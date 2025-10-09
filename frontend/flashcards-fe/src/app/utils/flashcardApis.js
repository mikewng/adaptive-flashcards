import { apiWrapper } from "./apiWrapper";

class FlashCardApiService {

    // DECK APIs
    async createDeck(deckContent) {
        return apiWrapper.request('/decks', {
            method: 'POST',
            body: JSON.stringify(deckContent),
        });
    }

    async getDecks() {
        return apiWrapper.request('/decks', {
            method: 'GET',
        });
    }

    async getDeckById(deckId) {
        return apiWrapper.request(`/decks/${deckId}`, {
            method: 'GET',
        });
    }

    async deleteDeckById(deckId) {
        return apiWrapper.request(`/decks/${deckId}`, {
            method: 'DELETE',
        });
    }

    // CARD APIs
    async createCard(deckId, cardContent) {
        return apiWrapper.request(`/cards`, {
            method: 'POST',
            body: JSON.stringify({ ...cardContent, deck_id: deckId }),
        });
    }

    async createCardMultiple(deckId, cardContent) {
        return apiWrapper.request(`/cards/multiple/${deckId}`, {
            method: 'POST',
        });
    }

    async getCardById(cardId) {
        return apiWrapper.request(`/cards/${cardId}`, {
            method: 'GET',
        });
    }

    async getCardsByDeckId(deckId) {
        return apiWrapper.request(`/cards/deck/${deckId}`, {
            method: 'GET',
        });
    }

    async updateCard(cardId, cardContent) {
        return apiWrapper.request(`/cards/${cardId}`, {
            method: 'PUT',
            body: JSON.stringify(cardContent),
        });
    }

    async deleteCardById(cardId) {
        return apiWrapper.request(`/cards/${cardId}`, {
            method: 'DELETE',
        });
    }
}

export const flashcardApiService = new FlashCardApiService();
