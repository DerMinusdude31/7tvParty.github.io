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

async function loadEmotes() {
    try {
        const response = await fetch('https://7tv.io/v3/emote-sets/global');
        const data = await response.json();
        
        // Zufällig 8 Emotes auswählen
        const selectedEmotes = data.emotes
            .sort(() => Math.random() - 0.5)
            .slice(0, 8)
            .map(emote => ({
                id: emote.id,
                url: `https://cdn.7tv.app/emote/${emote.id}/2x.webp`,
                name: emote.name
            }));
        
        // Jedes Emote zweimal für Paare
        emotes = [...selectedEmotes, ...selectedEmotes]
            .sort(() => Math.random() - 0.5);
        
        document.getElementById('loading').style.display = 'none';
        createBoard();
    } catch (error) {
        console.error('Fehler beim Laden der Emotes:', error);
        document.getElementById('loading').textContent = 
            'Fehler beim Laden der Emotes. Bitte Seite neu laden.';
    }
}

function createBoard() {
    const grid = document.getElementById('memoryGrid');
    grid.innerHTML = '';
    
    emotes.forEach((emote, index) => {
        const card = document.createElement('div');
        card.className = 'memory-card';
        card.dataset.index = index;
        
        const img = document.createElement('img');
        img.src = emote.url;
        img.alt = emote.name;
        
        card.appendChild(img);
        card.addEventListener('click', flipCard);
        grid.appendChild(card);
    });
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
        const match = emotes[card1.dataset.index].id === emotes[card2.dataset.index].id;
        
        if (match) {
            matchedPairs++;
            document.getElementById('pairs').textContent = matchedPairs;
            card1.classList.add('matched');
            card2.classList.add('matched');
            flippedCards = [];
            canFlip = true;
            
            if (matchedPairs === 8) {
                setTimeout(() => {
                    alert(`Spiel gewonnen! Züge: ${moves}`);
                }, 500);
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

// Navigation
document.getElementById('backToMenu').addEventListener('click', () => {
    window.location.href = '7tvDVD.html';
});

// Start Game
animate();
loadEmotes(); 