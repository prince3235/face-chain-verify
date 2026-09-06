import pytest

from config import get_settings
from services.chain_service import ChainService, ChainServiceError


@pytest.fixture
def chain_service(tmp_path, monkeypatch):
    ledger_path = tmp_path / "ledger.json"
    monkeypatch.setenv("CHAIN_MODE", "simulate")
    monkeypatch.setenv("SIMULATED_LEDGER_PATH", str(ledger_path))
    get_settings.cache_clear()

    service = ChainService()
    yield service

    get_settings.cache_clear()


def test_anchor_produces_a_record(chain_service):
    record = chain_service.anchor(post_text="hello world", post_url="https://example.test/1")

    assert record.tx_hash.startswith("0xSIM")
    assert record.post_hash.startswith("0x")
    assert "Simulated" in record.network


def test_reverify_succeeds_on_untampered_data(chain_service):
    record = chain_service.anchor(post_text="hello world", post_url="https://example.test/1")

    assert chain_service.re_verify(record.tx_hash, "hello world", "https://example.test/1") is True


def test_reverify_fails_on_tampered_data(chain_service):
    record = chain_service.anchor(post_text="original text", post_url="https://example.test/2")

    assert (
        chain_service.re_verify(record.tx_hash, "tampered text!", "https://example.test/2")
        is False
    )


def test_reverify_unknown_tx_raises(chain_service):
    with pytest.raises(ChainServiceError):
        chain_service.re_verify("0xdoesnotexist", "text", "https://example.test/3")
