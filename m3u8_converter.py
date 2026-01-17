import subprocess
import sys
import os

# --- Configuration ---
FFMPEG_PATH = 'ffmpeg' # Assumes 'ffmpeg' is in your system's PATH. 
                       # If not, replace this with the full path to the ffmpeg executable.

# --- New Default URL ---
# The URL provided by the user is used as the default stream source.
DEFAULT_M3U8_URL = 'https://video.squarespace-cdn.com/content/v1/5f9279271169d63a9f790c2d/6835a230-aa77-4902-8032-797b4c2a0fd2/playlist.m3u8'

def convert_m3u8_to_mp4(m3u8_url: str, output_filename: str):
    """
    Downloads and converts an M3U8 HLS stream to an MP4 file using FFmpeg.
    
    Args:
        m3u8_url: The URL of the M3U8 playlist file.
        output_filename: The name of the resulting MP4 file.
    """
    print(f"\n--- Starting M3U8 Conversion ---")
    print(f"Source URL: {m3u8_url}")
    print(f"Output File: {output_filename}")

    # The core FFmpeg command
    # -i: Input URL
    # -c copy: Copy the video and audio streams without re-encoding (fast and lossless)
    # -bsf:a aac_adtstoasc: Bitstream filter needed when copying AAC audio to an MP4 container
    
    ffmpeg_command = [
        FFMPEG_PATH,
        '-i', m3u8_url,
        '-c', 'copy',
        '-bsf:a', 'aac_adtstoasc',
        output_filename
    ]

    try:
        # Execute the FFmpeg command
        print("\nExecuting FFmpeg... (This process may take time depending on stream length)")
        
        # subprocess.run handles execution and waits for completion
        # capture_output=False shows FFmpeg's progress directly in the terminal
        result = subprocess.run(ffmpeg_command, check=True, capture_output=False)
        
        if result.returncode == 0:
            print("\n--------------------------------")
            print(f"✅ Success! Video saved to: {os.path.abspath(output_filename)}")
            print("--------------------------------")
        
    except FileNotFoundError:
        print("\n-----------------------------------------------------")
        print("🚨 ERROR: FFmpeg executable not found!")
        print(f"Please ensure FFmpeg is installed and accessible via the '{FFMPEG_PATH}' command.")
        print("-----------------------------------------------------")
    except subprocess.CalledProcessError as e:
        print("\n-----------------------------------------------------")
        print(f"🚨 ERROR: FFmpeg failed with return code {e.returncode}.")
        print("The M3U8 URL may be invalid, protected, or the stream format is unsupported.")
        print("-----------------------------------------------------")
    except Exception as e:
        print(f"\n🚨 An unexpected error occurred: {e}")

if __name__ == "__main__":
    # Get the number of arguments (including script name)
    num_args = len(sys.argv)
    
    url = None
    filename = None
    
    if num_args == 3:
        # Case 1: User provided URL and filename
        url = sys.argv[1]
        filename = sys.argv[2]
    elif num_args == 2:
        # Case 2: User provided only filename, use default URL
        url = DEFAULT_M3U8_URL
        filename = sys.argv[1]
        print(f"Using default M3U8 URL: {url}")
    else:
        # Case 3: Incorrect number of arguments (0 or >2)
        print("Usage:")
        print(f"1. To use a custom URL: python {sys.argv[0]} <M3U8_URL> <OUTPUT_FILENAME.mp4>")
        print(f"2. To use the default URL: python {sys.argv[0]} <OUTPUT_FILENAME.mp4>")
        print("\nExample:")
        print(f"python {sys.argv[0]} my_video.mp4")
        print(f"python {sys.argv[0]} https://another-stream.com/list.m3u8 custom_video.mp4")
        sys.exit(1)

    convert_m3u8_to_mp4(url, filename)
