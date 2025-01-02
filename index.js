// Canvas Setup
const canvas = document.getElementById('background-canvas');
const ctx = canvas.getContext('2d');

let isEmoteMode = false;
let emotes = [];
let particles = [];
let isTransitioning = false;
let transitionProgress = 0;
const TRANSITION_SPEED = 0.008;

// Neue Variable für die Richtung der Transition
let isReversing = false;

let currentBackground = 'stars'; // Standard-Hintergrund
let matrix = [];

// Definiere die verfügbaren Hintergründe
const backgrounds = {
    stars: {
        name: 'Sterne',
        icon: '✨',
        draw: drawStars
    },
    matrix: {
        name: 'Matrix',
        icon: '👾',
        draw: drawMatrix
    },
    rainbow: {
        name: 'Regenbogen',
        icon: '🌈',
        draw: drawRainbow
    },
    particles: {
        name: 'Partikel',
        icon: '🎨',
        draw: drawParticles
    }
};

// Füge diese Variablen am Anfang hinzu
let rainbowGradient = {
    hue: 0,
    colors: [],
    speed: 0.5
};

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    // Matrix-Array initialisieren
    matrix = Array(Math.ceil(canvas.width / 20)).fill(0);
    ctx.fillStyle = 'rgb(0, 0, 0)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Sterne für den Hintergrund
let stars = Array(120).fill().map(() => ({
    x: Math.random() * canvas.width,
    y: -10 - (Math.random() * canvas.height),
    speed: Math.random() * 2 + 0.5,
    size: Math.random() * 1.5 + 0.5
}));

// Event Listeners für Navigation und Modals
document.addEventListener('DOMContentLoaded', () => {
    // Navigation
    document.getElementById('classicMode').addEventListener('click', () => {
        window.location.href = 'classic.html';
    });

    document.getElementById('guessMode').addEventListener('click', () => {
        window.location.href = 'guess.html';
    });

    document.getElementById('memoryMode').addEventListener('click', () => {
        window.location.href = 'memory.html';
    });

    document.getElementById('catchMode').addEventListener('click', () => {
        window.location.href = 'catch.html';
    });

    document.getElementById('pongMode').addEventListener('click', () => {
        window.location.href = 'pong.html';
    });

    document.getElementById('casinoMode').addEventListener('click', () => {
        window.location.href = 'casino.html';
    });

    // Patch Notes Modal
    document.getElementById('patchNotesButton').addEventListener('click', () => {
        document.getElementById('patchNotesModal').style.display = 'flex';
        document.getElementById('patchNotesModal').style.opacity = '1';
        document.getElementById('patchNotesModal').style.visibility = 'visible';
    });

    document.getElementById('closePatchNotes').addEventListener('click', () => {
        document.getElementById('patchNotesModal').style.display = 'none';
        document.getElementById('patchNotesModal').style.opacity = '0';
        document.getElementById('patchNotesModal').style.visibility = 'hidden';
    });

    document.getElementById('helpSettings').addEventListener('click', () => {
        document.getElementById('settingsModal').style.display = 'flex';
        document.getElementById('settingsModal').style.opacity = '1';
        document.getElementById('settingsModal').style.visibility = 'visible';
        document.querySelector('.background-controls').style.display = 'none';
    });

    // Creator Modal
    document.getElementById('aboutCreator').addEventListener('click', () => {
        document.getElementById('creatorModal').style.display = 'flex';
        document.getElementById('creatorModal').style.opacity = '1';
        document.getElementById('creatorModal').style.visibility = 'visible';
        document.querySelector('.background-controls').style.display = 'none';
    });

    // ... rest of the existing event listeners ...
});

// Emote Setup
async function loadEmotes() {
    try {
        const response = await fetch('https://7tv.io/v3/emote-sets/global');
        const data = await response.json();
        emotes = data.emotes.map(emote => {
            const img = new Image();
            img.src = `https://cdn.7tv.app/emote/${emote.id}/2x.webp`;
            return {
                url: `https://cdn.7tv.app/emote/${emote.id}/2x.webp`,
                name: emote.name,
                img: img
            };
        });
        createParticles();
    } catch (error) {
        console.error('Fehler beim Laden der Emotes:', error);
    }
}

function createParticles() {
    particles = Array(30).fill().map(() => ({
        x: Math.random() * canvas.width,
        y: -10 - (Math.random() * canvas.height),
        speed: Math.random() * 1.5 + 0.5,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 2,
        emote: emotes[Math.floor(Math.random() * emotes.length)],
        size: Math.random() * 20 + 40
    }));
}

function drawStars() {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    stars.forEach(star => {
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
        
        star.y += star.speed;
        if (star.y > canvas.height) {
            star.y = -10;
            star.x = Math.random() * canvas.width;
            star.speed = Math.random() * 2 + 0.5;
        }
    });
}

function drawEmotes() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    particles.forEach(particle => {
        if (particle.emote && particle.emote.img) {
            ctx.save();
            ctx.translate(particle.x + particle.size/2, particle.y + particle.size/2);
            ctx.rotate(particle.rotation * Math.PI / 180);
            
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            
            ctx.drawImage(
                particle.emote.img,
                -particle.size/2,
                -particle.size/2,
                particle.size,
                particle.size
            );
            ctx.restore();

            particle.rotation += particle.rotationSpeed;
            particle.y += particle.speed;

            if (particle.y > canvas.height + particle.size) {
                particle.y = -particle.size;
                particle.x = Math.random() * (canvas.width - particle.size);
                particle.emote = emotes[Math.floor(Math.random() * emotes.length)];
                particle.speed = Math.random() * 1.5 + 0.5;
            }
        }
    });
}

function drawMatrix() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = '#0F0';
    ctx.font = '15px monospace';
    
    matrix.forEach((y, i) => {
        const char = String.fromCharCode(Math.random() * 128);
        const x = i * 20;
        ctx.fillText(char, x, y);
        
        if (y > canvas.height && Math.random() > 0.975) {
            matrix[i] = 0;
        } else {
            matrix[i] += 20;
        }
    });
}

function drawRainbow() {
    // Aktualisiere die Farben
    rainbowGradient.hue = (rainbowGradient.hue + rainbowGradient.speed) % 360;
    
    // Erstelle einen Farbverlauf
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    
    // Füge mehrere Farbstopps hinzu für einen flüssigeren Übergang
    for (let i = 0; i <= 8; i++) {
        const hue = (rainbowGradient.hue + (i * 45)) % 360;
        gradient.addColorStop(i/8, `hsla(${hue}, 70%, 50%, 0.1)`);
    }
    
    // Zeichne den Hintergrund mit Fade-Effekt
    ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Zeichne den Regenbogen-Effekt
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Sanfterer Glitzer-Effekt
    if (Math.random() > 0.95) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const size = Math.random() * 1.5 + 0.5;
        
        const glow = ctx.createRadialGradient(x, y, 0, x, y, size * 2);
        glow.addColorStop(0, `hsla(${Math.random() * 360}, 100%, 80%, 0.3)`);
        glow.addColorStop(1, 'rgba(255, 255, 255, 0)');
        
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(x, y, size * 2, 0, Math.PI * 2);
        ctx.fill();
    }
}

function drawParticles() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    particles.forEach(p => {
        ctx.beginPath();
        ctx.fillStyle = `hsl(${p.hue}, 50%, 50%)`;
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        
        p.x += p.vx;
        p.y += p.vy;
        p.hue = (p.hue + 1) % 360;
        
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
    });
}

function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'rgb(0, 0, 0)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    switch(currentBackground) {
        case 'stars':
            drawStars();
            break;
        case 'emotes':
            drawEmotes();
            break;
        case 'rainbow':
            drawRainbow();
            break;
        default:
            drawStars();
    }
    
    requestAnimationFrame(animate);
}

// Start Animation
animate();