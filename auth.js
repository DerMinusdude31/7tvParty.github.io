const CONFIG = {
    TWITCH_CLIENT_ID: '', // Hier deine Client-ID eintragen
    REDIRECT_URI: '', // Hier deine Redirect URI eintragen
    API_BASE_URL: 'https://api.twitch.tv/helix'
};

class TwitchAuth {
    constructor() {
        // Prüfe ob Konfiguration vorhanden
        if (!CONFIG.TWITCH_CLIENT_ID || !CONFIG.REDIRECT_URI) {
            console.error('Twitch Konfiguration fehlt! Bitte config.js ausfüllen.');
            this.showConfigError();
            return;
        }
        
        this.checkAuth();
        this.setupEventListeners();
    }

    showConfigError() {
        const loginBtn = document.getElementById('twitchLogin');
        loginBtn.disabled = true;
        loginBtn.innerHTML = `
            <span class="icon">⚠️</span>
            <span class="text">Konfiguration fehlt</span>
        `;
    }

    setupEventListeners() {
        document.getElementById('twitchLogin')?.addEventListener('click', () => this.login());
        document.getElementById('logout')?.addEventListener('click', () => this.logout());
    }

    login() {
        const scope = 'user:read:email';
        const authUrl = `https://id.twitch.tv/oauth2/authorize?client_id=${CONFIG.TWITCH_CLIENT_ID}&redirect_uri=${CONFIG.REDIRECT_URI}&response_type=token&scope=${scope}`;
        window.location.href = authUrl;
    }

    async checkAuth() {
        const accessToken = localStorage.getItem('twitch_access_token');
        if (accessToken) {
            try {
                const userData = await this.getUserData(accessToken);
                this.showUserInfo(userData);
            } catch (error) {
                console.error('Auth check failed:', error);
                this.logout();
            }
        }
    }

    async getUserData(accessToken) {
        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}/users`, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Client-Id': CONFIG.TWITCH_CLIENT_ID
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (!data.data || !data.data[0]) {
                throw new Error('Invalid user data received');
            }
            
            return data.data[0];
        } catch (error) {
            console.error('Failed to fetch user data:', error);
            this.showError('Fehler beim Laden der Benutzerdaten. Bitte später erneut versuchen.');
            return null;
        }
    }

    showUserInfo(userData) {
        document.getElementById('twitchLogin').style.display = 'none';
        document.getElementById('userInfo').style.display = 'flex';
        document.getElementById('userAvatar').src = userData.profile_image_url;
        document.getElementById('userName').textContent = userData.display_name;
    }

    logout() {
        localStorage.removeItem('twitch_access_token');
        document.getElementById('twitchLogin').style.display = 'flex';
        document.getElementById('userInfo').style.display = 'none';
    }

    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        document.body.appendChild(errorDiv);
        setTimeout(() => errorDiv.remove(), 5000);
    }
}

// Callback-Handler
if (window.location.hash) {
    const params = new URLSearchParams(window.location.hash.slice(1));
    const accessToken = params.get('access_token');
    if (accessToken) {
        localStorage.setItem('twitch_access_token', accessToken);
        window.location.href = '/'; // Zurück zur Hauptseite
    }
}

// Initialisiere Auth
const twitchAuth = new TwitchAuth(); 