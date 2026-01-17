// Block Registry - defines all block types
export class BlockRegistry {
    static blocks = {};
    static textureManager = null;
    
    static init(textureManager) {
        BlockRegistry.textureManager = textureManager;
        BlockRegistry.registerBlocks();
    }
    
    static registerBlocks() {
        // Air
        BlockRegistry.register(0, {
            name: 'air',
            solid: false,
            transparent: true
        });
        
        // Stone
        BlockRegistry.register(1, {
            name: 'stone',
            textures: 'stone',
            hardness: 1.5,
            tool: 'pickaxe',
            drops: 4 // Cobblestone
        });
        
        // Grass Block
        BlockRegistry.register(2, {
            name: 'grass_block',
            textures: {
                top: 'grass_top',
                bottom: 'dirt',
                side: 'grass_side'
            },
            hardness: 0.6,
            tool: 'shovel',
            drops: 3 // Dirt
        });
        
        // Dirt
        BlockRegistry.register(3, {
            name: 'dirt',
            textures: 'dirt',
            hardness: 0.5,
            tool: 'shovel'
        });
        
        // Cobblestone
        BlockRegistry.register(4, {
            name: 'cobblestone',
            textures: 'cobblestone',
            hardness: 2.0,
            tool: 'pickaxe'
        });
        
        // Oak Planks
        BlockRegistry.register(5, {
            name: 'oak_planks',
            textures: 'oak_planks',
            hardness: 2.0,
            tool: 'axe',
            flammable: true
        });
        
        // Saplings
        BlockRegistry.register(6, {
            name: 'sapling',
            textures: 'grass_plant',
            solid: false,
            transparent: true,
            hardness: 0
        });
        
        // Bedrock
        BlockRegistry.register(7, {
            name: 'bedrock',
            textures: 'bedrock',
            hardness: -1, // Unbreakable
            blast_resistance: 3600000
        });
        
        // Water
        BlockRegistry.register(8, {
            name: 'water',
            textures: 'water',
            solid: false,
            transparent: true,
            liquid: true
        });
        
        // Stationary Water
        BlockRegistry.register(9, {
            name: 'stationary_water',
            textures: 'water',
            solid: false,
            transparent: true,
            liquid: true
        });
        
        // Lava
        BlockRegistry.register(10, {
            name: 'lava',
            textures: 'lava',
            solid: false,
            transparent: true,
            liquid: true,
            light_level: 15
        });
        
        // Stationary Lava
        BlockRegistry.register(11, {
            name: 'stationary_lava',
            textures: 'lava',
            solid: false,
            transparent: true,
            liquid: true,
            light_level: 15
        });
        
        // Sand
        BlockRegistry.register(12, {
            name: 'sand',
            textures: 'sand',
            hardness: 0.5,
            tool: 'shovel',
            gravity: true
        });
        
        // Gravel
        BlockRegistry.register(13, {
            name: 'gravel',
            textures: 'gravel',
            hardness: 0.6,
            tool: 'shovel',
            gravity: true
        });
        
        // Gold Ore
        BlockRegistry.register(14, {
            name: 'gold_ore',
            textures: 'gold_ore',
            hardness: 3.0,
            tool: 'pickaxe',
            toolLevel: 2 // Iron+
        });
        
        // Iron Ore
        BlockRegistry.register(15, {
            name: 'iron_ore',
            textures: 'iron_ore',
            hardness: 3.0,
            tool: 'pickaxe',
            toolLevel: 1 // Stone+
        });
        
        // Coal Ore
        BlockRegistry.register(16, {
            name: 'coal_ore',
            textures: 'coal_ore',
            hardness: 3.0,
            tool: 'pickaxe',
            drops: 263 // Coal item
        });
        
        // Oak Log
        BlockRegistry.register(17, {
            name: 'oak_log',
            textures: {
                top: 'oak_log_top',
                bottom: 'oak_log_top',
                side: 'oak_log_side'
            },
            hardness: 2.0,
            tool: 'axe',
            flammable: true
        });
        
        // Oak Leaves
        BlockRegistry.register(18, {
            name: 'oak_leaves',
            textures: 'oak_leaves',
            hardness: 0.2,
            transparent: true,
            tool: 'shears',
            flammable: true
        });
        
        // Sponge
        BlockRegistry.register(19, {
            name: 'sponge',
            textures: 'white_wool',
            hardness: 0.6
        });
        
        // Glass
        BlockRegistry.register(20, {
            name: 'glass',
            textures: 'glass',
            hardness: 0.3,
            transparent: true,
            drops: 0 // Drops nothing
        });
        
        // Lapis Ore
        BlockRegistry.register(21, {
            name: 'lapis_ore',
            textures: 'lapis_ore',
            hardness: 3.0,
            tool: 'pickaxe',
            toolLevel: 1
        });
        
        // Sandstone
        BlockRegistry.register(24, {
            name: 'sandstone',
            textures: {
                top: 'sandstone_top',
                bottom: 'sandstone_bottom',
                side: 'sandstone_side'
            },
            hardness: 0.8,
            tool: 'pickaxe'
        });
        
        // Tall Grass
        BlockRegistry.register(31, {
            name: 'tall_grass',
            textures: 'grass_plant',
            solid: false,
            transparent: true,
            hardness: 0,
            replaceable: true
        });
        
        // Red Flower
        BlockRegistry.register(37, {
            name: 'red_flower',
            textures: 'flower_red',
            solid: false,
            transparent: true,
            hardness: 0
        });
        
        // Yellow Flower
        BlockRegistry.register(38, {
            name: 'yellow_flower',
            textures: 'flower_yellow',
            solid: false,
            transparent: true,
            hardness: 0
        });
        
        // Brick Block
        BlockRegistry.register(45, {
            name: 'brick_block',
            textures: 'brick',
            hardness: 2.0,
            tool: 'pickaxe'
        });
        
        // TNT
        BlockRegistry.register(46, {
            name: 'tnt',
            textures: {
                top: 'tnt_top',
                bottom: 'tnt_bottom',
                side: 'tnt_side'
            },
            hardness: 0,
            flammable: true,
            explosive: true
        });
        
        // Obsidian
        BlockRegistry.register(49, {
            name: 'obsidian',
            textures: 'obsidian',
            hardness: 50.0,
            tool: 'pickaxe',
            toolLevel: 3 // Diamond
        });
        
        // Torch
        BlockRegistry.register(50, {
            name: 'torch',
            textures: 'torch',
            solid: false,
            transparent: true,
            hardness: 0,
            light_level: 14
        });
        
        // Diamond Ore
        BlockRegistry.register(56, {
            name: 'diamond_ore',
            textures: 'diamond_ore',
            hardness: 3.0,
            tool: 'pickaxe',
            toolLevel: 2,
            drops: 264 // Diamond item
        });
        
        // Crafting Table
        BlockRegistry.register(58, {
            name: 'crafting_table',
            textures: {
                top: 'crafting_table_top',
                bottom: 'oak_planks',
                side: 'crafting_table_side'
            },
            hardness: 2.5,
            tool: 'axe',
            interactive: true
        });
        
        // Furnace
        BlockRegistry.register(61, {
            name: 'furnace',
            textures: {
                top: 'furnace_top',
                bottom: 'furnace_top',
                front: 'furnace_front',
                side: 'furnace_side'
            },
            hardness: 3.5,
            tool: 'pickaxe',
            interactive: true
        });
        
        // Redstone Ore
        BlockRegistry.register(73, {
            name: 'redstone_ore',
            textures: 'redstone_ore',
            hardness: 3.0,
            tool: 'pickaxe',
            toolLevel: 2
        });
        
        // Snow
        BlockRegistry.register(78, {
            name: 'snow',
            textures: 'snow',
            hardness: 0.1,
            tool: 'shovel'
        });
        
        // Snow Block
        BlockRegistry.register(80, {
            name: 'snow_block',
            textures: 'snow',
            hardness: 0.2,
            tool: 'shovel'
        });
        
        // Cactus
        BlockRegistry.register(81, {
            name: 'cactus',
            textures: 'grass_side', // Placeholder
            hardness: 0.4,
            damage: 1
        });
        
        // Pumpkin
        BlockRegistry.register(86, {
            name: 'pumpkin',
            textures: {
                top: 'pumpkin_top',
                bottom: 'pumpkin_top',
                front: 'pumpkin_face',
                side: 'pumpkin_side'
            },
            hardness: 1.0,
            tool: 'axe'
        });
        
        // Emerald Ore
        BlockRegistry.register(129, {
            name: 'emerald_ore',
            textures: 'emerald_ore',
            hardness: 3.0,
            tool: 'pickaxe',
            toolLevel: 2
        });
        
        // Stone Bricks
        BlockRegistry.register(98, {
            name: 'stone_bricks',
            textures: 'stone_brick',
            hardness: 1.5,
            tool: 'pickaxe'
        });
        
        // Birch Log
        BlockRegistry.register(162, {
            name: 'birch_log',
            textures: {
                top: 'birch_log_top',
                bottom: 'birch_log_top',
                side: 'birch_log_side'
            },
            hardness: 2.0,
            tool: 'axe'
        });
        
        // Wool colors
        const woolColors = [
            'white', 'orange', 'magenta', 'light_blue', 'yellow', 'lime',
            'pink', 'gray', 'light_gray', 'cyan', 'purple', 'blue',
            'brown', 'green', 'red', 'black'
        ];
        
        woolColors.forEach((color, index) => {
            BlockRegistry.register(35 + index * 0.0625, { // Use fractional IDs for wool variants
                name: `${color}_wool`,
                textures: `${color}_wool`,
                hardness: 0.8,
                flammable: true
            });
        });
        
        // Add white wool as ID 35
        BlockRegistry.register(35, {
            name: 'white_wool',
            textures: 'white_wool',
            hardness: 0.8,
            flammable: true
        });
    }
    
    static register(id, blockData) {
        BlockRegistry.blocks[id] = {
            id,
            solid: blockData.solid !== false,
            transparent: blockData.transparent || false,
            ...blockData
        };
    }
    
    static getBlock(id) {
        return BlockRegistry.blocks[id];
    }
    
    static getBlockByName(name) {
        return Object.values(BlockRegistry.blocks).find(b => b.name === name);
    }
    
    static getAllBlocks() {
        return Object.values(BlockRegistry.blocks).filter(b => b.id !== 0);
    }
}
