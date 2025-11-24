'use server';

import { NextResponse } from 'next/server';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../../utils/firebaseConfig';
import { SimulationScenario } from '../../../types/simulation';

export async function POST(request: Request) {
  try {
    const { userId, scenario } = await request.json();

    if (!userId || !scenario) {
      return NextResponse.json({ error: 'Missing userId or scenario data.' }, { status: 400 });
    }

    const scenarioId = scenario.id || `scenario-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const scenarioData: SimulationScenario = {
      ...scenario,
      id: scenarioId,
      userId,
      createdAt: scenario.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Ensure steps have proper order if not provided
    if (scenarioData.steps) {
      scenarioData.steps = scenarioData.steps.map((step, index) => ({
        ...step,
        order: step.order || index + 1,
      }));
    }

    // Save to Firestore userScenarios collection
    await setDoc(doc(db, 'userScenarios', scenarioId), scenarioData);

    return NextResponse.json({ success: true, scenarioId });
  } catch (error) {
    console.error('Save scenario error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to save scenario.';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

