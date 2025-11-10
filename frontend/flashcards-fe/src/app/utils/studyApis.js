import { apiWrapper } from './apiWrapper';

class StudyApiService {

    // ========================================================================
    // NEW SESSION ENDPOINTS (matching backend implementation)
    // ========================================================================

    /**
     * Start a new study session
     * @param {number} deckId - The deck to study
     * @param {string} sessionType - Type of session (e.g., "writing", "multiple_choice")
     * @returns {Promise} Session object with id
     */
    async startStudySession(deckId, sessionType = "writing") {
        return apiWrapper.request(`/study/session/start`, {
            method: 'POST',
            body: JSON.stringify({
                deck_id: deckId,
                session_type: sessionType
            }),
        });
    }

    /**
     * End a study session and get analytics
     * @param {number} sessionId - The session to end
     * @returns {Promise} Session analytics
     */
    async endStudySession(sessionId) {
        return apiWrapper.request(`/study/session/end`, {
            method: 'POST',
            body: JSON.stringify({ session_id: sessionId }),
        });
    }

    /**
     * Get details of a specific session
     * @param {number} sessionId - The session ID
     * @returns {Promise} Session details
     */
    async getStudySession(sessionId) {
        return apiWrapper.request(`/study/session/${sessionId}`, {
            method: 'GET',
        });
    }

    /**
     * Get cards that are due for review
     * @param {number} deckId - The deck ID
     * @param {number} limit - Max number of cards to return
     * @param {boolean} shuffle - Whether to shuffle the cards
     * @returns {Promise} Array of cards with questions (answers hidden)
     */
    async getDueCards(deckId, limit = 20, shuffle = false) {
        return apiWrapper.request(`/study/deck/${deckId}/due?limit=${limit}&shuffle=${shuffle}`, {
            method: 'GET',
        });
    }

    /**
     * Get new cards (never studied before)
     * @param {number} deckId - The deck ID
     * @param {number} limit - Max number of cards to return
     * @param {boolean} shuffle - Whether to shuffle the cards
     * @returns {Promise} Array of new cards
     */
    async getNewCards(deckId, limit = 20, shuffle = false) {
        return apiWrapper.request(`/study/deck/${deckId}/new?limit=${limit}&shuffle=${shuffle}`, {
            method: 'GET',
        });
    }

    /**
     * Get all cards (for practice mode)
     * @param {number} deckId - The deck ID
     * @param {number} limit - Max number of cards to return
     * @param {boolean} shuffle - Whether to shuffle the cards
     * @returns {Promise} Array of all cards
     */
    async getAllCards(deckId, limit = 50, shuffle = false) {
        return apiWrapper.request(`/study/deck/${deckId}/all?limit=${limit}&shuffle=${shuffle}`, {
            method: 'GET',
        });
    }

    /**
     * Submit an answer with detailed metrics
     * @param {object} answerData - Answer submission data
     * @returns {Promise} Feedback with correct answer and similarity score
     */
    async submitAnswer(answerData) {
        return apiWrapper.request(`/study/submit`, {
            method: 'POST',
            body: JSON.stringify(answerData),
        });
    }

    // ========================================================================
    // LEGACY ENDPOINTS (for backwards compatibility)
    // ========================================================================

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
