from __future__ import annotations

import argparse
import pathlib

from supabase_common import ROOT, add_confirm_flags, require_confirmation, sql_query


MIGRATIONS_DIR = ROOT / "supabase" / "migrations"


def migration_files() -> list[pathlib.Path]:
    return sorted(MIGRATIONS_DIR.glob("*.sql"))


def main() -> None:
    parser = argparse.ArgumentParser(description="Apply SQL migrations to the configured Supabase project.")
    add_confirm_flags(parser)
    args = parser.parse_args()

    files = migration_files()
    if not files:
        raise SystemExit("No migration files found.")

    print("Migrations:")
    for path in files:
        print(f"- {path.relative_to(ROOT)}")

    require_confirmation(args, "This will execute SQL against the configured Supabase database.")
    if args.dry_run:
        return

    for path in files:
        sql = path.read_text(encoding="utf-8")
        print(f"Applying {path.name}...")
        sql_query(sql)

    print("Done.")


if __name__ == "__main__":
    main()
