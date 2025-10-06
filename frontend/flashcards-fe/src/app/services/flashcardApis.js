// API Configuration and Helper Functions
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

class ApiService {
    async request(endpoint, options = {}) {
        const url = `${API_BASE_URL}${endpoint}`;
        const token = localStorage.getItem('access_token');

        const config = {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
        };

        try {
            const response = await fetch(url, config);

            if (!response.ok) {
                const error = await response.json().catch(() => ({ detail: 'An error occurred' }));
                throw new Error(error.detail || `HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    }

    // Authentication endpoints
    async login(email, password) {
        const formData = new URLSearchParams();
        formData.append('username', email);
        formData.append('password', password);

        return this.request('/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: formData,
        });
    }

    async register(email, password) {
        return this.request('/register', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });
    }

    async getCurrentUser() {
        return this.request('/me', {
            method: 'GET',
        });
    }

    // Deck endpoints (for future use)
    async getDecks() {
        return this.request('/decks', {
            method: 'GET',
        });
    }

    async getDeck(deckId) {
        return this.request(`/decks/${deckId}`, {
            method: 'GET',
        });
    }
}

export const apiService = new ApiService();
