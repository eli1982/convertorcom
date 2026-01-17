

export function createNoiseTexture(width: number, height: number, color: string, noiseAlpha: number = 0.2): string {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    // Base Color
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, width, height);

    // Noise
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
        const noise = (Math.random() - 0.5) * 255 * noiseAlpha;
        data[i] = Math.max(0, Math.min(255, data[i] + noise));
        data[i+1] = Math.max(0, Math.min(255, data[i+1] + noise));
        data[i+2] = Math.max(0, Math.min(255, data[i+2] + noise));
    }
    ctx.putImageData(imageData, 0, 0);
    return canvas.toDataURL();
}

export function createBrickTexture(): string {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    ctx.fillStyle = '#a05544';
    ctx.fillRect(0, 0, 512, 512);
    
    ctx.fillStyle = '#803322';
    const brickH = 32;
    const brickW = 64;
    
    for(let y=0; y<512; y+=brickH) {
        const offset = (y/brickH) % 2 === 0 ? 0 : brickW/2;
        for(let x=-brickW; x<512; x+=brickW) {
            ctx.fillRect(x + offset + 2, y + 2, brickW - 4, brickH - 4);
        }
    }
    return canvas.toDataURL();
}

export function createSpotTexture(): string {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';
    
    // Soft radial gradient for fake light pool
    const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 60);
    grad.addColorStop(0, 'rgba(255, 220, 180, 0.6)'); // Bright warm center
    grad.addColorStop(0.4, 'rgba(255, 200, 150, 0.2)');
    grad.addColorStop(1, 'rgba(255, 200, 150, 0)'); // Fade to transparent
    
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 128, 128);
    return canvas.toDataURL();
}

export const TEXTURE_URLS = {
    grass: createNoiseTexture(512, 512, '#3a7e3a', 0.3),
    rail: createNoiseTexture(512, 512, '#ffffff', 0.15),
    asphalt: createNoiseTexture(512, 512, '#111', 1),
    brick: createBrickTexture(),
    generic: createNoiseTexture(128, 128, '#cccccc', 0.1),
    spot: createSpotTexture(),
};