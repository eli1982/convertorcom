import re
import os
from urllib.parse import urlparse
from typing import Optional, Dict
import subprocess

# Import the individual downloaders
try:
    from youtube_downloader import download_youtube_video
    from twitter_downloader import download_twitter_video
    from m3u8_converter import convert_m3u8_to_mp4
except ImportError:
    # Fallback for when modules are in the same directory
    import sys
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    from youtube_downloader import download_youtube_video
    from twitter_downloader import download_twitter_video
    from m3u8_converter import convert_m3u8_to_mp4


class URLDetector:
    """Detects the type of video URL and routes to the appropriate downloader."""
    
    @staticmethod
    def is_youtube_url(url: str) -> bool:
        """Check if URL is from YouTube."""
        youtube_patterns = [
            r'(?:https?://)?(?:www\.)?youtube\.com/watch\?v=',
            r'(?:https?://)?(?:www\.)?youtube\.com/embed/',
            r'(?:https?://)?(?:www\.)?youtube\.com/v/',
            r'(?:https?://)?youtu\.be/',
            r'(?:https?://)?(?:www\.)?youtube\.com/shorts/',
        ]
        return any(re.search(pattern, url, re.IGNORECASE) for pattern in youtube_patterns)
    
    @staticmethod
    def is_twitter_url(url: str) -> bool:
        """Check if URL is from Twitter/X."""
        twitter_patterns = [
            r'(?:https?://)?(?:www\.)?twitter\.com/',
            r'(?:https?://)?(?:www\.)?x\.com/',
        ]
        return any(re.search(pattern, url, re.IGNORECASE) for pattern in twitter_patterns)
    
    @staticmethod
    def is_m3u8_url(url: str) -> bool:
        """Check if URL is an M3U8 playlist."""
        return url.lower().endswith('.m3u8') or 'm3u8' in url.lower()


def download_video(url: str, output_dir: str = "downloads", progress_callback=None) -> Dict:
    """
    Automatically detects the video source and downloads using the appropriate method.
    
    Args:
        url: The video URL (YouTube, Twitter/X, or M3U8)
        output_dir: Directory where the video will be saved (default: "downloads")
        progress_callback: Optional callback function for progress updates
        
    Returns:
        A dictionary with 'success' (bool), 'filepath' (str), 'message' (str), and 'type' (str)
    """
    print(f"\n{'='*60}")
    print(f"UNIVERSAL VIDEO DOWNLOADER")
    print(f"{'='*60}")
    print(f"Analyzing URL: {url}")
    
    # Create output directory
    os.makedirs(output_dir, exist_ok=True)
    
    detector = URLDetector()
    
    # Detect URL type and route to appropriate downloader
    if detector.is_youtube_url(url):
        print("Detected: YouTube video")
        result = download_youtube_video(url, output_dir, progress_callback)
        result['type'] = 'youtube'
        return result
        
    elif detector.is_twitter_url(url):
        print("Detected: Twitter/X video")
        result = download_twitter_video(url, output_dir, progress_callback)
        result['type'] = 'twitter'
        return result
        
    elif detector.is_m3u8_url(url):
        print("Detected: M3U8 stream")
        # Generate a filename based on URL or timestamp
        from datetime import datetime
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        output_file = os.path.join(output_dir, f"m3u8_video_{timestamp}.mp4")
        
        try:
            convert_m3u8_to_mp4(url, output_file)
            # Check if file was created successfully
            if os.path.exists(output_file) and os.path.getsize(output_file) > 0:
                return {
                    'success': True,
                    'filepath': os.path.abspath(output_file),
                    'message': 'Successfully downloaded M3U8 stream',
                    'type': 'm3u8'
                }
            else:
                return {
                    'success': False,
                    'filepath': None,
                    'message': 'M3U8 download failed - file not created',
                    'type': 'm3u8'
                }
        except Exception as e:
            return {
                'success': False,
                'filepath': None,
                'message': f'M3U8 download failed: {str(e)}',
                'type': 'm3u8'
            }
    
    else:
        error_msg = "Unable to detect video source. Supported: YouTube, Twitter/X, M3U8 streams"
        print(f"\n🚨 ERROR: {error_msg}")
        return {
            'success': False,
            'filepath': None,
            'message': error_msg,
            'type': 'unknown'
        }


if __name__ == "__main__":
    import sys
    
    if len(sys.argv) < 2:
        print("Usage: python downloader.py <VIDEO_URL> [OUTPUT_DIR]")
        print("\nSupported sources:")
        print("  - YouTube (youtube.com, youtu.be)")
        print("  - Twitter/X (twitter.com, x.com)")
        print("  - M3U8 streams (*.m3u8)")
        print("\nExample:")
        print("python downloader.py https://www.youtube.com/watch?v=dQw4w9WgXcQ")
        print("python downloader.py https://twitter.com/user/status/1234567890 my_videos")
        print("python downloader.py https://example.com/video/playlist.m3u8")
        sys.exit(1)
    
    video_url = sys.argv[1]
    output_directory = sys.argv[2] if len(sys.argv) > 2 else "downloads"
    
    result = download_video(video_url, output_directory)
    
    print(f"\n{'='*60}")
    if result['success']:
        print(f"✅ SUCCESS")
        print(f"Type: {result['type']}")
        print(f"File: {result['filepath']}")
    else:
        print(f"❌ FAILED")
        print(f"Error: {result['message']}")
    print(f"{'='*60}")
    
    sys.exit(0 if result['success'] else 1)
