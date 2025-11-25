'use server';

import { NextResponse } from 'next/server';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../../utils/firebaseConfig';
import { FlashcardSet } from '../../../types/flashcards';

export async function POST(request: Request) {
  try {
    const { userId, flashcardSet } = await request.json();

    if (!userId || !flashcardSet) {
      return NextResponse.json({ error: 'Missing userId or flashcardSet data.' }, { status: 400 });
    }

    const setId = flashcardSet.id || `set-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const setData: FlashcardSet = {
      ...flashcardSet,
      id: setId,
      userId,
      createdAt: flashcardSet.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Save to Firestore userFlashcards collection
    await setDoc(doc(db, 'userFlashcards', setId), setData);

    return NextResponse.json({ success: true, setId });
  } catch (error) {
    console.error('Save flashcard set error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to save flashcard set.';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}


