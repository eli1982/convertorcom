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


def download_youtube_video(url: str, output_dir: str = "downloads", progress_callback=None) -> dict:
    """
    Downloads a YouTube video at the best quality up to 1080p in MP4 format.
    
    Args:
        url: The YouTube video URL
        output_dir: Directory where the video will be saved (default: "downloads")
        
    Returns:
        A dictionary with 'success' (bool), 'filepath' (str), and 'message' (str)
    """
    print(f"\n--- Starting YouTube Download ---")
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
    
    # Configure yt-dlp options
    ydl_opts = {
        'format': 'bestvideo[height<=1080][ext=mp4]+bestaudio[ext=m4a]/best[height<=1080][ext=mp4]/best[height<=1080]',
        'outtmpl': os.path.join(output_dir, '%(title)s.%(ext)s'),
        'merge_output_format': 'mp4',
        'postprocessors': [{
            'key': 'FFmpegVideoConvertor',
            'preferedformat': 'mp4',
        }],
        'quiet': False,
        'no_warnings': False,
        'extract_flat': False,
        'progress_hooks': [progress_hook],
    }
    
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            # Extract video info first
            print("\nExtracting video information...")
            info = ydl.extract_info(url, download=False)
            
            video_title = info.get('title', 'video')
            sanitized_title = sanitize_filename(video_title)
            
            print(f"Video Title: {video_title}")
            print(f"Duration: {info.get('duration', 0)} seconds")
            
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
                'message': f'Successfully downloaded: {video_title}'
            }
            
    except Exception as e:
        error_msg = f"Failed to download video: {str(e)}"
        print(f"\n🚨 ERROR: {error_msg}")
        return {
            'success': False,
            'filepath': None,
            'message': error_msg
        }


if __name__ == "__main__":
    import sys
    
    if len(sys.argv) < 2:
        print("Usage: python youtube_downloader.py <YOUTUBE_URL> [OUTPUT_DIR]")
        print("\nExample:")
        print("python youtube_downloader.py https://www.youtube.com/watch?v=dQw4w9WgXcQ")
        print("python youtube_downloader.py https://www.youtube.com/watch?v=dQw4w9WgXcQ my_videos")
        sys.exit(1)
    
    youtube_url = sys.argv[1]
    output_directory = sys.argv[2] if len(sys.argv) > 2 else "downloads"
    
    result = download_youtube_video(youtube_url, output_directory)
    
    if not result['success']:
        sys.exit(1)
