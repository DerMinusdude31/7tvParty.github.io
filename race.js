// Canvas Setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let emote = null;
let obstacles = [];
let score = 0;
let highscore = localStorage.getItem('raceHighscore') || 0;
let gameLoop = null;
let gameStarted = false;

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Spieler-Emote
class Player {
    constructor(x, y, size) {
        this.x = x;
        this.y = y;
        this.size = size;
        this.speed = 8;
        this.img = null;
    }

    draw() {
        if (this.img) {
            ctx.drawImage(this.img, this.x, this.y, this.size, this.size);
        }
    }

    move(keys) {
        if (keys.ArrowLeft || keys.a) this.x = Math.max(0, this.x - this.speed);
        if (keys.ArrowRight || keys.d) this.x = Math.min(canvas.width - this.size, this.x + this.speed);
        this.y = canvas.height - 100;
    }

    collidesWith(obstacle) {
        return this.x < obstacle.x + obstacle.width &&
               this.x + this.size > obstacle.x &&
               this.y < obstacle.y + obstacle.height &&
               this.y + this.size > obstacle.y;
    }
}

// Hindernisse
class Obstacle {
    constructor() {
        this.width = 100;
        this.height = 20;
        this.x = Math.random() * (canvas.width - this.width);
        this.y = -this.height;
        this.speed = Math.random() * 1 + 3;
        this.color = `hsl(${Math.random() * 360}, 70%, 50%)`;
    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 10;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.shadowBlur = 0;
    }

    move() {
        this.y += this.speed;
        return this.y > canvas.height;
    }
}

// Spielsteuerung
const keys = {};
document.addEventListener('keydown', e => keys[e.key] = true);
document.addEventListener('keyup', e => keys[e.key] = false);

// Spiel-Loop
function gameUpdate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'rgb(0, 0, 0)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Spieler bewegen und zeichnen
    player.move(keys);
    player.draw();

    // Hindernisse verwalten
    if (Math.random() < 0.05) {
        obstacles.push(new Obstacle());
    }

    obstacles = obstacles.filter(obstacle => {
        obstacle.draw();
        if (obstacle.move()) {
            score++;
            document.getElementById('score').textContent = score;
            if (score > highscore) {
                highscore = score;
                localStorage.setItem('raceHighscore', highscore);
                document.getElementById('highscore').textContent = highscore;
            }
            return false;
        }
        if (player.collidesWith(obstacle)) {
            gameOver();
            return false;
        }
        return true;
    });

    gameLoop = requestAnimationFrame(gameUpdate);
}

function gameOver() {
    cancelAnimationFrame(gameLoop);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = 'white';
    ctx.font = '48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over!', canvas.width/2, canvas.height/2 - 50);
    ctx.font = '24px Arial';
    ctx.fillText(`Score: ${score}`, canvas.width/2, canvas.height/2 + 10);
    ctx.fillText('Drücke Leertaste zum Neustarten', canvas.width/2, canvas.height/2 + 50);
    
    gameStarted = false;
}

function startGame() {
    if (!gameStarted) {
        gameStarted = true;
        score = 0;
        document.getElementById('score').textContent = score;
        document.getElementById('highscore').textContent = highscore;
        obstacles = [];
        player = new Player(canvas.width/2, canvas.height - 100, 50);
        gameLoop = requestAnimationFrame(gameUpdate);
    }
}

// Emote laden
async function loadEmote() {
    try {
        const response = await fetch('https://7tv.io/v3/emote-sets/global');
        const data = await response.json();
        const randomEmote = data.emotes[Math.floor(Math.random() * data.emotes.length)];
        
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.src = `https://cdn.7tv.app/emote/${randomEmote.id}/2x.webp`;
        });
    } catch (error) {
        console.error('Fehler beim Laden des Emotes:', error);
        return null;
    }
}

// Spiel initialisieren
async function initGame() {
    const emoteImg = await loadEmote();
    document.getElementById('loading').style.display = 'none';
    
    if (emoteImg) {
        player = new Player(canvas.width/2, canvas.height - 100, 50);
        player.img = emoteImg;
        
        // Start-Screen
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'white';
        ctx.font = '48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Emote Race', canvas.width/2, canvas.height/2 - 50);
        ctx.font = '24px Arial';
        ctx.fillText('Drücke Leertaste zum Starten', canvas.width/2, canvas.height/2 + 50);
        
        // Leertaste zum Starten/Neustarten
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && !gameStarted) {
                startGame();
            }
        });
    }
}

// Navigation
document.getElementById('backToMenu').addEventListener('click', () => {
    window.location.href = '7tvDVD.html';
});

// Spiel starten
initGame(); 