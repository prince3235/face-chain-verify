# Demo / Screen Recording Script

A suggested run-through for the required screen recording. No editing needed
— just follow this order so the pipeline's three stages are all clearly visible.

## Before recording

1. Register at least one consented face:
   ```bash
   cd backend
   python scripts/seed_consent_dataset.py \
     --image ./your_photo.jpg \
     --person-id p1 \
     --display-name "Your Name" \
     --platform "X (demo)" \
     --url "https://example-social.test/post/123" \
     --text "Caption of the consented demo post"
   ```
2. Start the backend: `uvicorn main:app --reload --port 8000`
3. Start the frontend: `npm run dev` (in `frontend/`), with
   `NEXT_PUBLIC_USE_MOCK_PIPELINE=false` and `BACKEND_URL=http://localhost:8000`
   in `frontend/.env.local`.
4. If demoing the real chain: confirm `CHAIN_MODE=testnet` in `backend/.env`
   and that your deployed contract address/RPC/key are all set. If demoing
   the simulated ledger instead, `CHAIN_MODE=simulate` needs no extra setup
   — say so on camera so it's clear which mode is running.

## Recording order

1. **Show the landing page** (`/`) briefly — the three-stage pipeline preview.
2. **Open `/verify`**, mention out loud that the search is scoped to a
   consented demo registry (point at `docs/CONSENT_POLICY.md` if useful) —
   this pre-empts the most likely judge question.
3. **Upload the registered consented photo.** Narrate what's happening as
   the scanline animation plays: "detecting and encoding the face now."
4. **Let the stepper advance to the search stage** — narrate: "comparing
   this embedding against the consented registry via cosine similarity."
5. **Show the match result card** — point out the confidence score.
6. **Let it anchor on-chain** — once the chain badge appears, click through
   to the block explorer link (if on testnet) to show the real transaction
   publicly, or point out the "Simulated local ledger" label if in
   simulate mode.
7. **Click "Re-verify"** — narrate that this recomputes the hash from the
   original source data and compares it against the anchored record. Show
   the "tamper-evidence confirmed" state.
8. **(Optional, strong finish)** — in a second terminal, run
   `blockchain/scripts/verify_onchain.js` or show `pytest tests/ -v` in the
   backend passing, including the explicit tamper-detection test.

## What to say if asked "why doesn't this search real social media?"

Point to `docs/CONSENT_POLICY.md`: the search logic is genuinely real and
unconditional; only the search space is scoped to consented data, which is
what keeps the shipped pipeline from being a general-purpose people-search
tool the moment it's in a public repo.
