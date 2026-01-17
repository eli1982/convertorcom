// Save Manager
export class SaveManager {
    constructor(worldName) {
        this.worldName = worldName;
        this.storageKey = `webcraft_world_${worldName}`;
    }
    
    saveWorld(world) {
        const saveData = {
            name: this.worldName,
            seed: world.seed,
            type: world.type,
            time: world.time,
            weather: world.weather,
            chunks: this.serializeChunks(world.chunks),
            savedAt: Date.now()
        };
        
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(saveData));
            console.log('World saved successfully');
        } catch (e) {
            console.error('Failed to save world:', e);
            // If localStorage is full, try to save to IndexedDB
            this.saveToIndexedDB(saveData);
        }
    }
    
    savePlayer(player) {
        const playerData = {
            position: player.position,
            rotation: player.rotation,
            health: player.health,
            hunger: player.hunger,
            experience: player.experience,
            inventory: this.serializeInventory(player.inventory),
            gameMode: player.gameMode
        };
        
        try {
            localStorage.setItem(`${this.storageKey}_player`, JSON.stringify(playerData));
        } catch (e) {
            console.error('Failed to save player:', e);
        }
    }
    
    loadWorld() {
        try {
            const data = localStorage.getItem(this.storageKey);
            if (data) {
                return JSON.parse(data);
            }
        } catch (e) {
            console.error('Failed to load world:', e);
        }
        return null;
    }
    
    loadPlayer() {
        try {
            const data = localStorage.getItem(`${this.storageKey}_player`);
            if (data) {
                return JSON.parse(data);
            }
        } catch (e) {
            console.error('Failed to load player:', e);
        }
        return null;
    }
    
    serializeChunks(chunks) {
        const serialized = {};
        
        chunks.forEach((chunk, key) => {
            if (chunk.modified) {
                serialized[key] = {
                    x: chunk.x,
                    z: chunk.z,
                    blocks: this.compressBlockData(chunk.blocks)
                };
            }
        });
        
        return serialized;
    }
    
    compressBlockData(blocks) {
        // Run-length encoding for block data
        const compressed = [];
        let currentBlock = blocks[0];
        let count = 1;
        
        for (let i = 1; i < blocks.length; i++) {
            if (blocks[i] === currentBlock) {
                count++;
            } else {
                compressed.push([currentBlock, count]);
                currentBlock = blocks[i];
                count = 1;
            }
        }
        compressed.push([currentBlock, count]);
        
        return compressed;
    }
    
    decompressBlockData(compressed, size) {
        const blocks = new Uint8Array(size);
        let index = 0;
        
        for (const [block, count] of compressed) {
            for (let i = 0; i < count && index < size; i++) {
                blocks[index++] = block;
            }
        }
        
        return blocks;
    }
    
    serializeInventory(inventory) {
        return inventory.slots.map(slot => {
            if (slot.item) {
                return {
                    id: slot.item.id,
                    count: slot.count
                };
            }
            return null;
        });
    }
    
    async saveToIndexedDB(data) {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('WebCraft', 1);
            
            request.onerror = () => reject(request.error);
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains('worlds')) {
                    db.createObjectStore('worlds', { keyPath: 'name' });
                }
            };
            
            request.onsuccess = (event) => {
                const db = event.target.result;
                const transaction = db.transaction(['worlds'], 'readwrite');
                const store = transaction.objectStore('worlds');
                store.put(data);
                
                transaction.oncomplete = () => resolve();
                transaction.onerror = () => reject(transaction.error);
            };
        });
    }
    
    static getWorldList() {
        const worlds = [];
        
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith('webcraft_world_') && !key.endsWith('_player')) {
                try {
                    const data = JSON.parse(localStorage.getItem(key));
                    worlds.push({
                        name: data.name,
                        savedAt: data.savedAt,
                        seed: data.seed
                    });
                } catch (e) {
                    // Skip invalid entries
                }
            }
        }
        
        return worlds.sort((a, b) => b.savedAt - a.savedAt);
    }
    
    static deleteWorld(worldName) {
        const key = `webcraft_world_${worldName}`;
        localStorage.removeItem(key);
        localStorage.removeItem(`${key}_player`);
    }
}
