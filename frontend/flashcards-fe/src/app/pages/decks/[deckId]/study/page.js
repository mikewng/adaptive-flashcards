'use client'

import { useParams } from 'next/navigation';
import StudySession from "../../../../screens/study/StudySession";

export default function StudyPage() {
  const params = useParams();
  const deckId = params.deckId;

  return <StudySession deckId={deckId} />;
}
