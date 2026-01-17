// Inventory system
import { BlockRegistry } from '../blocks/BlockRegistry.js';

export class Inventory {
    constructor(size = 36) {
        this.size = size;
        this.slots = new Array(size).fill(null).map(() => ({ item: null, count: 0 }));
        this.armorSlots = {
            helmet: null,
            chestplate: null,
            leggings: null,
            boots: null
        };
    }
    
    getSlot(index) {
        if (index < 0 || index >= this.size) return null;
        return this.slots[index];
    }
    
    setSlot(index, item, count = 1) {
        if (index < 0 || index >= this.size) return false;
        this.slots[index] = { item, count };
        return true;
    }
    
    addItem(item, count = 1) {
        // First try to stack with existing items
        for (let i = 0; i < this.size; i++) {
            const slot = this.slots[i];
            if (slot.item && slot.item.id === item.id) {
                const maxStack = item.maxStack || 64;
                const canAdd = maxStack - slot.count;
                const toAdd = Math.min(canAdd, count);
                slot.count += toAdd;
                count -= toAdd;
                if (count <= 0) return true;
            }
        }
        
        // Then try to find empty slots
        for (let i = 0; i < this.size; i++) {
            if (!this.slots[i].item) {
                const maxStack = item.maxStack || 64;
                const toAdd = Math.min(maxStack, count);
                this.slots[i] = { item, count: toAdd };
                count -= toAdd;
                if (count <= 0) return true;
            }
        }
        
        return count <= 0;
    }
    
    removeItem(itemId, count = 1) {
        for (let i = this.size - 1; i >= 0; i--) {
            const slot = this.slots[i];
            if (slot.item && slot.item.id === itemId) {
                const toRemove = Math.min(slot.count, count);
                slot.count -= toRemove;
                count -= toRemove;
                
                if (slot.count <= 0) {
                    this.slots[i] = { item: null, count: 0 };
                }
                
                if (count <= 0) return true;
            }
        }
        return false;
    }
    
    hasItem(itemId, count = 1) {
        let total = 0;
        for (const slot of this.slots) {
            if (slot.item && slot.item.id === itemId) {
                total += slot.count;
                if (total >= count) return true;
            }
        }
        return false;
    }
    
    countItem(itemId) {
        let total = 0;
        for (const slot of this.slots) {
            if (slot.item && slot.item.id === itemId) {
                total += slot.count;
            }
        }
        return total;
    }
    
    decrementSlot(index) {
        if (index < 0 || index >= this.size) return false;
        const slot = this.slots[index];
        if (slot.item && slot.count > 0) {
            slot.count--;
            if (slot.count <= 0) {
                this.slots[index] = { item: null, count: 0 };
            }
            return true;
        }
        return false;
    }
    
    swapSlots(index1, index2) {
        if (index1 < 0 || index1 >= this.size) return false;
        if (index2 < 0 || index2 >= this.size) return false;
        
        const temp = this.slots[index1];
        this.slots[index1] = this.slots[index2];
        this.slots[index2] = temp;
        return true;
    }
    
    clear() {
        for (let i = 0; i < this.size; i++) {
            this.slots[i] = { item: null, count: 0 };
        }
    }
    
    giveStartingItems() {
        // Give some starting tools and items
        this.addItem({ id: 'wooden_pickaxe', name: 'Wooden Pickaxe', isBlock: false, tool: 'pickaxe', toolSpeed: 2 }, 1);
        this.addItem({ id: 'wooden_axe', name: 'Wooden Axe', isBlock: false, tool: 'axe', toolSpeed: 2 }, 1);
        this.addItem({ id: 'wooden_shovel', name: 'Wooden Shovel', isBlock: false, tool: 'shovel', toolSpeed: 2 }, 1);
        
        // Give some useful blocks
        this.addItem({ id: 4, name: 'Cobblestone', isBlock: true, blockId: 4 }, 64);
        this.addItem({ id: 5, name: 'Oak Planks', isBlock: true, blockId: 5 }, 64);
        this.addItem({ id: 3, name: 'Dirt', isBlock: true, blockId: 3 }, 64);
        this.addItem({ id: 1, name: 'Stone', isBlock: true, blockId: 1 }, 64);
        this.addItem({ id: 50, name: 'Torch', isBlock: true, blockId: 50 }, 32);
        this.addItem({ id: 17, name: 'Oak Log', isBlock: true, blockId: 17 }, 64);
    }
    
    giveCreativeItems() {
        // Give all blocks in creative mode
        const blocks = BlockRegistry.getAllBlocks();
        let slotIndex = 0;
        
        for (const block of blocks) {
            if (slotIndex >= this.size) break;
            if (block.solid !== false || block.name.includes('torch') || block.name.includes('flower')) {
                this.slots[slotIndex] = {
                    item: {
                        id: block.id,
                        name: block.name,
                        isBlock: true,
                        blockId: block.id
                    },
                    count: 64
                };
                slotIndex++;
            }
        }
    }
    
    getHotbar() {
        return this.slots.slice(0, 9);
    }
    
    getMainInventory() {
        return this.slots.slice(9);
    }
    
    serialize() {
        return this.slots.map(slot => {
            if (slot.item) {
                return { id: slot.item.id, count: slot.count };
            }
            return null;
        });
    }
    
    deserialize(data) {
        for (let i = 0; i < data.length && i < this.size; i++) {
            if (data[i]) {
                const block = BlockRegistry.getBlock(data[i].id);
                if (block) {
                    this.slots[i] = {
                        item: {
                            id: block.id,
                            name: block.name,
                            isBlock: true,
                            blockId: block.id
                        },
                        count: data[i].count
                    };
                }
            }
        }
    }
}
