import logging
from typing import Dict

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from config import get_settings
from models.schemas import (
    BoundingBox,
    ChainRecordResponse,
    FaceEncodingResponse,
    MatchResultResponse,
    ReVerifyResponse,
)
from services.chain_service import ChainService, ChainServiceError
from services.face_service import FaceService, FaceServiceError
from services.search_service import SearchService

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("face-chain-verify")

settings = get_settings()

app = FastAPI(
    title="face-chain-verify backend",
    description="Face detection -> consented-registry search -> blockchain anchoring pipeline.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

face_service = FaceService()
search_service = SearchService()
chain_service = ChainService()

# Maps tx_hash -> the original source data, so /chain-verify/re-verify can
# recompute the hash from source and compare. In-memory is fine for a
# single-instance demo; swap for a real store if you need it to survive
# restarts or run across multiple backend instances.
_verification_cache: Dict[str, dict] = {}


@app.get("/health")
def health():
    return {"status": "ok", "chain_mode": settings.chain_mode}


@app.post("/detect-face", response_model=FaceEncodingResponse)
async def detect_face(image: UploadFile = File(...)):
    contents = await image.read()
    try:
        result = face_service.detect_and_encode(contents)
    except FaceServiceError as e:
        raise HTTPException(status_code=422, detail=str(e))

    x, y, w, h = result.bounding_box
    return FaceEncodingResponse(
        embedding=result.embedding,
        face_bounding_box=BoundingBox(x=x, y=y, width=w, height=h),
    )


@app.post("/search-match", response_model=MatchResultResponse)
async def search_match(payload: dict):
    embedding = payload.get("embedding")
    image_base64 = payload.get("imageBase64")
    if not embedding:
        raise HTTPException(status_code=400, detail="Missing `embedding` in request body.")

    image_bytes = None
    if image_base64:
        import base64
        try:
            image_bytes = base64.b64decode(image_base64)
        except Exception as e:
            logger.warning(f"Could not decode imageBase64: {e}")

    result = search_service.find_match_full(embedding, image_bytes)
    return MatchResultResponse(
        found=result.found,
        post_url=result.post_url,
        source_platform=result.source_platform,
        confidence=result.confidence,
        post_text=result.post_text,
        person_name=result.person_name,
    )


@app.post("/chain-verify", response_model=ChainRecordResponse)
async def chain_verify(payload: dict):
    if not payload.get("found"):
        raise HTTPException(status_code=400, detail="No match to anchor on-chain.")

    post_text = payload.get("postText", "") or ""
    post_url = payload.get("postUrl", "") or ""

    try:
        record = chain_service.anchor(post_text=post_text, post_url=post_url)
    except ChainServiceError as e:
        raise HTTPException(status_code=500, detail=str(e))

    _verification_cache[record.tx_hash] = {"post_text": post_text, "post_url": post_url}

    return ChainRecordResponse(
        tx_hash=record.tx_hash,
        contract_address=record.contract_address,
        block_explorer_url=record.block_explorer_url,
        post_hash=record.post_hash,
        timestamp=record.timestamp,
        network=record.network,
    )


@app.post("/chain-verify/re-verify", response_model=ReVerifyResponse)
async def re_verify(payload: dict):
    tx_hash = payload.get("txHash")
    if not tx_hash:
        raise HTTPException(status_code=400, detail="Missing `txHash`.")

    cached = _verification_cache.get(tx_hash)
    if not cached:
        raise HTTPException(
            status_code=404,
            detail="No cached source data for this transaction on this server instance.",
        )

    try:
        matches = chain_service.re_verify(tx_hash, cached["post_text"], cached["post_url"])
    except ChainServiceError as e:
        raise HTTPException(status_code=500, detail=str(e))

    return ReVerifyResponse(matches=matches)
