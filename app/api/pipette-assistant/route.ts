'use server';

import { NextResponse } from 'next/server';

const SYSTEM_PROMPT = `You are PipettePal, a friendly laboratory assistant focused exclusively on pipettes,
pipetting techniques, volumetric accuracy, pipette maintenance, and glossary definitions.
Keep answers short (max 4 sentences), practical, and tied to pipetting context. If asked
about unrelated topics, gently steer the user back to pipetting.`;

interface ChatMessage {
  role: 'assistant' | 'user';
  content: string;
}

export async function POST(request: Request) {
  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json(
      { error: 'Missing Gemini API key on the server.' },
      { status: 500 }
    );
  }

  try {
    const { messages } = await request.json();
    if (!Array.isArray(messages)) {
      return NextResponse.json({ error: 'Invalid request payload.' }, { status: 400 });
    }

    const trimmedMessages = messages.slice(-8) as ChatMessage[];
    const conversation = trimmedMessages
      .map((msg) => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
      .join('\n');

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `${SYSTEM_PROMPT}\n\nConversation so far:\n${conversation}\nAssistant:`,
                },
              ],
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
    const reply =
      data?.candidates?.[0]?.content?.parts
        ?.map((part: { text?: string }) => part.text || '')
        .join(' ')
        .trim() || 'I had trouble answering that. Please ask about pipetting again.';

    return NextResponse.json({ reply });
  } catch (error) {
    console.error('Pipette assistant error:', error);
    return NextResponse.json(
      { error: 'Something went wrong while contacting PipettePal.' },
      { status: 500 }
    );
  }
}

