const GAME_CONFIG = {
    POINTS: {
        GOAL: 1,              // 1 Punkt pro Tor
        MAX_SCORE: 10         // Spiel endet bei 10 Punkten
    },
    PAUSE: {
        DURATION: 3000,       // 3 Sekunden Pause nach Tor
        BUFFER: 500          // Extra Puffer für Pause-Ende
    }
};

class EmotePet {
    constructor() {
        // Basis-Spielzustand
        this.gameState = {
            isActive: false,      // Spiel läuft
            isPaused: false,      // Pause aktiv
            pauseUntil: 0,        // Pause-Ende Zeitstempel
            winner: null          // Gewinner (wenn Spiel vorbei)
        };

        // Spieler-Status
        this.players = {
            player1: { score: 0 },
            player2: { score: 0 }
        };

        // Event Listener für Tastatur deaktivieren
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                e.preventDefault();
                return false;
            }
        });

        // Score Display initialisieren
        this.initScoreDisplay();
    }

    // Score-Anzeige erstellen
    initScoreDisplay() {
        const scoreDisplay = document.createElement('div');
        scoreDisplay.className = 'score-display';
        scoreDisplay.innerHTML = `
            <div id="player1Score">Spieler 1: 0</div>
            <div id="player2Score">Spieler 2: 0</div>
        `;
        document.body.appendChild(scoreDisplay);
    }

    // Spiel starten
    startGame() {
        this.gameState.isActive = true;
        this.resetScores();
        this.updateDisplay();
    }

    // Scores zurücksetzen
    resetScores() {
        this.players.player1.score = 0;
        this.players.player2.score = 0;
        this.gameState.winner = null;
        this.updateDisplay();
    }

    // Prüfen ob Spiel pausiert ist
    isPaused() {
        const now = Date.now();
        return this.gameState.isPaused || 
               now < this.gameState.pauseUntil || 
               now < this.gameState.pauseUntil + GAME_CONFIG.PAUSE.BUFFER;
    }

    // Tor erzielen (nur vom Spielsystem aufgerufen)
    handleGoal(playerId) {
        if (!this.gameState.isActive || this.isPaused()) {
            return false;
        }

        // Pause aktivieren
        this.gameState.isPaused = true;
        this.gameState.pauseUntil = Date.now() + GAME_CONFIG.PAUSE.DURATION;

        // Punkt hinzufügen
        this.players[playerId].score += GAME_CONFIG.POINTS.GOAL;
        
        // UI aktualisieren
        this.updateDisplay();
        this.showGoalAnimation(playerId);
        this.showPauseOverlay();

        // Prüfe auf Gewinner
        if (this.players[playerId].score >= GAME_CONFIG.POINTS.MAX_SCORE) {
            this.handleWin(playerId);
            return;
        }

        // Pause nach Ablauf aufheben
        setTimeout(() => {
            this.gameState.isPaused = false;
            this.gameState.pauseUntil = 0;
            this.hidePauseOverlay();
        }, GAME_CONFIG.PAUSE.DURATION);
    }

    // Gewinner behandeln
    handleWin(playerId) {
        this.gameState.isActive = false;
        this.gameState.winner = playerId;
        this.showWinScreen(playerId);
    }

    // UI Updates
    updateDisplay() {
        document.getElementById('player1Score').textContent = 
            `Spieler 1: ${this.players.player1.score}`;
        document.getElementById('player2Score').textContent = 
            `Spieler 2: ${this.players.player2.score}`;
    }

    showGoalAnimation(playerId) {
        const goalAnim = document.createElement('div');
        goalAnim.className = 'goal-animation';
        goalAnim.textContent = 'TOR!';
        goalAnim.style.top = playerId === 'player1' ? '20%' : '70%';
        document.body.appendChild(goalAnim);
        setTimeout(() => goalAnim.remove(), 2000);
    }

    showPauseOverlay() {
        const overlay = document.createElement('div');
        overlay.id = 'pauseOverlay';
        overlay.className = 'pause-overlay';
        overlay.textContent = 'PAUSE';
        document.body.appendChild(overlay);
    }

    hidePauseOverlay() {
        const overlay = document.getElementById('pauseOverlay');
        if (overlay) overlay.remove();
    }

    showWinScreen(playerId) {
        const winScreen = document.createElement('div');
        winScreen.className = 'win-screen';
        winScreen.innerHTML = `
            <h2>${playerId === 'player1' ? 'Spieler 1' : 'Spieler 2'} gewinnt!</h2>
            <button id="newGame" class="menu-button">Neues Spiel</button>
        `;
        document.body.appendChild(winScreen);

        document.getElementById('newGame').addEventListener('click', () => {
            winScreen.remove();
            this.startGame();
        });
    }

    showPauseMenu() {
        const pauseMenu = document.createElement('div');
        pauseMenu.className = 'pause-menu';
        pauseMenu.innerHTML = `
            <div class="pause-menu-content">
                <button class="pause-button" id="continueGame">
                    <span class="icon">▶️</span>
                    Weiter
                </button>
                <button class="pause-button" id="restartGame">
                    <span class="icon">🔄</span>
                    Restart
                </button>
                <button class="pause-button" id="backToMainMenu">
                    <span class="icon">🏠</span>
                    Menü
                </button>
            </div>
        `;
        document.body.appendChild(pauseMenu);

        // Event Listener
        document.getElementById('continueGame').addEventListener('click', () => {
            this.hidePauseMenu();
            this.gameState.isPaused = false;
        });

        document.getElementById('restartGame').addEventListener('click', () => {
            this.hidePauseMenu();
            this.resetScores();
            this.startGame();
        });

        document.getElementById('backToMainMenu').addEventListener('click', () => {
            window.location.href = 'index.html';
        });
    }

    hidePauseMenu() {
        const menu = document.querySelector('.pause-menu');
        if (menu) menu.remove();
    }
} 