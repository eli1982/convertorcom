const WebSocket = require('ws');
const http = require('http');

const PORT = process.env.PORT || 4000;

// Create HTTP server
const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Minecraft Server Running');
});

// Create WebSocket server
const wss = new WebSocket.Server({ server });

// Game state
const players = new Map();
const worldChanges = [];
let nextPlayerId = 1;

wss.on('connection', (ws) => {
    let playerId = null;
    
    console.log('New connection');
    
    ws.on('message', (data) => {
        try {
            const message = JSON.parse(data.toString());
            
            switch (message.type) {
                case 'join':
                    playerId = nextPlayerId++;
                    const player = {
                        id: playerId,
                        name: message.name || `Player${playerId}`,
                        skin: message.skin || {},
                        position: { x: 0, y: 70, z: 0 },
                        rotation: { x: 0, y: 0 },
                        ws: ws
                    };
                    players.set(playerId, player);
                    
                    // Send welcome
                    ws.send(JSON.stringify({
                        type: 'welcome',
                        playerId: playerId
                    }));
                    
                    // Send existing players list
                    const playersList = [];
                    players.forEach((p, id) => {
                        if (id !== playerId) {
                            playersList.push({
                                id: p.id,
                                name: p.name,
                                skin: p.skin,
                                position: p.position,
                                rotation: p.rotation
                            });
                        }
                    });
                    ws.send(JSON.stringify({
                        type: 'players_list',
                        players: playersList
                    }));
                    
                    // Send world changes
                    if (worldChanges.length > 0) {
                        ws.send(JSON.stringify({
                            type: 'world_data',
                            data: { changes: worldChanges }
                        }));
                    }
                    
                    // Broadcast new player to others
                    broadcast({
                        type: 'player_join',
                        player: {
                            id: playerId,
                            name: player.name,
                            skin: player.skin,
                            position: player.position,
                            rotation: player.rotation
                        }
                    }, playerId);
                    
                    console.log(`${player.name} joined (ID: ${playerId})`);
                    break;
                    
                case 'position':
                    if (playerId && players.has(playerId)) {
                        const p = players.get(playerId);
                        p.position = message.position;
                        p.rotation = message.rotation;
                        
                        broadcast({
                            type: 'player_update',
                            playerId: playerId,
                            data: {
                                position: message.position,
                                rotation: message.rotation,
                                velocity: message.velocity,
                                onGround: message.onGround,
                                animation: message.animation
                            }
                        }, playerId);
                    }
                    break;
                    
                case 'block_update':
                    // Store change
                    worldChanges.push({
                        position: message.position,
                        blockType: message.blockType
                    });
                    
                    // Broadcast to all players including sender
                    broadcast({
                        type: 'block_update',
                        position: message.position,
                        blockType: message.blockType
                    });
                    break;
                    
                case 'chat':
                    if (playerId && players.has(playerId)) {
                        const p = players.get(playerId);
                        broadcast({
                            type: 'chat',
                            playerId: playerId,
                            playerName: p.name,
                            message: message.message
                        });
                        console.log(`<${p.name}> ${message.message}`);
                    }
                    break;
                    
                case 'leave':
                    handleDisconnect();
                    break;
            }
        } catch (e) {
            console.error('Error parsing message:', e);
        }
    });
    
    function handleDisconnect() {
        if (playerId && players.has(playerId)) {
            const player = players.get(playerId);
            console.log(`${player.name} left (ID: ${playerId})`);
            
            broadcast({
                type: 'player_leave',
                playerId: playerId,
                playerName: player.name
            });
            
            players.delete(playerId);
        }
    }
    
    ws.on('close', handleDisconnect);
    ws.on('error', handleDisconnect);
});

function broadcast(message, excludeId = null) {
    const data = JSON.stringify(message);
    players.forEach((player, id) => {
        if (id !== excludeId && player.ws.readyState === WebSocket.OPEN) {
            player.ws.send(data);
        }
    });
}

server.listen(PORT, () => {
    console.log(`Minecraft Server running on port ${PORT}`);
    console.log(`Players can connect to: ws://localhost:${PORT}`);
});
