const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 8080;
const ROOT_DIR = __dirname;

const mimeTypes = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.mjs': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.wav': 'audio/wav',
    '.mp3': 'audio/mpeg',
    '.ogg': 'audio/ogg',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf'
};

const server = http.createServer((req, res) => {
    // Remove query string and decode URL
    let filePath = decodeURIComponent(req.url.split('?')[0]);
    
    // Default to index.html
    if (filePath === '/') {
        filePath = '/index.html';
    }
    
    // Construct absolute path
    const absolutePath = path.join(ROOT_DIR, filePath);
    
    // Security check - prevent directory traversal
    if (!absolutePath.startsWith(ROOT_DIR)) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
    }
    
    // Check if file exists
    fs.stat(absolutePath, (err, stats) => {
        if (err || !stats.isFile()) {
            res.writeHead(404);
            res.end('File not found');
            return;
        }
        
        // Get file extension and MIME type
        const ext = path.extname(absolutePath).toLowerCase();
        const contentType = mimeTypes[ext] || 'application/octet-stream';
        
        // Read and serve file
        fs.readFile(absolutePath, (err, data) => {
            if (err) {
                res.writeHead(500);
                res.end('Server error');
                return;
            }
            
            res.writeHead(200, {
                'Content-Type': contentType,
                'Access-Control-Allow-Origin': '*'
            });
            res.end(data);
        });
    });
});

server.listen(PORT, () => {
    console.log(`\n╔══════════════════════════════════════════════════════════════╗`);
    console.log(`║              MINECRAFT CLONE - WEB SERVER                    ║`);
    console.log(`╠══════════════════════════════════════════════════════════════╣`);
    console.log(`║  Game URL: http://localhost:${PORT}                            ║`);
    console.log(`╠══════════════════════════════════════════════════════════════╣`);
    console.log(`║  For multiplayer, also run: cd server && npm start           ║`);
    console.log(`╚══════════════════════════════════════════════════════════════╝\n`);
});
