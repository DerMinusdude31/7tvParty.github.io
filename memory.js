// Canvas Setup
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

// Memory Game Logic
let emotes = [];
let flippedCards = [];
let matchedPairs = 0;
let moves = 0;
let canFlip = true;
let currentSetId = 'global';
let currentSetName = 'Global';
let highscore = localStorage.getItem(`memoryHighscore_${currentSetId}`) || '-';
let selectedPairCount = 8;

// Zeige den Highscore beim Start
document.getElementById('highscore').textContent = highscore;

// Event Listener für den Start-Button
document.getElementById('startGame').addEventListener('click', () => {
    selectedPairCount = parseInt(document.getElementById('gridSize').value);
    currentSetId = document.getElementById('emoteSetId').value.trim() || 'global';
    currentSetName = currentSetId === 'global' ? 'Global' : `Set: ${currentSetId}`;
    highscore = localStorage.getItem(`memoryHighscore_${currentSetId}_${selectedPairCount}`) || '-';
    
    document.getElementById('highscore').textContent = highscore;
    document.getElementById('pairs').textContent = `0/${selectedPairCount}`;
    document.getElementById('loading').style.display = 'block';
    
    resetGame();
});

// Enter-Taste zum Starten
document.getElementById('emoteSetId').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        document.getElementById('startGame').click();
    }
});

// Zurück zum Menü Button
document.getElementById('backToMenu').addEventListener('click', () => {
    window.location.href = 'index.html';
});

// Reset mit R-Taste
document.addEventListener('keydown', (e) => {
    if (e.code === 'KeyR') {
        resetGame();
    }
});

// Start Animation
animate();

function createBoard() {
    const grid = document.getElementById('memoryGrid');
    grid.innerHTML = '';
    
    // Bestimme die Grid-Dimensionen basierend auf selectedPairCount
    let columns;
    switch(selectedPairCount) {
        case 12: // 12 Paare = 24 Karten
            columns = 6;
            break;
        case 18: // 18 Paare = 36 Karten
            columns = 6;
            break;
        case 24: // 24 Paare = 48 Karten
            columns = 8;
            break;
        default: // 8 Paare = 16 Karten
            columns = 4;
    }
    
    // Setze das Grid-Layout
    grid.style.gridTemplateColumns = `repeat(${columns}, 150px)`;
    grid.style.gridTemplateRows = 'auto';
    
    // Erstelle die Karten-Paare
    const cardPairs = [];
    for (let i = 0; i < selectedPairCount; i++) {
        // Füge jedes Emote zweimal hinzu für ein Paar
        cardPairs.push(emotes[i]);
        cardPairs.push(emotes[i]);
    }
    
    // Mische die Karten
    const shuffledCards = cardPairs.sort(() => Math.random() - 0.5);
    
    // Erstelle die Karten im DOM
    shuffledCards.forEach((emote, index) => {
        const card = document.createElement('div');
        card.className = 'memory-card';
        card.dataset.index = Math.floor(index / 2); // Index für das Paar
        
        const img = document.createElement('img');
        img.src = emote.url;
        img.alt = emote.name;
        
        card.appendChild(img);
        card.addEventListener('click', flipCard);
        grid.appendChild(card);
    });

    document.getElementById('pairs').textContent = `0/${selectedPairCount}`;
}

async function loadEmotes() {
    try {
        let url = currentSetId === 'global' 
            ? 'https://7tv.io/v3/emote-sets/global'
            : `https://7tv.io/v3/emote-sets/${currentSetId}`;
        
        const response = await fetch(url);
        const data = await response.json();
        
        // Prüfe, ob genug Emotes verfügbar sind
        if (!data.emotes || data.emotes.length < selectedPairCount) {
            throw new Error(`Nicht genügend Emotes im Set (mindestens ${selectedPairCount} benötigt)`);
        }
        
        // Wähle EXAKT die Anzahl der benötigten Emotes aus
        emotes = data.emotes
            .sort(() => Math.random() - 0.5)  // Mische alle Emotes
            .slice(0, selectedPairCount)      // Nimm nur so viele wie benötigt
            .map(emote => ({
                id: emote.id,
                url: `https://cdn.7tv.app/emote/${emote.id}/2x.webp`,
                name: emote.name
            }));

        createBoard();
        
        // UI Updates
        document.getElementById('loading').style.display = 'none';
        document.getElementById('preGameMenu').style.display = 'none';
        document.getElementById('gameInfo').style.display = 'flex';
        document.getElementById('memoryGrid').style.display = 'grid';
        document.getElementById('gameContainer').classList.add('game-active');
    } catch (error) {
        console.error('Fehler beim Laden der Emotes:', error);
        document.getElementById('loading').style.display = 'none';
        document.getElementById('emoteSetId').classList.add('error');
        setTimeout(() => {
            document.getElementById('emoteSetId').classList.remove('error');
        }, 1000);
    }
}

function flipCard() {
    if (!canFlip || flippedCards.includes(this) || this.classList.contains('matched')) return;
    
    this.classList.add('flipped');
    flippedCards.push(this);
    
    if (flippedCards.length === 2) {
        moves++;
        document.getElementById('moves').textContent = moves;
        canFlip = false;
        
        const [card1, card2] = flippedCards;
        // Vergleiche die tatsächlichen Emote-IDs
        const match = emotes[parseInt(card1.dataset.index)].id === 
                     emotes[parseInt(card2.dataset.index)].id;
        
        if (match) {
            matchedPairs++;
            document.getElementById('pairs').textContent = `${matchedPairs}/${selectedPairCount}`;
            card1.classList.add('matched');
            card2.classList.add('matched');
            flippedCards = [];
            canFlip = true;
            
            if (matchedPairs === selectedPairCount) {
                handleGameWin();
            }
        } else {
            setTimeout(() => {
                card1.classList.remove('flipped');
                card2.classList.remove('flipped');
                flippedCards = [];
                canFlip = true;
            }, 1000);
        }
    }
}

function handleGameWin() {
    if (highscore === '-' || moves < parseInt(highscore)) {
        highscore = moves;
        localStorage.setItem(`memoryHighscore_${currentSetId}_${selectedPairCount}`, highscore);
        document.getElementById('highscore').textContent = highscore;
        setTimeout(() => {
            alert(`Spiel gewonnen!\nNeuer Highscore: ${moves} Züge! 🎉`);
        }, 500);
    } else {
        setTimeout(() => {
            alert(`Spiel gewonnen!\nZüge: ${moves}\nHighscore: ${highscore}`);
        }, 500);
    }
}

// Event Listener für Set-Auswahl
document.getElementById('loadSet').addEventListener('click', loadEmoteSet);
document.getElementById('emoteSetId').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') loadEmoteSet();
});

// Wenn zurück zum Menü
function showMenu() {
    document.getElementById('preGameMenu').style.display = 'block';
    document.getElementById('gameContainer').classList.remove('game-active');
}

function getGridClass(pairCount) {
    switch(pairCount) {
        case 12: return 'grid-4x6';
        case 18: return 'grid-6x6';
        case 24: return 'grid-6x8';
        default: return ''; // 4x4 Standard
    }
} 