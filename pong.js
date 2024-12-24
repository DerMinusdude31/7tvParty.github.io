// Canvas Setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const bgCanvas = document.getElementById('background-canvas');
const bgCtx = bgCanvas.getContext('2d');

// Spielvariablen
let gameSettings = {
    ballSpeed: 7,
    paddleSize: 100,
    winScore: 5,
    aiEnabled: true,
    aiDifficulty: 0.8,
    maxBallSpeed: 15,    // Maximale Ballgeschwindigkeit
    speedIncrease: 1.05  // Geschwindigkeitszunahme bei Paddle-Treffer
};

let ball = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    size: 40,
    speedX: gameSettings.ballSpeed,
    speedY: gameSettings.ballSpeed,
    emote: null
};

let paddles = {
    left: {
        x: 50,
        y: canvas.height / 2 - gameSettings.paddleSize / 2,
        width: 20,
        height: gameSettings.paddleSize,
        speed: 8,
        score: 0
    },
    right: {
        x: 730,
        y: canvas.height / 2 - gameSettings.paddleSize / 2,
        width: 20,
        height: gameSettings.paddleSize,
        speed: 8,
        score: 0
    }
};

let keys = {};
let animationFrame = null;
let isPaused = false;
let emotes = [];
let countdown = 0;
let gameStarted = false;

// Canvas Größe
function resizeCanvas() {
    canvas.width = 800;
    canvas.height = 600;
    bgCanvas.width = window.innerWidth;
    bgCanvas.height = window.innerHeight;
    resetPaddlePositions();
}

// Sterne-Hintergrund
let stars = Array(120).fill().map(() => ({
    x: Math.random() * bgCanvas.width,
    y: -10 - (Math.random() * bgCanvas.height),
    speed: Math.random() * 2 + 0.5,
    size: Math.random() * 1.5 + 0.5
}));

function drawBackground() {
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
    
    requestAnimationFrame(drawBackground);
}

// Emotes laden
async function loadEmotes(setId = 'global') {
    try {
        const url = setId === 'global' 
            ? 'https://7tv.io/v3/emote-sets/global'
            : `https://7tv.io/v3/emote-sets/${setId}`;
            
        const response = await fetch(url);
        const data = await response.json();
        
        emotes = data.emotes.map(emote => ({
            name: emote.name,
            url: `https://cdn.7tv.app/emote/${emote.id}/2x.webp`
        }));
        
        showEmoteModal();
    } catch (error) {
        console.error('Fehler beim Laden der Emotes:', error);
    }
}

// Emote Modal
function showEmoteModal() {
    const modal = document.getElementById('emoteModal');
    const grid = document.getElementById('emoteGrid');
    grid.innerHTML = '';
    
    emotes.forEach(emote => {
        const div = document.createElement('div');
        div.className = 'emote-option';
        
        const img = document.createElement('img');
        img.src = emote.url;
        img.alt = emote.name;
        
        div.appendChild(img);
        div.addEventListener('click', () => selectEmote(emote));
        grid.appendChild(div);
    });
    
    modal.style.display = 'flex';
}

function selectEmote(emote) {
    ball.emote = new Image();
    ball.emote.src = emote.url;
    document.getElementById('emoteModal').style.display = 'none';
    if (!animationFrame) startGame();
}

// Spiel-Logik
function update() {
    if (isPaused) return;
    
    // Lösche den gesamten Canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Zeichne die Steuerungsanzeige
    drawControls();
    
    // Zeichne die Top-Bar (ohne schwarzen Hintergrund)
    drawTopBar();
    
    // Paddle Bewegung
    if (keys['w'] && paddles.left.y > 0) {
        paddles.left.y -= paddles.left.speed;
    }
    if (keys['s'] && paddles.left.y < canvas.height - paddles.left.height) {
        paddles.left.y += paddles.left.speed;
    }
    if (!gameSettings.aiEnabled) {
        if (keys['ArrowUp'] && paddles.right.y > 0) {
            paddles.right.y -= paddles.right.speed;
        }
        if (keys['ArrowDown'] && paddles.right.y < canvas.height - paddles.right.height) {
            paddles.right.y += paddles.right.speed;
        }
    } else {
        updateAI();
    }

    // Ball Bewegung
    const nextX = ball.x + ball.speedX;
    const nextY = ball.y + ball.speedY;

    // Prüfe Wandkollisionen vor der Bewegung
    if (nextY <= 0 || nextY >= canvas.height - ball.size) {
        ball.speedY *= -1;
    }

    // Prüfe Paddle-Kollisionen
    let collision = false;
    if (ball.speedX < 0) {
        collision = checkPaddleCollision(paddles.left);
    } else {
        collision = checkPaddleCollision(paddles.right);
    }

    // Wenn keine Kollision, bewege den Ball
    if (!collision) {
        ball.x = nextX;
        ball.y = nextY;
    }

    // Punkte nur vergeben wenn das Spiel nicht pausiert ist UND noch kein Gewinner feststeht
    if (!isPaused && paddles.left.score < gameSettings.winScore && paddles.right.score < gameSettings.winScore) {
        if (ball.x + ball.size < 0) {
            paddles.right.score++;
            document.getElementById('score2').textContent = paddles.right.score;
            if (paddles.right.score >= gameSettings.winScore) {
                // Spiel beenden und zurück zum Hauptmenü
                if (animationFrame) {
                    cancelAnimationFrame(animationFrame);
                    animationFrame = null;
                }
                window.location.href = 'index.html';
                return;
            } else {
                showPointScreen(2);
            }
        }
        if (ball.x > canvas.width) {
            paddles.left.score++;
            document.getElementById('score1').textContent = paddles.left.score;
            if (paddles.left.score >= gameSettings.winScore) {
                // Spiel beenden und zurück zum Hauptmenü
                if (animationFrame) {
                    cancelAnimationFrame(animationFrame);
                    animationFrame = null;
                }
                window.location.href = 'index.html';
                return;
            } else {
                showPointScreen(1);
            }
        }
    }

    // Zeichne alles
    draw();
}

function checkPaddleCollision(paddle) {
    // Berechne die Kanten des Balls
    const ballLeft = ball.x;
    const ballRight = ball.x + ball.size;
    const ballTop = ball.y;
    const ballBottom = ball.y + ball.size;
    
    // Berechne die Kanten des Paddles
    const paddleLeft = paddle.x;
    const paddleRight = paddle.x + paddle.width;
    const paddleTop = paddle.y;
    const paddleBottom = paddle.y + paddle.height;
    
    // Prüfe Kollision
    if (ballRight >= paddleLeft && 
        ballLeft <= paddleRight && 
        ballBottom >= paddleTop && 
        ballTop <= paddleBottom) {
        
        // Verhindere, dass der Ball im Paddle stecken bleibt
        if (ball.speedX > 0) {
            ball.x = paddleLeft - ball.size;
        } else {
            ball.x = paddleRight;
        }
        
        // Berechne Aufprallwinkel basierend auf Trefferpunkt
        const hitPosition = (ball.y + ball.size/2 - paddle.y) / paddle.height;
        const angle = (hitPosition - 0.5) * Math.PI / 3; // Max ±60 Grad
        
        // Setze neue Geschwindigkeit mit Mindestgeschwindigkeit
        const minSpeed = gameSettings.ballSpeed;
        const maxSpeed = gameSettings.maxBallSpeed;
        const newSpeed = Math.min(Math.abs(ball.speedX) * gameSettings.speedIncrease, maxSpeed);
        const speed = Math.max(minSpeed, newSpeed);
        
        ball.speedX = (ball.x < canvas.width/2 ? speed : -speed);
        ball.speedY = speed * Math.sin(angle);
        
        return true;
    }
    return false;
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Mittellinie
    ctx.strokeStyle = 'rgba(145, 70, 255, 0.3)';
    ctx.setLineDash([10, 10]);
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.stroke();
    ctx.setLineDash([]);

    // Paddles
    ctx.fillStyle = '#9146FF';
    ctx.fillRect(paddles.left.x, paddles.left.y, paddles.left.width, paddles.left.height);
    ctx.fillRect(paddles.right.x, paddles.right.y, paddles.right.width, paddles.right.height);

    // Ball (Emote)
    if (ball.emote) {
        ctx.drawImage(ball.emote, ball.x, ball.y, ball.size, ball.size);
    }
}

function runGameLoop() {
    if (!gameStarted) return;
    update();
    draw();
    animationFrame = requestAnimationFrame(runGameLoop);
}

function resetBall() {
    ball.x = canvas.width / 2 - ball.size / 2;
    ball.y = canvas.height / 2 - ball.size / 2;
    
    // Zufälliger Startwinkel (±30 Grad)
    const angle = (Math.random() * Math.PI / 3) - Math.PI / 6;
    const direction = Math.random() > 0.5 ? 1 : -1;
    
    ball.speedX = gameSettings.ballSpeed * direction;
    ball.speedY = gameSettings.ballSpeed * Math.sin(angle);
}

function startGame() {
    resetBall();
    paddles.left.score = 0;
    paddles.right.score = 0;
    document.getElementById('score1').textContent = '0';
    document.getElementById('score2').textContent = '0';
    if (animationFrame) {
        cancelAnimationFrame(animationFrame);
    }
    animationFrame = requestAnimationFrame(runGameLoop);
}

function gameOver() {
    if (animationFrame) {
        cancelAnimationFrame(animationFrame);
        animationFrame = null;
    }
    
    function drawEndScreen() {
        // Zeichne zuerst das normale Spielfeld
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Mittellinie
        ctx.strokeStyle = 'rgba(145, 70, 255, 0.3)';
        ctx.setLineDash([10, 10]);
        ctx.beginPath();
        ctx.moveTo(canvas.width / 2, 0);
        ctx.lineTo(canvas.width / 2, canvas.height);
        ctx.stroke();
        ctx.setLineDash([]);

        // Paddles
        ctx.fillStyle = '#9146FF';
        ctx.fillRect(paddles.left.x, paddles.left.y, paddles.left.width, paddles.left.height);
        ctx.fillRect(paddles.right.x, paddles.right.y, paddles.right.width, paddles.right.height);

        // Ball (Emote)
        if (ball.emote) {
            ctx.drawImage(ball.emote, ball.x, ball.y, ball.size, ball.size);
        }
        
        // Halbtransparenter Overlay über dem ganzen Spielfeld
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Box in der Mitte
        const boxWidth = 400;
        const boxHeight = 300;
        const boxX = canvas.width/2 - boxWidth/2;
        const boxY = canvas.height/2 - boxHeight/2;
        
        // Box Hintergrund
        ctx.fillStyle = 'rgba(14, 14, 16, 0.95)';
        ctx.strokeStyle = '#9146FF';
        ctx.lineWidth = 2;
        ctx.fillRect(boxX, boxY, boxWidth, boxHeight);
        ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);
        
        // Text basierend auf Gewinner
        ctx.textAlign = 'center';
        if (paddles.left.score >= gameSettings.winScore) {
            // Spieler hat gewonnen
            ctx.fillStyle = '#4CAF50'; // Grün
            ctx.font = 'bold 36px Arial';
            ctx.fillText('Du hast gewonnen!', canvas.width/2, boxY + 80);
        } else {
            // KI hat gewonnen
            ctx.fillStyle = '#f44336'; // Rot
            ctx.font = 'bold 36px Arial';
            ctx.fillText('Du hast verloren!', canvas.width/2, boxY + 80);
        }
        
        // Buttons
        const buttonWidth = 160;
        const buttonHeight = 50;
        const buttonGap = 20;
        const buttonsY = boxY + boxHeight - 100;
        
        // Neustart Button
        const replayX = canvas.width/2 - buttonWidth - buttonGap/2;
        ctx.fillStyle = 'rgba(145, 70, 255, 0.1)';
        ctx.strokeStyle = '#9146FF';
        ctx.fillRect(replayX, buttonsY, buttonWidth, buttonHeight);
        ctx.strokeRect(replayX, buttonsY, buttonWidth, buttonHeight);
        
        // Menü Button
        const menuX = canvas.width/2 + buttonGap/2;
        ctx.fillRect(menuX, buttonsY, buttonWidth, buttonHeight);
        ctx.strokeRect(menuX, buttonsY, buttonWidth, buttonHeight);
        
        // Button Text
        ctx.fillStyle = 'white';
        ctx.font = '24px Arial';
        ctx.fillText('Neustart', replayX + buttonWidth/2, buttonsY + buttonHeight/2 + 8);
        ctx.fillText('Hauptmenü', menuX + buttonWidth/2, buttonsY + buttonHeight/2 + 8);
        
        return {
            replayBtn: {x: replayX, y: buttonsY, width: buttonWidth, height: buttonHeight},
            menuBtn: {x: menuX, y: buttonsY, width: buttonWidth, height: buttonHeight}
        };
    }
    
    const buttons = drawEndScreen();
    
    // Click Handler für die Buttons bleibt gleich
    function handleClick(event) {
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        if (x >= buttons.replayBtn.x && x <= buttons.replayBtn.x + buttons.replayBtn.width &&
            y >= buttons.replayBtn.y && y <= buttons.replayBtn.y + buttons.replayBtn.height) {
            // Neustart
            canvas.removeEventListener('click', handleClick);
            startGame();
        } else if (x >= buttons.menuBtn.x && x <= buttons.menuBtn.x + buttons.menuBtn.width &&
                   y >= buttons.menuBtn.y && y <= buttons.menuBtn.y + buttons.menuBtn.height) {
            // Zum Hauptmenü
            window.location.href = 'index.html';
        }
    }
    
    canvas.addEventListener('click', handleClick);
}

// Event Listeners
document.addEventListener('keydown', e => {
    // Nur Bewegungstasten im keys-Objekt speichern
    if (e.key === 'w' || e.key === 's' || e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        keys[e.key] = true;
    }
    
    // Pause-Menü mit Leertaste öffnen/schließen
    if (e.code === 'Space') {
        togglePause();
        e.preventDefault(); // Verhindert das Scrollen der Seite
    }
});

document.addEventListener('keyup', e => {
    // Nur Bewegungstasten aus dem keys-Objekt entfernen
    if (e.key === 'w' || e.key === 's' || e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        keys[e.key] = false;
    }
});

document.getElementById('toggleSettings').addEventListener('click', () => {
    const settings = document.getElementById('settings');
    settings.style.display = settings.style.display === 'none' ? 'block' : 'none';
});

document.getElementById('applySettings').addEventListener('click', () => {
    gameSettings.ballSpeed = parseInt(document.getElementById('ballSpeed').value);
    gameSettings.paddleSize = parseInt(document.getElementById('paddleSize').value);
    gameSettings.winScore = parseInt(document.getElementById('winScore').value);
    gameSettings.aiEnabled = document.getElementById('aiEnabled').checked;
    gameSettings.aiDifficulty = parseFloat(document.getElementById('aiDifficulty').value);
    
    paddles.left.height = gameSettings.paddleSize;
    paddles.right.height = gameSettings.paddleSize;
    
    document.getElementById('settings').style.display = 'none';
    // Wenn aus dem Pause-Menü geöffnet, Pause-Menü wieder anzeigen
    if (isPaused) {
        document.getElementById('pauseMenu').style.display = 'flex';
    }
});

document.getElementById('changeBall').addEventListener('click', () => {
    showEmoteModal();
});

document.getElementById('backToMenu').addEventListener('click', () => {
    if (confirm('Zurück zum Hauptmenü? Das aktuelle Spiel wird beendet.')) {
        window.location.href = 'index.html';
    }
});

document.getElementById('loadSet').addEventListener('click', () => {
    const setId = document.getElementById('emoteSetId').value.trim() || 'global';
    loadEmotes(setId);
});

// Initialisierung
window.addEventListener('resize', resizeCanvas);
resizeCanvas();
drawBackground();
loadEmotes();
handleStartMenu();

function resetPaddlePositions() {
    paddles.left.x = 50;
    paddles.right.x = canvas.width - 70;
    paddles.left.y = canvas.height / 2 - paddles.left.height / 2;
    paddles.right.y = canvas.height / 2 - paddles.right.height / 2;
}

function updateAI() {
    if (!gameSettings.aiEnabled) return;
    
    // Verbesserte Vorhersage
    let prediction = ball.y;
    if (ball.speedX > 0) {
        // Ball kommt auf KI zu
        const timeToIntercept = Math.max(0, (paddles.right.x - ball.x) / ball.speedX);
        prediction = ball.y + (ball.speedY * timeToIntercept);
        
        // Berücksichtige mehrfache Abpraller
        while (prediction < 0 || prediction > canvas.height) {
            if (prediction < 0) {
                prediction = -prediction;
            }
            if (prediction > canvas.height) {
                prediction = 2 * canvas.height - prediction;
            }
        }
    } else {
        // Ball bewegt sich weg - zurück zur Mitte
        prediction = canvas.height / 2;
    }
    
    const paddleCenter = paddles.right.y + (paddles.right.height / 2);
    const difference = prediction - paddleCenter;
    
    // Verbesserte Reaktion
    const reactionSpeed = paddles.right.speed * gameSettings.aiDifficulty;
    const errorMargin = (1 - gameSettings.aiDifficulty) * 30;
    const randomError = (Math.random() - 0.5) * errorMargin;
    
    // Smoothere Bewegung mit Deadzone
    const deadzone = 5;
    if (Math.abs(difference + randomError) > deadzone) {
        const moveSpeed = Math.min(Math.abs(difference), reactionSpeed) * Math.sign(difference);
        paddles.right.y += moveSpeed;
        
        // Verhindere Zittern
        paddles.right.y = Math.round(paddles.right.y);
    }
    
    // Begrenze die Position
    paddles.right.y = Math.max(0, Math.min(canvas.height - paddles.right.height, paddles.right.y));
}

// Aktualisiere die Steuerungsanzeige basierend auf KI-Modus
function updateControls() {
    const controls = document.getElementById('controls');
    if (gameSettings.aiEnabled) {
        controls.innerHTML = `
            <div>Spieler: W/S</div>
            <div>Gegner: KI</div>
            <div>Pause: Leertaste</div>
        `;
    } else {
        controls.innerHTML = `
            <div>Spieler 1: W/S</div>
            <div>Spieler 2: ↑/↓</div>
            <div>Pause: Leertaste</div>
        `;
    }
}

// Füge den Event Listener für die Steuerungsaktualisierung hinzu
document.getElementById('aiEnabled').addEventListener('change', updateControls);

// Initialisiere die Steuerungsanzeige
updateControls();

// Initialisiere die Einstellungen korrekt
window.addEventListener('load', () => {
    // Setze initiale Einstellungswerte
    document.getElementById('ballSpeed').value = gameSettings.ballSpeed;
    document.getElementById('paddleSize').value = gameSettings.paddleSize;
    document.getElementById('winScore').value = gameSettings.winScore;
    document.getElementById('aiEnabled').checked = gameSettings.aiEnabled;
    document.getElementById('aiDifficulty').value = gameSettings.aiDifficulty;
    
    // Aktualisiere Steuerungsanzeige
    updateControls();
});

function showPointScreen(player) {
    isPaused = true;
    let timer = 3;
    
    function updateTimer() {
        // Hintergrund komplett schwarz
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Box mit Neon-Rahmen (kleiner)
        const boxWidth = canvas.width * 0.6;
        const boxHeight = canvas.height * 0.6;
        const boxX = canvas.width/2 - boxWidth/2;
        const boxY = canvas.height/2 - boxHeight/2;
        
        // Äußerer Neon-Glow
        ctx.shadowColor = '#9146FF';
        ctx.shadowBlur = 20;
        ctx.strokeStyle = '#9146FF';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(boxX, boxY, boxWidth, boxHeight, 25);
        ctx.stroke();
        
        // Titel mit Neon-Effekt
        ctx.shadowColor = '#9146FF';
        ctx.shadowBlur = 20;
        ctx.fillStyle = '#9146FF';
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`Punkt für ${player === 1 ? 'Spieler 1' : 'Spieler 2'}!`, canvas.width/2, boxY + 100);
        
        // Untertitel
        ctx.shadowBlur = 5;
        ctx.fillStyle = 'white';
        ctx.font = '20px Arial';
        ctx.fillText('Spiel geht gleich weiter...', canvas.width/2, boxY + 150);
        
        // Timer mit pulsierendem Effekt
        const pulseScale = 1 + Math.sin(Date.now() * 0.005) * 0.1;
        ctx.shadowColor = '#9146FF';
        ctx.shadowBlur = 20;
        ctx.fillStyle = '#9146FF';
        ctx.font = `bold ${48 * pulseScale}px Arial`;
        ctx.fillText(timer, canvas.width/2, boxY + boxHeight - 80);
        
        if (timer > 0) {
            timer--;
            setTimeout(updateTimer, 1000);
        } else {
            isPaused = false;
            resetBall();
        }
    }
    
    updateTimer();
}

// Neue Funktion für das End-Menü
function showEndMenu() {
    // Stoppe das Spiel
    if (animationFrame) {
        cancelAnimationFrame(animationFrame);
        animationFrame = null;
    }
    
    let hoveredButton = null;
    
    function drawEndScreen() {
        // Hintergrund komplett schwarz
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Box mit Neon-Rahmen (kleiner)
        const boxWidth = canvas.width * 0.6;
        const boxHeight = canvas.height * 0.6;
        const boxX = canvas.width/2 - boxWidth/2;
        const boxY = canvas.height/2 - boxHeight/2;
        
        // Äußerer Neon-Glow
        ctx.shadowColor = '#9146FF';
        ctx.shadowBlur = 20;
        ctx.strokeStyle = '#9146FF';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(boxX, boxY, boxWidth, boxHeight, 25);
        ctx.stroke();
        
        // Titel mit Neon-Effekt
        ctx.shadowColor = '#9146FF';
        ctx.shadowBlur = 20;
        ctx.fillStyle = '#9146FF';
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(
            paddles.left.score >= gameSettings.winScore ? 'Gewonnen!' : 'Verloren!',
            canvas.width/2,
            boxY + 100
        );
        
        // Untertitel
        ctx.shadowBlur = 5;
        ctx.fillStyle = 'white';
        ctx.font = '20px Arial';
        ctx.fillText(
            paddles.left.score >= gameSettings.winScore 
                ? 'Glückwunsch zum Sieg!'
                : 'Mehr Glück beim nächsten Mal!',
            canvas.width/2,
            boxY + 150
        );
        
        // Buttons nebeneinander
        const buttonWidth = 200;
        const buttonHeight = 50;
        const buttonGap = 40; // Größerer Abstand zwischen den Buttons
        const buttonsY = boxY + boxHeight - 150; // Höher positioniert
        
        // Neustart Button (links)
        drawNeonButton(
            canvas.width/2 - buttonWidth - buttonGap/2,
            buttonsY,
            buttonWidth,
            buttonHeight,
            'Neustart',
            hoveredButton === 'replay'
        );
        
        // Hauptmenü Button (rechts)
        drawNeonButton(
            canvas.width/2 + buttonGap/2,
            buttonsY,
            buttonWidth,
            buttonHeight,
            'Hauptmenü',
            hoveredButton === 'menu'
        );
        
        return {
            replayBtn: {
                x: canvas.width/2 - buttonWidth - buttonGap/2,
                y: buttonsY,
                width: buttonWidth,
                height: buttonHeight
            },
            menuBtn: {
                x: canvas.width/2 + buttonGap/2,
                y: buttonsY,
                width: buttonWidth,
                height: buttonHeight
            }
        };
    }
    
    const buttons = drawEndScreen();
    
    function handleMouseMove(event) {
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        const oldHoveredButton = hoveredButton;
        
        if (x >= buttons.replayBtn.x && x <= buttons.replayBtn.x + buttons.replayBtn.width &&
            y >= buttons.replayBtn.y && y <= buttons.replayBtn.y + buttons.replayBtn.height) {
            hoveredButton = 'replay';
            canvas.style.cursor = 'pointer';
        } else if (x >= buttons.menuBtn.x && x <= buttons.menuBtn.x + buttons.menuBtn.width &&
                   y >= buttons.menuBtn.y && y <= buttons.menuBtn.y + buttons.menuBtn.height) {
            hoveredButton = 'menu';
            canvas.style.cursor = 'pointer';
        } else {
            hoveredButton = null;
            canvas.style.cursor = 'default';
        }
        
        if (oldHoveredButton !== hoveredButton) {
            drawEndScreen();
        }
    }
    
    function handleClick(event) {
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        if (x >= buttons.replayBtn.x && x <= buttons.replayBtn.x + buttons.replayBtn.width &&
            y >= buttons.replayBtn.y && y <= buttons.replayBtn.y + buttons.replayBtn.height) {
            // Neustart
            canvas.removeEventListener('click', handleClick);
            canvas.removeEventListener('mousemove', handleMouseMove);
            startGame();
        } else if (x >= buttons.menuBtn.x && x <= buttons.menuBtn.x + buttons.menuBtn.width &&
                   y >= buttons.menuBtn.y && y <= buttons.menuBtn.y + buttons.menuBtn.height) {
            // Zum Hauptmenü
            window.location.href = 'index.html';
        }
    }
    
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('click', handleClick);
}

// Neue Funktion für das Startmenü
function showStartMenu() {
    const boxWidth = canvas.width * 0.8;
    const boxHeight = canvas.height * 0.8;
    const boxX = canvas.width/2 - boxWidth/2;
    const boxY = canvas.height/2 - boxHeight/2;
    
    const buttonWidth = 200;
    const buttonHeight = 50;
    const buttonGap = 40;
    const buttonsY = boxY + boxHeight - 150;
    
    return {
        playBtn: {
            x: canvas.width/2 - buttonWidth - buttonGap/2,
            y: buttonsY,
            width: buttonWidth,
            height: buttonHeight
        },
        settingsBtn: {
            x: canvas.width/2 + buttonGap/2,
            y: buttonsY,
            width: buttonWidth,
            height: buttonHeight
        }
    };
}

// Neue Hilfsfunktion für Neon-Buttons (angepasste Größen)
function drawNeonButton(x, y, width, height, text, isHovered = false) {
    // Innerer Button-Hintergrund (dunkel)
    ctx.fillStyle = isHovered ? 'rgba(145, 70, 255, 0.2)' : 'rgba(14, 14, 16, 0.95)';
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, 15);
    ctx.fill();
    
    // Äußerer Neon-Glow (stärker wenn gehovered)
    ctx.shadowColor = '#9146FF';
    ctx.shadowBlur = isHovered ? 30 : 20;
    ctx.strokeStyle = '#9146FF';
    ctx.lineWidth = isHovered ? 3 : 2;
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, 15);
    ctx.stroke();
    
    // Text mit Neon-Effekt
    ctx.shadowColor = '#9146FF';
    ctx.shadowBlur = isHovered ? 20 : 15;
    ctx.fillStyle = 'white';
    ctx.font = `bold ${isHovered ? '16px' : '14px'} Arial`; // Kleinere Schrift für die Menü-Buttons
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x + width/2, y + height/2);
}

function drawTopBar() {
    // Buttons in der Leiste (ohne schwarzen Hintergrund)
    const buttonWidth = 160;
    const buttonHeight = 40;
    const margin = 20;
    
    // Zurück zum Menü Button (links)
    drawNeonButton(
        margin,
        10,
        buttonWidth,
        buttonHeight,
        'Zurück zum Menü',
        hoveredButton === 'back'
    );
    
    // Punktestand in der Mitte
    ctx.shadowColor = '#9146FF';
    ctx.shadowBlur = 10;
    ctx.fillStyle = 'white';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`Spieler 1: ${paddles.left.score}    Spieler 2: ${paddles.right.score}`, canvas.width/2, 30);
    
    // Einstellungen Button (rechts)
    drawNeonButton(
        canvas.width - buttonWidth - margin,
        10,
        buttonWidth,
        buttonHeight,
        'Einstellungen',
        hoveredButton === 'settings'
    );
    
    return {
        backBtn: {
            x: margin,
            y: 10,
            width: buttonWidth,
            height: buttonHeight
        },
        settingsBtn: {
            x: canvas.width - buttonWidth - margin,
            y: 10,
            width: buttonWidth,
            height: buttonHeight
        }
    };
}

// Event Listener für die Top-Bar Buttons
let hoveredButton = null; // Globale Variable für den Hover-Status

function handleTopBarMouseMove(event) {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Nur prüfen wenn y in der Top-Bar ist
    if (y <= 60) {
        const topButtons = drawTopBar();
        
        if (x >= topButtons.backBtn.x && x <= topButtons.backBtn.x + topButtons.backBtn.width &&
            y >= topButtons.backBtn.y && y <= topButtons.backBtn.y + topButtons.backBtn.height) {
            hoveredButton = 'back';
            canvas.style.cursor = 'pointer';
        } else if (x >= topButtons.settingsBtn.x && x <= topButtons.settingsBtn.x + topButtons.settingsBtn.width &&
                   y >= topButtons.settingsBtn.y && y <= topButtons.settingsBtn.y + topButtons.settingsBtn.height) {
            hoveredButton = 'settings';
            canvas.style.cursor = 'pointer';
        } else {
            hoveredButton = null;
            canvas.style.cursor = 'default';
        }
    } else {
        hoveredButton = null;
        canvas.style.cursor = 'default';
    }
}

function handleTopBarClick(event) {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Nur prüfen wenn y in der Top-Bar ist
    if (y <= 60) {
        const topButtons = drawTopBar();
        
        if (x >= topButtons.backBtn.x && x <= topButtons.backBtn.x + topButtons.backBtn.width &&
            y >= topButtons.backBtn.y && y <= topButtons.backBtn.y + topButtons.backBtn.height) {
            // Zurück zum Hauptmenü
            if (confirm('Zurück zum Hauptmenü? Das aktuelle Spiel wird beendet.')) {
                window.location.href = 'index.html';
            }
        } else if (x >= topButtons.settingsBtn.x && x <= topButtons.settingsBtn.x + topButtons.settingsBtn.width &&
                   y >= topButtons.settingsBtn.y && y <= topButtons.settingsBtn.y + topButtons.settingsBtn.height) {
            // Einstellungen öffnen
            document.getElementById('settings').style.display = 'block';
        }
    }
}

// Event Listener hinzufügen
canvas.addEventListener('mousemove', handleTopBarMouseMove);
canvas.addEventListener('click', handleTopBarClick);

// Event Handler für das Startmenü
function handleStartMenu() {
    const buttons = showStartMenu();
    let hoveredButton = null;
    
    function redrawMenu() {
        // Hintergrund komplett schwarz
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Box mit Neon-Rahmen (stärker abgerundet)
        const boxWidth = canvas.width * 0.8;
        const boxHeight = canvas.height * 0.8;
        const boxX = canvas.width/2 - boxWidth/2;
        const boxY = canvas.height/2 - boxHeight/2;
        
        // Äußerer Neon-Glow mit stärkerer Rundung
        ctx.shadowColor = '#9146FF';
        ctx.shadowBlur = 40;
        ctx.strokeStyle = '#9146FF';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(boxX, boxY, boxWidth, boxHeight, 40);
        ctx.stroke();
        
        // Titel mit starkem Neon-Effekt
        ctx.shadowColor = '#9146FF';
        ctx.shadowBlur = 30;
        ctx.fillStyle = '#9146FF';
        ctx.font = 'bold 72px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('7TV Emote Pong', canvas.width/2, boxY + 120);
        
        // Untertitel
        ctx.shadowBlur = 10;
        ctx.fillStyle = 'white';
        ctx.font = '24px Arial';
        ctx.fillText('Spiele Pong mit deinen Lieblings-Emotes', canvas.width/2, boxY + 180);
        
        // Buttons nebeneinander
        const buttonWidth = 200;
        const buttonHeight = 50;
        const buttonGap = 40; // Größerer Abstand zwischen den Buttons
        const buttonsY = boxY + boxHeight - 150; // Höher positioniert
        
        // Spielen Button (links)
        drawNeonButton(
            canvas.width/2 - buttonWidth - buttonGap/2,
            buttonsY,
            buttonWidth,
            buttonHeight,
            'Spielen',
            hoveredButton === 'play'
        );
        
        // Einstellungen Button (rechts)
        drawNeonButton(
            canvas.width/2 + buttonGap/2,
            buttonsY,
            buttonWidth,
            buttonHeight,
            'Einstellungen',
            hoveredButton === 'settings'
        );
    }
    
    function handleMouseMove(event) {
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        const oldHoveredButton = hoveredButton;
        
        if (x >= buttons.playBtn.x && x <= buttons.playBtn.x + buttons.playBtn.width &&
            y >= buttons.playBtn.y && y <= buttons.playBtn.y + buttons.playBtn.height) {
            hoveredButton = 'play';
            canvas.style.cursor = 'pointer';
        } else if (x >= buttons.settingsBtn.x && x <= buttons.settingsBtn.x + buttons.settingsBtn.width &&
                   y >= buttons.settingsBtn.y && y <= buttons.settingsBtn.y + buttons.settingsBtn.height) {
            hoveredButton = 'settings';
            canvas.style.cursor = 'pointer';
        } else {
            hoveredButton = null;
            canvas.style.cursor = 'default';
        }
        
        // Nur neu zeichnen wenn sich der Hover-Status geändert hat
        if (oldHoveredButton !== hoveredButton) {
            redrawMenu();
        }
    }
    
    function handleClick(event) {
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        if (x >= buttons.playBtn.x && x <= buttons.playBtn.x + buttons.playBtn.width &&
            y >= buttons.playBtn.y && y <= buttons.playBtn.y + buttons.playBtn.height) {
            // Spiel starten
            canvas.removeEventListener('click', handleClick);
            canvas.removeEventListener('mousemove', handleMouseMove);
            gameStarted = true;
            startGame();
        } else if (x >= buttons.settingsBtn.x && x <= buttons.settingsBtn.x + buttons.settingsBtn.width &&
                   y >= buttons.settingsBtn.y && y <= buttons.settingsBtn.y + buttons.settingsBtn.height) {
            // Einstellungen öffnen
            document.getElementById('settings').style.display = 'block';
        }
    }
    
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('click', handleClick);
}

function drawControls() {
    // Box mit Neon-Rahmen für die Steuerung
    const boxWidth = 400;
    const boxHeight = 50;
    const boxX = canvas.width/2 - boxWidth/2;
    const boxY = 10;
    
    // Äußerer Neon-Glow
    ctx.shadowColor = '#9146FF';
    ctx.shadowBlur = 20;
    ctx.strokeStyle = '#9146FF';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(boxX, boxY, boxWidth, boxHeight, 15);
    ctx.stroke();
    
    // Text
    ctx.shadowColor = '#9146FF';
    ctx.shadowBlur = 10;
    ctx.fillStyle = 'white';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Zeige die entsprechende Steuerung basierend auf KI-Modus
    const controlText = gameSettings.aiEnabled 
        ? 'Spieler: W/S    Gegner: KI    Pause: Leertaste'
        : 'Spieler: W/S    Gegner: ↑/↓    Pause: Leertaste';
    
    ctx.fillText(controlText, canvas.width/2, boxY + boxHeight/2);
}

// Aktualisiere die Steuerungsanzeige wenn sich der KI-Modus ändert
document.getElementById('aiEnabled').addEventListener('change', function() {
    if (!isPaused && animationFrame) {
        drawControls();
    }
});

function togglePause() {
    if (!gameStarted) return; // Nicht pausieren wenn das Spiel noch nicht gestartet wurde
    
    isPaused = !isPaused;
    const pauseMenu = document.getElementById('pauseMenu');
    
    if (isPaused) {
        pauseMenu.style.display = 'flex';
    } else {
        pauseMenu.style.display = 'none';
    }
}

// Neue Event Listener für das Pause-Menü
document.getElementById('resumeGame').addEventListener('click', () => {
    togglePause();
});

document.getElementById('openSettingsFromPause').addEventListener('click', () => {
    document.getElementById('settings').style.display = 'block';
});

document.getElementById('backToMenuFromPause').addEventListener('click', () => {
    if (confirm('Zurück zum Hauptmenü? Das aktuelle Spiel wird beendet.')) {
        window.location.href = 'index.html';
    }
}); 