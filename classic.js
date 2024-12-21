/* JavaScript for 7TV Emote Party */

// Warten auf DOM-Laden bevor wir initialisieren
document.addEventListener('DOMContentLoaded', () => {
    // Hauptvariablen
    let emotes = [];
    let movingEmotes = [];
    let animationStarted = false;
    let currentSettings = {
        count: 150,
        size: 96,
        speed: 2.5,
        changeOnBounce: false,
        emoteSetId: 'global',
        dvdStyle: false
    };
    let currentMode = 'normal';
    let matrix = [];

    // Canvas Setup
    const canvas = document.getElementById('background-canvas');
    const ctx = canvas.getContext('2d');

    // Hintergrund-Animationen
    let stars = [];

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        matrix = Array(Math.ceil(canvas.width / 20)).fill(0);
    }

    function drawRainbow() {
        const time = Date.now() * 0.001;
        const hue = (time * 10) % 360;
        ctx.fillStyle = `hsl(${hue}, 50%, 5%)`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    function drawMatrix() {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#0F0';
        ctx.font = '15px monospace';
        
        matrix.forEach((y, i) => {
            const char = String.fromCharCode(Math.random() * 128);
            const x = i * 20;
            ctx.fillText(char, x, y);
            
            if (y > canvas.height && Math.random() > 0.975) {
                matrix[i] = 0;
            } else {
                matrix[i] += 20;
            }
        });
    }

    function initStars() {
        stars = Array(200).fill().map(() => ({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            speed: Math.random() * 3 + 1,
            size: Math.random() * 2 + 1
        }));
    }

    function drawStars() {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = 'white';
        stars.forEach(star => {
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            ctx.fill();
            
            star.y += star.speed;
            if (star.y > canvas.height) {
                star.y = 0;
                star.x = Math.random() * canvas.width;
            }
        });
    }

    function animateBackground() {
        switch(currentMode) {
            case 'rainbow':
                drawRainbow();
                break;
            case 'stars':
                drawStars();
                break;
            default:
                ctx.fillStyle = '#1a1a1a';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        requestAnimationFrame(animateBackground);
    }

    // Emote-Funktionen
    async function fetchEmotes() {
        try {
            let url;
            if (currentSettings.emoteSetId === 'global') {
                url = 'https://7tv.io/v3/emote-sets/global';
            } else {
                url = `https://7tv.io/v3/emote-sets/${currentSettings.emoteSetId}`;
            }

            const response = await fetch(url);
            const data = await response.json();
            
            const emoteArray = data.emotes || data.items || [];
            
            emotes = emoteArray.map(emote => ({
                name: emote.name,
                url: `https://cdn.7tv.app/emote/${emote.id}/4x.webp`
            }));
            
            if (emotes.length === 0) {
                throw new Error('Keine Emotes im Set gefunden');
            }
            
            document.getElementById('loading').style.display = 'none';
            initializeEmotes();
        } catch (error) {
            console.error('Fehler beim Laden der Emotes:', error);
            document.getElementById('loading').textContent = 
                'Fehler beim Laden der Emotes. Bitte überprüfen Sie die Set-ID und laden Sie die Seite neu.';
        }
    }

    class MovingEmote {
        constructor() {
            this.element = document.createElement('img');
            this.element.className = 'emote';
            this.element.style.width = currentSettings.size + 'px';
            this.element.style.height = currentSettings.size + 'px';
            this.element.style.zIndex = '1000';
            this.element.style.position = 'absolute';
            
            this.element.onerror = () => {
                console.error('Fehler beim Laden des Emotes');
                this.changeEmote();
            };
            
            const randomEmote = emotes[Math.floor(Math.random() * emotes.length)];
            this.element.src = randomEmote.url;
            this.element.title = randomEmote.name;
            
            this.x = Math.random() * (window.innerWidth - currentSettings.size);
            this.y = Math.random() * (window.innerHeight - currentSettings.size);

            if (currentSettings.dvdStyle) {
                const speed = currentSettings.speed * 2;
                const angle = Math.random() * Math.PI * 2;
                this.speedX = Math.cos(angle) * speed;
                this.speedY = Math.sin(angle) * speed;
            } else {
                this.speedX = (Math.random() - 0.5) * currentSettings.speed;
                this.speedY = (Math.random() - 0.5) * currentSettings.speed;
            }
            
            this.rotation = Math.random() * 360;
            this.rotationSpeed = currentSettings.dvdStyle ? 0 : (Math.random() - 0.5) * 2;
            
            this.updatePosition();
            
            this.element.addEventListener('click', () => this.changeEmote());
            document.getElementById('emotes-container').appendChild(this.element);
        }

        updatePosition() {
            this.element.style.left = this.x + 'px';
            this.element.style.top = this.y + 'px';
            if (!currentSettings.dvdStyle) {
                this.element.style.transform = `rotate(${this.rotation}deg)`;
            }
        }

        move() {
            this.x += this.speedX;
            this.y += this.speedY;

            if (!currentSettings.dvdStyle) {
                this.rotation += this.rotationSpeed;
            }

            let bounced = false;

            if (this.x <= 0 || this.x >= window.innerWidth - currentSettings.size) {
                this.speedX *= -1;
                bounced = true;
            }
            if (this.y <= 0 || this.y >= window.innerHeight - currentSettings.size) {
                this.speedY *= -1;
                bounced = true;
            }

            if (bounced && currentSettings.changeOnBounce) {
                this.changeEmote();
            }

            this.updatePosition();
        }

        changeEmote() {
            let newEmote;
            do {
                newEmote = emotes[Math.floor(Math.random() * emotes.length)];
            } while (newEmote.url === this.element.src);
            
            this.element.src = newEmote.url;
            this.element.title = newEmote.name;
            
            this.element.style.transform = 'scale(1.2)';
            setTimeout(() => {
                if (!currentSettings.dvdStyle) {
                    this.element.style.transform = `rotate(${this.rotation}deg)`;
                } else {
                    this.element.style.transform = 'none';
                }
            }, 200);
        }
    }

    function initializeEmotes() {
        const container = document.getElementById('emotes-container');
        container.innerHTML = '';
        
        movingEmotes = Array.from({ length: currentSettings.count }, () => new MovingEmote());
        if (!animationStarted) {
            animate();
            animationStarted = true;
        }
    }

    function animate() {
        movingEmotes.forEach(emote => emote.move());
        requestAnimationFrame(animate);
    }

    // Event Listeners
    window.addEventListener('resize', resizeCanvas);

    document.getElementById('toggleSettings').addEventListener('click', () => {
        const settings = document.getElementById('settings');
        settings.style.display = settings.style.display === 'none' ? 'block' : 'none';
    });

    document.getElementById('applySettings').addEventListener('click', () => {
        currentSettings.count = parseInt(document.getElementById('emoteCount').value);
        currentSettings.size = parseInt(document.getElementById('emoteSize').value);
        currentSettings.speed = parseFloat(document.getElementById('emoteSpeed').value);
        currentSettings.changeOnBounce = document.getElementById('changeOnBounce').checked;
        currentSettings.dvdStyle = document.getElementById('dvdStyle').checked;
        
        const newEmoteSetId = document.getElementById('emoteSetId').value.trim();
        if (newEmoteSetId !== currentSettings.emoteSetId) {
            currentSettings.emoteSetId = newEmoteSetId;
            document.getElementById('loading').style.display = 'block';
            document.getElementById('loading').textContent = 'Lade neue Emotes...';
            fetchEmotes();
        } else {
            initializeEmotes();
        }
    });

    document.getElementById('randomizeAll').addEventListener('click', () => {
        movingEmotes.forEach(emote => emote.changeEmote());
    });

    document.getElementById('backToMenu').addEventListener('click', () => {
        window.location.href = '7tvDVD.html';
    });

    document.getElementById('modes').addEventListener('click', (e) => {
        const button = e.target.closest('.mode-button');
        if (button && button.dataset.mode) {
            currentMode = button.dataset.mode;
            if (currentMode === 'stars') initStars();
            
            document.querySelectorAll('.mode-button').forEach(btn => {
                btn.classList.remove('active');
            });
            button.classList.add('active');
        }
    });

    document.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        movingEmotes.forEach(emote => emote.changeEmote());
    });

    document.addEventListener('keydown', (e) => {
        switch(e.key) {
            case 'Escape':
                const settings = document.getElementById('settings');
                settings.style.display = settings.style.display === 'none' ? 'block' : 'none';
                break;
            case ' ':
                movingEmotes.forEach(emote => emote.changeEmote());
                break;
        }
    });

    // Initialisierung
    resizeCanvas();
    initStars();
    animateBackground();
    fetchEmotes();

    // Lade Einstellungen
    document.getElementById('emoteCount').value = currentSettings.count;
    document.getElementById('emoteSize').value = currentSettings.size;
    document.getElementById('emoteSpeed').value = currentSettings.speed;
    document.getElementById('changeOnBounce').checked = currentSettings.changeOnBounce;
    document.getElementById('dvdStyle').checked = currentSettings.dvdStyle;
    document.getElementById('emoteSetId').value = currentSettings.emoteSetId;
});
