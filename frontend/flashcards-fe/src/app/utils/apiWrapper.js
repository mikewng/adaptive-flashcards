const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

class ApiWrapper {
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
}

export const apiWrapper = new ApiWrapper();