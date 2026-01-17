# Universal Video Downloader

A complete video downloading system that supports multiple platforms with an easy-to-use web interface.

## 🌟 Features

- **Multi-Platform Support:**
  - 📺 YouTube videos (max 1080p)
  - 🐦 Twitter/X videos (max 1080p)
  - 📡 M3U8 live streams (maximum available resolution)

- **Smart Features:**
  - Automatic URL detection
  - Proper filename generation using video titles
  - MP4 format output (universal compatibility)
  - Clean web interface
  - Background downloading with status tracking

## 📋 Prerequisites

Before running the application, ensure you have:

1. **Python 3.8+** installed
2. **FFmpeg** installed and available in your system PATH
   - Windows: Download from https://ffmpeg.org/download.html
   - Add FFmpeg to your system PATH

## 🚀 Installation

1. **Install Python dependencies:**
   ```powershell
   pip install -r requirements.txt
   ```

2. **Verify FFmpeg installation:**
   ```powershell
   ffmpeg -version
   ```

## 💻 Usage

### Web Interface (Recommended)

1. **Start the web server:**
   ```powershell
   python app.py
   ```

2. **Open your browser:**
   - Navigate to `http://localhost:5000`
   - Paste any supported video URL
   - Click "Download Video"
   - Wait for the download to complete
   - Click the download button to save the file

### Command Line Interface

#### Universal Downloader (Auto-detect)
```powershell
python downloader.py <VIDEO_URL> [OUTPUT_DIR]
```

Examples:
```powershell
# YouTube video
python downloader.py https://www.youtube.com/watch?v=dQw4w9WgXcQ

# Twitter video
python downloader.py https://twitter.com/user/status/1234567890 my_videos

# M3U8 stream
python downloader.py https://example.com/video/playlist.m3u8
```

#### Individual Downloaders

**YouTube:**
```powershell
python youtube_downloader.py <YOUTUBE_URL> [OUTPUT_DIR]
```

**Twitter/X:**
```powershell
python twitter_downloader.py <TWITTER_URL> [OUTPUT_DIR]
```

**M3U8:**
```powershell
python m3u8_converter.py <M3U8_URL> <OUTPUT_FILENAME.mp4>
```

## 📁 Project Structure

```
ConvertorCom/
├── app.py                    # Flask web application
├── downloader.py             # Universal downloader with auto-detection
├── youtube_downloader.py     # YouTube-specific downloader
├── twitter_downloader.py     # Twitter/X-specific downloader
├── m3u8_converter.py         # M3U8 stream converter
├── requirements.txt          # Python dependencies
├── templates/
│   └── index.html           # Web interface
└── downloads/               # Downloaded videos (created automatically)
```

## 🎯 Download Specifications

| Platform | Max Resolution | Format | Naming |
|----------|---------------|--------|--------|
| YouTube | 1080p | MP4 | Video title |
| Twitter/X | 1080p | MP4 | @username_description |
| M3U8 | Maximum available | MP4 | Timestamp or custom |

## 🔧 API Endpoints

If you're building on top of this service:

- `POST /api/download` - Start a download
  ```json
  {"url": "https://youtube.com/watch?v=..."}
  ```

- `GET /api/status/<task_id>` - Check download status

- `GET /api/download/<task_id>` - Download the completed file

- `GET /api/health` - Health check endpoint

## ⚠️ Troubleshooting

### FFmpeg not found
- Ensure FFmpeg is installed and in your system PATH
- Try running `ffmpeg -version` in PowerShell
- Restart your terminal after adding FFmpeg to PATH

### Module not found errors
- Run `pip install -r requirements.txt`
- Ensure you're using the correct Python environment

### Download fails
- Check if the URL is valid and accessible
- Some videos may be geo-restricted or private
- Twitter videos require the full tweet URL containing the video

## 📝 Notes

- Downloaded videos are saved in the `downloads/` directory
- The web server runs on port 5000 by default
- For production use, consider using a production WSGI server like Gunicorn
- Some platforms may have rate limiting or access restrictions

## 🛠️ Development

To modify download settings:

1. **YouTube/Twitter quality:** Edit format strings in `youtube_downloader.py` or `twitter_downloader.py`
2. **M3U8 conversion:** Modify FFmpeg command in `m3u8_converter.py`
3. **Web interface:** Edit `templates/index.html`
4. **API:** Modify `app.py`

## 📄 License

This tool is for personal use. Respect copyright laws and platform terms of service when downloading content.
