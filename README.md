# ER Board Tracker

A React + Vite application for tracking ER patients, pending tasks, consult services, disposition, and room assignment.

## Run locally

1. Install Node.js 18 or newer.
2. Open a terminal inside this folder.
3. Run `npm install`.
4. Run `npm run dev`.
5. Open the local address shown by Vite.

## Build for deployment

Run `npm run build`. The deployable site will be placed in `dist/`.

## Supabase shared database

The app works in local-only mode until Supabase credentials are added. To enable shared data:

1. Create a Supabase project.
2. Open the Supabase SQL Editor.
3. Run the SQL in `supabase-schema.sql`.
4. Copy `.env.example` to `.env`.
5. Fill in:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
6. Restart `npm run dev`.

When deployed to GitHub Pages, add the same values as GitHub Actions repository variables or secrets, then rebuild/deploy.

The included SQL allows public read/write/delete access for anyone who can open the app. Add authentication before using this with sensitive or real patient data.

## Privacy

Use patient codes or initials only. Do not enter full names, complete MRNs, addresses, contact details, or other identifying patient information.
