class EmotePet {
    constructor() {
        // Cache häufig verwendete DOM-Elemente
        this.statsElements = {
            health: document.getElementById('healthBar'),
            hunger: document.getElementById('hungerBar'),
            happiness: document.getElementById('happinessBar'),
            energy: document.getElementById('energyBar'),
            hygiene: document.getElementById('hygieneBar')
        };
        
        // Optimierte Stats-Initialisierung
        this.stats = {
            health: 100,
            hunger: 100,
            happiness: 100,
            energy: 100,
            hygiene: 100,
            xp: 0,
            level: 1,
            coins: 0
        };
        
        // Verbesserte Update-Intervalle
        this.updateInterval = 5000; // Alle 5 Sekunden statt jede Sekunde
        this.saveInterval = 30000;  // Alle 30 Sekunden speichern
        
        this.setupAutoSave();
        this.init();
    }

    setupAutoSave() {
        setInterval(() => this.saveData(), this.saveInterval);
    }
} 