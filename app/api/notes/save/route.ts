'use server';

import { NextResponse } from 'next/server';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../../../utils/firebaseConfig';
import { ExtractedNote } from '../../../types/notes';

export async function POST(request: Request) {
  try {
    const { userId, note } = await request.json();

    if (!userId || !note) {
      return NextResponse.json({ error: 'Missing userId or note data.' }, { status: 400 });
    }

    const noteId = note.id || `note-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const noteData: ExtractedNote = {
      ...note,
      id: noteId,
      userId,
      createdAt: note.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Save to Firestore userNotes collection (top-level)
    await setDoc(doc(db, 'userNotes', noteId), {
      ...noteData,
      userId,
    });

    return NextResponse.json({ success: true, noteId });
  } catch (error) {
    console.error('Save note error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to save note.';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const { noteId, updates } = await request.json();

    if (!noteId || !updates) {
      return NextResponse.json({ error: 'Missing noteId or updates.' }, { status: 400 });
    }

    // Update note in Firestore
    await setDoc(doc(db, 'userNotes', noteId), {
      ...updates,
      updatedAt: new Date().toISOString(),
    }, { merge: true });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update note error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to update note.';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const noteId = searchParams.get('noteId');

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId.' }, { status: 400 });
    }

    if (noteId) {
      // Get single note
      const noteDoc = await getDoc(doc(db, 'userNotes', noteId));
      if (!noteDoc.exists()) {
        return NextResponse.json({ error: 'Note not found.' }, { status: 404 });
      }
      return NextResponse.json({ note: noteDoc.data() });
    } else {
      // Get all notes for user (would need collection query in production)
      return NextResponse.json({ notes: [] }); // Placeholder
    }
  } catch (error) {
    console.error('Get note error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to get note.';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

