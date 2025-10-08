'use client'

import { useParams } from 'next/navigation';
import CardManagement from "../../../screens/cardmanagement/CardManagement";
import ProtectedRoute from "../../../components/ProtectedRoute";

export default function DeckCardsPage() {
  const params = useParams();
  const deckId = params.deckId;

  return (
    <ProtectedRoute>
      <CardManagement deckId={deckId} />
    </ProtectedRoute>
  );
}
