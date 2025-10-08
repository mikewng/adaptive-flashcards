'use client'

import { useParams } from 'next/navigation';
import Study from "../../../../screens/study/Study";

export default function StudyPage() {
  const params = useParams();
  const deckId = params.deckId;

  return <Study deckId={deckId} />;
}
