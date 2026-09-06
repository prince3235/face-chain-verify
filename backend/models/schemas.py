from typing import List, Optional

from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel


class CamelModel(BaseModel):
    """Base model that serializes to camelCase JSON (to match the Next.js
    frontend's TypeScript interfaces) while staying snake_case in Python."""
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)


class BoundingBox(CamelModel):
    x: int
    y: int
    width: int
    height: int


class FaceEncodingResponse(CamelModel):
    embedding: List[float]
    face_bounding_box: BoundingBox


class MatchResultResponse(CamelModel):
    found: bool
    post_url: Optional[str] = None
    post_image_url: Optional[str] = None
    source_platform: Optional[str] = None
    confidence: Optional[float] = None
    post_text: Optional[str] = None


class ChainRecordResponse(CamelModel):
    tx_hash: str
    contract_address: str
    block_explorer_url: str
    post_hash: str
    timestamp: str
    network: str


class ReVerifyResponse(CamelModel):
    matches: bool
