from __future__ import annotations

import argparse
import json
import os
import pathlib
import sys
import urllib.error
import urllib.parse
import urllib.request
from typing import Any


ROOT = pathlib.Path(__file__).resolve().parents[1]


def load_env() -> dict[str, str]:
    values: dict[str, str] = {}
    for name in (".env", ".env.local"):
        path = ROOT / name
        if not path.exists():
            continue
        for raw_line in path.read_text(encoding="utf-8").splitlines():
            line = raw_line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, value = line.split("=", 1)
            values[key.strip()] = value.strip().strip('"').strip("'")
    values.update({key: value for key, value in os.environ.items() if value})
    return values


ENV = load_env()


def env(name: str, fallback: str | None = None, required: bool = False) -> str:
    value = ENV.get(name) or fallback
    if required and not value:
        raise SystemExit(f"Missing required environment variable: {name}")
    return value or ""


def supabase_url() -> str:
    value = env("SUPABASE_URL") or env("NEXT_PUBLIC_SUPABASE_URL", required=True)
    return value.rstrip("/")


def service_role_key() -> str:
    return env("SUPABASE_SERVICE_ROLE_KEY", required=True)


def access_token() -> str:
    return env("SUPABASE_ACCESS_TOKEN", required=True)


def project_ref() -> str:
    return env("SUPABASE_PROJECT_REF", required=True)


def request_json(
    method: str,
    url: str,
    headers: dict[str, str] | None = None,
    payload: Any | None = None,
    expect_json: bool = True,
) -> Any:
    data = None
    final_headers = {
        "Accept": "application/json",
        "User-Agent": "EstateOS-Deployment-Scripts/1.0",
        **(headers or {}),
    }
    if payload is not None:
        data = json.dumps(payload).encode("utf-8")
        final_headers["Content-Type"] = "application/json"
    request = urllib.request.Request(url, data=data, headers=final_headers, method=method)
    try:
        with urllib.request.urlopen(request, timeout=60) as response:
            body = response.read().decode("utf-8")
            if not expect_json:
                return body
            return json.loads(body) if body else None
    except urllib.error.HTTPError as error:
        body = error.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"{method} {url} failed with {error.code}: {body}") from error


def management_request(method: str, path: str, payload: Any | None = None) -> Any:
    return request_json(
        method,
        f"https://api.supabase.com/v1{path}",
        headers={"Authorization": f"Bearer {access_token()}"},
        payload=payload,
    )


def sql_query(sql: str) -> Any:
    try:
        return management_request(
            "POST",
            f"/projects/{project_ref()}/database/query",
            {"query": sql},
        )
    except RuntimeError as error:
        if "cloudflare" not in str(error).lower() and "error 1010" not in str(error).lower():
            raise
        print("Supabase Management API blocked the SQL request; falling back to direct Postgres.", file=sys.stderr)
        return postgres_sql_query(sql)


def postgres_dsn() -> str:
    explicit = env("SUPABASE_DB_URL") or env("DATABASE_URL")
    if explicit:
        return explicit
    password = urllib.parse.quote(env("SUPABASE_DB_PASSWORD", required=True), safe="")
    ref = project_ref()
    return f"postgresql://postgres:{password}@db.{ref}.supabase.co:5432/postgres?sslmode=require"


def postgres_sql_query(sql: str) -> list[dict[str, Any]]:
    try:
        import psycopg
        from psycopg.rows import dict_row
    except ImportError as psycopg_error:
        try:
            import psycopg2
            import psycopg2.extras
        except ImportError as psycopg2_error:
            raise RuntimeError(
                "Direct Postgres fallback requires psycopg. Install it with: python -m pip install psycopg[binary]"
            ) from psycopg2_error

        connection = psycopg2.connect(postgres_dsn())
        try:
            with connection:
                with connection.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cursor:
                    cursor.execute(sql)
                    if cursor.description:
                        return [dict(row) for row in cursor.fetchall()]
                    return []
        finally:
            connection.close()

    with psycopg.connect(postgres_dsn(), row_factory=dict_row) as connection:
        with connection.cursor() as cursor:
            cursor.execute(sql)
            if cursor.description:
                return [dict(row) for row in cursor.fetchall()]
            return []


def postgrest_request(method: str, path: str, payload: Any | None = None, query: str = "") -> Any:
    suffix = f"?{query}" if query else ""
    prefer = "return=representation"
    if method.upper() == "POST" and "on_conflict=" in query:
        prefer = "resolution=merge-duplicates,return=representation"
    return request_json(
        method,
        f"{supabase_url()}/rest/v1/{path}{suffix}",
        headers={
            "apikey": service_role_key(),
            "Authorization": f"Bearer {service_role_key()}",
            "Prefer": prefer,
        },
        payload=payload,
    )


def storage_request(method: str, path: str, payload: Any | None = None) -> Any:
    return request_json(
        method,
        f"{supabase_url()}/storage/v1{path}",
        headers={
            "apikey": service_role_key(),
            "Authorization": f"Bearer {service_role_key()}",
        },
        payload=payload,
    )


def add_confirm_flags(parser: argparse.ArgumentParser) -> None:
    parser.add_argument("--dry-run", action="store_true", help="Print planned actions without changing Supabase.")
    parser.add_argument("--yes", action="store_true", help="Required for destructive actions.")


def require_confirmation(args: argparse.Namespace, message: str) -> None:
    if args.dry_run:
        return
    if args.yes:
        return
    print(message, file=sys.stderr)
    print("Re-run with --yes to confirm.", file=sys.stderr)
    raise SystemExit(2)
