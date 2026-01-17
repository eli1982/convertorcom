// World class - handles world data and generation
export class World {
    constructor(options = {}) {
        this.seed = options.seed || Math.random().toString(36).substring(7);
        this.type = options.type || 'default';
        this.chunks = new Map();
        
        // Time system (0-24000, like Minecraft)
        this.time = 6000; // Start at morning
        this.dayLength = 1200; // seconds per day cycle
        
        // Weather
        this.weather = 'clear';
        this.weatherTimer = 0;
        
        // Noise generators for terrain
        this.initNoiseGenerators();
    }
    
    initNoiseGenerators() {
        // Create multiple noise layers for terrain generation
        // Using simple hash-based noise since we don't have simplex-noise loaded
        this.noiseSeed = this.hashString(this.seed);
    }
    
    hashString(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash);
    }
    
    // Simple noise function
    noise2D(x, y) {
        const n = Math.sin(x * 12.9898 + y * 78.233 + this.noiseSeed) * 43758.5453;
        return n - Math.floor(n);
    }
    
    // Smoothed noise
    smoothNoise(x, y) {
        const corners = (
            this.noise2D(x - 1, y - 1) + 
            this.noise2D(x + 1, y - 1) + 
            this.noise2D(x - 1, y + 1) + 
            this.noise2D(x + 1, y + 1)
        ) / 16;
        
        const sides = (
            this.noise2D(x - 1, y) + 
            this.noise2D(x + 1, y) + 
            this.noise2D(x, y - 1) + 
            this.noise2D(x, y + 1)
        ) / 8;
        
        const center = this.noise2D(x, y) / 4;
        
        return corners + sides + center;
    }
    
    // Interpolated noise
    interpolatedNoise(x, y) {
        const intX = Math.floor(x);
        const fracX = x - intX;
        const intY = Math.floor(y);
        const fracY = y - intY;
        
        const v1 = this.smoothNoise(intX, intY);
        const v2 = this.smoothNoise(intX + 1, intY);
        const v3 = this.smoothNoise(intX, intY + 1);
        const v4 = this.smoothNoise(intX + 1, intY + 1);
        
        const i1 = this.lerp(v1, v2, fracX);
        const i2 = this.lerp(v3, v4, fracX);
        
        return this.lerp(i1, i2, fracY);
    }
    
    lerp(a, b, t) {
        return a + t * (b - a);
    }
    
    // Perlin-like noise with octaves
    perlinNoise(x, y, octaves = 4, persistence = 0.5) {
        let total = 0;
        let frequency = 1;
        let amplitude = 1;
        let maxValue = 0;
        
        for (let i = 0; i < octaves; i++) {
            total += this.interpolatedNoise(x * frequency, y * frequency) * amplitude;
            maxValue += amplitude;
            amplitude *= persistence;
            frequency *= 2;
        }
        
        return total / maxValue;
    }
    
    // Get height at world position
    getHeightAt(x, z) {
        if (this.type === 'flat') {
            return 64;
        }
        
        // Base terrain
        const scale = 0.01;
        let height = this.perlinNoise(x * scale, z * scale, 4, 0.5) * 30 + 60;
        
        // Mountains
        const mountainScale = 0.005;
        const mountain = this.perlinNoise(x * mountainScale + 1000, z * mountainScale, 3, 0.6);
        if (mountain > 0.6) {
            height += (mountain - 0.6) * 100;
        }
        
        // Valleys/rivers
        const riverScale = 0.02;
        const river = Math.abs(this.perlinNoise(x * riverScale, z * riverScale, 2, 0.5) - 0.5);
        if (river < 0.05) {
            height = Math.min(height, 60 - (0.05 - river) * 200);
        }
        
        if (this.type === 'amplified') {
            height = 64 + (height - 64) * 2;
        }
        
        return Math.floor(height);
    }
    
    // Get biome at position
    getBiomeAt(x, z) {
        const tempScale = 0.005;
        const humidScale = 0.007;
        
        const temperature = this.perlinNoise(x * tempScale, z * tempScale, 2, 0.5);
        const humidity = this.perlinNoise(x * humidScale + 500, z * humidScale, 2, 0.5);
        
        if (temperature < 0.3) {
            return humidity > 0.5 ? 'snowy_taiga' : 'snowy_plains';
        } else if (temperature < 0.6) {
            if (humidity < 0.3) return 'plains';
            if (humidity < 0.6) return 'forest';
            return 'swamp';
        } else {
            if (humidity < 0.3) return 'desert';
            if (humidity < 0.6) return 'savanna';
            return 'jungle';
        }
    }
    
    // Get spawn position
    getSpawnPosition() {
        // Find a suitable spawn location near origin
        for (let x = 0; x < 100; x++) {
            for (let z = 0; z < 100; z++) {
                const height = this.getHeightAt(x, z);
                if (height > 63 && height < 100) {
                    // Return position well above the ground to ensure safety
                    return { x: x + 0.5, y: height + 3, z: z + 0.5 };
                }
            }
        }
        return { x: 0.5, y: 100, z: 0.5 };
    }
    
    // Get block at world coordinates
    getBlock(x, y, z) {
        if (y < 0 || y >= 256) return 0;
        
        const chunkX = Math.floor(x / 16);
        const chunkZ = Math.floor(z / 16);
        const chunk = this.getChunk(chunkX, chunkZ);
        
        if (!chunk) return 0;
        
        const localX = ((x % 16) + 16) % 16;
        const localZ = ((z % 16) + 16) % 16;
        
        return chunk.getBlock(localX, y, localZ);
    }
    
    // Set block at world coordinates
    setBlock(x, y, z, blockId) {
        if (y < 0 || y >= 256) return;
        
        const chunkX = Math.floor(x / 16);
        const chunkZ = Math.floor(z / 16);
        const chunk = this.getChunk(chunkX, chunkZ);
        
        if (!chunk) return;
        
        const localX = ((x % 16) + 16) % 16;
        const localZ = ((z % 16) + 16) % 16;
        
        chunk.setBlock(localX, y, localZ, blockId);
    }
    
    // Get or create chunk
    getChunk(chunkX, chunkZ) {
        const key = `${chunkX},${chunkZ}`;
        return this.chunks.get(key);
    }
    
    // Add chunk
    addChunk(chunk) {
        const key = `${chunk.x},${chunk.z}`;
        this.chunks.set(key, chunk);
    }
    
    // Update world (time, weather, etc.)
    update(dt) {
        // Update time
        this.time += (24000 / this.dayLength) * dt;
        if (this.time >= 24000) {
            this.time -= 24000;
        }
        
        // Update weather
        this.weatherTimer -= dt;
        if (this.weatherTimer <= 0) {
            this.changeWeather();
        }
    }
    
    // Get time of day (0-1)
    getTimeOfDay() {
        return this.time / 24000;
    }
    
    // Is it daytime?
    isDaytime() {
        return this.time >= 0 && this.time < 13000;
    }
    
    // Change weather
    changeWeather() {
        const weathers = ['clear', 'clear', 'clear', 'rain', 'rain', 'thunder'];
        this.weather = weathers[Math.floor(Math.random() * weathers.length)];
        this.weatherTimer = 300 + Math.random() * 600; // 5-15 minutes
    }
    
    // Check if position is in water
    isInWater(x, y, z) {
        const block = this.getBlock(Math.floor(x), Math.floor(y), Math.floor(z));
        return block === 8 || block === 9;
    }
    
    // Check if position is in lava
    isInLava(x, y, z) {
        const block = this.getBlock(Math.floor(x), Math.floor(y), Math.floor(z));
        return block === 10 || block === 11;
    }
}
