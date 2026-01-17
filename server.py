import os
import uuid
import requests
from flask import Flask, request, jsonify, send_from_directory, Response, redirect
from werkzeug.utils import secure_filename
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = os.path.join('static', 'uploads')
GAMES_FOLDER = 'games'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(GAMES_FOLDER, exist_ok=True)

@app.route('/upload-image', methods=['POST'])
def upload_image():
    if 'image' not in request.files:
        return jsonify({'error': 'No image part'}), 400
    file = request.files['image']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    filename = file.filename or 'image.png'
    ext = os.path.splitext(filename)[1]
    unique_name = f"{uuid.uuid4().hex}{ext}"
    save_path = os.path.join(UPLOAD_FOLDER, secure_filename(unique_name))
    file.save(save_path)
    url = f"/static/uploads/{unique_name}"
    return jsonify({'url': url})

@app.route('/save-game', methods=['POST'])
def save_game():
    data = request.get_json(force=True)
    if not data:
        return jsonify({'error': 'Missing data'}), 400
    html = data.get('html')
    game_id = data.get('game_id')
    version = data.get('version')
    if not html or not game_id or not version:
        return jsonify({'error': 'Missing data'}), 400
    game_dir = os.path.join(GAMES_FOLDER, secure_filename(game_id))
    os.makedirs(game_dir, exist_ok=True)
    filename = f"{version}.html"
    file_path = os.path.join(game_dir, filename)
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(html)
    return jsonify({'success': True, 'path': f"/{GAMES_FOLDER}/{game_id}/{filename}"})

@app.route('/list-game-versions/<game_id>', methods=['GET'])
def list_game_versions(game_id):
    game_dir = os.path.join(GAMES_FOLDER, secure_filename(game_id))
    if not os.path.exists(game_dir):
        return jsonify({'versions': []})
    versions = [f for f in os.listdir(game_dir) if f.endswith('.html')]
    versions.sort()
    return jsonify({'versions': versions})

@app.route('/get-game/<game_id>/<version>', methods=['GET'])
def get_game(game_id, version):
    game_dir = os.path.join(GAMES_FOLDER, secure_filename(game_id))
    file_path = os.path.join(game_dir, secure_filename(version))
    if not os.path.exists(file_path):
        return "Not found", 404
    return send_from_directory(game_dir, version)

@app.route('/proxy-image', methods=['GET'])
def proxy_image():
    url = request.args.get('url')
    if not url:
        return jsonify({'error': 'No URL provided'}), 400
    try:
        response = requests.get(url, timeout=10)
        return Response(
            response.content,
            content_type=response.headers.get('Content-Type', 'image/jpeg'),
            headers={
                'Access-Control-Allow-Origin': '*',
                'Cache-Control': 'public, max-age=86400'
            }
        )
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/paris-tram-simulator-3d')
def serve_paris_tram_redirect():
    return redirect('/paris-tram-simulator-3d/')

@app.route('/paris-tram-simulator-3d/')
def serve_paris_tram_index():
    return send_from_directory('paris-tram-simulator-3d', 'index.html')

@app.route('/paris-tram-simulator-3d/<path:filename>')
def serve_paris_tram_files(filename):
    return send_from_directory('paris-tram-simulator-3d', filename)

if __name__ == '__main__':
    app.run(debug=True)
