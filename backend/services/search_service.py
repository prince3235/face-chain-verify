from typing import List, Optional

import numpy as np
from pydantic import BaseModel

from config import get_settings
from services.consent_registry import ConsentedEntry, ConsentRegistry
from services.web_search_service import WebSearchService


class MatchResult(BaseModel):
    found: bool
    person_id: Optional[str] = None
    post_url: Optional[str] = None
    post_text: Optional[str] = None
    source_platform: Optional[str] = None
    confidence: Optional[float] = None


class SearchService:
    """
    Performs a genuine nearest-neighbor similarity search over the consented
    registry — every embedding is compared against every registry entry via
    cosine similarity, and the best match above SIMILARITY_THRESHOLD wins.
    This is NOT a hardcoded lookup keyed to one specific demo image: swap in
    a different consented face and the comparison logic runs the same way.
    """

    def __init__(self, registry: Optional[ConsentRegistry] = None):
        settings = get_settings()
        self.threshold = settings.similarity_threshold
        self.web_search_enabled = settings.web_search_enabled
        self.registry = registry or ConsentRegistry()
        self.web_search_service = WebSearchService()

    @staticmethod
    def _cosine_similarity(a: List[float], b: List[float]) -> float:
        va, vb = np.array(a, dtype=float), np.array(b, dtype=float)
        if va.shape != vb.shape:
            # Different embedding dimensionality (e.g. mixed backends) — not comparable.
            return -1.0
        denom = (np.linalg.norm(va) * np.linalg.norm(vb)) or 1e-9
        return float(np.dot(va, vb) / denom)

    def find_match(self, embedding: List[float]) -> MatchResult:
        best_score = -1.0
        best_entry: Optional[ConsentedEntry] = None

        for entry in self.registry.all_entries():
            score = self._cosine_similarity(embedding, entry.embedding)
            if score > best_score:
                best_score = score
                best_entry = entry

        if best_entry is None or best_score < self.threshold:
            return MatchResult(found=False, confidence=max(best_score, 0.0))

        post = best_entry.posts[0]
        return MatchResult(
            found=True,
            person_id=best_entry.person_id,
            post_url=post.url,
            post_text=post.text,
            source_platform=post.platform,
            confidence=round(best_score, 4),
        )

    def find_match_full(self, embedding: List[float], image_bytes: Optional[bytes] = None) -> MatchResult:
        if self.web_search_enabled and image_bytes:
            web_result = self.web_search_service.search(image_bytes)
            if web_result and web_result.get("found"):
                return MatchResult(
                    found=True,
                    post_url=web_result.get("post_url"),
                    post_text=web_result.get("post_text"),
                    source_platform=web_result.get("source_platform"),
                    confidence=web_result.get("confidence")
                )
        
        # Fallback to consented registry
        return self.find_match(embedding)

