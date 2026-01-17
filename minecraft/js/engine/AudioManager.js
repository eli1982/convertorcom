// Audio Manager
export class AudioManager {
    static context = null;
    static sounds = {};
    static music = null;
    static musicVolume = 0.5;
    static sfxVolume = 1.0;
    
    static init() {
        try {
            AudioManager.context = new (window.AudioContext || window.webkitAudioContext)();
            AudioManager.loadSounds();
        } catch (e) {
            console.warn('Web Audio API not supported:', e);
        }
    }
    
    static async loadSounds() {
        // Generate procedural sounds since we can't load audio files
        AudioManager.sounds = {
            dig_stone: AudioManager.generateDigSound(800, 0.1),
            dig_dirt: AudioManager.generateDigSound(400, 0.08),
            dig_wood: AudioManager.generateDigSound(600, 0.12),
            dig_gravel: AudioManager.generateDigSound(300, 0.1),
            dig_sand: AudioManager.generateDigSound(200, 0.08),
            
            place_block: AudioManager.generatePlaceSound(),
            
            step_stone: AudioManager.generateStepSound(600),
            step_dirt: AudioManager.generateStepSound(300),
            step_wood: AudioManager.generateStepSound(500),
            step_grass: AudioManager.generateStepSound(350),
            
            hurt: AudioManager.generateHurtSound(),
            fall_small: AudioManager.generateFallSound(0.1),
            fall_big: AudioManager.generateFallSound(0.3),
            
            eat: AudioManager.generateEatSound(),
            burp: AudioManager.generateBurpSound(),
            
            explosion: AudioManager.generateExplosionSound(),
            
            door_open: AudioManager.generateDoorSound(true),
            door_close: AudioManager.generateDoorSound(false),
            
            click: AudioManager.generateClickSound()
        };
    }
    
    static generateDigSound(frequency, duration) {
        return { frequency, duration, type: 'dig' };
    }
    
    static generatePlaceSound() {
        return { frequency: 500, duration: 0.1, type: 'place' };
    }
    
    static generateStepSound(frequency) {
        return { frequency, duration: 0.05, type: 'step' };
    }
    
    static generateHurtSound() {
        return { frequency: 200, duration: 0.2, type: 'hurt' };
    }
    
    static generateFallSound(duration) {
        return { frequency: 150, duration, type: 'fall' };
    }
    
    static generateEatSound() {
        return { frequency: 400, duration: 0.15, type: 'eat' };
    }
    
    static generateBurpSound() {
        return { frequency: 100, duration: 0.3, type: 'burp' };
    }
    
    static generateExplosionSound() {
        return { frequency: 80, duration: 0.5, type: 'explosion' };
    }
    
    static generateDoorSound(open) {
        return { frequency: open ? 300 : 250, duration: 0.15, type: 'door' };
    }
    
    static generateClickSound() {
        return { frequency: 1000, duration: 0.03, type: 'click' };
    }
    
    static play(soundName, volume = 1.0) {
        if (!AudioManager.context || !AudioManager.sounds[soundName]) return;
        
        const sound = AudioManager.sounds[soundName];
        const actualVolume = volume * AudioManager.sfxVolume;
        
        try {
            const oscillator = AudioManager.context.createOscillator();
            const gainNode = AudioManager.context.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(AudioManager.context.destination);
            
            oscillator.frequency.value = sound.frequency;
            oscillator.type = sound.type === 'explosion' ? 'sawtooth' : 'square';
            
            gainNode.gain.setValueAtTime(actualVolume * 0.1, AudioManager.context.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.001, AudioManager.context.currentTime + sound.duration);
            
            oscillator.start(AudioManager.context.currentTime);
            oscillator.stop(AudioManager.context.currentTime + sound.duration);
        } catch (e) {
            // Ignore audio errors
        }
    }
    
    static playMusic(trackName) {
        // Music would be loaded from files in a full implementation
        console.log('Playing music:', trackName);
    }
    
    static stopMusic() {
        if (AudioManager.music) {
            AudioManager.music.stop();
            AudioManager.music = null;
        }
    }
    
    static setMusicVolume(volume) {
        AudioManager.musicVolume = volume;
    }
    
    static setSfxVolume(volume) {
        AudioManager.sfxVolume = volume;
    }
    
    static resumeContext() {
        if (AudioManager.context && AudioManager.context.state === 'suspended') {
            AudioManager.context.resume();
        }
    }
}
