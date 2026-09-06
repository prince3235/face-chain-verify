from services.consent_registry import ConsentedEntry, ConsentedPost, ConsentRegistry
from services.search_service import SearchService


class FakeRegistry(ConsentRegistry):
    """A registry pre-loaded with in-memory entries, bypassing disk I/O."""

    def __init__(self, entries):
        self._entries = entries

    def all_entries(self):
        return self._entries


def _entry(person_id: str, embedding: list) -> ConsentedEntry:
    return ConsentedEntry(
        person_id=person_id,
        display_name=person_id,
        embedding=embedding,
        posts=[
            ConsentedPost(
                platform="Demo",
                url=f"https://example.test/{person_id}",
                text=f"post by {person_id}",
            )
        ],
    )


def test_finds_best_match_above_threshold():
    registry = FakeRegistry([_entry("alice", [1.0, 0.0, 0.0]), _entry("bob", [0.0, 1.0, 0.0])])
    service = SearchService(registry=registry)
    service.threshold = 0.9

    result = service.find_match([0.99, 0.01, 0.0])

    assert result.found is True
    assert result.person_id == "alice"
    assert result.confidence > 0.9


def test_no_match_when_below_threshold():
    registry = FakeRegistry([_entry("alice", [1.0, 0.0, 0.0])])
    service = SearchService(registry=registry)
    service.threshold = 0.99

    result = service.find_match([0.0, 1.0, 0.0])

    assert result.found is False


def test_empty_registry_returns_no_match():
    service = SearchService(registry=FakeRegistry([]))
    result = service.find_match([1.0, 0.0, 0.0])
    assert result.found is False
