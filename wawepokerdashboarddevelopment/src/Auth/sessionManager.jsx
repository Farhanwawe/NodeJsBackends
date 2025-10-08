class SessionManager {
    constructor(timeout = 60 * 60 * 1000) { // 1 hour
        this.timeout = timeout;
        this.token = null;
        this.username = null;
        this.expirationTime = null;
        this.activityTimeout = null;
        this.role= null;
        this.userId = null;
    }

    setToken(token, username, email,role,userId) {
        const currentTime = new Date().getTime();
        const expiration = currentTime + this.timeout;  // Expire in 1 hour

        this.token = token;
        this.expirationTime = expiration;
        this.username = username;
        this.role = role;
        this.userId = userId;

        localStorage.setItem('jwtToken', token);
        localStorage.setItem('jwtExpiration', expiration);
        localStorage.setItem('username', username);
        localStorage.setItem('useremail', email);
        localStorage.setItem('role', role);
        localStorage.setItem('userId', userId);

        this.resetActivityTimeout();  // Reset activity timeout for session expiration
    }

    getToken() {
        return this.token || localStorage.getItem('jwtToken');
    }

    getUsername() {
        return this.username || localStorage.getItem('username');
    }

    getemail() {
        return localStorage.getItem('useremail');
    }

    getRole() {
        return this.role || localStorage.getItem('role');
    }
    getUserId() {
        return this.userId || localStorage.getItem('userId');
    }
    getUser() {
        return {
            username: this.getUsername(),
            email: this.getemail(),
            role: this.getRole(),
            userId: this.getUserId()

        };
    }
    isSessionActive() {
        const expiration = this.expirationTime || localStorage.getItem('jwtExpiration');
        return expiration && new Date().getTime() < parseInt(expiration, 10);
    }

    clearSession() {
        this.token = null;
        this.expirationTime = null;
        this.username = null;
        localStorage.removeItem('jwtToken');
        localStorage.removeItem('jwtExpiration');
        localStorage.removeItem('username');
        localStorage.removeItem('useremail');
        localStorage.removeItem('role');
        localStorage.removeItem('userId');
        clearTimeout(this.activityTimeout);
    }

    resetActivityTimeout() {
        clearTimeout(this.activityTimeout);
        if (this.isSessionActive()) {
            this.activityTimeout = setTimeout(() => this.clearSession(), this.timeout);
        }
    }

    init() {
        window.addEventListener('click', () => this.resetActivityTimeout());
        window.addEventListener('keypress', () => this.resetActivityTimeout());
    }
}

const sessionManager = new SessionManager();
sessionManager.init();

export default sessionManager;