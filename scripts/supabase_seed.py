from __future__ import annotations

import argparse
import json
import pathlib

from supabase_common import ROOT, add_confirm_flags, postgrest_request, require_confirmation


SEED_PATH = ROOT / "supabase" / "seed" / "demo_seed.json"


def upsert(table: str, rows: list[dict]) -> None:
    if not rows:
        return
    postgrest_request(
        "POST",
        table,
        payload=rows,
        query="on_conflict=id",
    )


def load_seed(path: pathlib.Path) -> dict:
    if not path.exists():
        raise SystemExit(f"Seed file not found: {path}")
    return json.loads(path.read_text(encoding="utf-8"))


def main() -> None:
    parser = argparse.ArgumentParser(description="Seed read-only Supabase demo tables.")
    add_confirm_flags(parser)
    parser.add_argument("--file", default=str(SEED_PATH), help="Path to demo seed JSON.")
    args = parser.parse_args()

    seed = load_seed(pathlib.Path(args.file))
    tables = ["demo_properties", "demo_customer_profiles", "demo_messages", "demo_rules"]

    for table in tables:
        print(f"{table}: {len(seed.get(table, []))} row(s)")

    require_confirmation(args, "This will upsert read-only seed rows using the service role key.")
    if args.dry_run:
        return

    for table in tables:
        upsert(table, seed.get(table, []))

    print("Seed complete.")


if __name__ == "__main__":
    main()
