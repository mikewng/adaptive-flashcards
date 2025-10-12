'use client'

import { useParams } from 'next/navigation';
import MultipleChoiceStudy from "../../../../../screens/study/MultipleChoiceStudy";
import ProtectedRoute from "../../../../../components/ProtectedRoute";

export default function MultipleChoiceStudyPage() {
  const params = useParams();
  const deckId = params.deckId;

  return (
    <ProtectedRoute>
      <MultipleChoiceStudy deckId={deckId} />
    </ProtectedRoute>
  );
}
