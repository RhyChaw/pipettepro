'use server';

import { NextResponse } from 'next/server';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../../utils/firebaseConfig';
import { FlashcardSet } from '../../../types/flashcards';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const noteId = searchParams.get('noteId');
    const userId = searchParams.get('userId');

    if (!noteId || !userId) {
      return NextResponse.json({ error: 'Missing noteId or userId.' }, { status: 400 });
    }

    // Get flashcard sets linked to this note
    const setsRef = collection(db, 'userFlashcards');
    const q = query(setsRef, where('userId', '==', userId), where('noteId', '==', noteId));
    const querySnapshot = await getDocs(q);
    const setsData: FlashcardSet[] = [];
    querySnapshot.forEach((doc) => {
      setsData.push({ id: doc.id, ...doc.data() } as FlashcardSet);
    });

    return NextResponse.json({ flashcardSets: setsData });
  } catch (error) {
    console.error('Get flashcards by note error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to get flashcards.';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}


