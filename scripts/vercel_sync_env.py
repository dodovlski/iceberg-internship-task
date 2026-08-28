from __future__ import annotations

import argparse
import os
import pathlib
import shutil
import subprocess
import sys


ROOT = pathlib.Path(__file__).resolve().parents[1]
DEFAULT_ENV_FILE = ROOT / ".env.local"

VERCEL_ENV_KEYS = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "GEMINI_API_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
]


def load_env(path: pathlib.Path) -> dict[str, str]:
    if not path.exists():
        raise SystemExit(f"Env file not found: {path}")

    values: dict[str, str] = {}
    for raw_line in path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        values[key.strip()] = value.strip().strip('"').strip("'")
    return values


def run_vercel(args: list[str], value: str | None = None, dry_run: bool = False, allow_failure: bool = False) -> None:
    executable = shutil.which("vercel") or shutil.which("vercel.cmd") or shutil.which("vercel.ps1")
    if not executable:
        raise SystemExit("Vercel CLI was not found in PATH. Install it with: npm i -g vercel")
    command = [executable, *args]
    print(" ".join(command))
    if dry_run:
        return
    result = subprocess.run(
        command,
        input=value,
        text=True,
        cwd=ROOT,
        check=False,
    )
    if result.returncode and not allow_failure:
        raise subprocess.CalledProcessError(result.returncode, command)


def sync_key(key: str, value: str, targets: list[str], dry_run: bool) -> None:
    for target in targets:
        run_vercel(["env", "rm", key, target, "--yes"], dry_run=dry_run, allow_failure=True)
        run_vercel(["env", "add", key, target], value=f"{value}\n", dry_run=dry_run)


def main() -> None:
    parser = argparse.ArgumentParser(description="Sync local ignored env values to Vercel through the Vercel CLI.")
    parser.add_argument("--env-file", default=str(DEFAULT_ENV_FILE), help="Source env file. Defaults to .env.local.")
    parser.add_argument(
        "--target",
        action="append",
        choices=["production", "preview", "development"],
        help="Vercel environment target. Can be passed multiple times. Defaults to production.",
    )
    parser.add_argument("--dry-run", action="store_true", help="Print Vercel commands without changing env vars.")
    args = parser.parse_args()

    env_values = load_env(pathlib.Path(args.env_file))
    targets = args.target or ["production"]
    missing = [key for key in VERCEL_ENV_KEYS if key not in env_values]
    if missing:
        raise SystemExit(f"Missing required keys in env file: {', '.join(missing)}")

    empty = [key for key in VERCEL_ENV_KEYS if not env_values[key]]
    if empty:
        print(f"Skipping empty keys: {', '.join(empty)}", file=sys.stderr)

    for key in VERCEL_ENV_KEYS:
        value = env_values.get(key, "")
        if not value:
            continue
        sync_key(key, value, targets, args.dry_run)

    print("Vercel env sync complete." if not args.dry_run else "Dry run complete.")


if __name__ == "__main__":
    main()
