// Canvas Setup
const canvas = document.getElementById('background-canvas');
const ctx = canvas.getContext('2d');

// Hintergrund-Canvas Größe anpassen
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

// Hintergrund-Animation
function animateBackground() {
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
    
    requestAnimationFrame(animateBackground);
}

// Starte die Hintergrund-Animation
animateBackground();

// Spielvariablen
let emotes = [];
let coins = 1000;
let currentBet = 50;
let isSpinning = false;
let totalSpins = 0;
let maxWin = 0;
let highscore = localStorage.getItem('casinoHighscore') || 0;

// Globale Variablen für den Hintergrund
let backgroundEmotes = [];
let isBackgroundAnimating = false;
let backgroundInterval;
let activeEmotes = new Set(); // Für besseres Tracking der aktiven Emotes

// Funktion zum Laden der Casino-Hintergrund-Emojis
async function loadBackgroundEmotes() {
    backgroundEmotes = [
        '🎰', '💎', '💰', '🎲', '🃏', '👑', '🍀', '💫'
    ];
}

// Funktion zum Erstellen eines Hintergrund-Emotes
function createBackgroundEmote() {
    if (backgroundEmotes.length === 0) return null;
    
    const emote = document.createElement('div');
    emote.className = 'background-emote';
    const randomEmote = backgroundEmotes[Math.floor(Math.random() * backgroundEmotes.length)];
    
    const startX = Math.random() * window.innerWidth;
    const startY = -50;
    
    emote.style.left = `${startX}px`;
    emote.style.top = `${startY}px`;
    emote.textContent = randomEmote;
    
    // Optimierte Animation-Parameter
    const duration = 4000 + Math.random() * 2000; // Reduzierte Dauer: 4-6 Sekunden
    const rotation = Math.random() * 180 - 90; // Reduzierter Rotationsbereich
    const scale = 0.8 + Math.random() * 0.4;
    const swayAmount = (Math.random() * 100) - 50; // Reduzierte seitliche Bewegung
    
    const animation = emote.animate([
        { 
            transform: `translate(0, 0) rotate(0deg) scale(${scale})`,
            opacity: 0
        },
        {
            transform: `translate(${swayAmount}px, ${window.innerHeight + 100}px) rotate(${rotation}deg) scale(${scale})`,
            opacity: 0.7
        }
    ], {
        duration: duration,
        easing: 'linear'
    });

    animation.onfinish = () => {
        emote.remove();
        activeEmotes.delete(emote);
    };

    activeEmotes.add(emote);
    document.body.appendChild(emote);
    return emote;
}

// Hintergrund-Animation starten/stoppen
function toggleBackgroundAnimation() {
    const canvas = document.getElementById('background-canvas');
    
    if (isBackgroundAnimating) {
        // Animation stoppen
        isBackgroundAnimating = false;
        clearInterval(backgroundInterval);
        document.getElementById('toggleBackgroundEmotes').classList.remove('active');
        
        // Sanft alle aktiven Emotes ausblenden
        activeEmotes.forEach(emote => {
            emote.style.transition = 'opacity 0.5s ease-out';
            emote.style.opacity = '0';
            setTimeout(() => {
                emote.remove();
                activeEmotes.delete(emote);
            }, 500);
        });
        
        // Sterne einblenden
        canvas.style.transition = 'opacity 0.5s ease-in';
        canvas.style.opacity = '1';
    } else {
        // Sterne ausblenden
        canvas.style.transition = 'opacity 0.5s ease-out';
        canvas.style.opacity = '0';
        
        if (backgroundEmotes.length === 0) {
            loadBackgroundEmotes().then(startBackgroundAnimation);
        } else {
            startBackgroundAnimation();
        }
        document.getElementById('toggleBackgroundEmotes').classList.add('active');
    }
}

function startBackgroundAnimation() {
    isBackgroundAnimating = true;
    
    // Initiale Emotes mit Verzögerung
    for (let i = 0; i < 8; i++) { // Reduzierte Anzahl
        setTimeout(() => {
            if (!isBackgroundAnimating) return; // Prüfe ob Animation noch aktiv
            createBackgroundEmote();
        }, i * 200);
    }
    
    // Regelmäßige neue Emotes
    backgroundInterval = setInterval(() => {
        if (!isBackgroundAnimating) return;
        if (activeEmotes.size < 15 && Math.random() < 0.5) { // Begrenzte Anzahl
            createBackgroundEmote();
        }
    }, 800); // Längeres Interval
}

// Event Listener für den Hintergrund-Toggle-Button
document.getElementById('toggleBackgroundEmotes').addEventListener('click', toggleBackgroundAnimation);

// Füge die CSS-Styles für die Hintergrund-Emotes hinzu
const style = document.createElement('style');
style.textContent = `
    .background-emote {
        position: fixed;
        z-index: -1;
        pointer-events: none;
        opacity: 0;
        font-size: 48px;
        will-change: transform;
    }
`;
document.head.appendChild(style);

// Toggle-Button Styling
document.getElementById('toggleBackgroundEmotes').addEventListener('click', function() {
    this.classList.toggle('active');
});

// Lade die Emotes
async function loadEmotes(emoteSetId = 'global') {
    try {
        document.getElementById('loading').style.display = 'block';
        const response = await fetch(`https://7tv.io/v3/emote-sets/${emoteSetId}`);
        if (!response.ok) {
            throw new Error('Emote-Set nicht gefunden');
        }
        const data = await response.json();
        emotes = data.emotes.map(emote => ({
            url: `https://cdn.7tv.app/emote/${emote.id}/2x.webp`,
            name: emote.name
        }));
        
        // Aktualisiere die Anzeige der Emote-Anzahl
        const emoteCount = getEmoteCountForAnimation(emotes.length);
        document.getElementById('emoteCount').textContent = emoteCount;
        
        document.getElementById('loading').style.display = 'none';
        initializeSlots();
    } catch (error) {
        console.error('Fehler beim Laden der Emotes:', error);
        document.getElementById('loading').textContent = 'Fehler beim Laden der Emotes. Bitte versuche es erneut.';
    }
}

// Initialisiere die Slots
function initializeSlots() {
    const slots = document.querySelectorAll('.slot');
    slots.forEach(slot => {
        const content = document.createElement('div');
        content.className = 'slot-content';
        const randomEmote = getRandomEmote();
        content.innerHTML = `<img src="${randomEmote.url}" alt="${randomEmote.name}">`;
        slot.appendChild(content);
    });
}

// Zufälliges Emote auswählen
function getRandomEmote() {
    return emotes[Math.floor(Math.random() * emotes.length)];
}

// Bestimme die Anzahl der Emotes für die Animation basierend auf der Set-Größe
function getEmoteCountForAnimation(setSize) {
    if (setSize >= 900) return 10;
    if (setSize >= 800) return 15;
    if (setSize >= 600) return 20;
    if (setSize >= 500) return 25;
    return 30; // Standard für Sets mit weniger als 500 Emotes
}

// Spin-Animation für einen einzelnen Slot
function spinSlot(slot, duration, forcedEmote = null) {
    return new Promise(resolve => {
        const content = slot.querySelector('.slot-content');
        content.style.transition = 'none';
        slot.classList.add('spinning');
        
        const spinContent = document.createElement('div');
        spinContent.className = 'slot-content';
        
        const emoteCount = getEmoteCountForAnimation(emotes.length);
        const selectedEmotes = [];
        const usedIndices = new Set();
        
        // Wenn ein forcedEmote vorhanden ist, füge es als letztes Element hinzu
        if (forcedEmote) {
            while (selectedEmotes.length < emoteCount - 1) {
                const randomEmote = getRandomEmote();
                if (randomEmote.name !== forcedEmote.name) {
                    selectedEmotes.push(randomEmote);
                }
            }
            selectedEmotes.push(forcedEmote);
        } else {
            while (selectedEmotes.length < emoteCount) {
                const index = Math.floor(Math.random() * emotes.length);
                if (!usedIndices.has(index)) {
                    usedIndices.add(index);
                    selectedEmotes.push(emotes[index]);
                }
            }
        }
        
        selectedEmotes.forEach(emote => {
            const img = document.createElement('img');
            img.src = emote.url;
            img.alt = emote.name;
            spinContent.appendChild(img);
        });
        
        slot.innerHTML = '';
        slot.appendChild(spinContent);
        
        setTimeout(() => {
            slot.classList.remove('spinning');
            slot.classList.add('stopping');
            
            setTimeout(() => {
                slot.classList.remove('stopping');
                const finalEmote = forcedEmote || selectedEmotes[selectedEmotes.length - 1];
                slot.innerHTML = `<div class="slot-content"><img src="${finalEmote.url}" alt="${finalEmote.name}"></div>`;
                resolve(finalEmote);
            }, 300);
        }, duration - 300);
    });
}

// Hauptspin-Funktion
async function spin() {
    if (isSpinning || coins < currentBet) return;
    
    isSpinning = true;
    totalSpins++;
    coins -= currentBet;
    updateCoins();
    
    const spinButton = document.getElementById('spinButton');
    spinButton.disabled = true;
    
    const slots = document.querySelectorAll('.slot');
    const results = [];
    
    // Zufallszahl für die Gewinnchance
    const chance = Math.random();
    
    // Reduzierte Wahrscheinlichkeiten:
    // 5% Chance für 3 gleiche (vorher 20%)
    // 15% Chance für 2 gleiche (vorher 40%)
    // 80% Chance für keine Übereinstimmung
    
    if (chance < 0.05) { // 3 gleiche
        const selectedEmote = getRandomEmote();
        for (let i = 0; i < slots.length; i++) {
            const result = await spinSlot(slots[i], 1000 + i * 500, selectedEmote);
            results.push(result);
        }
    } else if (chance < 0.20) { // 2 gleiche
        const selectedEmote = getRandomEmote();
        const differentEmote = getRandomEmote();
        const randomPosition = Math.floor(Math.random() * 3);
        
        for (let i = 0; i < slots.length; i++) {
            const emoteToUse = i === randomPosition ? differentEmote : selectedEmote;
            const result = await spinSlot(slots[i], 1000 + i * 500, emoteToUse);
            results.push(result);
        }
    } else { // Keine Übereinstimmung
        for (let i = 0; i < slots.length; i++) {
            const result = await spinSlot(slots[i], 1000 + i * 500);
            results.push(result);
        }
    }
    
    // Prüfe auf Gewinn
    checkWin(results);
    
    spinButton.disabled = false;
    isSpinning = false;
}

// Prüfe auf Gewinnkombinationen
function checkWin(results) {
    const slots = document.querySelectorAll('.slot');
    let winAmount = 0;
    
    // Prüfe auf gleiche Emotes
    const matches = results.filter((result, index, array) => 
        array.findIndex(r => r.name === result.name) === index
    ).length;
    
    if (matches === 1) { // Alle gleich
        winAmount = currentBet * 10;
        slots.forEach(slot => slot.classList.add('winner'));
    } else if (matches === 2) { // Zwei gleich
        winAmount = currentBet * 2;
        // Finde die übereinstimmenden Slots und markiere sie
        const matchingName = results.find((result, index, array) =>
            array.filter(r => r.name === result.name).length >= 2
        ).name;
        slots.forEach((slot, index) => {
            if (results[index].name === matchingName) {
                slot.classList.add('winner');
            }
        });
    }
    
    if (winAmount > 0) {
        showWinAnimation(winAmount);
        coins += winAmount;
        if (winAmount > maxWin) maxWin = winAmount;
        updateCoins();
        
        // Entferne die Winner-Klasse nach der Animation
        setTimeout(() => {
            slots.forEach(slot => slot.classList.remove('winner'));
        }, 2000);
    } else if (coins <= 0) {
        showGameOver();
    }
}

// Win Animation
function showWinAnimation(amount) {
    const winAnimation = document.getElementById('winAnimation');
    winAnimation.querySelector('.win-amount').textContent = `+${amount}`;
    winAnimation.style.display = 'block';
    
    // Füge Glitzer-Effekte hinzu
    for (let i = 0; i < 10; i++) {
        const sparkle = document.createElement('div');
        sparkle.className = 'sparkle';
        sparkle.style.left = `${Math.random() * 100}%`;
        sparkle.style.top = `${Math.random() * 100}%`;
        sparkle.style.animationDelay = `${Math.random() * 1}s`;
        winAnimation.appendChild(sparkle);
    }
    
    setTimeout(() => {
        winAnimation.style.display = 'none';
        // Entferne alle Glitzer-Effekte
        winAnimation.querySelectorAll('.sparkle').forEach(s => s.remove());
    }, 2000);
    
    // Verbesserte Münz-Animation
    const coinSymbols = ['🪙', '💰', '💎'];
    const coinCount = Math.min(Math.floor(amount / 100), 20); // Maximale Anzahl der Münzen basierend auf Gewinn
    
    for (let i = 0; i < coinCount; i++) {
        setTimeout(() => {
            const coin = document.createElement('div');
            coin.className = 'coin-animation';
            coin.textContent = coinSymbols[Math.floor(Math.random() * coinSymbols.length)];
            coin.style.left = `${Math.random() * window.innerWidth}px`;
            document.body.appendChild(coin);
            
            // Entferne die Münze nach der Animation
            setTimeout(() => coin.remove(), 2000);
        }, i * 100); // Verzögere jede Münze leicht
    }
    
    // Partikel-Effekt
    for (let i = 0; i < 20; i++) {
        const particle = document.createElement('div');
        particle.className = 'win-particle';
        particle.textContent = '✨';
        particle.style.left = '50%';
        particle.style.top = '50%';
        
        // Zufällige Endposition
        const angle = (Math.random() * Math.PI * 2);
        const distance = 100 + Math.random() * 200;
        const endX = Math.cos(angle) * distance;
        const endY = Math.sin(angle) * distance;
        
        particle.style.setProperty('--endX', `${endX}px`);
        particle.style.setProperty('--endY', `${endY}px`);
        
        document.body.appendChild(particle);
        
        // Entferne Partikel nach Animation
        setTimeout(() => particle.remove(), 1500);
    }
}

// Game Over Screen
function showGameOver() {
    const modal = document.getElementById('gameOverModal');
    document.getElementById('maxWin').textContent = maxWin;
    document.getElementById('totalSpins').textContent = totalSpins;
    modal.style.display = 'flex';
    
    // Aktualisiere Highscore
    if (maxWin > highscore) {
        highscore = maxWin;
        localStorage.setItem('casinoHighscore', highscore);
        document.getElementById('highscore').textContent = highscore;
    }
}

// Spiel neu starten
function restartGame() {
    coins = 1000;
    currentBet = 50;
    totalSpins = 0;
    maxWin = 0;
    updateCoins();
    document.getElementById('gameOverModal').style.display = 'none';
}

// UI Updates
function updateCoins() {
    document.getElementById('coins').textContent = coins;
    document.getElementById('currentBet').textContent = currentBet;
    document.getElementById('winAmount').textContent = maxWin;
    document.getElementById('highscore').textContent = highscore;
}

// Event Listeners
document.getElementById('spinButton').addEventListener('click', spin);

document.getElementById('increaseBet').addEventListener('click', () => {
    if (currentBet < coins) {
        currentBet = Math.min(currentBet + 50, coins);
        updateCoins();
    }
});

document.getElementById('decreaseBet').addEventListener('click', () => {
    if (currentBet > 50) {
        currentBet = Math.max(currentBet - 50, 50);
        updateCoins();
    }
});

document.getElementById('restartGame').addEventListener('click', restartGame);

document.getElementById('returnToMenu').addEventListener('click', () => {
    window.location.href = 'index.html';
});

document.getElementById('backToMenu').addEventListener('click', () => {
    window.location.href = 'index.html';
});

// Tastatur-Steuerung
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && !isSpinning) {
        spin();
    }
});

// Event Listener für das Laden eines benutzerdefinierten Emote-Sets
document.getElementById('loadEmoteSet').addEventListener('click', () => {
    const emoteSetId = document.getElementById('emoteSetInput').value.trim();
    if (emoteSetId) {
        loadEmotes(emoteSetId);
    } else {
        alert('Bitte gib eine gültige Emote-Set ID ein');
    }
});

// Event Listener für das Emote-List Modal
document.getElementById('showEmoteList').addEventListener('click', () => {
    const modal = document.getElementById('emoteListModal');
    const emoteList = document.getElementById('emoteList');
    
    // Leere die Liste
    emoteList.innerHTML = '';
    
    // Bestimme die Anzahl der Emotes basierend auf der Set-Größe
    const emoteCount = getEmoteCountForAnimation(emotes.length);
    
    // Wähle zufällig genau emoteCount verschiedene Emotes aus
    const selectedEmotes = [];
    const usedIndices = new Set();
    
    while (selectedEmotes.length < emoteCount) {
        const index = Math.floor(Math.random() * emotes.length);
        if (!usedIndices.has(index)) {
            usedIndices.add(index);
            selectedEmotes.push(emotes[index]);
        }
    }
    
    // Füge nur die ausgewählten Emotes zur Liste hinzu
    selectedEmotes.forEach(emote => {
        const emoteItem = document.createElement('div');
        emoteItem.className = 'emote-item';
        emoteItem.innerHTML = `
            <img src="${emote.url}" alt="${emote.name}">
            <span>${emote.name}</span>
        `;
        emoteList.appendChild(emoteItem);
    });
    
    // Aktualisiere den Modal-Titel mit der Anzahl
    const modalTitle = modal.querySelector('.modal-title');
    modalTitle.textContent = `Aktuelle Emotes (${emoteCount})`;
    
    modal.style.display = 'flex';
});

document.getElementById('closeEmoteList').addEventListener('click', () => {
    document.getElementById('emoteListModal').style.display = 'none';
});

// Schließe das Modal auch wenn außerhalb geklickt wird
document.getElementById('emoteListModal').addEventListener('click', (e) => {
    if (e.target.id === 'emoteListModal') {
        e.target.style.display = 'none';
    }
});

// Starte das Spiel
loadEmotes(); 