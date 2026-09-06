import json
from pathlib import Path
from typing import List, Optional

from pydantic import BaseModel

from config import get_settings


class ConsentedPost(BaseModel):
    platform: str
    url: str
    text: str
    image_path: Optional[str] = None


class ConsentedEntry(BaseModel):
    person_id: str
    display_name: str
    embedding: List[float]
    posts: List[ConsentedPost]


class ConsentRegistry:
    """
    The safety boundary of this whole project: the search step only ever
    runs against faces + posts that have explicitly opted in to this demo,
    registered here — never the open web or a real social graph.

    See docs/CONSENT_POLICY.md in the repo root for the reasoning, and
    scripts/seed_consent_dataset.py for how to add a new consented entry.
    """

    def __init__(self, registry_path: Optional[Path] = None):
        settings = get_settings()
        self.registry_path = registry_path or Path(settings.consent_registry_path)
        self._entries: List[ConsentedEntry] = self._load()

    def _load(self) -> List[ConsentedEntry]:
        if not self.registry_path.exists():
            return []
        raw = json.loads(self.registry_path.read_text())
        return [ConsentedEntry(**item) for item in raw]

    def reload(self) -> None:
        self._entries = self._load()

    def all_entries(self) -> List[ConsentedEntry]:
        return self._entries

    def add_entry(self, entry: ConsentedEntry, persist: bool = True) -> None:
        self._entries.append(entry)
        if persist:
            self._save()

    def _save(self) -> None:
        self.registry_path.parent.mkdir(parents=True, exist_ok=True)
        self.registry_path.write_text(
            json.dumps([e.model_dump() for e in self._entries], indent=2)
        )
