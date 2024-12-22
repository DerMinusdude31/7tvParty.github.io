// Spielvariablen
let emotes = [];
let gameActive = false;
let gameScore = 0;
let timeLeft = 30;
let gameTimer = null;
let currentEmoteToGuess = null;
let currentSetId = 'global';
let currentSetName = 'Global';

// Canvas Setup für Sterne-Animation
const canvas = document.getElementById('background-canvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
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

function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'rgb(0, 0, 0)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
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
    
    requestAnimationFrame(animate);
}

// Start Animation
animate();

// Emote-Funktionen
async function fetchEmotes() {
    try {
        let url;
        if (currentSetId === 'global') {
            url = 'https://7tv.io/v3/emote-sets/global';
        } else {
            url = `https://7tv.io/v3/emote-sets/${currentSetId}`;
        }

        const response = await fetch(url);
        const data = await response.json();
        
        if (!data.emotes || data.emotes.length === 0) {
            throw new Error('Keine Emotes gefunden');
        }
        
        emotes = data.emotes.map(emote => ({
            name: emote.name,
            url: `https://cdn.7tv.app/emote/${emote.id}/4x.webp`
        }));
        
        document.getElementById('loading').style.display = 'none';
        document.querySelector('.set-selector').style.display = 'none';
        document.getElementById('currentSet').textContent = currentSetName;
        startGame();
    } catch (error) {
        console.error('Fehler beim Laden der Emotes:', error);
        document.getElementById('loading').style.display = 'none';
        document.getElementById('emoteSetId').classList.add('error');
        setTimeout(() => {
            document.getElementById('emoteSetId').classList.remove('error');
        }, 1000);
    }
}

function startGame() {
    gameActive = true;
    gameScore = 0;
    timeLeft = 30;
    
    document.getElementById('gamePanel').style.display = 'block';
    document.getElementById('gameScore').textContent = `Punkte: ${gameScore}`;
    document.getElementById('timeLeft').textContent = timeLeft;
    
    nextEmote();
    startTimer();
}

function nextEmote() {
    currentEmoteToGuess = emotes[Math.floor(Math.random() * emotes.length)];
    document.getElementById('emoteToGuess').src = currentEmoteToGuess.url;
    document.getElementById('guessInput').value = '';
    document.getElementById('guessInput').focus();

    // Entferne alte Antwort-Anzeige falls vorhanden
    const existingAnswer = document.querySelector('.answer-reveal');
    if (existingAnswer) {
        existingAnswer.remove();
    }
}

function startTimer() {
    if (gameTimer) clearInterval(gameTimer);
    
    gameTimer = setInterval(() => {
        timeLeft--;
        document.getElementById('timeLeft').textContent = timeLeft;
        
        if (timeLeft <= 10) {
            document.getElementById('timeLeft').classList.add('time-warning');
        }
        
        if (timeLeft <= 0) {
            endGame();
        }
    }, 1000);
}

function endGame() {
    clearInterval(gameTimer);
    gameActive = false;
    
    const finalScore = gameScore;
    const highscoreKey = `emoteGameHighscore_${currentSetId}`;
    const currentHighscore = localStorage.getItem(highscoreKey) || 0;
    
    let message = `Spiel vorbei!\n\nPunkte: ${finalScore}\nEmote-Set: ${currentSetName}`;
    
    if (finalScore > currentHighscore) {
        localStorage.setItem(highscoreKey, finalScore);
        message += '\n\nNeuer Highscore! 🎉';
    } else {
        message += `\nHighscore: ${currentHighscore}`;
    }
    
    alert(message);
    
    // Zurück zur Set-Auswahl
    document.getElementById('gamePanel').style.display = 'none';
    document.getElementById('setSelector').style.display = 'block';
}

function checkGuess() {
    if (!gameActive) return;
    
    const guess = document.getElementById('guessInput').value.trim().toLowerCase();
    const correctName = currentEmoteToGuess.name.toLowerCase();
    
    if (guess === correctName) {
        // Richtige Antwort
        gameScore += 100;
        document.getElementById('gameScore').textContent = `Punkte: ${gameScore}`;
        document.getElementById('gameScore').classList.add('score-increase');
        
        // Bonus-Zeit
        timeLeft = Math.min(timeLeft + 5, 30);
        document.getElementById('timeLeft').textContent = timeLeft;
        document.getElementById('timeLeft').classList.remove('time-warning');
        
        // Visuelles Feedback
        document.getElementById('emoteToGuess').classList.add('correct-answer');
        setTimeout(() => {
            document.getElementById('emoteToGuess').classList.remove('correct-answer');
            document.getElementById('gameScore').classList.remove('score-increase');
        }, 500);
        
        nextEmote();
    } else {
        // Falsche Antwort
        document.getElementById('guessInput').classList.add('wrong-answer');
        setTimeout(() => {
            document.getElementById('guessInput').classList.remove('wrong-answer');
        }, 500);
    }
}

function revealAnswer() {
    if (!gameActive) return;
    
    // Punktabzug für das Auflösen
    gameScore = Math.max(0, gameScore - 50);
    document.getElementById('gameScore').textContent = `Punkte: ${gameScore}`;
    
    // Zeige die Antwort an
    const answerDiv = document.createElement('div');
    answerDiv.className = 'answer-reveal';
    answerDiv.textContent = `Antwort: ${currentEmoteToGuess.name}`;
    
    const emoteGuessDiv = document.getElementById('emoteGuess');
    const existingAnswer = emoteGuessDiv.querySelector('.answer-reveal');
    if (existingAnswer) {
        existingAnswer.remove();
    }
    emoteGuessDiv.appendChild(answerDiv);
    
    // Nach 2 Sekunden nächstes Emote
    setTimeout(() => {
        nextEmote();
    }, 2000);
}

// Event Listeners
document.getElementById('startGame').addEventListener('click', () => {
    const setId = document.getElementById('emoteSetId').value.trim();
    currentSetId = setId || 'global';
    currentSetName = currentSetId === 'global' ? 'Global' : `Set: ${currentSetId}`;
    
    document.getElementById('loading').style.display = 'block';
    
    fetchEmotes();
});

document.getElementById('emoteSetId').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        document.getElementById('startGame').click();
    }
});

document.getElementById('submitGuess').addEventListener('click', checkGuess);

document.getElementById('guessInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') checkGuess();
});

document.getElementById('revealAnswer').addEventListener('click', revealAnswer);

document.getElementById('backToMenu').addEventListener('click', () => {
    if (!gameActive || confirm('Möchtest du wirklich zum Hauptmenü zurückkehren? Dein Spielfortschritt geht verloren.')) {
        window.location.href = 'index.html';
    }
});