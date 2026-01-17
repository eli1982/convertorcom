// Texture Manager - Generates and manages block textures
import * as THREE from 'three';

export class TextureManager {
    constructor() {
        this.textures = {};
        this.textureAtlas = null;
        this.atlasSize = 16; // 16x16 blocks per atlas
        this.blockSize = 16; // 16x16 pixels per block
    }
    
    async loadAll() {
        // Generate all textures procedurally
        this.generateAllTextures();
        
        // Create texture atlas
        this.createTextureAtlas();
    }
    
    generateAllTextures() {
        // Generate each block texture
        this.textures = {
            // Basic blocks
            grass_top: this.generateGrassTop(),
            grass_side: this.generateGrassSide(),
            dirt: this.generateDirt(),
            stone: this.generateStone(),
            cobblestone: this.generateCobblestone(),
            bedrock: this.generateBedrock(),
            
            // Wood and trees
            oak_log_top: this.generateLogTop(0x8B7355),
            oak_log_side: this.generateLogSide(0x8B6914),
            oak_planks: this.generatePlanks(0xBC9458),
            oak_leaves: this.generateLeaves(0x2E8B2E),
            
            birch_log_top: this.generateLogTop(0xD4C4A8),
            birch_log_side: this.generateBirchLog(),
            birch_planks: this.generatePlanks(0xD4C4A8),
            birch_leaves: this.generateLeaves(0x80C080),
            
            // Ores
            coal_ore: this.generateOre(0x333333),
            iron_ore: this.generateOre(0xD4A574),
            gold_ore: this.generateOre(0xFFD700),
            diamond_ore: this.generateOre(0x55FFFF),
            redstone_ore: this.generateOre(0xFF0000),
            lapis_ore: this.generateOre(0x1E90FF),
            emerald_ore: this.generateOre(0x2ECC71),
            
            // Sand and gravel
            sand: this.generateSand(),
            gravel: this.generateGravel(),
            sandstone_top: this.generateSandstoneTop(),
            sandstone_side: this.generateSandstoneSide(),
            sandstone_bottom: this.generateSandstoneBottom(),
            
            // Water and lava
            water: this.generateWater(),
            lava: this.generateLava(),
            
            // Glass
            glass: this.generateGlass(),
            
            // Bricks and building
            brick: this.generateBrick(),
            stone_brick: this.generateStoneBrick(),
            
            // Snow and ice
            snow: this.generateSnow(),
            ice: this.generateIce(),
            
            // Crafting and utility
            crafting_table_top: this.generateCraftingTableTop(),
            crafting_table_side: this.generateCraftingTableSide(),
            furnace_front: this.generateFurnaceFront(false),
            furnace_front_on: this.generateFurnaceFront(true),
            furnace_side: this.generateFurnaceSide(),
            furnace_top: this.generateFurnaceTop(),
            
            // Obsidian
            obsidian: this.generateObsidian(),
            
            // TNT
            tnt_top: this.generateTNTTop(),
            tnt_side: this.generateTNTSide(),
            tnt_bottom: this.generateTNTBottom(),
            
            // Pumpkin
            pumpkin_top: this.generatePumpkinTop(),
            pumpkin_side: this.generatePumpkinSide(),
            pumpkin_face: this.generatePumpkinFace(),
            
            // Wool colors
            white_wool: this.generateWool(0xFFFFFF),
            orange_wool: this.generateWool(0xFF8800),
            magenta_wool: this.generateWool(0xFF00FF),
            light_blue_wool: this.generateWool(0x88CCFF),
            yellow_wool: this.generateWool(0xFFFF00),
            lime_wool: this.generateWool(0x88FF00),
            pink_wool: this.generateWool(0xFFAACC),
            gray_wool: this.generateWool(0x666666),
            light_gray_wool: this.generateWool(0xAAAAAA),
            cyan_wool: this.generateWool(0x00AAAA),
            purple_wool: this.generateWool(0x8800FF),
            blue_wool: this.generateWool(0x0000FF),
            brown_wool: this.generateWool(0x8B4513),
            green_wool: this.generateWool(0x228B22),
            red_wool: this.generateWool(0xFF0000),
            black_wool: this.generateWool(0x222222),
            
            // Flowers and plants
            grass_plant: this.generateGrassPlant(),
            flower_red: this.generateFlower(0xFF0000),
            flower_yellow: this.generateFlower(0xFFFF00),
            
            // Torch
            torch: this.generateTorch()
        };
    }
    
    // Create a canvas for texture generation
    createCanvas() {
        const canvas = document.createElement('canvas');
        canvas.width = this.blockSize;
        canvas.height = this.blockSize;
        return canvas;
    }
    
    // Helper to add noise to a color
    addNoise(ctx, intensity = 20) {
        const imageData = ctx.getImageData(0, 0, this.blockSize, this.blockSize);
        const data = imageData.data;
        
        for (let i = 0; i < data.length; i += 4) {
            const noise = (Math.random() - 0.5) * intensity;
            data[i] = Math.max(0, Math.min(255, data[i] + noise));
            data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise));
            data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise));
        }
        
        ctx.putImageData(imageData, 0, 0);
    }
    
    // Generate grass top texture
    generateGrassTop() {
        const canvas = this.createCanvas();
        const ctx = canvas.getContext('2d');
        
        // Base green color
        ctx.fillStyle = '#5A8F29';
        ctx.fillRect(0, 0, 16, 16);
        
        // Add variation
        for (let i = 0; i < 50; i++) {
            const x = Math.floor(Math.random() * 16);
            const y = Math.floor(Math.random() * 16);
            const shade = Math.random() > 0.5 ? '#4A7F19' : '#6A9F39';
            ctx.fillStyle = shade;
            ctx.fillRect(x, y, 1, 1);
        }
        
        this.addNoise(ctx, 10);
        return canvas;
    }
    
    // Generate grass side texture
    generateGrassSide() {
        const canvas = this.createCanvas();
        const ctx = canvas.getContext('2d');
        
        // Dirt base
        ctx.fillStyle = '#8B6914';
        ctx.fillRect(0, 0, 16, 16);
        
        // Grass top
        ctx.fillStyle = '#5A8F29';
        ctx.fillRect(0, 0, 16, 3);
        
        // Grass fringe
        for (let x = 0; x < 16; x++) {
            const h = Math.floor(Math.random() * 3);
            ctx.fillStyle = '#5A8F29';
            ctx.fillRect(x, 3, 1, h);
        }
        
        this.addNoise(ctx, 15);
        return canvas;
    }
    
    // Generate dirt texture
    generateDirt() {
        const canvas = this.createCanvas();
        const ctx = canvas.getContext('2d');
        
        ctx.fillStyle = '#8B6914';
        ctx.fillRect(0, 0, 16, 16);
        
        // Add darker spots
        for (let i = 0; i < 30; i++) {
            const x = Math.floor(Math.random() * 16);
            const y = Math.floor(Math.random() * 16);
            ctx.fillStyle = Math.random() > 0.5 ? '#7B5904' : '#9B7924';
            ctx.fillRect(x, y, 1, 1);
        }
        
        this.addNoise(ctx, 20);
        return canvas;
    }
    
    // Generate stone texture
    generateStone() {
        const canvas = this.createCanvas();
        const ctx = canvas.getContext('2d');
        
        ctx.fillStyle = '#7F7F7F';
        ctx.fillRect(0, 0, 16, 16);
        
        // Add variation
        for (let i = 0; i < 60; i++) {
            const x = Math.floor(Math.random() * 16);
            const y = Math.floor(Math.random() * 16);
            const shade = Math.floor(Math.random() * 40) + 100;
            ctx.fillStyle = `rgb(${shade},${shade},${shade})`;
            ctx.fillRect(x, y, Math.random() * 3, Math.random() * 3);
        }
        
        this.addNoise(ctx, 15);
        return canvas;
    }
    
    // Generate cobblestone texture
    generateCobblestone() {
        const canvas = this.createCanvas();
        const ctx = canvas.getContext('2d');
        
        // Base
        ctx.fillStyle = '#6F6F6F';
        ctx.fillRect(0, 0, 16, 16);
        
        // Add cobbles
        const cobblePositions = [
            [1, 1, 5, 4], [7, 0, 4, 5], [12, 1, 3, 4],
            [0, 6, 4, 4], [5, 5, 5, 4], [11, 6, 4, 3],
            [2, 11, 4, 4], [7, 10, 5, 5], [13, 11, 2, 4]
        ];
        
        cobblePositions.forEach(([x, y, w, h]) => {
            const shade = Math.floor(Math.random() * 40) + 80;
            ctx.fillStyle = `rgb(${shade},${shade},${shade})`;
            ctx.fillRect(x, y, w, h);
            
            // Darker border
            ctx.fillStyle = `rgb(${shade - 30},${shade - 30},${shade - 30})`;
            ctx.fillRect(x, y + h - 1, w, 1);
            ctx.fillRect(x + w - 1, y, 1, h);
        });
        
        this.addNoise(ctx, 10);
        return canvas;
    }
    
    // Generate bedrock texture
    generateBedrock() {
        const canvas = this.createCanvas();
        const ctx = canvas.getContext('2d');
        
        ctx.fillStyle = '#333333';
        ctx.fillRect(0, 0, 16, 16);
        
        // Random dark patches
        for (let i = 0; i < 40; i++) {
            const x = Math.floor(Math.random() * 16);
            const y = Math.floor(Math.random() * 16);
            const shade = Math.floor(Math.random() * 40) + 20;
            ctx.fillStyle = `rgb(${shade},${shade},${shade})`;
            ctx.fillRect(x, y, Math.random() * 4, Math.random() * 4);
        }
        
        this.addNoise(ctx, 15);
        return canvas;
    }
    
    // Generate log top texture
    generateLogTop(color) {
        const canvas = this.createCanvas();
        const ctx = canvas.getContext('2d');
        
        // Bark outer
        ctx.fillStyle = '#8B6914';
        ctx.fillRect(0, 0, 16, 16);
        
        // Inner wood
        const r = (color >> 16) & 255;
        const g = (color >> 8) & 255;
        const b = color & 255;
        
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.beginPath();
        ctx.arc(8, 8, 6, 0, Math.PI * 2);
        ctx.fill();
        
        // Rings
        ctx.strokeStyle = `rgb(${r - 30},${g - 30},${b - 30})`;
        ctx.lineWidth = 0.5;
        for (let i = 2; i <= 6; i += 2) {
            ctx.beginPath();
            ctx.arc(8, 8, i, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        this.addNoise(ctx, 10);
        return canvas;
    }
    
    // Generate log side texture
    generateLogSide(color) {
        const canvas = this.createCanvas();
        const ctx = canvas.getContext('2d');
        
        const r = (color >> 16) & 255;
        const g = (color >> 8) & 255;
        const b = color & 255;
        
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fillRect(0, 0, 16, 16);
        
        // Bark lines
        for (let y = 0; y < 16; y += 3) {
            ctx.fillStyle = `rgb(${r - 20},${g - 20},${b - 20})`;
            ctx.fillRect(0, y, 16, 1);
        }
        
        this.addNoise(ctx, 15);
        return canvas;
    }
    
    // Generate birch log texture
    generateBirchLog() {
        const canvas = this.createCanvas();
        const ctx = canvas.getContext('2d');
        
        // White bark
        ctx.fillStyle = '#D4C4A8';
        ctx.fillRect(0, 0, 16, 16);
        
        // Black patches
        const patches = [
            [2, 1, 3, 2], [10, 3, 4, 2], [1, 6, 2, 3],
            [8, 8, 3, 2], [13, 5, 2, 3], [3, 11, 4, 2],
            [9, 13, 3, 2]
        ];
        
        patches.forEach(([x, y, w, h]) => {
            ctx.fillStyle = '#333';
            ctx.fillRect(x, y, w, h);
        });
        
        this.addNoise(ctx, 10);
        return canvas;
    }
    
    // Generate planks texture
    generatePlanks(color) {
        const canvas = this.createCanvas();
        const ctx = canvas.getContext('2d');
        
        const r = (color >> 16) & 255;
        const g = (color >> 8) & 255;
        const b = color & 255;
        
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fillRect(0, 0, 16, 16);
        
        // Plank divisions
        ctx.fillStyle = `rgb(${r - 30},${g - 30},${b - 30})`;
        ctx.fillRect(0, 3, 16, 1);
        ctx.fillRect(0, 7, 16, 1);
        ctx.fillRect(0, 11, 16, 1);
        ctx.fillRect(0, 15, 16, 1);
        
        // Vertical lines offset per row
        ctx.fillRect(4, 0, 1, 4);
        ctx.fillRect(12, 4, 1, 4);
        ctx.fillRect(6, 8, 1, 4);
        ctx.fillRect(10, 12, 1, 4);
        
        this.addNoise(ctx, 10);
        return canvas;
    }
    
    // Generate leaves texture
    generateLeaves(color) {
        const canvas = this.createCanvas();
        const ctx = canvas.getContext('2d');
        
        const r = (color >> 16) & 255;
        const g = (color >> 8) & 255;
        const b = color & 255;
        
        // Transparent background with leaves
        ctx.fillStyle = `rgba(${r},${g},${b},0.9)`;
        ctx.fillRect(0, 0, 16, 16);
        
        // Add variation
        for (let i = 0; i < 40; i++) {
            const x = Math.floor(Math.random() * 16);
            const y = Math.floor(Math.random() * 16);
            const variant = Math.random();
            if (variant > 0.6) {
                ctx.fillStyle = `rgb(${r + 20},${g + 20},${b})`;
            } else if (variant > 0.3) {
                ctx.fillStyle = `rgb(${r - 20},${g - 20},${b - 10})`;
            } else {
                ctx.clearRect(x, y, 1, 1);
            }
            ctx.fillRect(x, y, 1, 1);
        }
        
        return canvas;
    }
    
    // Generate ore texture
    generateOre(oreColor) {
        const canvas = this.createCanvas();
        const ctx = canvas.getContext('2d');
        
        // Stone base
        ctx.fillStyle = '#7F7F7F';
        ctx.fillRect(0, 0, 16, 16);
        
        // Add stone variation
        for (let i = 0; i < 30; i++) {
            const x = Math.floor(Math.random() * 16);
            const y = Math.floor(Math.random() * 16);
            ctx.fillStyle = Math.random() > 0.5 ? '#6F6F6F' : '#8F8F8F';
            ctx.fillRect(x, y, 1, 1);
        }
        
        // Add ore spots
        const r = (oreColor >> 16) & 255;
        const g = (oreColor >> 8) & 255;
        const b = oreColor & 255;
        
        const oreSpots = [
            [2, 3], [4, 2], [3, 5], [6, 4],
            [10, 2], [12, 4], [11, 6],
            [3, 10], [5, 12], [4, 9],
            [11, 11], [13, 10], [10, 13]
        ];
        
        oreSpots.forEach(([x, y]) => {
            if (Math.random() > 0.3) {
                ctx.fillStyle = `rgb(${r},${g},${b})`;
                ctx.fillRect(x, y, 2, 2);
            }
        });
        
        this.addNoise(ctx, 10);
        return canvas;
    }
    
    // Generate sand texture
    generateSand() {
        const canvas = this.createCanvas();
        const ctx = canvas.getContext('2d');
        
        ctx.fillStyle = '#E6D596';
        ctx.fillRect(0, 0, 16, 16);
        
        // Add grain variation
        for (let i = 0; i < 80; i++) {
            const x = Math.floor(Math.random() * 16);
            const y = Math.floor(Math.random() * 16);
            const variant = Math.random();
            if (variant > 0.5) {
                ctx.fillStyle = '#D6C586';
            } else {
                ctx.fillStyle = '#F6E5A6';
            }
            ctx.fillRect(x, y, 1, 1);
        }
        
        this.addNoise(ctx, 10);
        return canvas;
    }
    
    // Generate gravel texture
    generateGravel() {
        const canvas = this.createCanvas();
        const ctx = canvas.getContext('2d');
        
        ctx.fillStyle = '#8B8B83';
        ctx.fillRect(0, 0, 16, 16);
        
        // Add pebbles
        for (let i = 0; i < 25; i++) {
            const x = Math.floor(Math.random() * 14) + 1;
            const y = Math.floor(Math.random() * 14) + 1;
            const shade = Math.floor(Math.random() * 60) + 100;
            ctx.fillStyle = `rgb(${shade},${shade},${shade - 10})`;
            ctx.beginPath();
            ctx.ellipse(x, y, Math.random() * 2 + 1, Math.random() * 2 + 1, 0, 0, Math.PI * 2);
            ctx.fill();
        }
        
        this.addNoise(ctx, 15);
        return canvas;
    }
    
    // Generate water texture
    generateWater() {
        const canvas = this.createCanvas();
        const ctx = canvas.getContext('2d');
        
        ctx.fillStyle = 'rgba(30, 100, 200, 0.7)';
        ctx.fillRect(0, 0, 16, 16);
        
        // Add wave highlights
        for (let i = 0; i < 20; i++) {
            const x = Math.floor(Math.random() * 16);
            const y = Math.floor(Math.random() * 16);
            ctx.fillStyle = 'rgba(100, 150, 255, 0.5)';
            ctx.fillRect(x, y, Math.random() * 3, 1);
        }
        
        return canvas;
    }
    
    // Generate lava texture
    generateLava() {
        const canvas = this.createCanvas();
        const ctx = canvas.getContext('2d');
        
        ctx.fillStyle = '#D94000';
        ctx.fillRect(0, 0, 16, 16);
        
        // Add bright spots
        for (let i = 0; i < 30; i++) {
            const x = Math.floor(Math.random() * 16);
            const y = Math.floor(Math.random() * 16);
            const variant = Math.random();
            if (variant > 0.7) {
                ctx.fillStyle = '#FF6600';
            } else if (variant > 0.3) {
                ctx.fillStyle = '#FF4400';
            } else {
                ctx.fillStyle = '#B93000';
            }
            ctx.fillRect(x, y, Math.random() * 3, Math.random() * 3);
        }
        
        return canvas;
    }
    
    // Generate glass texture
    generateGlass() {
        const canvas = this.createCanvas();
        const ctx = canvas.getContext('2d');
        
        ctx.fillStyle = 'rgba(200, 220, 255, 0.3)';
        ctx.fillRect(0, 0, 16, 16);
        
        // Border
        ctx.strokeStyle = 'rgba(150, 170, 200, 0.8)';
        ctx.lineWidth = 1;
        ctx.strokeRect(0.5, 0.5, 15, 15);
        
        // Highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fillRect(1, 1, 6, 1);
        ctx.fillRect(1, 1, 1, 6);
        
        return canvas;
    }
    
    // Generate brick texture
    generateBrick() {
        const canvas = this.createCanvas();
        const ctx = canvas.getContext('2d');
        
        // Mortar
        ctx.fillStyle = '#9E9E9E';
        ctx.fillRect(0, 0, 16, 16);
        
        // Bricks
        const brickColor = '#B04A30';
        ctx.fillStyle = brickColor;
        
        // Row 1
        ctx.fillRect(0, 0, 7, 3);
        ctx.fillRect(8, 0, 8, 3);
        
        // Row 2
        ctx.fillRect(0, 4, 3, 3);
        ctx.fillRect(4, 4, 7, 3);
        ctx.fillRect(12, 4, 4, 3);
        
        // Row 3
        ctx.fillRect(0, 8, 7, 3);
        ctx.fillRect(8, 8, 8, 3);
        
        // Row 4
        ctx.fillRect(0, 12, 3, 4);
        ctx.fillRect(4, 12, 7, 4);
        ctx.fillRect(12, 12, 4, 4);
        
        this.addNoise(ctx, 15);
        return canvas;
    }
    
    // Generate stone brick texture
    generateStoneBrick() {
        const canvas = this.createCanvas();
        const ctx = canvas.getContext('2d');
        
        // Mortar
        ctx.fillStyle = '#6E6E6E';
        ctx.fillRect(0, 0, 16, 16);
        
        // Bricks
        ctx.fillStyle = '#8B8B8B';
        
        // Row 1
        ctx.fillRect(0, 0, 7, 7);
        ctx.fillRect(8, 0, 8, 7);
        
        // Row 2
        ctx.fillRect(0, 8, 3, 8);
        ctx.fillRect(4, 8, 7, 8);
        ctx.fillRect(12, 8, 4, 8);
        
        this.addNoise(ctx, 15);
        return canvas;
    }
    
    // Generate snow texture
    generateSnow() {
        const canvas = this.createCanvas();
        const ctx = canvas.getContext('2d');
        
        ctx.fillStyle = '#FAFAFA';
        ctx.fillRect(0, 0, 16, 16);
        
        // Add subtle blue tint
        for (let i = 0; i < 30; i++) {
            const x = Math.floor(Math.random() * 16);
            const y = Math.floor(Math.random() * 16);
            ctx.fillStyle = 'rgba(200, 220, 255, 0.3)';
            ctx.fillRect(x, y, 1, 1);
        }
        
        this.addNoise(ctx, 5);
        return canvas;
    }
    
    // Generate ice texture
    generateIce() {
        const canvas = this.createCanvas();
        const ctx = canvas.getContext('2d');
        
        ctx.fillStyle = 'rgba(150, 200, 255, 0.7)';
        ctx.fillRect(0, 0, 16, 16);
        
        // Add cracks
        ctx.strokeStyle = 'rgba(200, 230, 255, 0.5)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, 8);
        ctx.lineTo(6, 5);
        ctx.lineTo(10, 8);
        ctx.lineTo(16, 4);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(2, 16);
        ctx.lineTo(7, 12);
        ctx.lineTo(14, 15);
        ctx.stroke();
        
        return canvas;
    }
    
    // Generate wool texture
    generateWool(color) {
        const canvas = this.createCanvas();
        const ctx = canvas.getContext('2d');
        
        const r = (color >> 16) & 255;
        const g = (color >> 8) & 255;
        const b = color & 255;
        
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fillRect(0, 0, 16, 16);
        
        // Add wool texture
        for (let i = 0; i < 50; i++) {
            const x = Math.floor(Math.random() * 16);
            const y = Math.floor(Math.random() * 16);
            const variant = Math.random();
            if (variant > 0.5) {
                ctx.fillStyle = `rgb(${Math.min(255, r + 20)},${Math.min(255, g + 20)},${Math.min(255, b + 20)})`;
            } else {
                ctx.fillStyle = `rgb(${Math.max(0, r - 20)},${Math.max(0, g - 20)},${Math.max(0, b - 20)})`;
            }
            ctx.fillRect(x, y, 1, 1);
        }
        
        this.addNoise(ctx, 10);
        return canvas;
    }
    
    // Generate crafting table top
    generateCraftingTableTop() {
        const canvas = this.createCanvas();
        const ctx = canvas.getContext('2d');
        
        // Wood base
        ctx.fillStyle = '#BC9458';
        ctx.fillRect(0, 0, 16, 16);
        
        // Grid lines
        ctx.strokeStyle = '#8B6914';
        ctx.lineWidth = 1;
        
        // Outer border
        ctx.strokeRect(1, 1, 14, 14);
        
        // Grid
        for (let i = 5; i <= 11; i += 3) {
            ctx.beginPath();
            ctx.moveTo(i, 1);
            ctx.lineTo(i, 15);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(1, i);
            ctx.lineTo(15, i);
            ctx.stroke();
        }
        
        this.addNoise(ctx, 10);
        return canvas;
    }
    
    // Generate crafting table side
    generateCraftingTableSide() {
        const canvas = this.createCanvas();
        const ctx = canvas.getContext('2d');
        
        // Top half - crafting pattern
        ctx.fillStyle = '#BC9458';
        ctx.fillRect(0, 0, 16, 8);
        
        // Grid lines on top half
        ctx.strokeStyle = '#8B6914';
        ctx.lineWidth = 1;
        for (let i = 4; i <= 12; i += 4) {
            ctx.beginPath();
            ctx.moveTo(i, 0);
            ctx.lineTo(i, 8);
            ctx.stroke();
        }
        
        // Bottom half - planks
        ctx.fillStyle = '#9E7448';
        ctx.fillRect(0, 8, 16, 8);
        
        // Plank divisions
        ctx.fillStyle = '#8B6438';
        ctx.fillRect(0, 11, 16, 1);
        ctx.fillRect(0, 15, 16, 1);
        ctx.fillRect(4, 8, 1, 4);
        ctx.fillRect(12, 12, 1, 4);
        
        this.addNoise(ctx, 10);
        return canvas;
    }
    
    // Generate furnace textures
    generateFurnaceFront(isOn) {
        const canvas = this.createCanvas();
        const ctx = canvas.getContext('2d');
        
        // Stone base
        ctx.fillStyle = '#7F7F7F';
        ctx.fillRect(0, 0, 16, 16);
        
        // Add stone variation
        for (let i = 0; i < 30; i++) {
            const x = Math.floor(Math.random() * 16);
            const y = Math.floor(Math.random() * 16);
            ctx.fillStyle = Math.random() > 0.5 ? '#6F6F6F' : '#8F8F8F';
            ctx.fillRect(x, y, 1, 1);
        }
        
        // Furnace opening
        ctx.fillStyle = isOn ? '#FF6600' : '#333';
        ctx.fillRect(4, 5, 8, 8);
        
        // Opening detail
        ctx.fillStyle = '#222';
        ctx.fillRect(5, 6, 6, 6);
        
        if (isOn) {
            // Fire glow
            ctx.fillStyle = '#FFAA00';
            ctx.fillRect(6, 8, 2, 2);
            ctx.fillRect(9, 9, 1, 2);
        }
        
        this.addNoise(ctx, 8);
        return canvas;
    }
    
    generateFurnaceSide() {
        const canvas = this.createCanvas();
        const ctx = canvas.getContext('2d');
        
        ctx.fillStyle = '#7F7F7F';
        ctx.fillRect(0, 0, 16, 16);
        
        for (let i = 0; i < 40; i++) {
            const x = Math.floor(Math.random() * 16);
            const y = Math.floor(Math.random() * 16);
            ctx.fillStyle = Math.random() > 0.5 ? '#6F6F6F' : '#8F8F8F';
            ctx.fillRect(x, y, 1, 1);
        }
        
        this.addNoise(ctx, 10);
        return canvas;
    }
    
    generateFurnaceTop() {
        const canvas = this.createCanvas();
        const ctx = canvas.getContext('2d');
        
        ctx.fillStyle = '#6F6F6F';
        ctx.fillRect(0, 0, 16, 16);
        
        // Darker center
        ctx.fillStyle = '#5F5F5F';
        ctx.fillRect(3, 3, 10, 10);
        
        for (let i = 0; i < 30; i++) {
            const x = Math.floor(Math.random() * 16);
            const y = Math.floor(Math.random() * 16);
            ctx.fillStyle = Math.random() > 0.5 ? '#5F5F5F' : '#7F7F7F';
            ctx.fillRect(x, y, 1, 1);
        }
        
        this.addNoise(ctx, 10);
        return canvas;
    }
    
    // Generate obsidian texture
    generateObsidian() {
        const canvas = this.createCanvas();
        const ctx = canvas.getContext('2d');
        
        ctx.fillStyle = '#1A0A30';
        ctx.fillRect(0, 0, 16, 16);
        
        // Add purple highlights
        for (let i = 0; i < 30; i++) {
            const x = Math.floor(Math.random() * 16);
            const y = Math.floor(Math.random() * 16);
            ctx.fillStyle = Math.random() > 0.5 ? '#2A1A40' : '#0A0020';
            ctx.fillRect(x, y, Math.random() * 3, Math.random() * 3);
        }
        
        this.addNoise(ctx, 8);
        return canvas;
    }
    
    // Generate TNT textures
    generateTNTTop() {
        const canvas = this.createCanvas();
        const ctx = canvas.getContext('2d');
        
        ctx.fillStyle = '#8B6914';
        ctx.fillRect(0, 0, 16, 16);
        
        // Center circle
        ctx.fillStyle = '#444';
        ctx.beginPath();
        ctx.arc(8, 8, 4, 0, Math.PI * 2);
        ctx.fill();
        
        // Fuse
        ctx.fillStyle = '#888';
        ctx.fillRect(7, 0, 2, 4);
        
        this.addNoise(ctx, 10);
        return canvas;
    }
    
    generateTNTSide() {
        const canvas = this.createCanvas();
        const ctx = canvas.getContext('2d');
        
        // Red base
        ctx.fillStyle = '#B03030';
        ctx.fillRect(0, 0, 16, 16);
        
        // TNT label
        ctx.fillStyle = '#FFF';
        ctx.fillRect(1, 4, 14, 8);
        
        // "TNT" text (simplified as blocks)
        ctx.fillStyle = '#B03030';
        // T
        ctx.fillRect(2, 5, 3, 1);
        ctx.fillRect(3, 6, 1, 5);
        // N
        ctx.fillRect(6, 5, 1, 6);
        ctx.fillRect(7, 6, 1, 1);
        ctx.fillRect(8, 7, 1, 2);
        ctx.fillRect(9, 5, 1, 6);
        // T
        ctx.fillRect(11, 5, 3, 1);
        ctx.fillRect(12, 6, 1, 5);
        
        this.addNoise(ctx, 8);
        return canvas;
    }
    
    generateTNTBottom() {
        const canvas = this.createCanvas();
        const ctx = canvas.getContext('2d');
        
        ctx.fillStyle = '#8B6914';
        ctx.fillRect(0, 0, 16, 16);
        
        this.addNoise(ctx, 10);
        return canvas;
    }
    
    // Generate pumpkin textures
    generatePumpkinTop() {
        const canvas = this.createCanvas();
        const ctx = canvas.getContext('2d');
        
        ctx.fillStyle = '#B86400';
        ctx.fillRect(0, 0, 16, 16);
        
        // Stem
        ctx.fillStyle = '#5A8F29';
        ctx.fillRect(6, 6, 4, 4);
        
        // Ridges
        ctx.fillStyle = '#986400';
        for (let i = 2; i < 16; i += 4) {
            ctx.fillRect(i, 0, 1, 16);
        }
        
        this.addNoise(ctx, 10);
        return canvas;
    }
    
    generatePumpkinSide() {
        const canvas = this.createCanvas();
        const ctx = canvas.getContext('2d');
        
        ctx.fillStyle = '#C87400';
        ctx.fillRect(0, 0, 16, 16);
        
        // Ridges
        ctx.fillStyle = '#A85400';
        ctx.fillRect(0, 0, 2, 16);
        ctx.fillRect(7, 0, 2, 16);
        ctx.fillRect(14, 0, 2, 16);
        
        this.addNoise(ctx, 10);
        return canvas;
    }
    
    generatePumpkinFace() {
        const canvas = this.createCanvas();
        const ctx = canvas.getContext('2d');
        
        ctx.fillStyle = '#C87400';
        ctx.fillRect(0, 0, 16, 16);
        
        // Ridges
        ctx.fillStyle = '#A85400';
        ctx.fillRect(0, 0, 2, 16);
        ctx.fillRect(14, 0, 2, 16);
        
        // Face - carved out (dark)
        ctx.fillStyle = '#1A0A00';
        
        // Eyes (triangular)
        ctx.beginPath();
        ctx.moveTo(3, 4);
        ctx.lineTo(6, 4);
        ctx.lineTo(4.5, 7);
        ctx.fill();
        
        ctx.beginPath();
        ctx.moveTo(10, 4);
        ctx.lineTo(13, 4);
        ctx.lineTo(11.5, 7);
        ctx.fill();
        
        // Mouth
        ctx.fillRect(3, 9, 10, 4);
        // Teeth
        ctx.fillStyle = '#C87400';
        ctx.fillRect(5, 9, 2, 2);
        ctx.fillRect(9, 11, 2, 2);
        
        this.addNoise(ctx, 8);
        return canvas;
    }
    
    // Generate sandstone textures
    generateSandstoneTop() {
        const canvas = this.createCanvas();
        const ctx = canvas.getContext('2d');
        
        ctx.fillStyle = '#E6D596';
        ctx.fillRect(0, 0, 16, 16);
        
        this.addNoise(ctx, 10);
        return canvas;
    }
    
    generateSandstoneSide() {
        const canvas = this.createCanvas();
        const ctx = canvas.getContext('2d');
        
        ctx.fillStyle = '#D6C586';
        ctx.fillRect(0, 0, 16, 16);
        
        // Top decorative band
        ctx.fillStyle = '#C6B576';
        ctx.fillRect(0, 0, 16, 4);
        
        // Pattern
        ctx.fillStyle = '#B6A566';
        ctx.fillRect(0, 2, 16, 1);
        
        this.addNoise(ctx, 10);
        return canvas;
    }
    
    generateSandstoneBottom() {
        const canvas = this.createCanvas();
        const ctx = canvas.getContext('2d');
        
        ctx.fillStyle = '#C6B576';
        ctx.fillRect(0, 0, 16, 16);
        
        this.addNoise(ctx, 10);
        return canvas;
    }
    
    // Generate grass plant texture
    generateGrassPlant() {
        const canvas = this.createCanvas();
        const ctx = canvas.getContext('2d');
        
        // Transparent background
        ctx.clearRect(0, 0, 16, 16);
        
        // Draw grass blades
        ctx.fillStyle = '#5A8F29';
        
        const blades = [
            [7, 15, 8, 0], [6, 14, 5, 2], [9, 14, 11, 3],
            [5, 13, 3, 5], [10, 13, 13, 4], [7, 12, 6, 6]
        ];
        
        blades.forEach(([x1, y1, x2, y2]) => {
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.lineTo(x2 + 1, y2);
            ctx.lineTo(x1 + 1, y1);
            ctx.fill();
        });
        
        return canvas;
    }
    
    // Generate flower texture
    generateFlower(color) {
        const canvas = this.createCanvas();
        const ctx = canvas.getContext('2d');
        
        // Transparent background
        ctx.clearRect(0, 0, 16, 16);
        
        // Stem
        ctx.fillStyle = '#5A8F29';
        ctx.fillRect(7, 8, 2, 8);
        
        // Petals
        const r = (color >> 16) & 255;
        const g = (color >> 8) & 255;
        const b = color & 255;
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        
        // Simple flower shape
        ctx.fillRect(6, 3, 4, 4);
        ctx.fillRect(4, 5, 2, 2);
        ctx.fillRect(10, 5, 2, 2);
        ctx.fillRect(6, 1, 4, 2);
        ctx.fillRect(6, 7, 4, 2);
        
        // Center
        ctx.fillStyle = '#FFFF00';
        ctx.fillRect(7, 4, 2, 2);
        
        return canvas;
    }
    
    // Generate torch texture
    generateTorch() {
        const canvas = this.createCanvas();
        const ctx = canvas.getContext('2d');
        
        // Transparent background
        ctx.clearRect(0, 0, 16, 16);
        
        // Stick
        ctx.fillStyle = '#8B6914';
        ctx.fillRect(7, 6, 2, 10);
        
        // Flame
        ctx.fillStyle = '#FFAA00';
        ctx.fillRect(6, 2, 4, 5);
        ctx.fillStyle = '#FFFF00';
        ctx.fillRect(7, 3, 2, 3);
        
        return canvas;
    }
    
    // Create texture atlas
    createTextureAtlas() {
        const textureNames = Object.keys(this.textures);
        const atlasCanvas = document.createElement('canvas');
        const size = Math.ceil(Math.sqrt(textureNames.length));
        atlasCanvas.width = size * this.blockSize;
        atlasCanvas.height = size * this.blockSize;
        const ctx = atlasCanvas.getContext('2d');
        
        this.textureCoords = {};
        
        textureNames.forEach((name, index) => {
            const x = (index % size) * this.blockSize;
            const y = Math.floor(index / size) * this.blockSize;
            ctx.drawImage(this.textures[name], x, y);
            
            // Store UV coordinates
            this.textureCoords[name] = {
                u: x / atlasCanvas.width,
                v: y / atlasCanvas.height,
                uSize: this.blockSize / atlasCanvas.width,
                vSize: this.blockSize / atlasCanvas.height
            };
        });
        
        // Create Three.js texture
        this.atlasTexture = new THREE.CanvasTexture(atlasCanvas);
        this.atlasTexture.magFilter = THREE.NearestFilter;
        this.atlasTexture.minFilter = THREE.NearestFilter;
        this.atlasTexture.wrapS = THREE.RepeatWrapping;
        this.atlasTexture.wrapT = THREE.RepeatWrapping;
    }
    
    // Get texture for a specific block face
    getTexture(name) {
        return this.textures[name];
    }
    
    // Get UV coordinates for a texture
    getUVs(name) {
        return this.textureCoords[name];
    }
    
    // Get the atlas texture
    getAtlasTexture() {
        return this.atlasTexture;
    }
    
    // Create material for a specific texture
    createMaterial(textureName, options = {}) {
        const canvas = this.textures[textureName];
        if (!canvas) return null;
        
        const texture = new THREE.CanvasTexture(canvas);
        texture.magFilter = THREE.NearestFilter;
        texture.minFilter = THREE.NearestFilter;
        
        return new THREE.MeshLambertMaterial({
            map: texture,
            transparent: options.transparent || false,
            alphaTest: options.alphaTest || 0,
            side: options.doubleSided ? THREE.DoubleSide : THREE.FrontSide,
            ...options
        });
    }
}
