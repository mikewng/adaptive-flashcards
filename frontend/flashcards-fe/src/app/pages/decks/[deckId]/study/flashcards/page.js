'use client'

import { useParams } from 'next/navigation';
import FlashcardsStudy from "../../../../../screens/study/FlashcardsStudy";
import ProtectedRoute from "../../../../../components/ProtectedRoute";

export default function FlashcardsStudyPage() {
  const params = useParams();
  const deckId = params.deckId;

  return (
    <ProtectedRoute>
      <FlashcardsStudy deckId={deckId} />
    </ProtectedRoute>
  );
}
