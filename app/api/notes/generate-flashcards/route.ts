'use server';

import { NextResponse } from 'next/server';
import { Flashcard, FlashcardSet } from '../../../types/flashcards';

const FLASHCARD_GENERATION_PROMPT = `You are a flashcard generator for lab manuals. Generate flashcards based on the provided lab manual content.

Rules:
1. Only generate flashcards from information that is explicitly present in the content
2. Do NOT hallucinate or make up information
3. Create flashcards covering:
   - Key terms and definitions
   - Important concepts
   - Procedure steps
   - Safety information
   - Calculations and formulas
   - Equipment names and uses
4. Each flashcard should have:
   - Front: A question, term, or concept
   - Back: The answer, definition, or explanation
5. Generate 15-25 flashcards covering different sections

Return ONLY valid JSON in this format:
{
  "flashcards": [
    {
      "front": "Question or term",
      "back": "Answer or definition",
      "tags": ["tag1", "tag2"],
      "difficulty": "easy" | "medium" | "hard"
    }
  ]
}`;

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

    const prompt = `${FLASHCARD_GENERATION_PROMPT}\n\nLab Manual Content:\n${noteContent}\n\nSections:\n${sectionsText}\n\nGenerate flashcards. Return ONLY valid JSON.`;

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
    let flashcardData: { flashcards: Omit<Flashcard, 'id'>[] };
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        flashcardData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch {
      // Fallback: generate basic flashcards
      flashcardData = {
        flashcards: [
          {
            front: 'What is the main topic of this lab manual?',
            back: 'Review the manual content for details.',
            tags: ['general'],
            difficulty: 'easy',
          },
        ],
      };
    }

    // Add IDs to flashcards
    const flashcards: Flashcard[] = flashcardData.flashcards.map((fc, idx) => ({
      ...fc,
      id: `fc-${Date.now()}-${idx}`,
    }));

    const flashcardSet: FlashcardSet = {
      id: `set-${Date.now()}`,
      noteId: '', // Will be set by caller
      userId: '', // Will be set by caller
      title: 'Flashcards from Lab Manual',
      flashcards,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json(flashcardSet);
  } catch (error) {
    console.error('Flashcard generation error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate flashcards.';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}


