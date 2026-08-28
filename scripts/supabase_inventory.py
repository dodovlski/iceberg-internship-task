from __future__ import annotations

import json

from supabase_common import management_request, project_ref, sql_query, storage_request


INVENTORY_SQL = """
select 'table' as kind, schemaname as schema, tablename as name
from pg_tables
where schemaname = 'public'
union all
select 'view' as kind, schemaname as schema, viewname as name
from pg_views
where schemaname = 'public'
union all
select 'function' as kind, n.nspname as schema, p.proname as name
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
union all
select 'trigger' as kind, event_object_schema as schema, trigger_name as name
from information_schema.triggers
where event_object_schema = 'public'
union all
select 'policy' as kind, schemaname as schema, policyname as name
from pg_policies
where schemaname = 'public'
order by kind, schema, name;
"""


def main() -> None:
    result = {
        "database": sql_query(INVENTORY_SQL),
        "storage_buckets": storage_request("GET", "/bucket"),
    }

    try:
        result["edge_functions"] = management_request("GET", f"/projects/{project_ref()}/functions")
    except Exception as error:
        result["edge_functions_error"] = str(error)

    print(json.dumps(result, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
