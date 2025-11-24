'use server';

import { NextResponse } from 'next/server';
import { GeneratedQuiz, GeneratedQuestion, QuestionType } from '../../../types/quiz';
import { Difficulty } from '../../../quiz/types';

const QUIZ_GENERATION_PROMPT = `You are a quiz generator for lab manuals. Generate quiz questions based on the provided lab manual content.

Rules:
1. Only generate questions from information that is explicitly present in the content
2. Do NOT hallucinate or make up information
3. Generate a mix of question types: multiple choice, fill-in-the-blank, short answer, procedure ordering, safety-related, and calculation questions
4. Provide difficulty levels: Beginner (basic facts), Intermediate (application), Advanced (analysis/synthesis)
5. Include clear explanations for each answer
6. For calculations, provide the formula and steps if mentioned in the content

Return ONLY valid JSON in this format:
{
  "questions": [
    {
      "type": "multiple_choice" | "fill_in_blank" | "short_answer" | "procedure_ordering" | "safety_related" | "calculation",
      "difficulty": "Beginner" | "Intermediate" | "Advanced",
      "questionText": "Question text",
      "options": ["option1", "option2", "option3", "option4"], // Only for multiple choice
      "correctAnswer": "correct answer" | 0 | ["step1", "step2"], // String for text, number for index, array for ordering
      "explanation": "Why this answer is correct",
      "sourceSection": "Which section this came from",
      "tags": ["tag1", "tag2"]
    }
  ]
}

Generate 10-15 questions covering different sections and difficulty levels.`;

export async function POST(request: Request) {
  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json(
      { error: 'Missing Gemini API key on the server.' },
      { status: 500 }
    );
  }

  try {
    const { noteContent, sections } = await request.json();

    if (!noteContent) {
      return NextResponse.json({ error: 'No note content provided.' }, { status: 400 });
    }

    const sectionsText = sections
      ? sections.map((s: { type: string; title: string; content: string }) => `[${s.type}] ${s.title}\n${s.content}`).join('\n\n')
      : '';

    const prompt = `${QUIZ_GENERATION_PROMPT}\n\nLab Manual Content:\n${noteContent}\n\nSections:\n${sectionsText}\n\nGenerate quiz questions. Return ONLY valid JSON.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: prompt }],
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || 'Gemini API error');
    }

    const data = await response.json();
    const content = data?.candidates?.[0]?.content?.parts
      ?.map((part: { text?: string }) => part.text || '')
      .join(' ')
      .trim() || '{}';

    // Parse JSON from response
    let quizData: { questions: GeneratedQuestion[] };
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        quizData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch {
      // Fallback: generate basic questions
      quizData = {
        questions: [
          {
            id: '1',
            type: QuestionType.MULTIPLE_CHOICE,
            difficulty: Difficulty.BEGINNER,
            questionText: 'What is the main topic of this lab manual?',
            options: ['Pipetting', 'General Lab Safety', 'Unknown'],
            correctAnswer: 'Unknown',
            explanation: 'Please review the manual content.',
            sourceSection: 'general',
          },
        ],
      };
    }

    // Add IDs to questions
    const questions: GeneratedQuestion[] = quizData.questions.map((q, idx) => ({
      ...q,
      id: `q-${Date.now()}-${idx}`,
    }));

    const quiz: GeneratedQuiz = {
      id: `quiz-${Date.now()}`,
      noteId: '', // Will be set by caller
      title: 'Quiz from Lab Manual',
      questions,
      createdAt: new Date().toISOString(),
      difficulty: Difficulty.INTERMEDIATE,
      estimatedTime: Math.ceil(questions.length * 1.5),
    };

    return NextResponse.json(quiz);
  } catch (error) {
    console.error('Quiz generation error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate quiz.';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

