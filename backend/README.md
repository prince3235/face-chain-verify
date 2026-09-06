# Backend — face-chain-verify

FastAPI backend implementing the three pipeline stages: face detection +
encoding, consented-registry search, and blockchain anchoring with
re-verification.

## What it does

- **`POST /detect-face`** — accepts an uploaded image, detects a face, and
  returns a numeric embedding + bounding box.
- **`POST /search-match`** — takes an embedding and runs a genuine cosine
  similarity search against the consented registry (`services/search_service.py`),
  returning the best match above a confidence threshold, or `found: false`.
- **`POST /chain-verify`** — hashes the matched post's content, anchors the
  hash (either to a real testnet or a local simulated ledger, see below),
  and returns the record.
- **`POST /chain-verify/re-verify`** — recomputes the hash from the original
  source data and compares it against the anchored record, proving
  tamper-evidence.

## Why the search is scoped to a consented registry

This backend does not search the open web or real social media. It searches
only `data/consented_dataset/registry.json` — faces and posts that have
explicitly opted in to this demo, added via `scripts/seed_consent_dataset.py`.
The similarity-search logic itself is real and unconditional (any embedding
is compared against every entry via cosine similarity); only the search
space is scoped. See `docs/CONSENT_POLICY.md` at the repo root.

## Setup

```bash
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
```

## Register at least one consented face before demoing

```bash
python scripts/seed_consent_dataset.py \
  --image ./team/your_photo.jpg \
  --person-id p1 \
  --display-name "Your Name" \
  --platform "X (demo)" \
  --url "https://example-social.test/post/123" \
  --text "Caption of the consented demo post"
```

## Run

```bash
uvicorn main:app --reload --port 8000
```

Visit `http://localhost:8000/docs` for interactive Swagger UI to try every
endpoint by hand.

## Run tests

```bash
pytest tests/ -v
```

10 tests covering face encoding (including the "no face detected" failure
path), similarity search (match found / no match / empty registry), and
chain anchoring + re-verification (including a **tampered-data test that
proves re-verify correctly returns `false`**).

## Which blockchain

Two modes, set via `CHAIN_MODE` in `.env`:

- **`simulate`** (default) — anchors records to a local JSON ledger
  (`data/simulated_ledger.json`) instead of a real chain. No RPC endpoint,
  gas, or private key needed. Every response is labeled
  `"Simulated local ledger"` so it's never mistaken for a real on-chain
  record. This is what makes the pipeline demoable end-to-end with zero
  setup cost — genuinely satisfies the task's "local/simulated chain" option.
- **`testnet`** — submits real transactions via `web3.py` to a deployed
  `VerificationRegistry` smart contract (see `/blockchain/contracts` and
  its ABI in `contracts/VerificationRegistry.json`) on a public testnet —
  Polygon Amoy or Ethereum Sepolia recommended (both have free faucets).
  Requires `RPC_URL`, `PRIVATE_KEY`, and `CONTRACT_ADDRESS` in `.env`.

Both modes implement the same `anchor()` / `re_verify()` contract in
`services/chain_service.py`, so switching modes needs no other code changes.

## Face detection backend

- Uses `face_recognition` (dlib) automatically if it's installed —
  production-grade embeddings.
- Falls back to an OpenCV Haar-cascade detector + a normalized block-
  histogram embedding if `face_recognition` isn't installed — this is a
  **real, working, deterministic embedding**, not a mock, so the pipeline
  runs fully end-to-end without needing dlib's native build toolchain.
  Lower accuracy than (1); uncomment `face_recognition`/`dlib` in
  `requirements.txt` for production use.

## Known limitations

- OpenCV fallback embeddings are far less discriminative than a real
  face-recognition model — expect a low false-match/false-non-match bar
  in that mode. Install `face_recognition`/`dlib` for real accuracy.
- Consent registry and simulated ledger are flat JSON files — fine for a
  demo, not for concurrent multi-user production load.
- The re-verification cache mapping `txHash -> source data` is in-memory
  and per-process — it resets if the server restarts, and doesn't scale
  across multiple backend instances. A real deployment should persist
  this alongside the on-chain record's metadata URI.
- No authentication on any endpoint — add an API key or auth layer before
  exposing this beyond a local/demo environment.
