import yt_dlp
import os
import re


def sanitize_filename(filename: str) -> str:
    """
    Sanitizes a filename by removing or replacing invalid characters.
    
    Args:
        filename: The original filename
        
    Returns:
        A sanitized filename safe for use on most filesystems
    """
    # Remove invalid characters for Windows/Linux filesystems
    filename = re.sub(r'[<>:"/\\|?*]', '', filename)
    # Replace multiple spaces with single space
    filename = re.sub(r'\s+', ' ', filename)
    # Remove leading/trailing spaces and dots
    filename = filename.strip('. ')
    # Limit length to avoid filesystem issues
    if len(filename) > 200:
        filename = filename[:200]
    return filename


def download_twitter_video(url: str, output_dir: str = "downloads", progress_callback=None) -> dict:
    """
    Downloads a Twitter/X video at the best quality up to 1080p in MP4 format.
    
    Args:
        url: The Twitter/X video URL
        output_dir: Directory where the video will be saved (default: "downloads")
        
    Returns:
        A dictionary with 'success' (bool), 'filepath' (str), and 'message' (str)
    """
    print(f"\n--- Starting Twitter/X Download ---")
    print(f"URL: {url}")
    
    # Create output directory if it doesn't exist
    os.makedirs(output_dir, exist_ok=True)
    
    # Progress hook for yt-dlp
    def progress_hook(d):
        if progress_callback and d['status'] == 'downloading':
            total = d.get('total_bytes') or d.get('total_bytes_estimate', 0)
            downloaded = d.get('downloaded_bytes', 0)
            if total > 0:
                percentage = (downloaded / total) * 100
                progress_callback(percentage)
    
    # Configure yt-dlp options for Twitter
    ydl_opts = {
        'format': 'best[height<=1080][ext=mp4]/best[height<=1080]/best',
        'outtmpl': os.path.join(output_dir, '%(uploader)s_%(id)s.%(ext)s'),
        'merge_output_format': 'mp4',
        'postprocessors': [{
            'key': 'FFmpegVideoConvertor',
            'preferedformat': 'mp4',
        }],
        'quiet': False,
        'no_warnings': False,
        # Twitter-specific options
        'extractor_args': {
            'twitter': {
                'api': ['syndication', 'graphql']
            }
        },
        'progress_hooks': [progress_hook],
    }
    
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            # Extract video info first
            print("\nExtracting video information...")
            info = ydl.extract_info(url, download=False)
            
            # Create a meaningful filename
            uploader = info.get('uploader', 'twitter_user')
            video_id = info.get('id', 'video')
            description = info.get('description', '')
            
            # Try to create a meaningful title from description (first 50 chars)
            if description:
                title_part = description[:50].replace('\n', ' ').strip()
                sanitized_title = sanitize_filename(f"{uploader}_{title_part}_{video_id}")
            else:
                sanitized_title = sanitize_filename(f"{uploader}_{video_id}")
            
            print(f"Uploader: {uploader}")
            print(f"Video ID: {video_id}")
            
            # Update output template with sanitized filename
            ydl_opts['outtmpl'] = os.path.join(output_dir, f'{sanitized_title}.%(ext)s')
            
            # Download the video
            print("\nDownloading video...")
            with yt_dlp.YoutubeDL(ydl_opts) as ydl_download:
                ydl_download.download([url])
            
            output_file = os.path.join(output_dir, f'{sanitized_title}.mp4')
            
            print("\n--------------------------------")
            print(f"✅ Success! Video saved to: {os.path.abspath(output_file)}")
            print("--------------------------------")
            
            return {
                'success': True,
                'filepath': os.path.abspath(output_file),
                'message': f'Successfully downloaded Twitter video from @{uploader}'
            }
            
    except Exception as e:
        error_msg = str(e)
        
        # Provide more helpful error messages
        if "No video could be found" in error_msg:
            error_msg = ("No video found in this tweet. Please ensure:\n"
                        "1. The tweet actually contains a video (not just images)\n"
                        "2. The video is not from a private/protected account\n"
                        "3. You're using the full tweet URL (e.g., https://twitter.com/user/status/123...)")
        elif "403" in error_msg or "Forbidden" in error_msg:
            error_msg = "Access forbidden. The tweet may be from a private account or region-restricted."
        elif "404" in error_msg or "Not Found" in error_msg:
            error_msg = "Tweet not found. Please check the URL is correct."
        
        print(f"\n🚨 ERROR: Failed to download Twitter video: {error_msg}")
        return {
            'success': False,
            'filepath': None,
            'message': f'Failed to download Twitter video: {error_msg}'
        }


if __name__ == "__main__":
    import sys
    
    if len(sys.argv) < 2:
        print("Usage: python twitter_downloader.py <TWITTER_URL> [OUTPUT_DIR]")
        print("\nExample:")
        print("python twitter_downloader.py https://twitter.com/user/status/1234567890")
        print("python twitter_downloader.py https://x.com/user/status/1234567890 my_videos")
        sys.exit(1)
    
    twitter_url = sys.argv[1]
    output_directory = sys.argv[2] if len(sys.argv) > 2 else "downloads"
    
    result = download_twitter_video(twitter_url, output_directory)
    
    if not result['success']:
        sys.exit(1)
