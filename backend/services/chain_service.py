import hashlib
import json
import time
from dataclasses import dataclass
from pathlib import Path
from typing import List

from config import get_settings

try:
    from web3 import Web3
    _HAS_WEB3 = True
except ImportError:
    _HAS_WEB3 = False


@dataclass
class ChainRecord:
    tx_hash: str
    contract_address: str
    block_explorer_url: str
    post_hash: str
    timestamp: str
    network: str


class ChainServiceError(Exception):
    """Raised when anchoring or re-verifying a record fails."""


class ChainService:
    """
    Hashes discovered post data and anchors it so it can be independently
    re-verified later.

    Two modes, controlled by CHAIN_MODE:

      - "simulate" (default): writes to a local JSON ledger file instead of
        a real chain. No RPC endpoint, gas, or private key required — this
        is what makes the pipeline demoable end-to-end without funded
        testnet keys. Every response is clearly labeled as simulated.

      - "testnet": submits a real transaction via web3.py to a deployed
        VerificationRegistry contract (see /blockchain/contracts) on a
        public testnet such as Polygon Amoy or Ethereum Sepolia.

    Both modes implement the same hash -> anchor -> re-verify contract, so
    switching modes doesn't change any calling code.
    """

    def __init__(self):
        self.settings = get_settings()
        self.mode = self.settings.chain_mode
        self._local_ledger_path = Path(self.settings.simulated_ledger_path)

        if self.mode == "testnet":
            self._init_testnet()

    def _init_testnet(self) -> None:
        if not _HAS_WEB3:
            raise ChainServiceError("web3.py is not installed but CHAIN_MODE=testnet.")
        missing = [
            name
            for name, value in [
                ("RPC_URL", self.settings.rpc_url),
                ("PRIVATE_KEY", self.settings.private_key),
                ("CONTRACT_ADDRESS", self.settings.contract_address),
            ]
            if not value
        ]
        if missing:
            raise ChainServiceError(
                f"CHAIN_MODE=testnet requires {', '.join(missing)} to be set in .env"
            )

        self.w3 = Web3(Web3.HTTPProvider(self.settings.rpc_url))
        abi_path = Path(__file__).resolve().parent.parent / "contracts" / "VerificationRegistry.json"
        abi = json.loads(abi_path.read_text())["abi"]
        self.contract = self.w3.eth.contract(address=self.settings.contract_address, abi=abi)
        self.account = self.w3.eth.account.from_key(self.settings.private_key)
        # Maps tx hash -> on-chain recordId, so re-verification can call the
        # contract's `verifyRecord` view function directly instead of
        # re-parsing transaction input (fragile across ABI/encoding changes).
        self._testnet_record_ids: dict = {}

    @staticmethod
    def _hash_content(post_url: str, post_text: str) -> str:
        payload = f"{post_url}|{post_text}".encode("utf-8")
        return "0x" + hashlib.sha256(payload).hexdigest()

    def anchor(self, post_text: str, post_url: str) -> ChainRecord:
        content_hash = self._hash_content(post_url, post_text)
        if self.mode == "simulate":
            return self._anchor_simulated(content_hash, post_url)
        return self._anchor_testnet(content_hash, post_url)

    def re_verify(self, tx_hash: str, expected_post_text: str, expected_post_url: str) -> bool:
        """Recompute the hash from the original source data and compare it
        against the anchored record — this is the tamper-evidence proof."""
        recomputed = self._hash_content(expected_post_url, expected_post_text)

        if self.mode == "simulate":
            ledger = self._read_ledger()
            match = next((r for r in ledger if r["tx_hash"] == tx_hash), None)
            if not match:
                raise ChainServiceError(f"No simulated record found for tx {tx_hash}")
            return match["post_hash"] == recomputed

        return self._reverify_testnet(tx_hash, recomputed)

    # ---- simulate mode -------------------------------------------------

    def _anchor_simulated(self, content_hash: str, metadata_uri: str) -> ChainRecord:
        ledger = self._read_ledger()
        tx_hash = "0xSIM" + hashlib.sha256(
            f"{content_hash}{time.time()}".encode()
        ).hexdigest()[:60]
        timestamp = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())

        ledger.append(
            {
                "tx_hash": tx_hash,
                "post_hash": content_hash,
                "metadata_uri": metadata_uri,
                "timestamp": timestamp,
            }
        )
        self._write_ledger(ledger)

        return ChainRecord(
            tx_hash=tx_hash,
            contract_address="0xSIMULATED0000000000000000000000000000000",
            block_explorer_url="local://simulated-ledger/",
            post_hash=content_hash,
            timestamp=timestamp,
            network="Simulated local ledger (set CHAIN_MODE=testnet for a real chain)",
        )

    def _read_ledger(self) -> List[dict]:
        if not self._local_ledger_path.exists():
            return []
        return json.loads(self._local_ledger_path.read_text())

    def _write_ledger(self, ledger: List[dict]) -> None:
        self._local_ledger_path.parent.mkdir(parents=True, exist_ok=True)
        self._local_ledger_path.write_text(json.dumps(ledger, indent=2))

    # ---- testnet mode ----------------------------------------------------

    def _anchor_testnet(self, content_hash: str, metadata_uri: str) -> ChainRecord:
        tx = self.contract.functions.submitRecord(content_hash, metadata_uri).build_transaction(
            {
                "from": self.account.address,
                "nonce": self.w3.eth.get_transaction_count(self.account.address),
                "gas": 200_000,
                "gasPrice": self.w3.eth.gas_price,
            }
        )
        signed = self.account.sign_transaction(tx)
        raw_tx = getattr(signed, "raw_transaction", None) or signed.rawTransaction
        tx_hash = self.w3.eth.send_raw_transaction(raw_tx)
        receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash)

        record_id = self._extract_record_id(receipt)
        self._testnet_record_ids[tx_hash.hex()] = record_id

        return ChainRecord(
            tx_hash=tx_hash.hex(),
            contract_address=self.settings.contract_address,
            block_explorer_url=self.settings.block_explorer_base_url,
            post_hash=content_hash,
            timestamp=time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            network=self.settings.network_name,
        )

    def _extract_record_id(self, receipt) -> int:
        events = self.contract.events.RecordSubmitted().process_receipt(receipt)
        if not events:
            raise ChainServiceError("RecordSubmitted event not found in transaction receipt.")
        return events[0]["args"]["recordId"]

    def _reverify_testnet(self, tx_hash: str, recomputed_hash: str) -> bool:
        record_id = self._testnet_record_ids.get(tx_hash)
        if record_id is None:
            raise ChainServiceError(
                f"No known recordId for tx {tx_hash} — the backend may have "
                "restarted since this record was anchored."
            )
        return self.contract.functions.verifyRecord(record_id, recomputed_hash).call()
