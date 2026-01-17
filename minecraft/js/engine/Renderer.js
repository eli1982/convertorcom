// Three.js Renderer
import * as THREE from 'three';

export class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.sunLight = null;
        this.moonLight = null;
        this.ambientLight = null;
        this.skyMesh = null;
    }
    
    async init() {
        // Create scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87CEEB);
        this.scene.fog = new THREE.Fog(0x87CEEB, 50, 200);
        
        // Create camera
        const fov = 70;
        const aspect = window.innerWidth / window.innerHeight;
        this.camera = new THREE.PerspectiveCamera(fov, aspect, 0.1, 1000);
        this.camera.position.set(0, 70, 0);
        
        // Create renderer
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.outputEncoding = THREE.sRGBEncoding;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1;
        
        // Handle window resize
        window.addEventListener('resize', () => this.onResize());
        
        // Create sky
        this.createSky();
    }
    
    createSky() {
        // Create gradient sky sphere
        const skyGeometry = new THREE.SphereGeometry(500, 32, 32);
        const skyMaterial = new THREE.ShaderMaterial({
            uniforms: {
                topColor: { value: new THREE.Color(0x0077ff) },
                bottomColor: { value: new THREE.Color(0x87CEEB) },
                offset: { value: 33 },
                exponent: { value: 0.6 },
                sunPosition: { value: new THREE.Vector3(0, 1, 0) }
            },
            vertexShader: `
                varying vec3 vWorldPosition;
                void main() {
                    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
                    vWorldPosition = worldPosition.xyz;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform vec3 topColor;
                uniform vec3 bottomColor;
                uniform float offset;
                uniform float exponent;
                uniform vec3 sunPosition;
                varying vec3 vWorldPosition;
                
                void main() {
                    float h = normalize(vWorldPosition + offset).y;
                    float t = max(pow(max(h, 0.0), exponent), 0.0);
                    vec3 skyColor = mix(bottomColor, topColor, t);
                    
                    // Add sun glow
                    vec3 sunDir = normalize(sunPosition);
                    vec3 viewDir = normalize(vWorldPosition);
                    float sunDot = max(dot(viewDir, sunDir), 0.0);
                    vec3 sunColor = vec3(1.0, 0.9, 0.7);
                    skyColor += sunColor * pow(sunDot, 256.0) * 2.0;
                    skyColor += sunColor * pow(sunDot, 8.0) * 0.3;
                    
                    gl_FragColor = vec4(skyColor, 1.0);
                }
            `,
            side: THREE.BackSide
        });
        
        this.skyMesh = new THREE.Mesh(skyGeometry, skyMaterial);
        this.scene.add(this.skyMesh);
    }
    
    setupLighting() {
        // Ambient light
        this.ambientLight = new THREE.AmbientLight(0x404040, 0.4);
        this.scene.add(this.ambientLight);
        
        // Sun light (directional)
        this.sunLight = new THREE.DirectionalLight(0xffffff, 1.0);
        this.sunLight.position.set(100, 200, 100);
        this.sunLight.castShadow = true;
        this.sunLight.shadow.mapSize.width = 2048;
        this.sunLight.shadow.mapSize.height = 2048;
        this.sunLight.shadow.camera.near = 0.5;
        this.sunLight.shadow.camera.far = 500;
        this.sunLight.shadow.camera.left = -100;
        this.sunLight.shadow.camera.right = 100;
        this.sunLight.shadow.camera.top = 100;
        this.sunLight.shadow.camera.bottom = -100;
        this.sunLight.shadow.bias = -0.0001;
        this.scene.add(this.sunLight);
        
        // Moon light
        this.moonLight = new THREE.DirectionalLight(0x8888ff, 0.2);
        this.moonLight.position.set(-100, 100, -100);
        this.scene.add(this.moonLight);
        
        // Hemisphere light for better ambient
        const hemiLight = new THREE.HemisphereLight(0x87CEEB, 0x444444, 0.3);
        this.scene.add(hemiLight);
    }
    
    updateCamera(player) {
        // First person view
        this.camera.position.copy(player.position);
        this.camera.position.y += player.eyeHeight;
        
        // Apply rotation from player
        this.camera.rotation.order = 'YXZ';
        this.camera.rotation.y = player.rotation.y;
        this.camera.rotation.x = player.rotation.x;
    }
    
    updateSkyColor(timeOfDay) {
        // timeOfDay is 0-1, where 0.5 is noon
        const dayProgress = timeOfDay;
        
        let topColor, bottomColor, sunIntensity, ambientIntensity;
        
        if (dayProgress < 0.25) {
            // Night to sunrise
            const t = dayProgress / 0.25;
            topColor = new THREE.Color().lerpColors(
                new THREE.Color(0x000011),
                new THREE.Color(0xff7700),
                t
            );
            bottomColor = new THREE.Color().lerpColors(
                new THREE.Color(0x000022),
                new THREE.Color(0xffaa44),
                t
            );
            sunIntensity = t * 0.5;
            ambientIntensity = 0.1 + t * 0.2;
        } else if (dayProgress < 0.5) {
            // Sunrise to noon
            const t = (dayProgress - 0.25) / 0.25;
            topColor = new THREE.Color().lerpColors(
                new THREE.Color(0xff7700),
                new THREE.Color(0x0077ff),
                t
            );
            bottomColor = new THREE.Color().lerpColors(
                new THREE.Color(0xffaa44),
                new THREE.Color(0x87CEEB),
                t
            );
            sunIntensity = 0.5 + t * 0.5;
            ambientIntensity = 0.3 + t * 0.2;
        } else if (dayProgress < 0.75) {
            // Noon to sunset
            const t = (dayProgress - 0.5) / 0.25;
            topColor = new THREE.Color().lerpColors(
                new THREE.Color(0x0077ff),
                new THREE.Color(0xff4400),
                t
            );
            bottomColor = new THREE.Color().lerpColors(
                new THREE.Color(0x87CEEB),
                new THREE.Color(0xff6644),
                t
            );
            sunIntensity = 1.0 - t * 0.5;
            ambientIntensity = 0.5 - t * 0.2;
        } else {
            // Sunset to night
            const t = (dayProgress - 0.75) / 0.25;
            topColor = new THREE.Color().lerpColors(
                new THREE.Color(0xff4400),
                new THREE.Color(0x000011),
                t
            );
            bottomColor = new THREE.Color().lerpColors(
                new THREE.Color(0xff6644),
                new THREE.Color(0x000022),
                t
            );
            sunIntensity = 0.5 - t * 0.5;
            ambientIntensity = 0.3 - t * 0.2;
        }
        
        // Update sky shader
        if (this.skyMesh) {
            this.skyMesh.material.uniforms.topColor.value = topColor;
            this.skyMesh.material.uniforms.bottomColor.value = bottomColor;
            
            // Update sun position
            const sunAngle = dayProgress * Math.PI * 2;
            const sunX = Math.cos(sunAngle) * 100;
            const sunY = Math.sin(sunAngle) * 100;
            this.skyMesh.material.uniforms.sunPosition.value.set(sunX, sunY, 0);
            
            // Update sun light position
            if (this.sunLight) {
                this.sunLight.position.set(sunX, Math.abs(sunY), 50);
                this.sunLight.intensity = sunIntensity;
            }
        }
        
        // Update ambient light
        if (this.ambientLight) {
            this.ambientLight.intensity = ambientIntensity;
        }
        
        // Update fog
        this.scene.fog.color = bottomColor;
        this.scene.background = bottomColor;
    }
    
    addToScene(object) {
        this.scene.add(object);
    }
    
    removeFromScene(object) {
        this.scene.remove(object);
    }
    
    render() {
        this.renderer.render(this.scene, this.camera);
    }
    
    onResize() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        
        this.renderer.setSize(width, height);
    }
    
    setFOV(fov) {
        this.camera.fov = fov;
        this.camera.updateProjectionMatrix();
    }
    
    dispose() {
        this.renderer.dispose();
        window.removeEventListener('resize', this.onResize);
    }
}
