const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

class ApiWrapper {
    constructor() {
        this.isRefreshing = false;
        this.failedQueue = [];
    }

    processQueue(error, token = null) {
        this.failedQueue.forEach(prom => {
            if (error) {
                prom.reject(error);
            } else {
                prom.resolve(token);
            }
        });
        this.failedQueue = [];
    }

    async refreshAccessToken() {
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) {
            throw new Error('No refresh token available');
        }

        try {
            const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ refresh_token: refreshToken }),
            });

            if (!response.ok) {
                throw new Error('Failed to refresh token');
            }

            const data = await response.json();
            localStorage.setItem('access_token', data.access_token);
            localStorage.setItem('refresh_token', data.refresh_token);

            return data.access_token;
        } catch (error) {
            // Refresh failed - clear tokens and redirect to login
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');

            // Trigger a custom event that the auth context can listen to
            window.dispatchEvent(new Event('token-expired'));

            throw error;
        }
    }

    async request(endpoint, options = {}) {
        const url = `${API_BASE_URL}${endpoint}`;
        const token = options.skipAuth ? null : localStorage.getItem('access_token');

        const config = {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
                ...(token && !options.skipAuth ? { Authorization: `Bearer ${token}` } : {}),
            },
        };

        try {
            const response = await fetch(url, config);

            // Handle 401 - token expired or invalid
            if (response.status === 401 && !options.skipAuth && !options._isRetry) {
                // If already refreshing, queue this request
                if (this.isRefreshing) {
                    return new Promise((resolve, reject) => {
                        this.failedQueue.push({ resolve, reject });
                    })
                        .then(token => {
                            return this.request(endpoint, { ...options, _isRetry: true });
                        })
                        .catch(err => {
                            throw err;
                        });
                }

                this.isRefreshing = true;

                try {
                    const newToken = await this.refreshAccessToken();
                    this.processQueue(null, newToken);
                    this.isRefreshing = false;

                    // Retry original request with new token
                    return this.request(endpoint, { ...options, _isRetry: true });
                } catch (refreshError) {
                    this.processQueue(refreshError, null);
                    this.isRefreshing = false;
                    throw refreshError;
                }
            }

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