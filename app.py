from flask import Flask, request, jsonify, send_file, render_template, send_from_directory
from flask_cors import CORS
import os
import threading
import uuid
from datetime import datetime
from downloader import download_video
import mimetypes
from werkzeug.utils import secure_filename

# Add MIME type for JSX files
mimetypes.add_type('text/javascript', '.jsx')

app = Flask(__name__)
CORS(app)

# Configuration
DOWNLOAD_DIR = "downloads"
UPLOAD_FOLDER = os.path.join('static', 'uploads')
GAMES_FOLDER = 'games'
os.makedirs(DOWNLOAD_DIR, exist_ok=True)
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(GAMES_FOLDER, exist_ok=True)

# Store download status in memory (for production, use a database)
download_status = {}


def download_task(task_id: str, url: str):
    """Background task to download a video."""
    print(f"Starting download task {task_id} for URL: {url}")
    try:
        download_status[task_id]['status'] = 'downloading'
        download_status[task_id]['message'] = 'Starting download...'
        download_status[task_id]['progress'] = 0
        print(f"Task {task_id}: Status updated to downloading")
        
        # Progress callback to update status
        def update_progress(percentage):
            download_status[task_id]['progress'] = min(int(percentage), 100)
            download_status[task_id]['message'] = f'Downloading... {int(percentage)}%'
        
        result = download_video(url, DOWNLOAD_DIR, progress_callback=update_progress)
        print(f"Task {task_id}: Download result: {result}")
        
        if result['success']:
            download_status[task_id]['status'] = 'completed'
            download_status[task_id]['message'] = result['message']
            download_status[task_id]['filepath'] = result['filepath']
            download_status[task_id]['filename'] = os.path.basename(result['filepath'])
            download_status[task_id]['type'] = result['type']
            download_status[task_id]['progress'] = 100
            print(f"Task {task_id}: Completed successfully")
        else:
            download_status[task_id]['status'] = 'failed'
            download_status[task_id]['message'] = result['message']
            download_status[task_id]['progress'] = 0
            print(f"Task {task_id}: Failed - {result['message']}")
            
    except Exception as e:
        error_msg = f'Download error: {str(e)}'
        download_status[task_id]['status'] = 'failed'
        download_status[task_id]['message'] = error_msg
        download_status[task_id]['progress'] = 0
        print(f"Task {task_id}: Exception - {error_msg}")
        import traceback
        traceback.print_exc()


@app.route('/')
def index():
    """Serve the main HTML page."""
    return render_template('index.html')


@app.route('/hands_teleoperations_demo')
def hands():
    """Serve the hand gesture FX page."""
    return render_template('hands_teleoperations_demo.html')


@app.route('/lumina')
def lumina():
    """Serve the Lumina game page."""
    return render_template('Lumina.html')


@app.route('/game_creator')
def game_creator():
    """Serve the game creator page."""
    return render_template('game_creator.html')


@app.route('/flappybird')
def flappybird():
    """Serve the Flappy Bird 3D game."""
    return render_template('FLAPPYBIRD3d.html')


@app.route('/api/download', methods=['POST'])
def start_download():
    """
    Start a video download.
    
    Expected JSON body:
    {
        "url": "https://youtube.com/watch?v=..."
    }
    
    Returns:
    {
        "task_id": "unique-task-id",
        "message": "Download started"
    }
    """
    print("Received download request")
    data = request.get_json()
    print(f"Request data: {data}")
    
    if not data or 'url' not in data:
        print("Error: Missing URL parameter")
        return jsonify({'error': 'Missing URL parameter'}), 400
    
    url = data['url']
    
    # Generate unique task ID
    task_id = str(uuid.uuid4())
    
    # Initialize task status
    download_status[task_id] = {
        'status': 'pending',
        'message': 'Download queued',
        'url': url,
        'created_at': datetime.now().isoformat(),
        'filepath': None,
        'filename': None,
        'type': None,
        'progress': 0
    }
    
    # Start download in background thread
    thread = threading.Thread(target=download_task, args=(task_id, url))
    thread.daemon = True
    thread.start()
    
    return jsonify({
        'task_id': task_id,
        'message': 'Download started'
    }), 202


@app.route('/api/status/<task_id>', methods=['GET'])
def get_status(task_id):
    """
    Get the status of a download task.
    
    Returns:
    {
        "status": "pending|downloading|completed|failed",
        "message": "Status message",
        "filepath": "/path/to/file" (if completed),
        "filename": "filename.mp4" (if completed),
        "type": "youtube|twitter|m3u8" (if completed)
    }
    """
    if task_id not in download_status:
        return jsonify({'error': 'Task not found'}), 404
    
    return jsonify(download_status[task_id])


@app.route('/api/download/<task_id>', methods=['GET'])
def download_file(task_id):
    """
    Download the completed video file.
    """
    if task_id not in download_status:
        return jsonify({'error': 'Task not found'}), 404
    
    task = download_status[task_id]
    
    if task['status'] != 'completed':
        return jsonify({'error': 'Download not completed yet'}), 400
    
    if not task['filepath'] or not os.path.exists(task['filepath']):
        return jsonify({'error': 'File not found'}), 404
    
    return send_file(
        task['filepath'],
        as_attachment=True,
        download_name=task['filename']
    )


@app.route('/api/stream/<task_id>', methods=['GET'])
def stream_video(task_id):
    """
    Stream the completed video file for playback in browser.
    """
    if task_id not in download_status:
        return jsonify({'error': 'Task not found'}), 404
    
    task = download_status[task_id]
    
    if task['status'] != 'completed':
        return jsonify({'error': 'Download not completed yet'}), 400
    
    if not task['filepath'] or not os.path.exists(task['filepath']):
        return jsonify({'error': 'File not found'}), 404
    
    return send_file(
        task['filepath'],
        mimetype='video/mp4',
        as_attachment=False
    )


@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint."""
    return jsonify({
        'status': 'healthy',
        'service': 'video-downloader',
        'timestamp': datetime.now().isoformat()
    })


@app.route('/upload-image', methods=['POST'])
def upload_image():
    if 'image' not in request.files:
        return jsonify({'error': 'No image provided'}), 400
    file = request.files['image']
    if file.filename == '':
        return jsonify({'error': 'Empty filename'}), 400
    filename = secure_filename(file.filename or 'image.png')
    ext = os.path.splitext(filename)[1]
    unique_name = f"{uuid.uuid4().hex}{ext}"
    save_path = os.path.join(UPLOAD_FOLDER, unique_name)
    file.save(save_path)
    return jsonify({'url': f"/static/uploads/{unique_name}"})


@app.route('/save-game', methods=['POST'])
def save_game():
    data = request.get_json(force=True, silent=True)
    if not data:
        return jsonify({'error': 'Missing data'}), 400
    html = data.get('html')
    game_id = data.get('game_id')
    version = data.get('version')
    if not html or not game_id or not version:
        return jsonify({'error': 'Missing data'}), 400
    game_dir = os.path.join(GAMES_FOLDER, secure_filename(game_id))
    os.makedirs(game_dir, exist_ok=True)
    filename = secure_filename(f"{version}.html")
    file_path = os.path.join(game_dir, filename)
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(html)
    return jsonify({'success': True, 'path': f"/{GAMES_FOLDER}/{secure_filename(game_id)}/{filename}"})


@app.route('/list-game-versions/<game_id>', methods=['GET'])
def list_game_versions(game_id):
    game_dir = os.path.join(GAMES_FOLDER, secure_filename(game_id))
    if not os.path.exists(game_dir):
        return jsonify({'versions': []})
    versions = [f for f in os.listdir(game_dir) if f.endswith('.html')]
    versions.sort(reverse=True)
    return jsonify({'versions': versions})


@app.route('/get-game/<game_id>/<version>', methods=['GET'])
def get_game_version(game_id, version):
    game_dir = os.path.join(GAMES_FOLDER, secure_filename(game_id))
    safe_version = secure_filename(version)
    file_path = os.path.join(game_dir, safe_version)
    if not os.path.exists(file_path):
        return jsonify({'error': 'Game version not found'}), 404
    return send_from_directory(game_dir, safe_version)


@app.route('/delete-game/<game_id>/<version>', methods=['DELETE'])
def delete_game_version(game_id, version):
    game_dir = os.path.join(GAMES_FOLDER, secure_filename(game_id))
    safe_version = secure_filename(version)
    file_path = os.path.join(game_dir, safe_version)
    
    if not os.path.exists(file_path):
        return jsonify({'error': 'Game version not found'}), 404
    
    try:
        os.remove(file_path)
        return jsonify({'success': True, 'message': 'Game version deleted'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    print("=" * 60)
    print("VIDEO DOWNLOADER WEB SERVICE")
    print("=" * 60)
    print(f"Server starting on http://localhost:5000")
    print(f"Downloads will be saved to: {os.path.abspath(DOWNLOAD_DIR)}")
    print("=" * 60)
    
    app.run(debug=True, host='0.0.0.0', port=5000)
