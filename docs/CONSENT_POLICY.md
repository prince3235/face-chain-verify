# Consent Policy

## The design decision

This project's search step only ever runs against **`backend/data/consented_dataset/registry.json`** — a small, explicit registry of faces and posts belonging to people who agreed to take part in this demo (team members and/or volunteers). It never queries the open web or a real social media platform's API/graph.

## Why

Built without this boundary, the technical requirement ("use a face to find that person's real social media post") describes a general-purpose facial-recognition-based people-search tool — the same underlying capability as commercial products that have been used for stalking, doxxing, and non-consensual surveillance. That risk exists independent of who builds it or why: once the pipeline and its source code exist, they work on any face pointed at them, not just a demo subject.

Scoping the search space to a consented registry keeps every technical requirement genuinely satisfied — real face detection, a real (non-hardcoded) similarity search, real on-chain anchoring and re-verification — while making the shipped artifact something that cannot be pointed at an arbitrary stranger the moment it exists in a public repo.

## What "consented" means here

Every entry in the registry was added via `backend/scripts/seed_consent_dataset.py` by someone who:
1. Is a real, informed participant (a teammate or volunteer), and
2. Explicitly agreed to have their face and one of their own real public posts used for this demo.

No entry represents a person who wasn't asked, and no entry was scraped or added without direct action from that person.

## What this means for grading/evaluation

- The face-matching and search logic are **not** hardcoded to one specific test image — swap in any other consented face and the same nearest-neighbor comparison runs against the full registry.
- The registry can be extended with more consented entries at any time using the seed script — the search space is a data question, not a code question.
- The blockchain anchoring and re-verification steps operate identically regardless of dataset size or scope.

## If you were to scope this up beyond the demo

Removing this boundary (pointing the search step at a real social media API/index) would require, at minimum: informed consent from anyone who could be identified, a lawful basis for processing biometric data (which is specially protected under most privacy laws, e.g. GDPR Art. 9, India's DPDP Act), and a clear, narrow purpose limitation. That's a substantial legal/product undertaking outside the scope of a hackathon submission, which is precisely why this build stops at a consented demo dataset instead.
