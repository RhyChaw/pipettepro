'use server';

import { NextResponse } from 'next/server';
import { NoteSectionType, ProcessingResult, FileUploadMetadata } from '../../../types/notes';

const SYSTEM_PROMPT = `You are a lab manual processing assistant. Your job is to:
1. Extract text from lab manuals (handwritten or printed)
2. Clean the text (remove headers, page numbers, footers, tables if not relevant)
3. Chunk the content into logical sections:
   - Materials (chemicals, reagents, consumables)
   - Equipment (pipettes, containers, instruments)
   - Procedure Steps (step-by-step instructions)
   - Safety Notes (warnings, PPE requirements)
   - Calculations (formulas, volume calculations)
   - Conceptual Theory (background, principles)
   - Troubleshooting (common issues and solutions)
   - Other (anything that doesn't fit above)

Return ONLY valid JSON in this format:
{
  "rawText": "full extracted text",
  "cleanedText": "cleaned text without headers/footers",
  "sections": [
    {
      "type": "materials" | "equipment" | "procedure_steps" | "safety_notes" | "calculations" | "conceptual_theory" | "troubleshooting" | "other",
      "title": "Section title",
      "content": "section content",
      "order": 1
    }
  ]
}

IMPORTANT: Only extract what is actually in the document. Do not hallucinate or add information that isn't present.`;

export async function POST(request: Request) {
  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json(
      { error: 'Missing Gemini API key on the server.' },
      { status: 500 }
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const text = formData.get('text') as string | null; // For direct text input

    if (!file && !text) {
      return NextResponse.json({ error: 'No file or text provided.' }, { status: 400 });
    }

    let extractedText = '';

    if (text) {
      // Direct text input (for handwritten notes that were already transcribed)
      extractedText = text.trim();
    } else if (file) {
      // For PDF/DOC files, we'll use Gemini's vision capabilities
      // For images, use vision API; for PDFs, we'll need to extract text first
      const fileBuffer = await file.arrayBuffer();
      // Convert to base64 - works in both Node.js and browser environments
      const base64 = typeof Buffer !== 'undefined' 
        ? Buffer.from(fileBuffer).toString('base64')
        : btoa(String.fromCharCode(...new Uint8Array(fileBuffer)));
      
      // Check if it's an image
      const isImage = file.type.startsWith('image/');
      
      if (isImage) {
        // Use Gemini Vision API for OCR on images
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [
                {
                  role: 'user',
                  parts: [
                    {
                      inline_data: {
                        mime_type: file.type,
                        data: base64,
                      },
                    },
                    {
                      text: `Extract all text from this image. Return the raw extracted text only, no formatting.`,
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
        extractedText = data?.candidates?.[0]?.content?.parts
          ?.map((part: { text?: string }) => part.text || '')
          .join(' ')
          .trim() || '';
      } else {
        // For PDF/DOC files, for now return a placeholder
        // In production, use a proper PDF/DOC parser or Gemini's PDF support
        extractedText = `[PDF/DOC file: ${file.name}]\n\nNote: PDF/DOC parsing requires additional setup. Please paste the text content directly or convert to an image.`;
      }
    }

    // Validate extracted text
    if (!extractedText || extractedText.trim().length === 0) {
      return NextResponse.json(
        { error: 'No text could be extracted from the document. Please ensure the file contains readable text or try pasting the text directly.' },
        { status: 400 }
      );
    }

    // Now process the extracted text to clean and chunk it
    // Truncate text if too long (Gemini has token limits)
    const maxTextLength = 30000; // Leave room for prompt
    const truncatedText = extractedText.length > maxTextLength 
      ? extractedText.substring(0, maxTextLength) + '\n\n[Text truncated due to length]'
      : extractedText;

    // Use gemini-2.5-flash (latest, faster, cheaper)
    const processingResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: `${SYSTEM_PROMPT}\n\nExtracted text:\n${truncatedText}\n\nProcess this text and return ONLY valid JSON.`,
                },
              ],
            },
          ],
        }),
      }
    );

    let result: ProcessingResult;
    
    if (!processingResponse.ok) {
      const errorText = await processingResponse.text();
      let errorMessage = 'Failed to process text';
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.error?.message || errorData.error || errorText;
      } catch {
        errorMessage = errorText || 'Failed to process text';
      }
      console.error('Gemini API error:', errorMessage);
      
      // Fallback: create a basic structure even if API fails
      console.log('Using fallback structure due to API error');
      result = {
        rawText: extractedText,
        cleanedText: extractedText,
        sections: [
          {
            type: NoteSectionType.OTHER,
            title: 'Content',
            content: extractedText,
            order: 1,
          },
        ],
        metadata: {
          fileName: file?.name || 'text-input.txt',
          fileSize: file?.size || 0,
          fileType: file?.type || 'text/plain',
          uploadedAt: new Date().toISOString(),
          processedAt: new Date().toISOString(),
          status: 'completed',
        },
      };
    } else {
      const processingData = await processingResponse.json();
      const processedContent = processingData?.candidates?.[0]?.content?.parts
        ?.map((part: { text?: string }) => part.text || '')
        .join(' ')
        .trim() || '{}';

      // Parse the JSON response
      try {
        const jsonMatch = processedContent.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          result = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No JSON found in response');
        }
      } catch (parseError) {
        // Fallback: create a basic structure if parsing fails
        console.log('Using fallback structure due to parse error');
        result = {
          rawText: extractedText,
          cleanedText: extractedText,
          sections: [
            {
              type: NoteSectionType.OTHER,
              title: 'Content',
              content: extractedText,
              order: 1,
            },
          ],
          metadata: {
            fileName: file?.name || 'text-input.txt',
            fileSize: file?.size || 0,
            fileType: file?.type || 'text/plain',
            uploadedAt: new Date().toISOString(),
            processedAt: new Date().toISOString(),
            status: 'completed',
          },
        };
      }
    }

    // Ensure metadata is set
    if (!result.metadata) {
      result.metadata = {
        fileName: file?.name || 'text-input.txt',
        fileSize: file?.size || 0,
        fileType: file?.type || 'text/plain',
        uploadedAt: new Date().toISOString(),
        processedAt: new Date().toISOString(),
        status: 'completed',
      };
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Processing error:', error);
    const errorMessage = error.message || 'Failed to process document.';
    // Provide more helpful error messages
    if (errorMessage.includes('API key')) {
      return NextResponse.json(
        { error: 'API configuration error. Please check your Gemini API key.' },
        { status: 500 }
      );
    }
    if (errorMessage.includes('quota') || errorMessage.includes('rate limit')) {
      return NextResponse.json(
        { error: 'API rate limit exceeded. Please try again in a moment.' },
        { status: 429 }
      );
    }
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

