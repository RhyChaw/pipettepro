'use server';

import { NextResponse } from 'next/server';
import { SimulationScenario, SimulatorStep, SimulatorActionType } from '../../../types/simulation';

const SCENARIO_GENERATION_PROMPT = `You are a simulation scenario generator for lab procedures. Convert lab manual content into simulator-ready steps.

Rules:
1. Only use information explicitly present in the content - DO NOT hallucinate
2. Identify pipetting procedures and extract:
   - Required pipette types (p2, p10, p200, p1000)
   - Volumes to pipette
   - Source and target containers
   - Step-by-step sequence
3. If critical information is missing (volumes, pipette types, containers), list them in missingInfo
4. Generate steps in the correct order
5. Use only these action types:
   - select_pipette: Select which pipette to use
   - attach_tip: Attach a tip to the pipette
   - set_volume: Set the target volume
   - move_to_source: Move pipette to source container
   - aspirate: Aspirate liquid
   - move_to_target: Move pipette to target container
   - dispense: Dispense liquid
   - eject_tip: Eject the tip
   - wait: Wait for a specified time
   - check: Check a condition

Return ONLY valid JSON in this format:
{
  "title": "Scenario title",
  "description": "Brief description",
  "experimentType": "Type of experiment",
  "equipment": ["pipette", "container", etc.],
  "reagents": [
    {
      "name": "Reagent name",
      "volume": 100, // in µL, if specified
      "container": "Container name"
    }
  ],
  "steps": [
    {
      "type": "select_pipette" | "attach_tip" | "set_volume" | "move_to_source" | "aspirate" | "move_to_target" | "dispense" | "eject_tip" | "wait" | "check",
      "order": 1,
      "instruction": "Human-readable instruction",
      "targetVolume": 100, // Only for set_volume
      "pipetteId": "p200", // Only for select_pipette
      "sourceContainer": "Source", // Only for move_to_source/aspirate
      "targetContainer": "Target", // Only for move_to_target/dispense
      "waitTime": 5, // Only for wait, in seconds
      "checkCondition": "Check text", // Only for check
      "validationCriteria": {
        "volume": 100,
        "pipette": "p200",
        "container": "Target"
      }
    }
  ],
  "estimatedDuration": 10, // in minutes
  "difficulty": "beginner" | "intermediate" | "advanced",
  "missingInfo": ["Missing volume for step X", "Missing pipette type"]
}

If the content is not about pipetting, return an error message explaining why.`;

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
      ? sections.map((s: any) => `[${s.type}] ${s.title}\n${s.content}`).join('\n\n')
      : '';

    const prompt = `${SCENARIO_GENERATION_PROMPT}\n\nLab Manual Content:\n${noteContent}\n\nSections:\n${sectionsText}\n\nGenerate simulation scenario. Return ONLY valid JSON.`;

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
    let scenarioData: Partial<SimulationScenario> & { error?: string };
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        scenarioData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (error) {
      return NextResponse.json(
        { error: 'Failed to parse scenario. The content may not contain pipetting procedures.' },
        { status: 400 }
      );
    }

    // Validate and structure the scenario
    if (scenarioData.error) {
      return NextResponse.json({ error: scenarioData.error }, { status: 400 });
    }

    const scenario: SimulationScenario = {
      id: `scenario-${Date.now()}`,
      noteId: '', // Will be set by caller
      title: scenarioData.title || 'Generated Scenario',
      description: scenarioData.description || '',
      experimentType: scenarioData.experimentType || 'Unknown',
      equipment: scenarioData.equipment || [],
      reagents: scenarioData.reagents || [],
      steps: (scenarioData.steps || []).map((step: any, idx: number) => ({
        id: `step-${Date.now()}-${idx}`,
        type: step.type || SimulatorActionType.CHECK,
        order: step.order || idx + 1,
        instruction: step.instruction || 'Perform step',
        targetVolume: step.targetVolume,
        pipetteId: step.pipetteId,
        sourceContainer: step.sourceContainer,
        targetContainer: step.targetContainer,
        waitTime: step.waitTime,
        checkCondition: step.checkCondition,
        validationCriteria: step.validationCriteria,
      })),
      createdAt: new Date().toISOString(),
      estimatedDuration: scenarioData.estimatedDuration,
      difficulty: scenarioData.difficulty || 'intermediate',
      missingInfo: scenarioData.missingInfo || [],
    };

    return NextResponse.json(scenario);
  } catch (error: any) {
    console.error('Scenario generation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate scenario.' },
      { status: 500 }
    );
  }
}

