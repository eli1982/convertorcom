// Menu Manager
import * as THREE from 'three';
import { SaveManager } from '../engine/SaveManager.js';

// Character preset definitions based on official Minecraft characters
const CHARACTER_PRESETS = {
    sunny: {
        name: 'Sunny',
        skinColor: '#d4a574',
        hairColor: '#1a1a2e',
        shirtColor: '#4a7c59',
        pantsColor: '#3d5a80',
        sleeveColor: '#4a7c59'
    },
    kai: {
        name: 'Kai',
        skinColor: '#f5d0c5',
        hairColor: '#f4d03f',
        shirtColor: '#d4a017',
        pantsColor: '#1a1a1a',
        sleeveColor: '#d4a017'
    },
    makena: {
        name: 'Makena',
        skinColor: '#8b5a2b',
        hairColor: '#1a0f0a',
        shirtColor: '#40e0d0',
        pantsColor: '#6b4aa3',
        sleeveColor: '#40e0d0'
    },
    steve: {
        name: 'Steve',
        skinColor: '#c4a484',
        hairColor: '#4a3728',
        shirtColor: '#00aaaa',
        pantsColor: '#3333aa',
        sleeveColor: '#c4a484'
    },
    alex: {
        name: 'Alex',
        skinColor: '#e8c4a0',
        hairColor: '#c46210',
        shirtColor: '#5d8c3e',
        pantsColor: '#6b5344',
        sleeveColor: '#5d8c3e'
    },
    zuri: {
        name: 'Zuri',
        skinColor: '#8b5a2b',
        hairColor: '#c46210',
        shirtColor: '#2d5016',
        pantsColor: '#8b6914',
        sleeveColor: '#2d5016'
    },
    efe: {
        name: 'Efe',
        skinColor: '#5c4033',
        hairColor: '#1a0f0a',
        shirtColor: '#2f4f4f',
        pantsColor: '#1a1a1a',
        sleeveColor: '#2f4f4f'
    },
    ari: {
        name: 'Ari',
        skinColor: '#d4a574',
        hairColor: '#4a0080',
        shirtColor: '#8b0000',
        pantsColor: '#2e5339',
        sleeveColor: '#8b0000'
    },
    noor: {
        name: 'Noor',
        skinColor: '#a0522d',
        hairColor: '#1a0f0a',
        shirtColor: '#8b4513',
        pantsColor: '#2e5339',
        sleeveColor: '#8b4513'
    }
};

export class MenuManager {
    constructor() {
        this.currentMenu = 'main-menu';
        this.characterPreviewRenderer = null;
        this.characterData = {
            preset: 'steve',
            skinColor: '#c4a484',
            shirtColor: '#00aaaa',
            pantsColor: '#3333aa',
            hairColor: '#4a3728'
        };
        this.presets = CHARACTER_PRESETS;
    }
    
    init() {
        this.loadWorldList();
        this.loadCharacterData();
        this.setupCharacterOptions();
    }
    
    showMenu(menuId) {
        // Hide all menus
        document.querySelectorAll('.menu-screen').forEach(menu => {
            menu.classList.add('hidden');
        });
        
        // Show selected menu
        const menu = document.getElementById(menuId);
        if (menu) {
            menu.classList.remove('hidden');
            this.currentMenu = menuId;
            
            // Refresh world list when showing world menu
            if (menuId === 'world-menu') {
                this.loadWorldList();
            }
        }
    }
    
    loadWorldList() {
        const worldList = document.getElementById('world-list');
        const worlds = SaveManager.getWorldList();
        
        worldList.innerHTML = '';
        
        if (worlds.length === 0) {
            worldList.innerHTML = '<div class="no-worlds">No worlds yet. Create one!</div>';
            return;
        }
        
        worlds.forEach(world => {
            const worldItem = document.createElement('div');
            worldItem.className = 'world-item';
            worldItem.innerHTML = `
                <div class="world-icon"></div>
                <div class="world-info">
                    <h3>${world.name}</h3>
                    <p>Seed: ${world.seed}</p>
                    <p>Last played: ${new Date(world.savedAt).toLocaleDateString()}</p>
                </div>
            `;
            
            worldItem.addEventListener('click', () => {
                // Select world
                document.querySelectorAll('.world-item').forEach(w => w.classList.remove('selected'));
                worldItem.classList.add('selected');
            });
            
            worldItem.addEventListener('dblclick', () => {
                // Load world
                this.loadWorld(world.name);
            });
            
            worldList.appendChild(worldItem);
        });
    }
    
    loadWorld(worldName) {
        // TODO: Implement world loading
        console.log('Loading world:', worldName);
    }
    
    loadCharacterData() {
        try {
            const saved = localStorage.getItem('webcraft_character');
            if (saved) {
                const data = JSON.parse(saved);
                this.characterData = { ...this.characterData, ...data };
                
                // Apply to color inputs if they exist
                setTimeout(() => {
                    const skinInput = document.getElementById('skin-color');
                    const shirtInput = document.getElementById('shirt-color');
                    const pantsInput = document.getElementById('pants-color');
                    const hairInput = document.getElementById('hair-color');
                    
                    if (skinInput) skinInput.value = this.characterData.skinColor;
                    if (shirtInput) shirtInput.value = this.characterData.shirtColor;
                    if (pantsInput) pantsInput.value = this.characterData.pantsColor;
                    if (hairInput) hairInput.value = this.characterData.hairColor;
                    
                    // Update active preset button
                    if (this.characterData.preset) {
                        document.querySelectorAll('.preset-btn').forEach(btn => {
                            btn.classList.remove('active');
                            if (btn.dataset.preset === this.characterData.preset) {
                                btn.classList.add('active');
                            }
                        });
                    }
                }, 100);
            }
        } catch (e) {
            console.warn('Failed to load character data');
        }
    }
    
    setupCharacterOptions() {
        // Character preset buttons
        document.querySelectorAll('.preset-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const presetName = btn.dataset.preset;
                const preset = this.presets[presetName];
                
                if (preset) {
                    // Update active state
                    document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    
                    // Apply preset colors
                    this.characterData.preset = presetName;
                    this.characterData.skinColor = preset.skinColor;
                    this.characterData.shirtColor = preset.shirtColor;
                    this.characterData.pantsColor = preset.pantsColor;
                    this.characterData.hairColor = preset.hairColor;
                    
                    // Update color inputs
                    document.getElementById('skin-color').value = preset.skinColor;
                    document.getElementById('shirt-color').value = preset.shirtColor;
                    document.getElementById('pants-color').value = preset.pantsColor;
                    document.getElementById('hair-color').value = preset.hairColor;
                    
                    this.updateCharacterPreview();
                }
            });
        });
        
        // Color inputs
        const colorInputs = ['skin-color', 'shirt-color', 'pants-color', 'hair-color'];
        colorInputs.forEach(id => {
            const input = document.getElementById(id);
            if (input) {
                input.addEventListener('input', () => {
                    const propName = id.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
                    this.characterData[propName] = input.value;
                    this.characterData.preset = 'custom';
                    
                    // Deselect preset buttons
                    document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
                    
                    this.updateCharacterPreview();
                });
            }
        });
    }
    
    initCharacterPreview() {
        const canvas = document.getElementById('character-canvas');
        if (!canvas || this.characterPreviewRenderer) return;
        
        // Create simple Three.js preview
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x1a1a1a);
        
        const camera = new THREE.PerspectiveCamera(50, canvas.width / canvas.height, 0.1, 100);
        camera.position.set(0, 1, 3);
        camera.lookAt(0, 0.8, 0);
        
        const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
        renderer.setSize(canvas.clientWidth, canvas.clientHeight);
        
        // Add lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(2, 2, 2);
        scene.add(directionalLight);
        
        // Create character model
        this.characterMesh = this.createCharacterMesh();
        scene.add(this.characterMesh);
        
        this.characterPreviewRenderer = renderer;
        this.characterPreviewScene = scene;
        this.characterPreviewCamera = camera;
        
        // Animation loop
        const animate = () => {
            if (!this.characterPreviewRenderer) return;
            
            // Rotate character
            if (this.characterMesh) {
                this.characterMesh.rotation.y += 0.01;
            }
            
            renderer.render(scene, camera);
            requestAnimationFrame(animate);
        };
        
        animate();
    }
    
    createCharacterMesh() {
        const group = new THREE.Group();
        
        // Body parts with colors from character data
        const skinColor = new THREE.Color(this.characterData.skinColor);
        const shirtColor = new THREE.Color(this.characterData.shirtColor);
        const pantsColor = new THREE.Color(this.characterData.pantsColor);
        const hairColor = new THREE.Color(this.characterData.hairColor);
        
        // Head
        const headGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
        const headMaterial = new THREE.MeshLambertMaterial({ color: skinColor });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.y = 1.5;
        group.add(head);
        
        // Hair (on top)
        const hairGeometry = new THREE.BoxGeometry(0.52, 0.15, 0.52);
        const hairMaterial = new THREE.MeshLambertMaterial({ color: hairColor });
        const hair = new THREE.Mesh(hairGeometry, hairMaterial);
        hair.position.y = 1.8;
        group.add(hair);
        
        // Body
        const bodyGeometry = new THREE.BoxGeometry(0.5, 0.75, 0.25);
        const bodyMaterial = new THREE.MeshLambertMaterial({ color: shirtColor });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 0.9;
        group.add(body);
        
        // Arms
        const armGeometry = new THREE.BoxGeometry(0.25, 0.75, 0.25);
        const armMaterial = new THREE.MeshLambertMaterial({ color: skinColor });
        
        const leftArm = new THREE.Mesh(armGeometry, armMaterial);
        leftArm.position.set(-0.375, 0.9, 0);
        group.add(leftArm);
        
        const rightArm = new THREE.Mesh(armGeometry, armMaterial);
        rightArm.position.set(0.375, 0.9, 0);
        group.add(rightArm);
        
        // Legs
        const legGeometry = new THREE.BoxGeometry(0.25, 0.75, 0.25);
        const legMaterial = new THREE.MeshLambertMaterial({ color: pantsColor });
        
        const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
        leftLeg.position.set(-0.125, 0.15, 0);
        group.add(leftLeg);
        
        const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
        rightLeg.position.set(0.125, 0.15, 0);
        group.add(rightLeg);
        
        return group;
    }
    
    updateCharacterPreview() {
        if (!this.characterMesh) return;
        
        // Remove old mesh
        this.characterPreviewScene.remove(this.characterMesh);
        
        // Create new mesh with updated colors
        this.characterMesh = this.createCharacterMesh();
        this.characterPreviewScene.add(this.characterMesh);
    }
    
    saveCharacter() {
        try {
            localStorage.setItem('webcraft_character', JSON.stringify(this.characterData));
        } catch (e) {
            console.warn('Failed to save character data');
        }
    }
    
    toggleDebug() {
        const debugInfo = document.getElementById('debug-info');
        if (debugInfo) {
            debugInfo.classList.toggle('hidden');
        }
    }
}
