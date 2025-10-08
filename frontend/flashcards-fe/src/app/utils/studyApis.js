import { apiWrapper } from './apiWrapper';

class StudyApiService {

    async startSession(deckId, options) {
        return apiWrapper.request('/study/session/start', {
            method: 'POST',
            body: JSON.stringify({ deck_id: deckId, ...options })
        });
    }

    async endSession(sessionId) {
        return apiWrapper.request('/study/session/end', {
            method: 'POST',
            body: JSON.stringify({ session_id: sessionId })
        });
    }

    async getSession(sessionId) {
        return apiWrapper.request(`/study/session/${sessionId}`, {
            method: 'GET'
        });
    }

    async getDueCards(deckId, limit = 20) {
        return apiWrapper.request(`/study/deck/${deckId}/due?limit=${limit}`, {
            method: 'GET'
        });
    }

    async getNewCards(deckId, limit = 5) {
        return apiWrapper.request(`/study/deck/${deckId}/new?limit=${limit}`, {
            method: 'GET'
        });
    }

    async submitAnswer(payload) {
        return apiWrapper.request('/study/submit', {
            method: 'POST',
            body: JSON.stringify(payload)
        });
    }

    // Analytics
    async getDeckAnalytics(deckId) {
        return apiWrapper.request(`/study/analytics/deck/${deckId}`, {
            method: 'GET'
        });
    }

    async getUserAnalytics() {
        return apiWrapper.request('/study/analytics/user', {
            method: 'GET'
        });
    }

    async getCardAnalytics(cardId) {
        return apiWrapper.request(`/study/analytics/card/${cardId}`, {
            method: 'GET'
        });
    }
}

export const studyApiService = new StudyApiService();
