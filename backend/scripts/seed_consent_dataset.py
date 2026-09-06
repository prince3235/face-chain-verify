"""
Register a consented face + post pair into the demo registry.

Only run this for people who have explicitly agreed to have their face and
a real post of theirs used in this demo. This is the one place new entries
enter the pipeline's search space — see docs/CONSENT_POLICY.md.

Usage:
    python scripts/seed_consent_dataset.py \\
        --image ./my_photo.jpg \\
        --person-id p1 \\
        --display-name "Priya S." \\
        --platform "Instagram (demo)" \\
        --url "https://instagram.com/p/example123" \\
        --text "Caption of the consented demo post"
"""

import argparse
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from services.consent_registry import ConsentedEntry, ConsentedPost, ConsentRegistry  # noqa: E402
from services.face_service import FaceService, FaceServiceError  # noqa: E402


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--image", required=True, help="Path to the person's face photo")
    parser.add_argument("--person-id", required=True)
    parser.add_argument("--display-name", required=True)
    parser.add_argument("--platform", required=True, help="e.g. 'Instagram (demo)'")
    parser.add_argument("--url", required=True, help="URL of the consented post")
    parser.add_argument("--text", required=True, help="Text/caption of the consented post")
    args = parser.parse_args()

    image_bytes = Path(args.image).read_bytes()

    face_service = FaceService()
    try:
        result = face_service.detect_and_encode(image_bytes)
    except FaceServiceError as e:
        print(f"Failed to encode face: {e}")
        raise SystemExit(1)

    registry = ConsentRegistry()
    registry.add_entry(
        ConsentedEntry(
            person_id=args.person_id,
            display_name=args.display_name,
            embedding=result.embedding,
            posts=[ConsentedPost(platform=args.platform, url=args.url, text=args.text)],
        )
    )
    print(
        f"Registered '{args.display_name}' ({args.person_id}) with a "
        f"{len(result.embedding)}-dim embedding into {registry.registry_path}"
    )


if __name__ == "__main__":
    main()
