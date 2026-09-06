import json
from functools import lru_cache
from typing import List, Optional, Union

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    host: str = "0.0.0.0"
    port: int = 8000
    cors_origins: Union[str, List[str]] = ["*"]

    @field_validator("cors_origins", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str):
            v = v.strip()
            if not v or v == "*":
                return ["*"]
            if v.startswith("[") and v.endswith("]"):
                try:
                    return json.loads(v)
                except Exception:
                    pass
            return [item.strip() for item in v.split(",") if item.strip()]
        elif isinstance(v, (list, tuple)):
            return list(v)
        return ["*"]

    consent_registry_path: str = "data/consented_dataset/registry.json"
    similarity_threshold: float = 0.75
    web_search_enabled: bool = True

    # "simulate" -> local JSON ledger, no real chain, no keys needed.
    # "testnet"  -> real transactions via web3.py against a deployed contract.
    chain_mode: str = "simulate"
    simulated_ledger_path: str = "data/simulated_ledger.json"

    rpc_url: Optional[str] = None
    private_key: Optional[str] = None
    contract_address: Optional[str] = None
    network_name: str = "Polygon Amoy Testnet"
    block_explorer_base_url: str = "https://amoy.polygonscan.com/tx/"


@lru_cache
def get_settings() -> Settings:
    return Settings()
