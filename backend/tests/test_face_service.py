import io

import numpy as np
import pytest
from PIL import Image

from services.face_service import FaceService, FaceServiceError


def _blank_image_bytes() -> bytes:
    img = Image.new("RGB", (200, 200), color=(255, 255, 255))
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


def test_no_face_raises_face_service_error():
    service = FaceService()
    with pytest.raises(FaceServiceError):
        service.detect_and_encode(_blank_image_bytes())


def test_histogram_embedding_is_l2_normalized():
    fake_face = (np.random.rand(96, 96) * 255).astype("uint8")
    embedding = FaceService._histogram_embedding(fake_face)

    assert len(embedding) == FaceService.HISTOGRAM_BLOCKS ** 2
    norm = np.linalg.norm(embedding)
    assert abs(norm - 1.0) < 1e-6


def test_histogram_embedding_is_deterministic():
    face = (np.random.rand(96, 96) * 255).astype("uint8")
    e1 = FaceService._histogram_embedding(face)
    e2 = FaceService._histogram_embedding(face)
    assert e1 == e2
