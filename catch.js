// Canvas Setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Hintergrund-Canvas
const bgCanvas = document.createElement('canvas');
const bgCtx = bgCanvas.getContext('2d');
document.body.insertBefore(bgCanvas, document.body.firstChild);
bgCanvas.id = 'background-canvas';

// Hintergrund-Canvas Größe anpassen
function resizeBgCanvas() {
    bgCanvas.width = window.innerWidth;
    bgCanvas.height = window.innerHeight;
}

window.addEventListener('resize', resizeBgCanvas);
resizeBgCanvas();

// Sterne für den Hintergrund
let stars = Array(120).fill().map(() => ({
    x: Math.random() * bgCanvas.width,
    y: -10 - (Math.random() * bgCanvas.height),
    speed: Math.random() * 2 + 0.5,
    size: Math.random() * 1.5 + 0.5
}));

// Hintergrund-Animation
function animateBackground() {
    bgCtx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);
    bgCtx.fillStyle = 'rgb(0, 0, 0)';
    bgCtx.fillRect(0, 0, bgCanvas.width, bgCanvas.height);
    
    bgCtx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    stars.forEach(star => {
        bgCtx.beginPath();
        bgCtx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        bgCtx.fill();
        
        star.y += star.speed;
        if (star.y > bgCanvas.height) {
            star.y = -10;
            star.x = Math.random() * bgCanvas.width;
            star.speed = Math.random() * 2 + 0.5;
        }
    });
    
    requestAnimationFrame(animateBackground);
}

// Starte die Hintergrund-Animation
animateBackground();

let emotes = [];
let player = null;
let fallingEmotes = [];
let score = 0;
let lives = 3;
let highscore = localStorage.getItem('catchHighscore') || 0;
let gameLoop = null;
let gameStarted = false;

let gameSettings = {
    difficulty: 'normal',
    platformSize: 100,
    platformSpeed: 10,
    emoteSetId: 'global',
    spawnRate: 0.02,
    emoteSpeed: 1.5,
    level: 1,
    maxLevel: 20,
    speedIncreasePerLevel: 0.1,
    spawnRateIncreasePerLevel: 0.001,
    powerupChance: 0.005,
    scoreMultiplier: 1
};

let powerups = [];

// Füge diese Variable am Anfang hinzu
let lastScore = 0;
let currentLevel = 1;

// Player
class Player {
    constructor() {
        this.width = gameSettings.platformSize;
        this.height = 20;
        this.x = canvas.width / 2 - this.width / 2;
        this.y = canvas.height - 30;
        this.speed = gameSettings.platformSpeed;
        this.color = '#4CAF50';
        this.powerupActive = false;
    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 15;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.shadowBlur = 0;
    }

    move(keys) {
        if (keys.ArrowLeft || keys.a) this.x = Math.max(0, this.x - this.speed);
        if (keys.ArrowRight || keys.d) this.x = Math.min(canvas.width - this.width, this.x + this.speed);
    }
}

// Falling Emote
class FallingEmote {
    constructor() {
        this.size = 48;
        this.x = Math.random() * (canvas.width - this.size);
        this.y = -this.size;
        this.speed = Math.random() * 0.8 + gameSettings.emoteSpeed;
        this.emote = emotes[Math.floor(Math.random() * emotes.length)];
        this.img = null;
        this.loadImage();
    }

    loadImage() {
        this.img = new Image();
        this.img.src = this.emote.url;
    }

    draw() {
        if (this.img) {
            ctx.drawImage(this.img, this.x, this.y, this.size, this.size);
        }
    }

    move() {
        this.y += this.speed;
        
        // Kollision mit Player
        if (this.y + this.size > player.y && 
            this.x + this.size > player.x && 
            this.x < player.x + player.width) {
            // Berücksichtige den Score-Multiplikator
            const points = gameSettings.scoreMultiplier;
            score += points;
            document.getElementById('score').textContent = score;
            if (score > highscore) {
                highscore = score;
                localStorage.setItem('catchHighscore', highscore);
                document.getElementById('highscore').textContent = highscore;
            }
            return true;
        }
        
        // Verpasstes Emote
        if (this.y > canvas.height) {
            lives--;
            document.getElementById('lives').textContent = lives;
            if (lives <= 0) {
                lives = 0;
                document.getElementById('lives').textContent = lives;
                gameOver();
            }
            return true;
        }
        
        return false;
    }
}

// Vereinfachte Powerup-Klasse
class Powerup {
    constructor() {
        this.size = 30;
        this.x = Math.random() * (canvas.width - this.size);
        this.y = -this.size;
        this.speed = 2;
        this.type = this.getRandomType();
        this.color = this.getColorForType();
        this.active = false;
    }

    getRandomType() {
        // Neue, simplere Powerups
        const types = ['extraLife', 'slowdown', 'doublePoints'];
        return types[Math.floor(Math.random() * types.length)];
    }

    getColorForType() {
        const colors = {
            extraLife: '#ff4444',    // Rot für Extra Leben
            slowdown: '#4444ff',     // Blau für Verlangsamung
            doublePoints: '#44ff44'  // Grün für Doppelte Punkte
        };
        return colors[this.type];
    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x + this.size/2, this.y + this.size/2, this.size/2, 0, Math.PI * 2);
        ctx.fill();
    }

    move() {
        this.y += this.speed;
        
        if (this.y + this.size > player.y && 
            this.x + this.size > player.x && 
            this.x < player.x + player.width) {
            this.applyPowerup();
            return true;
        }
        
        return this.y > canvas.height;
    }

    applyPowerup() {
        switch(this.type) {
            case 'extraLife':
                lives++;
                document.getElementById('lives').textContent = lives;
                showPowerupNotification('❤️ Extra Leben!');
                break;

            case 'slowdown':
                // Verlangsame NEUE fallende Emotes für 10 Sekunden
                const originalSpeed = gameSettings.emoteSpeed;
                gameSettings.emoteSpeed *= 0.5;
                showPowerupNotification('🐌 Verlangsamung Aktiv!');
                
                setTimeout(() => {
                    gameSettings.emoteSpeed = originalSpeed;
                    showPowerupNotification('🏃 Normale Geschwindigkeit!');
                }, 10000);
                break;

            case 'doublePoints':
                // Doppelte Punkte für 10 Sekunden
                gameSettings.scoreMultiplier *= 2;
                showPowerupNotification('✨ Doppelte Punkte Aktiv!');
                
                setTimeout(() => {
                    gameSettings.scoreMultiplier /= 2;
                    showPowerupNotification('💫 Normale Punkte!');
                }, 10000);
                break;
        }
    }
}

// Funktion für Powerup-Benachrichtigungen
function showPowerupNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'powerup-notification';
    notification.textContent = message;
    document.body.appendChild(notification);

    // Animation für das Erscheinen
    notification.style.opacity = '0';
    notification.style.transform = 'translateY(20px)';
    
    setTimeout(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translateY(0)';
    }, 10);

    // Entferne nach 2 Sekunden mit Animation
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateY(-20px)';
        setTimeout(() => notification.remove(), 300);
    }, 2000);
}

// Game Controls
const keys = {};
document.addEventListener('keydown', e => keys[e.key] = true);
document.addEventListener('keyup', e => keys[e.key] = false);

function gameUpdate() {
    if (gameStarted || fallingEmotes.length > 0) {
        // Clear canvas und zeichne den Hintergrund
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'rgb(0, 0, 0)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Zeichne den Player
        player.move(keys);
        player.draw();

        // Emotes spawnen und bewegen
        if (gameStarted && Math.random() < gameSettings.spawnRate) {
            fallingEmotes.push(new FallingEmote());
        }

        // Update und zeichne alle fallenden Emotes
        fallingEmotes = fallingEmotes.filter(emote => {
            emote.draw();
            return !emote.move();
        });

        // Powerups spawnen und bewegen
        if (gameStarted && Math.random() < 0.005) {
            powerups.push(new Powerup());
        }

        powerups = powerups.filter(powerup => {
            powerup.draw();
            return !powerup.move();
        });

        // Level-System - Nur prüfen wenn sich der Score geändert hat
        if (score !== lastScore) {
            checkLevelUp();
            lastScore = score;
        }

        gameLoop = requestAnimationFrame(gameUpdate);
    } else {
        if (!document.querySelector('.game-over-box')) {
            showGameOver();
        }
    }
}

function gameOver() {
    cancelAnimationFrame(gameLoop);
    gameStarted = false;
    // Warte bis alle Emotes den Boden erreicht haben
    if (fallingEmotes.length === 0) {
        showGameOver();
    } else {
        // Starte die Animation wieder für die verbleibenden Emotes
        gameLoop = requestAnimationFrame(gameUpdate);
    }
}

function showGameOver() {
    // Game Over Box anzeigen
    const gameOverBox = document.createElement('div');
    gameOverBox.className = 'game-over-box';
    gameOverBox.innerHTML = `
        <h2>Spiel vorbei!</h2>
        <div class="score-info">
            <p>Score: ${score}</p>
            <p>Highscore: ${highscore}</p>
            <p>Level erreicht: ${gameSettings.level}</p>
        </div>
        <div class="game-over-buttons">
            <button id="restartGame" class="menu-button">
                <span class="icon">🔄</span>
                <span class="text">Neustarten</span>
            </button>
            <button id="backToMenuFromGame" class="menu-button">
                <span class="icon">🏠</span>
                <span class="text">Zum Menü</span>
            </button>
        </div>
    `;
    document.body.appendChild(gameOverBox);
    
    // Event Listener für die Buttons
    document.getElementById('restartGame').addEventListener('click', () => {
        document.body.removeChild(gameOverBox);
        fallingEmotes = [];
        powerups = [];
        startGame();
    });
    
    document.getElementById('backToMenuFromGame').addEventListener('click', () => {
        window.location.href = 'index.html';
    });
}

function startGame() {
    if (!gameStarted) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        gameStarted = true;
        score = 0;
        lastScore = 0;
        currentLevel = 1;
        lives = 5;
        gameSettings.level = 1;
        gameSettings.spawnRate = 0.01;
        gameSettings.emoteSpeed = 1.2;
        
        document.getElementById('score').textContent = score;
        document.getElementById('lives').textContent = lives;
        document.getElementById('highscore').textContent = highscore;
        document.getElementById('level').textContent = gameSettings.level;
        
        fallingEmotes = [];
        powerups = [];
        player = new Player();
        gameLoop = requestAnimationFrame(gameUpdate);
    }
}

// Load Emotes
async function loadEmotes() {
    try {
        const response = await fetch('https://7tv.io/v3/emote-sets/global');
        const data = await response.json();
        emotes = data.emotes.map(emote => ({
            url: `https://cdn.7tv.app/emote/${emote.id}/2x.webp`,
            name: emote.name
        }));
        
        document.getElementById('loading').style.display = 'none';
        initGame();
    } catch (error) {
        console.error('Fehler beim Laden der Emotes:', error);
        document.getElementById('loading').textContent = 
            'Fehler beim Laden der Emotes. Bitte Seite neu laden.';
    }
}

function initGame() {
    resizeCanvas();
    player = new Player();
    
    // Start Screen mit halbtransparentem Hintergrund
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = 'white';
    ctx.font = '48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Emote Catcher', canvas.width/2, canvas.height/2 - 50);
    ctx.font = '24px Arial';
    ctx.fillText('Drücke Leertaste zum Starten', canvas.width/2, canvas.height/2 + 50);
    
    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space' && !gameStarted) {
            startGame();
        }
    });
}

// Navigation
document.getElementById('backToMenu').addEventListener('click', () => {
    window.location.href = 'index.html';
});

// Einstellungen-Toggle
document.getElementById('toggleSettings').addEventListener('click', () => {
    const settings = document.getElementById('settings');
    settings.style.display = settings.style.display === 'none' ? 'block' : 'none';
});

// Einstellungen anwenden
document.getElementById('applySettings').addEventListener('click', () => {
    gameSettings.difficulty = document.getElementById('difficulty').value;
    gameSettings.platformSize = parseInt(document.getElementById('platformSize').value);
    gameSettings.platformSpeed = parseInt(document.getElementById('platformSpeed').value);
    gameSettings.emoteSetId = document.getElementById('emoteSetId').value;

    // Schwierigkeitsgrad-Anpassungen
    switch(gameSettings.difficulty) {
        case 'easy':
            gameSettings.spawnRate = 0.02;
            gameSettings.emoteSpeed = 1.5;
            break;
        case 'hard':
            gameSettings.spawnRate = 0.04;
            gameSettings.emoteSpeed = 3;
            break;
        default:
            gameSettings.spawnRate = 0.03;
            gameSettings.emoteSpeed = 2;
    }

    // Neues Spiel starten
    if (gameStarted) {
        gameOver();
        startGame();
    }

    document.getElementById('settings').style.display = 'none';
});

// Start Game
loadEmotes();

function makeDraggable() {
    const draggables = [
        // Keine beweglichen Elemente im Catcher-Modus
    ];

    draggables.forEach(element => {
        if (!element) return;
        
        element.classList.add('draggable');
        
        // Lade gespeicherte Position
        const savedPos = localStorage.getItem(`${element.id}_position`);
        if (savedPos) {
            const [x, y] = JSON.parse(savedPos);
            element.style.left = `${x}px`;
            element.style.top = `${y}px`;
        }

        let isDragging = false;
        let currentX;
        let currentY;
        let initialX;
        let initialY;

        element.addEventListener('mousedown', dragStart);
        document.addEventListener('mousemove', drag);
        document.addEventListener('mouseup', dragEnd);

        function dragStart(e) {
            initialX = e.clientX - element.offsetLeft;
            initialY = e.clientY - element.offsetTop;

            if (e.target === element) {
                isDragging = true;
                element.classList.add('dragging');
            }
        }

        function drag(e) {
            if (!isDragging) return;

            e.preventDefault();

            currentX = e.clientX - initialX;
            currentY = e.clientY - initialY;

            // Begrenze die Position innerhalb des Fensters
            currentX = Math.max(0, Math.min(currentX, window.innerWidth - element.offsetWidth));
            currentY = Math.max(0, Math.min(currentY, window.innerHeight - element.offsetHeight));

            element.style.left = `${currentX}px`;
            element.style.top = `${currentY}px`;
        }

        function dragEnd(e) {
            if (!isDragging) return;

            initialX = currentX;
            initialY = currentY;

            // Speichere die Position
            localStorage.setItem(`${element.id}_position`, JSON.stringify([currentX, currentY]));

            isDragging = false;
            element.classList.remove('dragging');
        }
    });
}

function addResetPositionsButton() {
    const settingsDiv = document.getElementById('settings');
    const resetButton = document.createElement('button');
    resetButton.textContent = 'Positionen zurücksetzen';
    resetButton.style.marginTop = '10px';
    resetButton.style.width = '100%';
    resetButton.style.padding = '10px';
    resetButton.style.background = '#ff5252';
    resetButton.style.color = 'white';
    resetButton.style.border = 'none';
    resetButton.style.borderRadius = '4px';
    resetButton.style.cursor = 'pointer';

    resetButton.addEventListener('click', () => {
        const elements = {
            'gameInfo': { top: '20px', right: '20px', left: 'auto' },
            'gameControls': { bottom: '40px', left: '50%', transform: 'translateX(-50%)' },
            'backToMenu': { top: '20px', left: '20px' },
            'toggleSettings': { top: '20px', left: '100px' }
        };

        Object.entries(elements).forEach(([id, pos]) => {
            const element = document.getElementById(id);
            if (element) {
                Object.entries(pos).forEach(([prop, value]) => {
                    element.style[prop] = value;
                });
                localStorage.removeItem(`${id}_position`);
            }
        });
    });

    settingsDiv.appendChild(resetButton);
}

document.addEventListener('DOMContentLoaded', () => {
    makeDraggable();
    addResetPositionsButton();
});

function checkLives() {
    if (lives <= 0) {
        lives = 0;  // Verhindere negative Leben
        document.getElementById('lives').textContent = lives;
        gameOver();
        return false;
    }
    return true;
}

function checkCollision(emote, player) {
    return emote.y + emote.size > player.y && 
           emote.x + emote.size > player.x && 
           emote.x < player.x + player.width &&
           emote.y < player.y + player.height;
}

function addScore() {
    const basePoints = 100;
    const levelMultiplier = gameSettings.scoreMultiplier;
    const speedBonus = Math.floor(gameSettings.emoteSpeed * 10);
    
    const points = Math.floor(basePoints * levelMultiplier) + speedBonus;
    score += points;
    
    // Visuelles Feedback
    showScoreAnimation(points);
    document.getElementById('score').textContent = score;
    
    if (score > highscore) {
        highscore = score;
        localStorage.setItem('catchHighscore', highscore);
        document.getElementById('highscore').textContent = highscore;
        showNewHighscoreAnimation();
    }
}

function showLevelUpAnimation() {
    const levelDisplay = document.getElementById('level');
    levelDisplay.classList.add('level-up');
    setTimeout(() => levelDisplay.classList.remove('level-up'), 1000);
}

function showPowerupAnimation(type) {
    const powerupDisplay = document.createElement('div');
    powerupDisplay.className = 'powerup-notification';
    powerupDisplay.textContent = `${getPowerupEmoji(type)} Powerup!`;
    document.body.appendChild(powerupDisplay);
    setTimeout(() => powerupDisplay.remove(), 2000);
}

function showScoreAnimation(points) {
    const scorePopup = document.createElement('div');
    scorePopup.className = 'score-popup';
    scorePopup.textContent = `+${points}`;
    document.body.appendChild(scorePopup);
    setTimeout(() => scorePopup.remove(), 1000);
}

function getPowerupEmoji(type) {
    const emojis = {
        size: '🔄',
        speed: '🚀',
        shield: '🛡️',
        multiplier: '✖️'
    };
    return emojis[type] || '❓';
}

function showNewHighscoreAnimation() {
    const highscoreDisplay = document.getElementById('highscore');
    highscoreDisplay.classList.add('new-highscore');
    setTimeout(() => highscoreDisplay.classList.remove('new-highscore'), 1000);
}

// Füge diese Funktion wieder hinzu
function resizeCanvas() {
    // Begrenztes Spielfeld
    canvas.width = Math.min(800, window.innerWidth);
    canvas.height = Math.min(600, window.innerHeight);
    
    // Zentriere das Canvas
    canvas.style.position = 'absolute';
    canvas.style.left = '50%';
    canvas.style.top = '50%';
    canvas.style.transform = 'translate(-50%, -50%)';
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Neue Funktion für Level-Up Prüfung
function checkLevelUp() {
    const newLevel = Math.floor(score / 10) + 1;
    if (newLevel > currentLevel) {
        currentLevel = newLevel;
        gameSettings.level = currentLevel;
        gameSettings.spawnRate = Math.min(0.025, 0.01 + (currentLevel - 1) * 0.002);
        gameSettings.emoteSpeed = Math.min(2.5, 1.2 + (currentLevel - 1) * 0.1);
        document.getElementById('level').textContent = currentLevel;
    }
}
  