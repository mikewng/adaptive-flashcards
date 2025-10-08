'use client'

import { useParams } from 'next/navigation';
import StudySession from "../../../../screens/study/StudySession";
import ProtectedRoute from "../../../../components/ProtectedRoute";

export default function StudyPage() {
  const params = useParams();
  const deckId = params.deckId;

  return (
    <ProtectedRoute>
      <StudySession deckId={deckId} />
    </ProtectedRoute>
  );
}
