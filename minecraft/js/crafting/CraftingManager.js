// Crafting Manager - handles crafting recipes and grid operations
export class CraftingManager {
    constructor(game) {
        this.game = game;
        
        // Crafting grid (2x2 for inventory, 3x3 for crafting table)
        this.grid = [];
        this.gridSize = 2;
        
        // All recipes
        this.recipes = [];
        this.registerRecipes();
    }
    
    registerRecipes() {
        // Wood planks from logs
        this.addShapelessRecipe(
            [{ id: 'oak_log', count: 1 }],
            { id: 'oak_planks', count: 4 }
        );
        this.addShapelessRecipe(
            [{ id: 'birch_log', count: 1 }],
            { id: 'birch_planks', count: 4 }
        );
        this.addShapelessRecipe(
            [{ id: 'spruce_log', count: 1 }],
            { id: 'spruce_planks', count: 4 }
        );
        
        // Sticks
        this.addShapedRecipe([
            ['oak_planks'],
            ['oak_planks']
        ], { id: 'stick', count: 4 });
        
        // Crafting table
        this.addShapedRecipe([
            ['oak_planks', 'oak_planks'],
            ['oak_planks', 'oak_planks']
        ], { id: 'crafting_table', count: 1 });
        
        // Furnace
        this.addShapedRecipe([
            ['cobblestone', 'cobblestone', 'cobblestone'],
            ['cobblestone', null, 'cobblestone'],
            ['cobblestone', 'cobblestone', 'cobblestone']
        ], { id: 'furnace', count: 1 });
        
        // Wooden tools
        this.addShapedRecipe([
            ['oak_planks', 'oak_planks'],
            ['oak_planks', 'stick'],
            [null, 'stick']
        ], { id: 'wooden_axe', count: 1 });
        
        this.addShapedRecipe([
            ['oak_planks', 'oak_planks', 'oak_planks'],
            [null, 'stick', null],
            [null, 'stick', null]
        ], { id: 'wooden_pickaxe', count: 1 });
        
        this.addShapedRecipe([
            ['oak_planks'],
            ['stick'],
            ['stick']
        ], { id: 'wooden_shovel', count: 1 });
        
        this.addShapedRecipe([
            ['oak_planks', 'oak_planks'],
            [null, 'stick'],
            [null, 'stick']
        ], { id: 'wooden_hoe', count: 1 });
        
        this.addShapedRecipe([
            ['oak_planks'],
            ['oak_planks'],
            ['stick']
        ], { id: 'wooden_sword', count: 1 });
        
        // Stone tools
        this.addShapedRecipe([
            ['cobblestone', 'cobblestone'],
            ['cobblestone', 'stick'],
            [null, 'stick']
        ], { id: 'stone_axe', count: 1 });
        
        this.addShapedRecipe([
            ['cobblestone', 'cobblestone', 'cobblestone'],
            [null, 'stick', null],
            [null, 'stick', null]
        ], { id: 'stone_pickaxe', count: 1 });
        
        this.addShapedRecipe([
            ['cobblestone'],
            ['stick'],
            ['stick']
        ], { id: 'stone_shovel', count: 1 });
        
        this.addShapedRecipe([
            ['cobblestone', 'cobblestone'],
            [null, 'stick'],
            [null, 'stick']
        ], { id: 'stone_hoe', count: 1 });
        
        this.addShapedRecipe([
            ['cobblestone'],
            ['cobblestone'],
            ['stick']
        ], { id: 'stone_sword', count: 1 });
        
        // Iron tools
        this.addShapedRecipe([
            ['iron_ingot', 'iron_ingot'],
            ['iron_ingot', 'stick'],
            [null, 'stick']
        ], { id: 'iron_axe', count: 1 });
        
        this.addShapedRecipe([
            ['iron_ingot', 'iron_ingot', 'iron_ingot'],
            [null, 'stick', null],
            [null, 'stick', null]
        ], { id: 'iron_pickaxe', count: 1 });
        
        this.addShapedRecipe([
            ['iron_ingot'],
            ['stick'],
            ['stick']
        ], { id: 'iron_shovel', count: 1 });
        
        this.addShapedRecipe([
            ['iron_ingot', 'iron_ingot'],
            [null, 'stick'],
            [null, 'stick']
        ], { id: 'iron_hoe', count: 1 });
        
        this.addShapedRecipe([
            ['iron_ingot'],
            ['iron_ingot'],
            ['stick']
        ], { id: 'iron_sword', count: 1 });
        
        // Diamond tools
        this.addShapedRecipe([
            ['diamond', 'diamond'],
            ['diamond', 'stick'],
            [null, 'stick']
        ], { id: 'diamond_axe', count: 1 });
        
        this.addShapedRecipe([
            ['diamond', 'diamond', 'diamond'],
            [null, 'stick', null],
            [null, 'stick', null]
        ], { id: 'diamond_pickaxe', count: 1 });
        
        this.addShapedRecipe([
            ['diamond'],
            ['stick'],
            ['stick']
        ], { id: 'diamond_shovel', count: 1 });
        
        this.addShapedRecipe([
            ['diamond', 'diamond'],
            [null, 'stick'],
            [null, 'stick']
        ], { id: 'diamond_hoe', count: 1 });
        
        this.addShapedRecipe([
            ['diamond'],
            ['diamond'],
            ['stick']
        ], { id: 'diamond_sword', count: 1 });
        
        // Torches
        this.addShapedRecipe([
            ['coal'],
            ['stick']
        ], { id: 'torch', count: 4 });
        
        // Chest
        this.addShapedRecipe([
            ['oak_planks', 'oak_planks', 'oak_planks'],
            ['oak_planks', null, 'oak_planks'],
            ['oak_planks', 'oak_planks', 'oak_planks']
        ], { id: 'chest', count: 1 });
        
        // Ladder
        this.addShapedRecipe([
            ['stick', null, 'stick'],
            ['stick', 'stick', 'stick'],
            ['stick', null, 'stick']
        ], { id: 'ladder', count: 3 });
        
        // Fence
        this.addShapedRecipe([
            ['oak_planks', 'stick', 'oak_planks'],
            ['oak_planks', 'stick', 'oak_planks']
        ], { id: 'oak_fence', count: 3 });
        
        // Fence gate
        this.addShapedRecipe([
            ['stick', 'oak_planks', 'stick'],
            ['stick', 'oak_planks', 'stick']
        ], { id: 'oak_fence_gate', count: 1 });
        
        // Door
        this.addShapedRecipe([
            ['oak_planks', 'oak_planks'],
            ['oak_planks', 'oak_planks'],
            ['oak_planks', 'oak_planks']
        ], { id: 'oak_door', count: 3 });
        
        // Glass pane
        this.addShapedRecipe([
            ['glass', 'glass', 'glass'],
            ['glass', 'glass', 'glass']
        ], { id: 'glass_pane', count: 16 });
        
        // Bookshelf
        this.addShapedRecipe([
            ['oak_planks', 'oak_planks', 'oak_planks'],
            ['book', 'book', 'book'],
            ['oak_planks', 'oak_planks', 'oak_planks']
        ], { id: 'bookshelf', count: 1 });
        
        // Book
        this.addShapedRecipe([
            ['paper', 'paper', 'paper'],
            ['leather']
        ], { id: 'book', count: 1 });
        
        // Stairs
        this.addShapedRecipe([
            ['cobblestone', null, null],
            ['cobblestone', 'cobblestone', null],
            ['cobblestone', 'cobblestone', 'cobblestone']
        ], { id: 'stone_stairs', count: 4 });
        
        this.addShapedRecipe([
            ['oak_planks', null, null],
            ['oak_planks', 'oak_planks', null],
            ['oak_planks', 'oak_planks', 'oak_planks']
        ], { id: 'oak_stairs', count: 4 });
        
        // Slabs
        this.addShapedRecipe([
            ['cobblestone', 'cobblestone', 'cobblestone']
        ], { id: 'stone_slab', count: 6 });
        
        this.addShapedRecipe([
            ['oak_planks', 'oak_planks', 'oak_planks']
        ], { id: 'oak_slab', count: 6 });
        
        // Iron block
        this.addShapedRecipe([
            ['iron_ingot', 'iron_ingot', 'iron_ingot'],
            ['iron_ingot', 'iron_ingot', 'iron_ingot'],
            ['iron_ingot', 'iron_ingot', 'iron_ingot']
        ], { id: 'iron_block', count: 1 });
        
        // Gold block
        this.addShapedRecipe([
            ['gold_ingot', 'gold_ingot', 'gold_ingot'],
            ['gold_ingot', 'gold_ingot', 'gold_ingot'],
            ['gold_ingot', 'gold_ingot', 'gold_ingot']
        ], { id: 'gold_block', count: 1 });
        
        // Diamond block
        this.addShapedRecipe([
            ['diamond', 'diamond', 'diamond'],
            ['diamond', 'diamond', 'diamond'],
            ['diamond', 'diamond', 'diamond']
        ], { id: 'diamond_block', count: 1 });
        
        // Iron ingots from block
        this.addShapelessRecipe(
            [{ id: 'iron_block', count: 1 }],
            { id: 'iron_ingot', count: 9 }
        );
        
        // Gold ingots from block
        this.addShapelessRecipe(
            [{ id: 'gold_block', count: 1 }],
            { id: 'gold_ingot', count: 9 }
        );
        
        // Diamonds from block
        this.addShapelessRecipe(
            [{ id: 'diamond_block', count: 1 }],
            { id: 'diamond', count: 9 }
        );
        
        // Armor - Iron
        this.addShapedRecipe([
            ['iron_ingot', null, 'iron_ingot'],
            ['iron_ingot', 'iron_ingot', 'iron_ingot'],
            ['iron_ingot', 'iron_ingot', 'iron_ingot']
        ], { id: 'iron_chestplate', count: 1 });
        
        this.addShapedRecipe([
            ['iron_ingot', 'iron_ingot', 'iron_ingot'],
            ['iron_ingot', null, 'iron_ingot']
        ], { id: 'iron_helmet', count: 1 });
        
        this.addShapedRecipe([
            ['iron_ingot', 'iron_ingot', 'iron_ingot'],
            ['iron_ingot', null, 'iron_ingot'],
            ['iron_ingot', null, 'iron_ingot']
        ], { id: 'iron_leggings', count: 1 });
        
        this.addShapedRecipe([
            ['iron_ingot', null, 'iron_ingot'],
            ['iron_ingot', null, 'iron_ingot']
        ], { id: 'iron_boots', count: 1 });
        
        // Armor - Diamond
        this.addShapedRecipe([
            ['diamond', null, 'diamond'],
            ['diamond', 'diamond', 'diamond'],
            ['diamond', 'diamond', 'diamond']
        ], { id: 'diamond_chestplate', count: 1 });
        
        this.addShapedRecipe([
            ['diamond', 'diamond', 'diamond'],
            ['diamond', null, 'diamond']
        ], { id: 'diamond_helmet', count: 1 });
        
        this.addShapedRecipe([
            ['diamond', 'diamond', 'diamond'],
            ['diamond', null, 'diamond'],
            ['diamond', null, 'diamond']
        ], { id: 'diamond_leggings', count: 1 });
        
        this.addShapedRecipe([
            ['diamond', null, 'diamond'],
            ['diamond', null, 'diamond']
        ], { id: 'diamond_boots', count: 1 });
        
        // Bucket
        this.addShapedRecipe([
            ['iron_ingot', null, 'iron_ingot'],
            [null, 'iron_ingot', null]
        ], { id: 'bucket', count: 1 });
        
        // Bed
        this.addShapedRecipe([
            ['wool', 'wool', 'wool'],
            ['oak_planks', 'oak_planks', 'oak_planks']
        ], { id: 'bed', count: 1 });
        
        // TNT
        this.addShapedRecipe([
            ['gunpowder', 'sand', 'gunpowder'],
            ['sand', 'gunpowder', 'sand'],
            ['gunpowder', 'sand', 'gunpowder']
        ], { id: 'tnt', count: 1 });
        
        // Bow
        this.addShapedRecipe([
            [null, 'stick', 'string'],
            ['stick', null, 'string'],
            [null, 'stick', 'string']
        ], { id: 'bow', count: 1 });
        
        // Arrow
        this.addShapedRecipe([
            ['flint'],
            ['stick'],
            ['feather']
        ], { id: 'arrow', count: 4 });
        
        // Boat
        this.addShapedRecipe([
            ['oak_planks', null, 'oak_planks'],
            ['oak_planks', 'oak_planks', 'oak_planks']
        ], { id: 'boat', count: 1 });
        
        // Compass
        this.addShapedRecipe([
            [null, 'iron_ingot', null],
            ['iron_ingot', 'redstone', 'iron_ingot'],
            [null, 'iron_ingot', null]
        ], { id: 'compass', count: 1 });
        
        // Clock
        this.addShapedRecipe([
            [null, 'gold_ingot', null],
            ['gold_ingot', 'redstone', 'gold_ingot'],
            [null, 'gold_ingot', null]
        ], { id: 'clock', count: 1 });
    }
    
    addShapedRecipe(pattern, result) {
        this.recipes.push({
            type: 'shaped',
            pattern: pattern,
            result: result,
            width: pattern[0].length,
            height: pattern.length
        });
    }
    
    addShapelessRecipe(ingredients, result) {
        this.recipes.push({
            type: 'shapeless',
            ingredients: ingredients,
            result: result
        });
    }
    
    setGridSize(size) {
        this.gridSize = size;
        this.grid = new Array(size * size).fill(null);
    }
    
    setGridItem(slot, item) {
        if (slot >= 0 && slot < this.grid.length) {
            this.grid[slot] = item ? { ...item } : null;
        }
    }
    
    getGridItem(slot) {
        return this.grid[slot];
    }
    
    clearGrid() {
        this.grid.fill(null);
    }
    
    checkRecipe() {
        // Convert grid to 2D array
        const grid2D = [];
        for (let y = 0; y < this.gridSize; y++) {
            const row = [];
            for (let x = 0; x < this.gridSize; x++) {
                const item = this.grid[y * this.gridSize + x];
                row.push(item ? item.id : null);
            }
            grid2D.push(row);
        }
        
        // Check shaped recipes first
        for (const recipe of this.recipes) {
            if (recipe.type === 'shaped') {
                const result = this.matchShapedRecipe(recipe, grid2D);
                if (result) return result;
            } else {
                const result = this.matchShapelessRecipe(recipe);
                if (result) return result;
            }
        }
        
        return null;
    }
    
    matchShapedRecipe(recipe, grid2D) {
        // Find the bounding box of items in grid
        let minX = this.gridSize, maxX = -1;
        let minY = this.gridSize, maxY = -1;
        
        for (let y = 0; y < this.gridSize; y++) {
            for (let x = 0; x < this.gridSize; x++) {
                if (grid2D[y][x] !== null) {
                    minX = Math.min(minX, x);
                    maxX = Math.max(maxX, x);
                    minY = Math.min(minY, y);
                    maxY = Math.max(maxY, y);
                }
            }
        }
        
        // Empty grid
        if (maxX < 0) return null;
        
        // Get actual dimensions
        const gridWidth = maxX - minX + 1;
        const gridHeight = maxY - minY + 1;
        
        // Check if dimensions match
        if (gridWidth !== recipe.width || gridHeight !== recipe.height) {
            return null;
        }
        
        // Check each cell
        for (let y = 0; y < recipe.height; y++) {
            for (let x = 0; x < recipe.width; x++) {
                const gridItem = grid2D[minY + y][minX + x];
                const recipeItem = recipe.pattern[y][x];
                
                if (!this.itemMatches(gridItem, recipeItem)) {
                    return null;
                }
            }
        }
        
        return { ...recipe.result };
    }
    
    matchShapelessRecipe(recipe) {
        // Collect all items from grid
        const gridItems = [];
        for (const item of this.grid) {
            if (item) {
                gridItems.push(item);
            }
        }
        
        // Check if we have the right number of items
        if (gridItems.length !== recipe.ingredients.length) {
            return null;
        }
        
        // Check if all ingredients are present
        const usedItems = new Array(gridItems.length).fill(false);
        
        for (const ingredient of recipe.ingredients) {
            let found = false;
            for (let i = 0; i < gridItems.length; i++) {
                if (!usedItems[i] && gridItems[i].id === ingredient.id && gridItems[i].count >= ingredient.count) {
                    usedItems[i] = true;
                    found = true;
                    break;
                }
            }
            if (!found) return null;
        }
        
        return { ...recipe.result };
    }
    
    itemMatches(gridItem, recipeItem) {
        // Both empty
        if (!gridItem && !recipeItem) return true;
        
        // One empty, one not
        if (!gridItem || !recipeItem) return false;
        
        // Check if item matches (handle wood type wildcards)
        if (recipeItem.includes('_planks') && gridItem.includes('_planks')) {
            return true;
        }
        
        return gridItem === recipeItem;
    }
    
    craft() {
        const result = this.checkRecipe();
        if (!result) return null;
        
        // Consume ingredients
        for (let i = 0; i < this.grid.length; i++) {
            if (this.grid[i]) {
                this.grid[i].count--;
                if (this.grid[i].count <= 0) {
                    this.grid[i] = null;
                }
            }
        }
        
        return result;
    }
    
    getRecipesForItem(itemId) {
        return this.recipes.filter(recipe => recipe.result.id === itemId);
    }
    
    getAllRecipes() {
        return this.recipes;
    }
    
    getRecipeBook() {
        // Return recipes organized by category
        const categories = {
            tools: [],
            weapons: [],
            armor: [],
            building: [],
            redstone: [],
            misc: []
        };
        
        for (const recipe of this.recipes) {
            const id = recipe.result.id;
            
            if (id.includes('pickaxe') || id.includes('axe') || id.includes('shovel') || id.includes('hoe')) {
                categories.tools.push(recipe);
            } else if (id.includes('sword') || id.includes('bow') || id.includes('arrow')) {
                categories.weapons.push(recipe);
            } else if (id.includes('helmet') || id.includes('chestplate') || id.includes('leggings') || id.includes('boots')) {
                categories.armor.push(recipe);
            } else if (id.includes('planks') || id.includes('stairs') || id.includes('slab') || id.includes('fence') || id.includes('door')) {
                categories.building.push(recipe);
            } else if (id.includes('redstone') || id.includes('piston') || id.includes('repeater')) {
                categories.redstone.push(recipe);
            } else {
                categories.misc.push(recipe);
            }
        }
        
        return categories;
    }
}

// Smelting recipes (for furnace)
export class SmeltingManager {
    constructor() {
        this.recipes = new Map();
        this.registerRecipes();
    }
    
    registerRecipes() {
        // Ores
        this.addRecipe('iron_ore', 'iron_ingot', 200);
        this.addRecipe('gold_ore', 'gold_ingot', 200);
        this.addRecipe('raw_iron', 'iron_ingot', 200);
        this.addRecipe('raw_gold', 'gold_ingot', 200);
        this.addRecipe('raw_copper', 'copper_ingot', 200);
        
        // Stone
        this.addRecipe('cobblestone', 'stone', 200);
        this.addRecipe('stone', 'smooth_stone', 200);
        this.addRecipe('sand', 'glass', 200);
        this.addRecipe('clay_ball', 'brick', 200);
        this.addRecipe('netherrack', 'nether_brick', 200);
        
        // Food
        this.addRecipe('raw_beef', 'cooked_beef', 200);
        this.addRecipe('raw_porkchop', 'cooked_porkchop', 200);
        this.addRecipe('raw_chicken', 'cooked_chicken', 200);
        this.addRecipe('raw_mutton', 'cooked_mutton', 200);
        this.addRecipe('raw_salmon', 'cooked_salmon', 200);
        this.addRecipe('raw_cod', 'cooked_cod', 200);
        this.addRecipe('potato', 'baked_potato', 200);
        this.addRecipe('kelp', 'dried_kelp', 200);
        
        // Misc
        this.addRecipe('oak_log', 'charcoal', 200);
        this.addRecipe('birch_log', 'charcoal', 200);
        this.addRecipe('spruce_log', 'charcoal', 200);
        this.addRecipe('wet_sponge', 'sponge', 200);
        this.addRecipe('cactus', 'green_dye', 200);
    }
    
    addRecipe(input, output, time) {
        this.recipes.set(input, { output, time });
    }
    
    getRecipe(inputItem) {
        return this.recipes.get(inputItem);
    }
    
    smelt(inputItem) {
        const recipe = this.getRecipe(inputItem);
        if (!recipe) return null;
        
        return { id: recipe.output, count: 1 };
    }
}
