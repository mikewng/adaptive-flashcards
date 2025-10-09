import { apiWrapper } from './apiWrapper';

class StudyApiService {

    async startStudySession(deckId, studyMode) {
        return apiWrapper.request(`/study/sessions`, {
            method: 'POST',
            body: JSON.stringify({ deckId, studyMode }),
        });
    }

    async getStudySessionCards(deckId, sessionId) {
        const params = new URLSearchParams();
        if (deckId) params.append('deckId', deckId);
        if (sessionId) params.append('sessionId', sessionId);

        return apiWrapper.request(`/study/next?${params.toString()}`, {
            method: 'GET',
        });
    }

    async reviewCard(reviewData) {
        return apiWrapper.request(`/study/review`, {
            method: 'POST',
            body: JSON.stringify(reviewData),
        });
    }

    async endStudySession(sessionId) {
        return apiWrapper.request(`/study/sessions/${sessionId}/end`, {
            method: 'POST',
        });
    }

    async getSessionStats(sessionId) {
        return apiWrapper.request(`/study/sessions/${sessionId}/stats`, {
            method: 'GET',
        });
    }

    async getStudyHistory(deckId) {
        return apiWrapper.request(`/study/history/${deckId}`, {
            method: 'GET',
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
