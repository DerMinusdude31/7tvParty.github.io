// Spielvariablen
let emotes = [];
let gameActive = false;
let gameScore = 0;
let timeLeft = 30;
let gameTimer = null;
let currentEmoteToGuess = null;
let currentSetId = 'global';
let currentSetName = 'Global';

// Canvas Setup
const canvas = document.getElementById('background-canvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Hintergrund-Animation
function drawBackground() {
    ctx.fillStyle = 'rgba(26, 26, 26, 0.1)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    requestAnimationFrame(drawBackground);
}

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
        
        emotes = data.emotes.map(emote => ({
            name: emote.name,
            url: `https://cdn.7tv.app/emote/${emote.id}/4x.webp`
        }));
        
        if (emotes.length === 0) {
            throw new Error('Keine Emotes gefunden');
        }
        
        document.getElementById('loading').style.display = 'none';
        document.getElementById('setSelector').style.display = 'none';
        document.getElementById('currentSet').textContent = currentSetName;
        startGame();
    } catch (error) {
        console.error('Fehler beim Laden der Emotes:', error);
        document.getElementById('loading').textContent = 
            'Fehler beim Laden der Emotes. Bitte überprüfen Sie die Set-ID und versuchen Sie es erneut.';
        
        document.getElementById('setSelector').style.display = 'block';
    }
}

function loadEmoteSet() {
    const setInput = document.getElementById('emoteSetId');
    const newSetId = setInput.value.trim();
    
    if (newSetId) {
        currentSetId = newSetId;
        currentSetName = newSetId === 'global' ? 'Global' : `Set: ${newSetId}`;
        
        document.getElementById('loading').style.display = 'block';
        document.getElementById('loading').textContent = 'Lade Emotes...';
        
        fetchEmotes();
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
document.getElementById('loadSet').addEventListener('click', loadEmoteSet);

document.getElementById('emoteSetId').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') loadEmoteSet();
});

document.getElementById('submitGuess').addEventListener('click', checkGuess);

document.getElementById('guessInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') checkGuess();
});

document.getElementById('revealAnswer').addEventListener('click', revealAnswer);

document.getElementById('backToMenu').addEventListener('click', () => {
    if (!gameActive || confirm('Möchtest du wirklich zum Hauptmenü zurückkehren? Dein Spielfortschritt geht verloren.')) {
        window.location.href = '7tvDVD.html';
    }
});

// Start Animation
drawBackground();