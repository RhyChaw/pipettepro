'use server';

import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json(
      { error: 'Missing Gemini API key on the server.' },
      { status: 500 }
    );
  }

  try {
    const { text, voiceName = 'Kore', style } = await request.json();

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Text is required.' }, { status: 400 });
    }

    // Prepare the prompt with optional style instructions
    const prompt = style ? `${style}: ${text}` : text;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${process.env.GEMINI_API_KEY}`,
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
          generationConfig: {
            responseModalities: ['AUDIO'],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: {
                  voiceName: voiceName,
                },
              },
            },
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini TTS API error:', errorText);
      throw new Error(errorText || 'Gemini TTS API error');
    }

    const data = await response.json();
    const audioData = data?.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

    if (!audioData) {
      throw new Error('No audio data received from API');
    }

    // Return base64 encoded audio data
    return NextResponse.json({ audioData });
  } catch (error) {
    console.error('TTS generation error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate speech.';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}


