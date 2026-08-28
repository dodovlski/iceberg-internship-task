from __future__ import annotations

import argparse

from supabase_common import add_confirm_flags, require_confirmation, sql_query, storage_request


RESET_SQL = """
do $$
declare
  item record;
begin
  for item in
    select schemaname, policyname, tablename
    from pg_policies
    where schemaname = 'public'
  loop
    execute format('drop policy if exists %I on %I.%I', item.policyname, item.schemaname, item.tablename);
  end loop;

  for item in
    select event_object_schema, event_object_table, trigger_name
    from information_schema.triggers
    where event_object_schema = 'public'
  loop
    execute format('drop trigger if exists %I on %I.%I', item.trigger_name, item.event_object_schema, item.event_object_table);
  end loop;

  for item in
    select schemaname, viewname
    from pg_views
    where schemaname = 'public'
      and viewname not in ('geography_columns', 'geometry_columns', 'raster_columns', 'raster_overviews')
      and not exists (
        select 1
        from pg_class c
        join pg_namespace n on n.oid = c.relnamespace
        join pg_depend d on d.objid = c.oid
        join pg_extension e on e.oid = d.refobjid
        where n.nspname = schemaname
          and c.relname = viewname
          and d.deptype = 'e'
      )
  loop
    execute format('drop view if exists %I.%I cascade', item.schemaname, item.viewname);
  end loop;

  for item in
    select schemaname, tablename
    from pg_tables
    where schemaname = 'public'
      and tablename not in ('spatial_ref_sys')
      and not exists (
        select 1
        from pg_class c
        join pg_namespace n on n.oid = c.relnamespace
        join pg_depend d on d.objid = c.oid
        join pg_extension e on e.oid = d.refobjid
        where n.nspname = schemaname
          and c.relname = tablename
          and d.deptype = 'e'
      )
  loop
    execute format('drop table if exists %I.%I cascade', item.schemaname, item.tablename);
  end loop;

  for item in
    select n.nspname as schema_name, p.proname as function_name, oidvectortypes(p.proargtypes) as args
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and not exists (
        select 1
        from pg_depend d
        join pg_extension e on e.oid = d.refobjid
        where d.objid = p.oid
          and d.deptype = 'e'
      )
  loop
    execute format('drop function if exists %I.%I(%s) cascade', item.schema_name, item.function_name, item.args);
  end loop;
end $$;
"""


def reset_storage(dry_run: bool) -> None:
    if dry_run:
        print("Would inspect and delete storage buckets.")
        return
    buckets = storage_request("GET", "/bucket") or []
    for bucket in buckets:
        bucket_id = bucket.get("id") or bucket.get("name")
        if not bucket_id:
            continue
        print(f"Delete storage bucket: {bucket_id}")
        if not dry_run:
            storage_request("DELETE", f"/bucket/{bucket_id}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Destructively reset public DB objects and storage buckets.")
    add_confirm_flags(parser)
    parser.add_argument("--keep-storage", action="store_true", help="Do not remove storage buckets.")
    args = parser.parse_args()

    require_confirmation(args, "Destructive reset: this drops public tables, views, policies, triggers, functions and storage buckets.")
    print("Drop public database objects.")
    if not args.dry_run:
        sql_query(RESET_SQL)

    if not args.keep_storage:
        reset_storage(args.dry_run)

    print("Reset complete." if not args.dry_run else "Dry run complete.")


if __name__ == "__main__":
    main()
