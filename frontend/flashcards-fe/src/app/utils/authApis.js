import { apiWrapper } from "./apiWrapper";

class AuthApiService {
    async login(email, password) {
        const formData = new URLSearchParams();
        formData.append('username', email);
        formData.append('password', password);

        return apiWrapper.request('/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: formData,
        });
    }

    async register(email, password, firstName = null, lastName = null, timezone = 'UTC') {
        return apiWrapper.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify({
                email,
                password,
                first_name: firstName,
                last_name: lastName,
                timezone
            }),
        });
    }

    async getCurrentUser() {
        return apiWrapper.request('/auth/me', {
            method: 'GET',
        });
    }

    async updateProfile(updates) {
        return apiWrapper.request('/auth/me', {
            method: 'PATCH',
            body: JSON.stringify(updates),
        });
    }

    async refreshToken(refreshToken) {
        return apiWrapper.request('/auth/refresh', {
            method: 'POST',
            body: JSON.stringify({ refresh_token: refreshToken }),
            skipAuth: true, // Don't include access token in this request
        });
    }

    async logout(refreshToken) {
        return apiWrapper.request('/auth/logout', {
            method: 'POST',
            body: JSON.stringify({ refresh_token: refreshToken }),
        });
    }
}

export const authApiService = new AuthApiService();
