// src/canvas/goodbyecard.js
import { createCanvas, Image } from '@napi-rs/canvas';

const DEFAULT_BG_URL = 'https://files.catbox.moe/p8y6nb.jpg';
const DEFAULT_PFP_URL = 'https://i.imgur.com/bGqSIIq.jpg';

const CONFIG = {
    width: 1536,
    height: 1024,
    colors: {
        primary: '#8B0000',
        primaryLight: '#C62828',
        white: '#ffffff',
        paper: '#fdfbf7',
        textPrimary: '#4A1A1A',
        textSecondary: '#6A3A3A',
        shadow: 'rgba(139, 0, 0, 0.2)',
        shadowSoft: 'rgba(139, 0, 0, 0.15)',
    },
    fonts: {
        handwritten: '"Dancing Script", "Segoe Script", "Comic Sans MS", "Brush Script MT", cursive',
        body: '"Segoe UI", "Roboto", "Helvetica Neue", Arial, sans-serif',
        button: '"Segoe UI", "Roboto", "Helvetica Neue", Arial, sans-serif',
    },
    layout: {
        avatar: {
            cx: 320,
            cy: 512,
            radius: 180,
            outerRingWidth: 18,
            innerRingWidth: 10,
        },
        title: {
            x: 680,
            y: 330,
            fontSize: 120,
            letterSpacing: 2,
        },
        underline: {
            startX: 685,
            y: 430,
            width: 320,
            thickness: 6,
            curvature: 18,
        },
        description: {
            centerX: 1040,
            startY: 490,
            maxWidth: 680,
            lineHeight: 48,
            fontSize: 30,
        },
        button: {
            x: 770,
            y: 730,
            width: 520,
            height: 85,
            radius: 42,
            fontSize: 30,
            shadowBlur: 15,
            shadowOffsetY: 8,
        },
    },
    decorations: {
        stars: [
            { x: 140, y: 140, outerR: 65, innerR: 26, rotation: -15 },
            { x: 1420, y: 880, outerR: 55, innerR: 22, rotation: 10 },
            { x: 1500, y: 100, outerR: 35, innerR: 14, rotation: 20 },
            { x: 60, y: 920, outerR: 30, innerR: 12, rotation: -10 },
            { x: 600, y: 80, outerR: 25, innerR: 10, rotation: 5 },
            { x: 1350, y: 150, outerR: 20, innerR: 8, rotation: -25 },
        ],
        sparkles: [
            { x: 250, y: 250, length: 20, rotation: 0 },
            { x: 1450, y: 750, length: 25, rotation: 45 },
            { x: 120, y: 800, length: 18, rotation: 30 },
            { x: 700, y: 120, length: 15, rotation: 15 },
            { x: 1300, y: 950, length: 22, rotation: -20 },
        ],
        dots: [
            { x: 200, y: 180, r: 4 },
            { x: 80, y: 350, r: 3 },
            { x: 1480, y: 600, r: 5 },
            { x: 1350, y: 450, r: 3 },
            { x: 160, y: 700, r: 4 },
            { x: 500, y: 950, r: 3 },
            { x: 1100, y: 100, r: 4 },
        ],
        accentLines: [
            { x1: 100, y1: 960, x2: 200, y2: 960, thickness: 3 },
            { x1: 1350, y1: 60, x2: 1450, y2: 60, thickness: 3 },
            { x1: 1440, y1: 950, x2: 1510, y2: 950, thickness: 2 },
        ],
    },
};

const imageCache = new Map();

async function loadImage(url) {
    if (!url) return null;
    if (imageCache.has(url)) return imageCache.get(url);
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const buffer = Buffer.from(await response.arrayBuffer());
        const image = new Image();
        image.src = buffer;
        imageCache.set(url, image);
        return image;
    } catch (err) {
        console.error('loadImage failed:', url, err.message);
        return null;
    }
}

function drawBackground(ctx, w, h, bgImage) {
    ctx.save();
    if (bgImage) {
        const scale = Math.max(w / bgImage.width, h / bgImage.height);
        const x = (w - bgImage.width * scale) / 2;
        const y = (h - bgImage.height * scale) / 2;
        ctx.drawImage(bgImage, x, y, bgImage.width * scale, bgImage.height * scale);
    } else {
        ctx.fillStyle = CONFIG.colors.paper;
        ctx.fillRect(0, 0, w, h);
    }
    ctx.restore();
}

function drawCircularImage(ctx, img, cx, cy, radius) {
    if (!img) return;
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2, false);
    ctx.closePath();
    ctx.clip();

    const scale = Math.max((radius * 2) / img.width, (radius * 2) / img.height);
    const w = img.width * scale;
    const h = img.height * scale;
    const x = cx - w / 2;
    const y = cy - h / 2;
    ctx.drawImage(img, x, y, w, h);
    ctx.restore();
}

function drawAvatar(ctx, pfpImage, cfg) {
    const { cx, cy, radius, outerRingWidth, innerRingWidth } = cfg;
    const totalRadius = radius + outerRingWidth + innerRingWidth;
    ctx.save();
    ctx.shadowColor = CONFIG.colors.shadow;
    ctx.shadowBlur = 30;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 10;

    ctx.beginPath();
    ctx.arc(cx, cy, totalRadius, 0, Math.PI * 2, false);
    ctx.fillStyle = CONFIG.colors.primary;
    ctx.fill();
    ctx.shadowColor = 'transparent';

    ctx.beginPath();
    ctx.arc(cx, cy, radius + innerRingWidth, 0, Math.PI * 2, false);
    ctx.fillStyle = CONFIG.colors.white;
    ctx.fill();

    drawCircularImage(ctx, pfpImage, cx, cy, radius);
    ctx.restore();
}

function drawRoundedRect(ctx, x, y, w, h, r, fill = false, stroke = false) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
    if (fill) ctx.fill();
    if (stroke) ctx.stroke();
}

function drawUnderline(ctx, cfg) {
    const { startX, y, width, thickness, curvature } = cfg;
    const endX = startX + width;
    const midX = startX + width / 2;
    ctx.save();
    ctx.strokeStyle = CONFIG.colors.primary;
    ctx.lineWidth = thickness;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(startX, y);
    ctx.quadraticCurveTo(midX, y + curvature, endX, y - (curvature / 3));
    ctx.stroke();
    ctx.restore();
}

function drawWrappedText(ctx, text, x, startY, maxWidth, lineHeight) {
    if (!text) return 0;
    const words = text.split(' ');
    const lines = [];
    let currentLine = words[0] || '';
    for (let i = 1; i < words.length; i++) {
        const testLine = currentLine + ' ' + words[i];
        if (ctx.measureText(testLine).width > maxWidth && currentLine !== '') {
            lines.push(currentLine);
            currentLine = words[i];
        } else {
            currentLine = testLine;
        }
    }
    lines.push(currentLine);

    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    lines.forEach((line, idx) => {
        ctx.fillText(line, x, startY + idx * lineHeight);
    });
    ctx.restore();
    return lines.length * lineHeight;
}

function drawButton(ctx, text, cfg) {
    const { x, y, width, height, radius, fontSize, shadowBlur, shadowOffsetY } = cfg;
    const displayText = text || ' See You Next Time! ';
    ctx.save();
    ctx.shadowColor = CONFIG.colors.shadowSoft;
    ctx.shadowBlur = shadowBlur;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = shadowOffsetY;
    ctx.fillStyle = CONFIG.colors.primary;
    drawRoundedRect(ctx, x, y, width, height, radius, true, false);
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.fillStyle = CONFIG.colors.white;
    ctx.font = `bold ${fontSize}px ${CONFIG.fonts.button}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(displayText, x + width / 2, y + height / 2);
    ctx.restore();
}

function drawFivePointStar(ctx, cx, cy, outerR, innerR, rotation = 0) {
    const rot = (rotation * Math.PI) / 180;
    const step = Math.PI / 5;
    ctx.save();
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
        const r = i % 2 === 0 ? outerR : innerR;
        const angle = i * step - Math.PI / 2 + rot;
        const x = cx + Math.cos(angle) * r;
        const y = cy + Math.sin(angle) * r;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fillStyle = CONFIG.colors.primary;
    ctx.fill();
    ctx.restore();
}

function drawStars(ctx, stars) {
    stars.forEach(star => drawFivePointStar(ctx, star.x, star.y, star.outerR, star.innerR, star.rotation));
}

function drawFourPointSparkle(ctx, cx, cy, length, rotation = 0) {
    const rot = (rotation * Math.PI) / 180;
    const innerLength = length * 0.2;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rot);
    ctx.beginPath();
    ctx.moveTo(0, -length);
    ctx.quadraticCurveTo(innerLength, -innerLength, length, 0);
    ctx.quadraticCurveTo(innerLength, innerLength, 0, length);
    ctx.quadraticCurveTo(-innerLength, innerLength, -length, 0);
    ctx.quadraticCurveTo(-innerLength, -innerLength, 0, -length);
    ctx.closePath();
    ctx.fillStyle = CONFIG.colors.primaryLight;
    ctx.fill();
    ctx.restore();
}

function drawSparkles(ctx, sparkles) {
    sparkles.forEach(sparkle => drawFourPointSparkle(ctx, sparkle.x, sparkle.y, sparkle.length, sparkle.rotation));
}

function drawDots(ctx, dots) {
    ctx.save();
    ctx.fillStyle = CONFIG.colors.primary;
    dots.forEach(dot => {
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, dot.r, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.restore();
}

function drawAccentLines(ctx, lines) {
    ctx.save();
    ctx.strokeStyle = CONFIG.colors.primaryLight;
    ctx.lineCap = 'round';
    lines.forEach(line => {
        ctx.lineWidth = line.thickness;
        ctx.beginPath();
        ctx.moveTo(line.x1, line.y1);
        ctx.lineTo(line.x2, line.y2);
        ctx.stroke();
    });
    ctx.restore();
}

function render(ctx, options, config, bgImage, pfpImage) {
    const { width, height, layout, decorations } = config;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    drawBackground(ctx, width, height, bgImage);
    drawStars(ctx, decorations.stars);
    drawSparkles(ctx, decorations.sparkles);
    drawDots(ctx, decorations.dots);
    drawAccentLines(ctx, decorations.accentLines);

    drawAvatar(ctx, pfpImage, layout.avatar);

    ctx.save();
    ctx.fillStyle = CONFIG.colors.primary;
    ctx.font = `bold ${layout.title.fontSize}px ${CONFIG.fonts.handwritten}`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText('Goodbye', layout.title.x, layout.title.y);
    ctx.restore();

    drawUnderline(ctx, layout.underline);

    ctx.save();
    ctx.fillStyle = CONFIG.colors.textSecondary;
    ctx.font = `${layout.description.fontSize}px ${CONFIG.fonts.body}`;
    drawWrappedText(
        ctx,
        options.description || 'Semoga kita bertemu lagi! Sampai jumpa.',
        layout.description.centerX,
        layout.description.startY,
        layout.description.maxWidth,
        layout.description.lineHeight
    );
    ctx.restore();

    drawButton(ctx, options.buttonText, layout.button);
}

export async function generateGoodbyeCard(options = {}) {
    const backgroundUrl = options.backgroundURL || DEFAULT_BG_URL;
    const profileUrl = options.profile || DEFAULT_PFP_URL;

    const buttonText = options.groupName
        ? `❤ See You Later in ${options.groupName}! ❤`
        : '❤ See You Next Time! ❤';

    const outputW = options.outputWidth || CONFIG.width;
    const outputH = options.outputHeight || CONFIG.height;
    const scaleX = outputW / CONFIG.width;
    const scaleY = outputH / CONFIG.height;

    const [bgImage, pfpImage] = await Promise.all([
        loadImage(backgroundUrl),
        loadImage(profileUrl)
    ]);

    const canvas = createCanvas(outputW, outputH);
    const ctx = canvas.getContext('2d');
    ctx.scale(scaleX, scaleY);

    render(ctx, { ...options, buttonText }, CONFIG, bgImage, pfpImage);
    return canvas.toBuffer('image/png');
}