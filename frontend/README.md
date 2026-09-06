# Frontend — face-chain-verify

Next.js (App Router) + Tailwind + Framer Motion frontend for the consent-scoped
face → search → blockchain verification pipeline.

## Local development

```bash
npm install
cp .env.example .env.local
npm run dev
```

By default `NEXT_PUBLIC_USE_MOCK_PIPELINE=true`, so the UI runs fully against
mocked pipeline data — useful for styling/demo work before the backend is
ready. Set it to `false` and point `BACKEND_URL` at your FastAPI backend to
run the real pipeline.

## Deploying to Vercel

1. Push this repo to GitHub.
2. Import the repo in Vercel, set the **root directory** to `frontend/`.
3. Add environment variables in the Vercel dashboard:
   - `BACKEND_URL` — your deployed backend's URL
   - `NEXT_PUBLIC_USE_MOCK_PIPELINE` — `false` for the real pipeline
4. Deploy. Vercel auto-detects Next.js — no extra config needed beyond `vercel.json`.

## Structure

- `app/` — pages and API route proxies (App Router)
- `components/` — pipeline UI (uploader, stepper, result cards, theme toggle)
- `lib/` — theme provider, API client, utilities

## Design notes

Dark-first "ledger" theme: cyan (`--accent-scan`) marks the detection/search
stages, brass (`--accent-verify`) marks the blockchain stage. Space Grotesk
for headlines, IBM Plex Sans for body text, IBM Plex Mono for hashes and
transaction IDs. Fully responsive down to mobile widths; respects
`prefers-reduced-motion`.
