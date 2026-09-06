# Architecture — Face-Chain-Verify

## 1. System Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (Next.js)                       │
│  Deployed on Vercel                                               │
│                                                                    │
│  ┌──────────────┐   ┌───────────────────┐   ┌──────────────────┐ │
│  │ Face Uploader│──▶│ Pipeline Stepper   │──▶│ Result / Chain    │ │
│  │ (upload/cam) │   │ (animated progress)│   │ Badge Display     │ │
│  └──────────────┘   └───────────────────┘   └──────────────────┘ │
│         │                                             ▲           │
│         ▼                                             │           │
│  /api/detect-face  /api/search-match  /api/chain-verify           │
└─────────│───────────────────│───────────────────│─────────────────┘
          │                   │                   │
          ▼                   ▼                   ▼
┌─────────────────────────────────────────────────────────────────┐
│                        BACKEND (FastAPI)                          │
│  Hosted on Render/Railway/Fly.io (separate from Vercel)           │
│                                                                    │
│  ┌────────────────┐  ┌───────────────────┐  ┌──────────────────┐ │
│  │ face_service.py│─▶│ search_service.py │─▶│ chain_service.py │ │
│  │ detect + encode│  │ match vs consent  │  │ hash + upload +  │ │
│  │                │  │ registry          │  │ re-verify        │ │
│  └────────────────┘  └───────────────────┘  └──────────────────┘ │
│           │                    │                     │            │
│           ▼                    ▼                     ▼            │
│  ┌────────────────┐  ┌───────────────────┐  ┌──────────────────┐ │
│  │ dlib / DeepFace│  │ consent_registry.py│  │ web3.py / ethers │ │
│  │ model weights  │  │ + consented_dataset│  │ RPC to testnet   │ │
│  └────────────────┘  └───────────────────┘  └──────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                                                        │
                                                        ▼
                                     ┌───────────────────────────────┐
                                     │   BLOCKCHAIN (Testnet)         │
                                     │   VerificationRegistry.sol     │
                                     │   stores: postHash, metaHash,  │
                                     │   timestamp, submitter address │
                                     └───────────────────────────────┘
```

## 2. Component Responsibilities

### Frontend (Vercel)
- Renders upload/webcam UI, dark/light theme toggle, animated multi-stage progress indicator.
- Calls backend via Next.js API routes (kept server-side to avoid exposing backend URLs/keys directly).
- Displays the matched post, the computed hash, the on-chain transaction link, and a "re-verify" action that re-triggers the compare-on-chain step live in front of the user.

### Backend — Face Service
- Accepts an image, runs detection (locates the face), then encoding (128-d or similar embedding vector).
- Returns the embedding to the orchestration layer; no matching logic lives here.

### Backend — Search Service
- Takes the embedding and compares it (cosine/Euclidean distance) against embeddings in the **consent registry** — the set of faces + associated posts that opted into this demo.
- This is a real nearest-neighbor search, not an if/else lookup keyed to a specific test image — swapping in a different consented face still triggers a genuine comparison.
- Returns the best match above a similarity threshold, or "no match" if none clears it.

### Backend — Chain Service
- Takes the matched post's content/metadata, computes a SHA-256 hash.
- Submits a transaction to `VerificationRegistry.sol` storing the hash, a timestamp, and the submitter address.
- On re-verification: fetches the on-chain record by ID/hash, recomputes the hash from the original source data, and confirms equality — proving the record hasn't been tampered with since upload.

### Blockchain Layer
- `VerificationRegistry.sol`: a minimal contract with `submitRecord(bytes32 hash, string metadataURI)`, `getRecord(uint256 recordId)`, and a `verifyRecord(uint256 recordId, bytes32 hash)` view function used directly for re-verification.
- Deployed via Hardhat to Polygon Amoy (default) or Ethereum Sepolia.
- Chosen for zero cost during demoing and full public verifiability (anyone can check the transaction on a block explorer).
- A `CHAIN_MODE=simulate` fallback (local JSON ledger, same interface) lets the pipeline run with zero RPC/wallet setup — useful for offline development or if testnet faucets are rate-limited close to a deadline.

## 3. Data Flow for One Request

1. User uploads/captures an image on the frontend.
2. Frontend → `/api/detect-face` → backend `face_service` → returns face embedding.
3. Frontend → `/api/search-match` (embedding) → backend `search_service` → compares against `consent_registry` → returns matched post + confidence score.
4. Frontend → `/api/chain-verify` (matched post data) → backend `chain_service`:
   a. Hashes the post data.
   b. Submits to the smart contract on testnet.
   c. Waits for confirmation, returns tx hash + block explorer link.
5. Frontend displays a "Verified On-Chain" badge with the tx link.
6. User clicks "Re-verify" → frontend calls chain service again → it re-fetches on-chain data and re-hashes the source → confirms match → UI shows a live "✅ Verified" state (this is the moment to capture clearly in the screen recording).

## 4. Deployment Notes

- **Frontend:** Vercel (Next.js zero-config deploy).
- **Backend:** Vercel serverless functions are not well suited to `face_recognition`/`dlib` (large native dependencies, cold start size limits) — deploy backend separately to Render, Railway, or Fly.io, and point the frontend's API routes at it via an environment variable (`BACKEND_URL`).
- **Blockchain:** No hosting needed — contract lives on the public testnet; only the RPC endpoint (e.g., via Alchemy/Infura) needs an API key, stored as a backend environment variable.

## 5. Known Limitations (Architecture-Level)

- Consent registry is a simple local dataset (not a live social-media crawler), by design — see `docs/CONSENT_POLICY.md`.
- Single-threaded synchronous pipeline; not built for concurrent multi-user load.
- No persistent database — registry and results are file-based/in-memory for demo purposes.
- Testnet reliability depends on the third-party RPC provider's uptime.
