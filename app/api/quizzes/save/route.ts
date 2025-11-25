'use server';

import { NextResponse } from 'next/server';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../../utils/firebaseConfig';
import { GeneratedQuiz } from '../../../types/quiz';

export async function POST(request: Request) {
  try {
    const { userId, quiz } = await request.json();

    if (!userId || !quiz) {
      return NextResponse.json({ error: 'Missing userId or quiz data.' }, { status: 400 });
    }

    const quizId = quiz.id || `quiz-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const quizData: GeneratedQuiz = {
      ...quiz,
      id: quizId,
      createdAt: quiz.createdAt || new Date().toISOString(),
    };

    // Save to Firestore userQuizzes collection
    await setDoc(doc(db, 'userQuizzes', quizId), {
      ...quizData,
      userId,
    });

    return NextResponse.json({ success: true, quizId });
  } catch (error) {
    console.error('Save quiz error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to save quiz.';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}


