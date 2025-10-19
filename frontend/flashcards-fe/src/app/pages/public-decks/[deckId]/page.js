'use client'

import { use } from 'react';
import PublicDeckView from "../../../screens/publicdeckview/PublicDeckView";

export default function PublicDeckViewPage({ params }) {
  const { deckId } = use(params);
  return <PublicDeckView deckId={deckId} />;
}
