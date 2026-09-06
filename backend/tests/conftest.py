import sys
from pathlib import Path

# Allow tests to `import` backend modules the same way the app does
# (e.g. `from services.face_service import FaceService`), regardless of
# which directory pytest is invoked from.
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
