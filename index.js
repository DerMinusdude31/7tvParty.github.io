// Canvas Setup
const canvas = document.getElementById('background-canvas');
const ctx = canvas.getContext('2d');

let isEmoteMode = false;
let emotes = [];
let particles = [];
let isTransitioning = false;
let transitionProgress = 0;
const TRANSITION_SPEED = 0.015;

// Neue Variable für die Richtung der Transition
let isReversing = false;

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
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

// Emote Setup
async function loadEmotes() {
    try {
        const response = await fetch('https://7tv.io/v3/emote-sets/global');
        const data = await response.json();
        emotes = data.emotes.map(emote => ({
            url: `https://cdn.7tv.app/emote/${emote.id}/2x.webp`,
            name: emote.name
        }));
        createParticles();
    } catch (error) {
        console.error('Fehler beim Laden der Emotes:', error);
    }
}

function createParticles() {
    particles = Array(50).fill().map(() => ({
        x: Math.random() * canvas.width,
        y: -10 - (Math.random() * canvas.height),
        speed: Math.random() * 2 + 0.5,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 4,
        emote: emotes[Math.floor(Math.random() * emotes.length)],
        size: Math.random() * 20 + 30
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
    particles.forEach(particle => {
        if (particle.emote && particle.emote.loaded) {
            ctx.save();
            ctx.translate(particle.x + particle.size/2, particle.y + particle.size/2);
            ctx.rotate(particle.rotation * Math.PI / 180);
            ctx.drawImage(
                particle.emote.img,
                -particle.size/2,
                -particle.size/2,
                particle.size,
                particle.size
            );
            ctx.restore();

            particle.rotation += particle.rotationSpeed;
        }
        
        particle.y += particle.speed;
        if (particle.y > canvas.height) {
            particle.y = -particle.size;
            particle.x = Math.random() * (canvas.width - particle.size);
            if (emotes.length > 0) {
                particle.emote = emotes[Math.floor(Math.random() * emotes.length)];
            }
        }
    });
}

function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
}

function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'rgb(0, 0, 0)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    if (isTransitioning) {
        const progress = easeInOutCubic(transitionProgress);
        
        // Slide-Animation
        const slideOffset = canvas.width * (1 - progress);
        
        // Zeichne den aktuellen Zustand
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, 0, canvas.width - slideOffset, canvas.height);
        ctx.clip();
        if (isEmoteMode) {
            drawEmotes();
        } else {
            drawStars();
        }
        ctx.restore();
        
        // Zeichne den vorherigen Zustand
        ctx.save();
        ctx.beginPath();
        ctx.rect(canvas.width - slideOffset, 0, slideOffset, canvas.height);
        ctx.clip();
        if (isEmoteMode) {
            drawStars();
        } else {
            drawEmotes();
        }
        ctx.restore();
        
        transitionProgress += TRANSITION_SPEED;
        if (transitionProgress >= 1) {
            isTransitioning = false;
            transitionProgress = 0;
        }
    } else {
        if (isEmoteMode) {
            drawEmotes();
        } else {
            drawStars();
        }
    }
    
    requestAnimationFrame(animate);
}

// Event Listener für den Toggle-Button
document.getElementById('toggleBackground').addEventListener('click', () => {
    const button = document.getElementById('toggleBackground');
    button.disabled = true;
    
    if (!isEmoteMode && emotes.length === 0) {
        button.querySelector('.text').textContent = 'Lade Emotes...';
        loadEmotes().then(() => {
            let loadedCount = 0;
            emotes.forEach(emote => {
                const img = new Image();
                img.onload = () => {
                    emote.loaded = true;
                    emote.img = img;
                    loadedCount++;
                    if (loadedCount === emotes.length) {
                        startTransition();
                    }
                };
                img.src = emote.url;
            });
        });
    } else {
        startTransition();
    }
});

function startTransition() {
    const button = document.getElementById('toggleBackground');
    isTransitioning = true;
    transitionProgress = 0;
    isReversing = isEmoteMode;
    isEmoteMode = !isEmoteMode;
    
    button.disabled = false;
    button.querySelector('.text').textContent = 'Hintergrund wechseln';
    button.querySelector('.icon').textContent = isEmoteMode ? '🎭' : '🌟';
}

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

    document.getElementById('helpSettings').addEventListener('click', () => {
        window.location.href = 'settings.html';
    });

    // Creator Modal
    document.getElementById('aboutCreator').addEventListener('click', () => {
        document.getElementById('creatorModal').style.display = 'flex';
    });

    document.getElementById('closeModal').addEventListener('click', () => {
        document.getElementById('creatorModal').style.display = 'none';
    });

    // AI Info Modal
    document.getElementById('aiInfoButton').addEventListener('click', () => {
        document.getElementById('aiInfoModal').style.display = 'flex';
        document.querySelector('.background-controls').style.display = 'none';
    });

    document.getElementById('closeAiInfo').addEventListener('click', () => {
        document.getElementById('aiInfoModal').style.display = 'none';
        document.querySelector('.background-controls').style.display = 'block';
    });

    // AI Warning Modal
    document.getElementById('aiWarningButton').addEventListener('click', () => {
        document.getElementById('aiWarningModal').style.display = 'flex';
        document.querySelector('.background-controls').style.display = 'none';
    });

    document.getElementById('closeAiWarning').addEventListener('click', () => {
        document.getElementById('aiWarningModal').style.display = 'none';
        document.querySelector('.background-controls').style.display = 'block';
    });

    // Global Modal Handling
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            document.getElementById('creatorModal').style.display = 'none';
            document.getElementById('aiInfoModal').style.display = 'none';
            document.getElementById('aiWarningModal').style.display = 'none';
            document.querySelector('.background-controls').style.display = 'block';
        }
    });

    // Click outside to close modals
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
                document.querySelector('.background-controls').style.display = 'block';
            }
        });
    });
});

// Start Animation
animate();