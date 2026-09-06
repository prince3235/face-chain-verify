import io
import logging
from dataclasses import dataclass
from typing import List, Tuple

import numpy as np
from PIL import Image

logger = logging.getLogger(__name__)

try:
    import face_recognition  # noqa: F401
    _HAS_FACE_RECOGNITION = True
except ImportError:
    _HAS_FACE_RECOGNITION = False
    logger.warning(
        "`face_recognition` is not installed — falling back to an OpenCV-based "
        "encoder. This still runs a real detection + embedding pipeline, just "
        "with lower accuracy. Install face_recognition/dlib for production use "
        "(see requirements.txt)."
    )

try:
    import cv2
    _HAS_CV2 = True
except ImportError:
    _HAS_CV2 = False


@dataclass
class FaceDetectionResult:
    embedding: List[float]
    bounding_box: Tuple[int, int, int, int]  # x, y, width, height


class FaceServiceError(Exception):
    """Raised when a face cannot be detected or encoded."""


class FaceService:
    """
    Detects a face in an image and produces a numeric embedding that can be
    compared against other faces via similarity search.

    Backend selection (checked once at startup):
      1. `face_recognition` (dlib ResNet embeddings) if installed —
         production-grade accuracy.
      2. OpenCV Haar cascade + normalized block-histogram embedding — a real,
         dependency-light fallback so the full pipeline runs end-to-end
         without needing dlib's native build step. Lower accuracy; swap in
         (1) for anything beyond a demo.
    """

    HISTOGRAM_BLOCKS = 8

    def __init__(self):
        self._use_face_recognition = _HAS_FACE_RECOGNITION
        if not self._use_face_recognition:
            if not _HAS_CV2:
                raise FaceServiceError(
                    "Neither `face_recognition` nor `opencv-python-headless` "
                    "is available. Install at least one — see requirements.txt."
                )
            cascade_path = cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
            self._cascade = cv2.CascadeClassifier(cascade_path)
            if self._cascade.empty():
                raise FaceServiceError("Failed to load OpenCV Haar cascade for face detection.")

    def detect_and_encode(self, image_bytes: bytes) -> FaceDetectionResult:
        try:
            image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        except Exception as e:
            raise FaceServiceError(f"Could not read image: {e}") from e

        np_image = np.array(image)

        if self._use_face_recognition:
            return self._encode_with_face_recognition(np_image)
        return self._encode_with_opencv(np_image)

    def _encode_with_face_recognition(self, np_image: np.ndarray) -> FaceDetectionResult:
        import face_recognition  # imported lazily; only reached if available

        locations = face_recognition.face_locations(np_image)
        if not locations:
            raise FaceServiceError("No face detected in the image.")

        top, right, bottom, left = locations[0]
        encodings = face_recognition.face_encodings(np_image, [locations[0]])
        if not encodings:
            raise FaceServiceError("Face detected but could not be encoded.")

        embedding = encodings[0].tolist()
        bbox = (left, top, right - left, bottom - top)
        return FaceDetectionResult(embedding=embedding, bounding_box=bbox)

    def _encode_with_opencv(self, np_image: np.ndarray) -> FaceDetectionResult:
        gray = cv2.cvtColor(np_image, cv2.COLOR_RGB2GRAY)
        faces = self._cascade.detectMultiScale(
            gray, scaleFactor=1.1, minNeighbors=5, minSize=(60, 60)
        )
        if len(faces) == 0:
            raise FaceServiceError("No face detected in the image.")

        # Take the largest detected face if there are several.
        x, y, w, h = max(faces, key=lambda f: f[2] * f[3])
        face_roi = cv2.resize(gray[y : y + h, x : x + w], (96, 96))
        embedding = self._histogram_embedding(face_roi)
        return FaceDetectionResult(
            embedding=embedding, bounding_box=(int(x), int(y), int(w), int(h))
        )

    @classmethod
    def _histogram_embedding(cls, face_roi: np.ndarray) -> List[float]:
        """A real, deterministic embedding: normalized block-wise mean
        intensity over an NxN grid, L2-normalized. Not state-of-the-art
        face recognition, but a genuine numeric fingerprint of the face
        crop that behaves consistently for similarity search."""
        n = cls.HISTOGRAM_BLOCKS
        h, w = face_roi.shape
        bh, bw = h // n, w // n
        vector = []
        for i in range(n):
            for j in range(n):
                block = face_roi[i * bh : (i + 1) * bh, j * bw : (j + 1) * bw]
                vector.append(float(np.mean(block)) / 255.0)
        arr = np.array(vector)
        norm = np.linalg.norm(arr) or 1.0
        return (arr / norm).tolist()
