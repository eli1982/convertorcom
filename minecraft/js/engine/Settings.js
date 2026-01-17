// Settings Manager
export class Settings {
    static defaults = {
        render_distance: 8,
        fov: 70,
        sensitivity: 50,
        music_volume: 50,
        sfx_volume: 100,
        shadow_quality: 'medium',
        vsync: true,
        show_fps: false,
        fancy_graphics: true,
        smooth_lighting: true,
        particles: true
    };
    
    static current = { ...Settings.defaults };
    
    static load() {
        try {
            const saved = localStorage.getItem('webcraft_settings');
            if (saved) {
                const parsed = JSON.parse(saved);
                Settings.current = { ...Settings.defaults, ...parsed };
            }
        } catch (e) {
            console.warn('Failed to load settings:', e);
        }
        
        Settings.applyToUI();
    }
    
    static save() {
        try {
            localStorage.setItem('webcraft_settings', JSON.stringify(Settings.current));
        } catch (e) {
            console.warn('Failed to save settings:', e);
        }
    }
    
    static get(key) {
        return Settings.current[key] !== undefined ? Settings.current[key] : Settings.defaults[key];
    }
    
    static set(key, value) {
        Settings.current[key] = value;
    }
    
    static applyToUI() {
        // Apply settings to UI elements
        const elements = {
            'render-distance': Settings.current.render_distance,
            'fov': Settings.current.fov,
            'sensitivity': Settings.current.sensitivity,
            'music-volume': Settings.current.music_volume,
            'sfx-volume': Settings.current.sfx_volume,
            'shadow-quality': Settings.current.shadow_quality,
            'vsync': Settings.current.vsync
        };
        
        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                if (element.type === 'checkbox') {
                    element.checked = value;
                } else {
                    element.value = value;
                }
                
                // Update display value
                const display = document.getElementById(`${id}-value`);
                if (display) {
                    if (id.includes('volume')) {
                        display.textContent = value + '%';
                    } else {
                        display.textContent = value;
                    }
                }
            }
        });
    }
    
    static reset() {
        Settings.current = { ...Settings.defaults };
        Settings.save();
        Settings.applyToUI();
    }
}
