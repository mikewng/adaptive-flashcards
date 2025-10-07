'use client'

import { useParams } from 'next/navigation';
import CardManagement from "../../../screens/cardmanagement/CardManagement";

export default function DeckCardsPage() {
  const params = useParams();
  const deckId = params.deckId;

  return <CardManagement deckId={deckId} />;
}
