# Consented dataset

`registry.json` starts empty. Populate it by running, for each person who
has explicitly agreed to take part in the demo:

```bash
python scripts/seed_consent_dataset.py \
  --image ./team/priya.jpg \
  --person-id p1 \
  --display-name "Priya S." \
  --platform "Instagram (demo)" \
  --url "https://instagram.com/p/example123" \
  --text "Caption of the consented demo post"
```

Do not add anyone who has not explicitly opted in. This registry is the
entire search space of the pipeline — see `docs/CONSENT_POLICY.md` at the
repo root for why it's scoped this way.
