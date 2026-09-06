# face-chain-verify

**HH Goa 2026 — Shortlisting Task #3: Face Identification & Blockchain Verification**

An end-to-end pipeline: face scan → matching post found in a consented
registry → the discovery is hashed and anchored on-chain → the record is
independently re-verified.

```
Face image → Detect & encode → Search consented registry → Hash + anchor on-chain → Re-verify
```

## Why the search is scoped to a consented dataset

Built without restriction, "use a face to find that person's real social
media post" is a general-purpose people-search tool — the same underlying
capability behind products that have enabled stalking and doxxing. This
build keeps every technical requirement genuinely real (actual face
detection, a real non-hardcoded similarity search, real on-chain anchoring
and re-verification) while scoping the search space to faces + posts that
explicitly opted in to this demo. Full reasoning in
[`docs/CONSENT_POLICY.md`](docs/CONSENT_POLICY.md).

## Repo layout

```
face-chain-verify/
├── frontend/     Next.js UI — dark/light mode, animated pipeline, Vercel-ready
├── backend/      FastAPI — face detection, registry search, chain anchoring
├── blockchain/   Solidity contract + Hardhat deploy/test scripts
├── docs/         Project overview, architecture, consent policy, demo script
└── README.md     You are here
```

Each folder has its own README with setup specifics. Start here for the
overall picture, then:
- [`docs/PROJECT_OVERVIEW.md`](docs/PROJECT_OVERVIEW.md) — what it does, tech stack, limitations
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — system diagram, component responsibilities, data flow
- [`docs/DEMO_SCRIPT.md`](docs/DEMO_SCRIPT.md) — step-by-step for the required screen recording

## Quickstart (local, everything on one machine)

```bash
# 1. Blockchain — optional if you're OK demoing with CHAIN_MODE=simulate
cd blockchain
npm install
cp .env.example .env        # fill in RPC_URL + PRIVATE_KEY for a testnet wallet
npx hardhat run scripts/deploy.js --network polygonAmoy

# 2. Backend
cd ../backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env        # set CHAIN_MODE + CONTRACT_ADDRESS if using testnet
python scripts/seed_consent_dataset.py \
  --image ./your_photo.jpg --person-id p1 --display-name "You" \
  --platform "X (demo)" --url "https://example.test/post/1" --text "demo caption"
uvicorn main:app --reload --port 8000

# 3. Frontend
cd ../frontend
npm install
cp .env.example .env.local  # set NEXT_PUBLIC_USE_MOCK_PIPELINE=false, BACKEND_URL=http://localhost:8000
npm run dev
```

Visit `http://localhost:3000`, click "Start verification," upload the photo
you registered in step 2, and watch the full pipeline run.

## Deploying to Vercel

Only the `frontend/` folder deploys to Vercel — import the repo, set the
project's root directory to `frontend/`, and add `BACKEND_URL` +
`NEXT_PUBLIC_USE_MOCK_PIPELINE=false` as environment variables. The backend
(face processing) needs a separate host (Render/Railway/Fly.io) since
Vercel's serverless functions aren't suited to the ML dependencies — see
`frontend/README.md` for details.

## Which blockchain

Polygon Amoy testnet by default (Sepolia also supported) — or a local
simulated ledger (`CHAIN_MODE=simulate` in `backend/.env`) requiring zero
setup, zero gas, and no funded wallet. Both modes implement the same
anchor/re-verify interface. See `blockchain/README.md` and
`backend/README.md` for details.

## Testing

```bash
# Backend — 10 tests, including an explicit tamper-detection check
cd backend && pytest tests/ -v

# Blockchain contract — deploy/submit/verify/tamper-detect, edge cases
cd blockchain && npx hardhat test
```

## Known limitations

See the "Known limitations" section in each of `backend/README.md`,
`blockchain/README.md`, and `docs/PROJECT_OVERVIEW.md` — summarized:
OpenCV-fallback face embeddings are lower accuracy than a real
`face_recognition`/dlib model; the consent registry is a flat JSON file
(fine for a demo, not production scale); no auth on any API endpoint; the
smart contract has no access control on writes.
