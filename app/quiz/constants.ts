import { Question, Category, Difficulty } from './types';

export const QUESTIONS: Question[] = [
  // Pipetting Technique
  {
    id: 1,
    category: Category.PIPETTING_TECHNIQUE,
    difficulty: Difficulty.BEGINNER,
    questionText: 'Which image shows the correct angle for aspirating liquid?',
    options: [
      { id: 'A', title: '45° Angle', description: 'Pipette is held at a significant angle to the liquid surface.' },
      { id: 'B', title: '90° Angle', description: 'Pipette is held vertically, perpendicular to the liquid surface.' },
    ],
    correctOptionId: 'B',
    explanation: 'A 90° angle (vertical) ensures the most accurate liquid aspiration. Pipetting at an angle can introduce significant measurement errors.'
  },
  {
    id: 2,
    category: Category.PIPETTING_TECHNIQUE,
    difficulty: Difficulty.INTERMEDIATE,
    questionText: 'When dispensing liquid, which plunger technique is correct?',
    options: [
      { id: 'A', title: 'Smooth & Controlled', description: 'The plunger is pressed down slowly and smoothly to the first stop.' },
      { id: 'B', title: 'Quick & Snappy', description: 'The plunger is quickly snapped down, causing a splash.' },
    ],
    correctOptionId: 'A',
    explanation: 'A smooth, controlled plunger motion prevents splashing and aerosol formation, ensuring the full volume is dispensed accurately and safely.'
  },
  {
    id: 3,
    category: Category.PIPETTING_TECHNIQUE,
    difficulty: Difficulty.ADVANCED,
    questionText: 'When pipetting a viscous liquid like glycerol, what is the best practice?',
    options: [
      { id: 'A', title: 'Reverse Pipetting', description: 'Depress plunger to second stop, aspirate, then dispense by depressing only to the first stop.' },
      { id: 'B', title: 'Standard Pipetting', description: 'Depress to the first stop, aspirate, then depress to the second stop to dispense.' },
    ],
    correctOptionId: 'A',
    explanation: 'Reverse pipetting is ideal for viscous or volatile liquids. It compensates for the liquid that tends to cling to the tip surface, ensuring a more accurate dispense.'
  },
  {
    id: 11,
    category: Category.PIPETTING_TECHNIQUE,
    difficulty: Difficulty.INTERMEDIATE,
    questionText: 'What is the correct tip immersion depth when aspirating liquid?',
    options: [
      { id: 'A', title: 'As deep as possible', description: 'Immerse the tip deep into the liquid to ensure none is missed.' },
      { id: 'B', title: 'Just below the surface', description: 'Immerse the tip only 2-3mm below the liquid meniscus.' },
    ],
    correctOptionId: 'B',
    explanation: 'Immersing the tip too deep can cause excess liquid to cling to the outside of the tip, leading to inaccurate measurements. Just below the surface is optimal.'
  },
  {
    id: 12,
    category: Category.PIPETTING_TECHNIQUE,
    difficulty: Difficulty.ADVANCED,
    questionText: 'When pipetting a volatile solvent like ethanol, why is it important to pre-wet the tip?',
    options: [
      { id: 'A', title: 'To clean the tip', description: 'It helps sterilize the tip before use.' },
      { id: 'B', title: 'To prevent evaporation', description: 'It equilibrates the temperature and humidity inside the tip, preventing solvent evaporation and inaccurate delivery.' },
    ],
    correctOptionId: 'B',
    explanation: 'Volatile liquids evaporate quickly inside the tip, creating vapor pressure that can cause dripping. Pre-wetting (aspirating and dispensing the liquid back 2-3 times) saturates the air inside the tip, minimizing this effect.'
  },
  
  // Pipette Selection
  {
    id: 4,
    category: Category.PIPETTE_SELECTION,
    difficulty: Difficulty.BEGINNER,
    questionText: 'You need to measure 150µL. Which pipette should you choose for the best accuracy?',
    options: [
      { id: 'A', title: 'P1000 (100-1000µL)', description: 'Using a P1000 set to 150µL.' },
      { id: 'B', title: 'P200 (20-200µL)', description: 'Using a P200 set to 150µL.' },
    ],
    correctOptionId: 'B',
    explanation: 'Always choose the smallest volume pipette that can handle the required volume. A P200 is more accurate at 150µL than a P1000.'
  },
  {
    id: 5,
    category: Category.PIPETTE_SELECTION,
    difficulty: Difficulty.INTERMEDIATE,
    questionText: 'You are setting up a PCR reaction and need to add 0.5µL of enzyme. Which pipette is appropriate?',
    options: [
      { id: 'A', title: 'P2 (0.2-2µL)', description: 'A pipette designed for very small volumes.' },
      { id: 'B', title: 'P20 (2-20µL)', description: 'This pipette is not accurate at 0.5µL.' },
    ],
    correctOptionId: 'A',
    explanation: 'A pipette is most accurate in the middle to upper end of its range. A P2 is the correct choice for 0.5µL. Using a P20 would be highly inaccurate.'
  },
  {
    id: 13,
    category: Category.PIPETTE_SELECTION,
    difficulty: Difficulty.ADVANCED,
    questionText: 'You need to fill a 96-well plate with 50µL of the same reagent in each well. What is the most efficient and consistent tool?',
    options: [
      { id: 'A', title: 'Single-channel pipette', description: 'A single-channel P100 pipette, used 96 times.' },
      { id: 'B', title: 'Multichannel pipette', description: 'An 8 or 12-channel multichannel pipette.' },
    ],
    correctOptionId: 'B',
    explanation: 'A multichannel pipette allows you to fill an entire row or column at once, drastically increasing speed and reducing the chance of well-to-well variability.'
  },

  // Contamination Prevention
  {
    id: 6,
    category: Category.CONTAMINATION_PREVENTION,
    difficulty: Difficulty.BEGINNER,
    questionText: 'To prevent cross-contamination between samples, what should you always do?',
    options: [
      { id: 'A', title: 'Use the Same Tip', description: 'Using the same pipette tip for multiple different samples to save time.' },
      { id: 'B', title: 'Change Tip Every Time', description: 'Using a fresh, sterile pipette tip for each different sample.' },
    ],
    correctOptionId: 'B',
    explanation: 'Always change your pipette tip when switching between different reagents or samples to prevent cross-contamination, which can ruin experiments.'
  },
    {
    id: 14,
    category: Category.CONTAMINATION_PREVENTION,
    difficulty: Difficulty.INTERMEDIATE,
    questionText: 'When aspirating from a shared stock reagent bottle, what is the best practice?',
    options: [
      { id: 'A', title: 'Pipette directly from stock', description: 'Dip your pipette tip directly into the main stock bottle.' },
      { id: 'B', title: 'Use an aliquot', description: 'Pour a small amount (an aliquot) into a separate, sterile tube and pipette from that tube.' },
    ],
    correctOptionId: 'B',
    explanation: 'Never dip a pipette tip into a shared stock solution. This prevents accidental contamination of the entire stock for everyone else. Always pour what you need into a separate container.'
  },
  {
    id: 7,
    category: Category.CONTAMINATION_PREVENTION,
    difficulty: Difficulty.ADVANCED,
    questionText: 'When working with RNA, which type of tip is essential to prevent contamination from the pipette itself?',
    options: [
      { id: 'A', title: 'Filter Tips', description: 'Tips with a barrier to prevent aerosols from entering the pipette barrel.' },
      { id: 'B', title: 'Non-filter Tips', description: 'Standard tips without any barrier.' },
    ],
    correctOptionId: 'A',
    explanation: 'Filter tips create a barrier that prevents aerosols and contaminating enzymes (like RNases) from inside the pipette barrel from contaminating your sensitive RNA sample.'
  },

  // Sterile Technique
  {
    id: 8,
    category: Category.STERILE_TECHNIQUE,
    difficulty: Difficulty.BEGINNER,
    questionText: 'When plating bacteria, how should you handle the petri dish lid?',
    options: [
      { id: 'A', title: 'Clamshell Method', description: 'Lift the lid only partially, keeping it over the plate like a shield.' },
      { id: 'B', title: 'Lid on Bench', description: 'Take the lid completely off and place it face-down on the lab bench.' },
    ],
    correctOptionId: 'A',
    explanation: 'The "clamshell" method minimizes the chance of airborne contaminants (like mold spores or other bacteria) falling onto your sterile agar surface.'
  },
  {
    id: 9,
    category: Category.STERILE_TECHNIQUE,
    difficulty: Difficulty.INTERMEDIATE,
    questionText: 'You are working in a biosafety cabinet (hood). Where should you perform your work?',
    options: [
      { id: 'A', title: 'Deep Inside Cabinet', description: 'Work is performed well inside the cabinet, away from the front opening.' },
      { id: 'B', title: 'Near the Front', description: 'Work is performed right at the front edge of the cabinet.' },
    ],
    correctOptionId: 'A',
    explanation: 'Working deep inside the cabinet ensures your experiment is protected by the sterile airflow and prevents contaminated room air from being drawn in.'
  },
  {
    id: 15,
    category: Category.STERILE_TECHNIQUE,
    difficulty: Difficulty.ADVANCED,
    questionText: 'What is the purpose of working near a Bunsen burner flame for sterile technique?',
    options: [
      { id: 'A', title: 'Creates a sterile field', description: 'The flame creates an updraft of hot air, preventing airborne contaminants from settling near your work.' },
      { id: 'B', title: 'Provides light', description: 'The light from the flame helps you see microorganisms better.' },
    ],
    correctOptionId: 'A',
    explanation: 'The convection current from the Bunsen burner generates a cone of sterile, rising air. Performing manipulations within this ~6-inch radius minimizes the risk of contamination.'
  },

  // Equipment Handling
  {
    id: 10,
    category: Category.EQUIPMENT_HANDLING,
    difficulty: Difficulty.BEGINNER,
    questionText: 'You just aspirated liquid into your pipette. What should you NEVER do?',
    options: [
      { id: 'A', title: 'Lay it Down Horizontally', description: 'The pipette is laid on its side on the lab bench.' },
      { id: 'B', title: 'Keep it Vertical', description: 'The pipette is kept upright or placed in a proper stand.' },
    ],
    correctOptionId: 'A',
    explanation: 'Laying a pipette down with liquid in the tip allows the liquid to run back into the barrel, causing contamination and damage to the instrument.'
  },
  {
    id: 16,
    category: Category.EQUIPMENT_HANDLING,
    difficulty: Difficulty.BEGINNER,
    questionText: 'When setting the volume on a manual pipette, what is the correct procedure?',
    options: [
      { id: 'A', title: 'Dial down to the volume', description: 'Go above the target volume, then dial down to the correct setting.' },
      { id: 'B', title: 'Dial up to the volume', description: 'Start at a low volume and dial up to the correct setting.' },
    ],
    correctOptionId: 'A',
    explanation: 'To ensure accuracy and avoid mechanical backlash, you should always turn the dial slightly above your target volume and then dial down to it. This ensures the gears are properly engaged.'
  },
  {
    id: 17,
    category: Category.EQUIPMENT_HANDLING,
    difficulty: Difficulty.INTERMEDIATE,
    questionText: 'How should pipettes be stored when not in use?',
    options: [
      { id: 'A', title: 'Lying flat in a drawer', description: 'Store the pipettes horizontally to save space.' },
      { id: 'B', title: 'Upright in a stand', description: 'Store pipettes vertically in a designated pipette stand.' },
    ],
    correctOptionId: 'B',
    explanation: 'Storing pipettes upright prevents any residual liquids from running into and corroding the piston mechanism. It also keeps them organized and safe.'
  },
  {
    id: 18,
    category: Category.EQUIPMENT_HANDLING,
    difficulty: Difficulty.ADVANCED,
    questionText: 'If your pipette consistently dispenses an incorrect volume, what action is required?',
    options: [
      { id: 'A', title: 'Needs Calibration', description: 'The pipette needs to be professionally calibrated to ensure accuracy.' },
      { id: 'B', title: 'Replace the tip', description: 'The tip is probably the wrong size for the pipette.' },
    ],
    correctOptionId: 'A',
    explanation: 'Pipettes are precision instruments that can drift over time. Regular calibration is a routine maintenance procedure to check and adjust its accuracy, ensuring reliable results.'
  }
];
