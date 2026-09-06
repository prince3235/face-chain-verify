# Blockchain — face-chain-verify

Solidity smart contract + Hardhat project for anchoring content hashes
on-chain and re-verifying them later.

## What it does

`VerificationRegistry.sol` is intentionally minimal:

- `submitRecord(bytes32 hash, string metadataURI)` — stores a hash, a
  pointer to the off-chain content, a timestamp, and the submitter's
  address. Emits `RecordSubmitted`.
- `getRecord(uint256 recordId)` — reads back a stored record.
- `verifyRecord(uint256 recordId, bytes32 hash)` — returns `true`/`false`
  for whether `hash` matches what's stored — this is the re-verification
  primitive the backend calls.

It never stores the underlying content itself, only its hash + a metadata
URI — keeps gas cheap and avoids putting personal data permanently on a
public ledger.

**Verified:** this contract has been compiled with solc 0.8.24 and
exercised end-to-end (deploy → submit → fetch → verify → tamper-detect)
against a local EVM. `test/VerificationRegistry.test.js` covers all of
this plus edge cases (out-of-range record IDs, multiple independent
records).

## Setup

```bash
npm install
cp .env.example .env
```

Fill in `.env`:
- `RPC_URL` — an RPC endpoint for your chosen testnet (e.g. from Alchemy or
  a public RPC like `https://rpc-amoy.polygon.technology`)
- `PRIVATE_KEY` — a **throwaway testnet-only** wallet's private key, funded
  with free testnet tokens from a faucet. Never use a real/mainnet wallet.

## Compile & test

```bash
npx hardhat compile
npx hardhat test
```

## Deploy to a testnet

```bash
npx hardhat run scripts/deploy.js --network polygonAmoy
# or
npx hardhat run scripts/deploy.js --network sepolia
```

This prints the deployed contract address and also writes the ABI +
address straight into `backend/contracts/VerificationRegistry.json`, so
the Python backend can pick it up immediately. Copy the printed address
into `backend/.env` as `CONTRACT_ADDRESS`, and set `CHAIN_MODE=testnet`
there too.

## Sanity-check a fresh deployment

```bash
CONTRACT_ADDRESS=0xYourDeployedAddress npx hardhat run scripts/verify_onchain.js --network polygonAmoy
```

Submits one record and immediately re-fetches + re-verifies it — useful
to confirm a new deployment works before wiring up the full pipeline.

## Which testnet

Polygon Amoy is recommended: fast, cheap/free test transactions, and a
free faucet at https://faucet.polygon.technology. Sepolia (Ethereum) is
supported too and is pre-configured in `hardhat.config.js`.

## Known limitations

- No access control on `submitRecord` — anyone with a funded wallet can
  write to the registry. Fine for a demo; add an `onlyOwner`/allowlist
  modifier before using this for anything real.
- `evmVersion` is pinned to `paris` in `hardhat.config.js` for broad
  compatibility with older tooling/testnets that don't yet support
  Shanghai's `PUSH0` opcode (solc 0.8.24's default target).
- Records are append-only and unindexed beyond their integer ID — fine at
  demo scale, would want an off-chain index (or `metadataURI`-based
  lookup) for anything larger.
