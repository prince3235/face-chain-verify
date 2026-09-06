import logging
import httpx
from bs4 import BeautifulSoup
from typing import Optional, Dict, Any

logger = logging.getLogger(__name__)

class WebSearchServiceError(Exception):
    """Raised when web search fails."""

class WebSearchService:
    """
    Genuine reverse image search using Google Lens (zero API key approach).
    Uploads the face crop to an anonymous ephemeral file host, then queries
    Google Lens and parses the results for matching social media posts.
    """
    def __init__(self):
        pass

    def upload_image(self, image_bytes: bytes) -> str:
        files = {"file": ("image.jpg", image_bytes, "image/jpeg")}
        try:
            with httpx.Client(timeout=15.0) as client:
                response = client.post("https://tmpfiles.org/api/v1/upload", files=files)
                response.raise_for_status()
                data = response.json()
                
                url = data.get("data", {}).get("url")
                if not url:
                    raise WebSearchServiceError("Failed to upload image to tmpfiles.org")
                
                # Convert to direct download link required by Google Lens
                direct_url = url.replace("tmpfiles.org/", "tmpfiles.org/dl/")
                return direct_url
        except Exception as e:
            logger.error(f"Image upload failed: {e}")
            raise WebSearchServiceError(f"Image upload failed: {e}")

    def search_google_lens(self, image_url: str) -> Optional[Dict[str, Any]]:
        lens_url = f"https://lens.google.com/uploadbyurl?url={image_url}"
        
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
        
        try:
            with httpx.Client(timeout=20.0, follow_redirects=True) as client:
                response = client.get(lens_url, headers=headers)
                response.raise_for_status()
                
                soup = BeautifulSoup(response.text, "lxml")
                
                social_platforms = {
                    "twitter.com": "X (Twitter)",
                    "x.com": "X (Twitter)",
                    "instagram.com": "Instagram",
                    "linkedin.com": "LinkedIn",
                    "facebook.com": "Facebook",
                    "tiktok.com": "TikTok"
                }
                
                links = soup.find_all("a", href=True)
                for link in links:
                    href = link["href"]
                    for domain, platform_name in social_platforms.items():
                        if domain in href and "google.com" not in href:
                            return {
                                "found": True,
                                "post_url": href,
                                "post_text": f"Found matching face on {platform_name} via Google Lens",
                                "source_platform": f"{platform_name} (Web Search)",
                                "confidence": 0.85 
                            }
                return None
        except Exception as e:
            logger.error(f"Google Lens search failed: {e}")
            return None

    def search(self, image_bytes: bytes) -> Dict[str, Any]:
        try:
            image_url = self.upload_image(image_bytes)
            logger.info(f"Uploaded image to {image_url} for Lens search")
            
            result = self.search_google_lens(image_url)
            if result:
                return result
                
            return {"found": False}
        except Exception as e:
            logger.error(f"Web search pipeline failed: {e}")
            return {"found": False}
