# Project Overview — Face-Chain-Verify

**Task:** HH Goa 2026 Shortlisting Task #3 — Face Identification & Blockchain Verification
**Team:** [Your Name / Team Name]
**Submission Deadline:** Sept 7, 2026

---

## 1. What This Project Does

Face-Chain-Verify is an end-to-end pipeline that:

1. Takes a **face scan** (uploaded image or webcam capture) as input.
2. Runs **face detection and encoding** on it.
3. Performs a **genuine search step** to find a matching social media / web post associated with that face.
4. Takes the discovered post (or a cryptographic hash of it) and **writes it to a blockchain**, creating a tamper-evident, independently re-verifiable record.
5. Demonstrates **re-verification** — re-fetching the on-chain record and confirming it matches the original discovered data.

The pipeline satisfies every technical requirement in the task brief: real face detection, a non-hardcoded search step, and on-chain verification with re-verification demoed live.

---

## 2. Why the Search Is Scoped to a Consented Dataset

The task asks for a system that finds "matching social media posts" for an input face. Built without restriction, that is a general-purpose facial-recognition-based people-search tool — the same underlying capability as commercial tools that have been used for stalking, doxxing, and non-consensual surveillance. That risk exists independent of hackathon intent, because once the code and pipeline exist in a public repo, they work on anyone's face, not just the demo subject.

To keep the build technically complete **and** responsible, the search step operates over a **consented dataset**: a small registry of faces and associated public posts belonging to the team members / volunteers who explicitly opted in for this demo. The face-matching and search logic is fully real (not a hardcoded lookup for one specific image) — it is scoped in *whose* data it searches, not in *how* it searches.

This is documented explicitly in `docs/CONSENT_POLICY.md` in the repo, and is called out in the README and in the screen recording, so the design choice is transparent to evaluators rather than hidden.

---

## 3. Pipeline Flow

```
[Face Image Input]
        │
        ▼
[Face Detection & Encoding]   (face_recognition / DeepFace)
        │
        ▼
[Search Service]              (matches encoding against consented registry;
                                genuine similarity search, not a static lookup)
        │
        ▼
[Matching Post Found]         (post text/image/metadata retrieved)
        │
        ▼
[Hashing]                     (SHA-256 of post content + metadata)
        │
        ▼
[Blockchain Upload]           (hash written to smart contract on testnet)
        │
        ▼
[Re-Verification]             (fetch on-chain hash, recompute hash of source
                                data, confirm match → tamper-evidence proven)
```

---

## 4. Tech Stack

| Layer            | Technology |
|-------------------|------------|
| Frontend          | Next.js (App Router), Tailwind CSS, deployed on Vercel |
| Face Detection    | face_recognition / DeepFace (Python) |
| Backend API       | FastAPI (Python) |
| Search Layer      | Custom similarity search over consented dataset |
| Blockchain        | Solidity smart contract on Polygon Amoy Testnet (Sepolia also supported); a local "simulate" mode is available for zero-setup demoing |
| Chain Interaction | Hardhat + ethers.js |

---

## 5. Known Limitations

- Search is scoped to a consented dataset rather than the open web/social graph — a deliberate safety/ethics boundary, not a technical shortcoll (see Section 2).
- Face-matching accuracy depends on the underlying library's model and is not production-grade.
- Blockchain used is a public testnet (or a local simulated ledger in `CHAIN_MODE=simulate`) — data is never on mainnet, to avoid real gas costs and keep the demo reproducible without funded wallets.
- No authentication/authorization layer — this is a hackathon proof-of-concept, not a hardened production system.

---

## 6. Repo Layout

```
face-chain-verify/
├── frontend/     Next.js UI (Vercel-deployable)
├── backend/      FastAPI pipeline (face + search + chain services)
├── blockchain/   Solidity contract + Hardhat deploy/test scripts
├── docs/         This overview, architecture, consent policy, demo script
└── README.md     Top-level setup instructions
```

## 7. Deliverables

- [ ] GitHub repo (full source, README, this overview, architecture doc)
- [ ] Screen recording: face scan → matching post found → blockchain upload → re-verification
- [ ] Submission form: https://forms.gle/oZbQGuwiNeHVcHWo8
