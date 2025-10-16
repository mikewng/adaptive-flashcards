'use client'

import { use } from 'react';
import CardManagement from "../../../screens/cardmanagement/CardManagement";

export default function PublicDeckViewPage({ params }) {
  const { deckId } = use(params);
  return <CardManagement deckId={deckId} readOnly={true} />;
}
