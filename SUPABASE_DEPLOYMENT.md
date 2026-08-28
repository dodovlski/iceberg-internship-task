# Supabase + Vercel Deployment Notes

## Required Vercel env

Client-safe:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

Server-only:

```env
GEMINI_API_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

Script-only, do not add as `NEXT_PUBLIC_*`:

```env
SUPABASE_ACCESS_TOKEN=
SUPABASE_PROJECT_REF=
SUPABASE_DB_PASSWORD=
SUPABASE_URL=
SUPABASE_ANON_KEY=
```

## Push env to Vercel without using the dashboard

After `vercel login` and linking the project once, sync ignored local env values to Vercel:

```bash
npm run vercel:env
```

Dry run:

```bash
npm run vercel:env -- --dry-run
```

Production only:

```bash
npm run vercel:env -- --target production
```

## Supabase setup

Enable Anonymous Sign-Ins in Supabase Auth settings before deploying.

Apply the schema:

```bash
python scripts/supabase_apply_migrations.py --yes
```

Optional seed for read-only rule rows:

```bash
python scripts/supabase_seed.py --yes
```

Inventory old project objects:

```bash
python scripts/supabase_inventory.py
```

Destructive reset of old public objects and storage buckets:

```bash
python scripts/supabase_reset.py --dry-run
python scripts/supabase_reset.py --yes
python scripts/supabase_apply_migrations.py --yes
python scripts/supabase_seed.py --yes
```

## Runtime behavior

- The app creates a Supabase anonymous user in the browser without showing login UI.
- Mutable demo state is stored in `demo_user_state` with `user_id = auth.uid()`.
- RLS only allows the current anonymous user to read/write/delete their own rows.
- Seed tables are readable by public clients but have no public write policies.
- If Supabase is unavailable or env is missing, the demo falls back to local React state.
