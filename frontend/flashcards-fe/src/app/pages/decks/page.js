'use client'

import DeckView from "../../screens/deckview/DeckView";
import ProtectedRoute from "../../components/ProtectedRoute";

export default function DecksPage() {
  return (
    <ProtectedRoute>
      <DeckView />
    </ProtectedRoute>
  );
}
