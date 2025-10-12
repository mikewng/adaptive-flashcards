'use client'

import { useParams } from 'next/navigation';
import WritingStudy from "../../../../../screens/study/WritingStudy";
import ProtectedRoute from "../../../../../components/ProtectedRoute";

export default function WritingStudyPage() {
  const params = useParams();
  const deckId = params.deckId;

  return (
    <ProtectedRoute>
      <WritingStudy deckId={deckId} />
    </ProtectedRoute>
  );
}
