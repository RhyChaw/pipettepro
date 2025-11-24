'use server';

import { NextResponse } from 'next/server';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../../../utils/firebaseConfig';

const TUTORIAL_SCENARIO = {
  id: 'tutorial-basic-pipetting',
  title: 'Basic Pipetting Tutorial',
  description: 'Learn fundamental pipetting techniques',
  experimentType: 'tutorial',
  question: `Task:
Using a P200 micropipette, prepare 100 µL of a diluted dye solution by mixing:

80 µL of distilled water
20 µL of blue food dye solution

Steps the student must perform:

1. Set the P200 pipette to 80 µL.
2. Attach a blue pipette tip.
3. Pipette 80 µL of distilled water into a clean microcentrifuge tube.
4. Change to a new tip.
5. Set the P200 to 20 µL.
6. Pipette 20 µL of blue dye solution into the same tube.
7. Mix by gently pipetting up and down 3 times.

Final Expected Volume: 100 µL`,
  welcomeMessage: "Hey! Welcome! Here is your question to start. You have learnt the basics of our tools by now, it's time to understand this simulator and begin your pipette journey!",
  steps: [
    {
      id: 'step-1',
      type: 'select_pipette',
      order: 1,
      instruction: 'Select the P200 pipette (200 µL range)',
      targetVolume: 80,
      pipetteId: 'p200',
    },
    {
      id: 'step-2',
      type: 'set_volume',
      order: 2,
      instruction: 'Set the P200 pipette to 80 µL',
      targetVolume: 80,
    },
    {
      id: 'step-3',
      type: 'attach_tip',
      order: 3,
      instruction: 'Attach a blue pipette tip',
    },
    {
      id: 'step-4',
      type: 'aspirate',
      order: 4,
      instruction: 'Pipette 80 µL of distilled water into a clean microcentrifuge tube',
      targetVolume: 80,
      sourceContainer: 'water',
    },
    {
      id: 'step-5',
      type: 'eject_tip',
      order: 5,
      instruction: 'Eject the used tip and attach a new tip',
    },
    {
      id: 'step-6',
      type: 'set_volume',
      order: 6,
      instruction: 'Set the P200 pipette to 20 µL',
      targetVolume: 20,
    },
    {
      id: 'step-7',
      type: 'aspirate',
      order: 7,
      instruction: 'Pipette 20 µL of blue dye solution into the same tube',
      targetVolume: 20,
      sourceContainer: 'dye',
    },
    {
      id: 'step-8',
      type: 'mix',
      order: 8,
      instruction: 'Mix by gently pipetting up and down 3 times',
    },
  ],
  equipment: ['P200 Pipette', 'Pipette Tips', 'Microcentrifuge Tube'],
  reagents: [
    { name: 'Distilled Water', volume: 80 },
    { name: 'Blue Food Dye', volume: 20 },
  ],
};

export async function GET(request: Request) {
  try {
    const scenarioId = 'tutorial-basic-pipetting';
    
    // Check if tutorial scenario exists in Firestore
    const scenarioRef = doc(db, 'tutorialScenarios', scenarioId);
    const scenarioSnap = await getDoc(scenarioRef);
    
    if (scenarioSnap.exists()) {
      return NextResponse.json({ scenario: scenarioSnap.data() });
    }
    
    // If not exists, create it
    await setDoc(scenarioRef, {
      ...TUTORIAL_SCENARIO,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    
    return NextResponse.json({ scenario: TUTORIAL_SCENARIO });
  } catch (error) {
    console.error('Get tutorial scenario error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to get tutorial scenario.';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

