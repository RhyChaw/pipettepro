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
  },

  // Additional questions to reach 5 per category/difficulty
  // Pipetting Technique - Beginner (need 3 more)
  {
    id: 19,
    category: Category.PIPETTING_TECHNIQUE,
    difficulty: Difficulty.BEGINNER,
    questionText: 'What is the first step before aspirating liquid with a pipette?',
    options: [
      { id: 'A', title: 'Press the plunger', description: 'Immediately press the plunger to the first stop.' },
      { id: 'B', title: 'Attach a fresh tip', description: 'Always attach a new, sterile tip before aspirating.' },
    ],
    correctOptionId: 'B',
    explanation: 'Always start by attaching a fresh, sterile tip to prevent contamination and ensure accurate measurements.'
  },
  {
    id: 20,
    category: Category.PIPETTING_TECHNIQUE,
    difficulty: Difficulty.BEGINNER,
    questionText: 'After aspirating liquid, what should you do before moving the pipette?',
    options: [
      { id: 'A', title: 'Wait 1-2 seconds', description: 'Pause briefly to allow the liquid to settle in the tip.' },
      { id: 'B', title: 'Move immediately', description: 'Move the pipette right away to save time.' },
    ],
    correctOptionId: 'A',
    explanation: 'Waiting 1-2 seconds after aspiration allows the liquid to settle and ensures accurate volume measurement.'
  },
  {
    id: 21,
    category: Category.PIPETTING_TECHNIQUE,
    difficulty: Difficulty.BEGINNER,
    questionText: 'When dispensing liquid, to what point should you press the plunger first?',
    options: [
      { id: 'A', title: 'Second stop', description: 'Press all the way down to the second stop immediately.' },
      { id: 'B', title: 'First stop', description: 'Press to the first stop, pause, then press to second stop for blow-out.' },
    ],
    correctOptionId: 'B',
    explanation: 'Press to the first stop to dispense the main volume, then press to the second stop to blow out any remaining liquid.'
  },

  // Pipetting Technique - Intermediate (need 3 more)
  {
    id: 22,
    category: Category.PIPETTING_TECHNIQUE,
    difficulty: Difficulty.INTERMEDIATE,
    questionText: 'What happens if you release the plunger too quickly after aspirating?',
    options: [
      { id: 'A', title: 'Liquid may splash', description: 'Quick release can cause liquid to splash or form bubbles.' },
      { id: 'B', title: 'Nothing', description: 'The speed of release does not affect the volume.' },
    ],
    correctOptionId: 'A',
    explanation: 'Releasing the plunger too quickly can cause liquid to splash, form bubbles, or lead to inaccurate volume aspiration.'
  },
  {
    id: 23,
    category: Category.PIPETTING_TECHNIQUE,
    difficulty: Difficulty.INTERMEDIATE,
    questionText: 'What is the purpose of "reverse pipetting" technique?',
    options: [
      { id: 'A', title: 'For viscous liquids', description: 'It compensates for liquid that clings to the tip, improving accuracy for viscous or volatile liquids.' },
      { id: 'B', title: 'To save tips', description: 'It allows reusing the same tip multiple times.' },
    ],
    correctOptionId: 'A',
    explanation: 'Reverse pipetting is used for viscous or volatile liquids where some liquid may cling to the tip, ensuring more accurate delivery.'
  },
  {
    id: 24,
    category: Category.PIPETTING_TECHNIQUE,
    difficulty: Difficulty.INTERMEDIATE,
    questionText: 'How should you handle the pipette when aspirating from a small volume container?',
    options: [
      { id: 'A', title: 'Tilt the container', description: 'Tilt the container to make it easier to reach the liquid.' },
      { id: 'B', title: 'Keep container level', description: 'Keep the container on a level surface and position the pipette vertically.' },
    ],
    correctOptionId: 'B',
    explanation: 'Keeping the container level and the pipette vertical ensures accurate aspiration and prevents spillage or contamination.'
  },

  // Pipetting Technique - Advanced (need 3 more)
  {
    id: 25,
    category: Category.PIPETTING_TECHNIQUE,
    difficulty: Difficulty.ADVANCED,
    questionText: 'What is "pre-wetting" and when is it most beneficial?',
    options: [
      { id: 'A', title: 'For volatile liquids', description: 'Pre-wetting (aspirating and dispensing 2-3 times) saturates the tip air, reducing evaporation for volatile solvents.' },
      { id: 'B', title: 'For all liquids', description: 'Pre-wetting should be done for every liquid to ensure accuracy.' },
    ],
    correctOptionId: 'A',
    explanation: 'Pre-wetting is specifically beneficial for volatile liquids as it saturates the air inside the tip, preventing evaporation and ensuring accurate delivery.'
  },
  {
    id: 26,
    category: Category.PIPETTING_TECHNIQUE,
    difficulty: Difficulty.ADVANCED,
    questionText: 'When working with low-retention tips, what advantage do they provide?',
    options: [
      { id: 'A', title: 'Prevent liquid adhesion', description: 'They have a hydrophobic coating that minimizes liquid sticking to the tip walls.' },
      { id: 'B', title: 'Filter contaminants', description: 'They filter out contaminants from the liquid.' },
    ],
    correctOptionId: 'A',
    explanation: 'Low-retention tips have a hydrophobic inner surface that prevents liquid from clinging to the tip, ensuring complete delivery of precious samples.'
  },
  {
    id: 27,
    category: Category.PIPETTING_TECHNIQUE,
    difficulty: Difficulty.ADVANCED,
    questionText: 'What is the recommended technique for pipetting very small volumes (< 1µL)?',
    options: [
      { id: 'A', title: 'Use positive displacement', description: 'Use a positive displacement pipette or special technique to minimize dead volume.' },
      { id: 'B', title: 'Use standard pipette', description: 'Any standard pipette will work fine for small volumes.' },
    ],
    correctOptionId: 'A',
    explanation: 'For very small volumes, positive displacement pipettes or special techniques are recommended to minimize dead volume and ensure accuracy.'
  },

  // Pipette Selection - Beginner (need 4 more)
  {
    id: 28,
    category: Category.PIPETTE_SELECTION,
    difficulty: Difficulty.BEGINNER,
    questionText: 'You need to pipette 5µL. Which pipette is most appropriate?',
    options: [
      { id: 'A', title: 'P10 (1-10µL)', description: 'A P10 pipette is designed for volumes in the 1-10µL range.' },
      { id: 'B', title: 'P20 (2-20µL)', description: 'A P20 pipette, though it can handle 5µL, is less accurate than a P10.' },
    ],
    correctOptionId: 'A',
    explanation: 'Always use the smallest pipette that can handle your volume. A P10 is more accurate at 5µL than a P20.'
  },
  {
    id: 29,
    category: Category.PIPETTE_SELECTION,
    difficulty: Difficulty.BEGINNER,
    questionText: 'What is the general rule for selecting a pipette?',
    options: [
      { id: 'A', title: 'Use the smallest pipette that can handle the volume', description: 'Smaller pipettes are more accurate for their range.' },
      { id: 'B', title: 'Use the largest pipette available', description: 'Larger pipettes are more versatile.' },
    ],
    correctOptionId: 'A',
    explanation: 'The smallest pipette that can handle your volume will provide the best accuracy and precision.'
  },
  {
    id: 30,
    category: Category.PIPETTE_SELECTION,
    difficulty: Difficulty.BEGINNER,
    questionText: 'You need to measure 100µL. Which pipette should you use?',
    options: [
      { id: 'A', title: 'P200 (20-200µL)', description: 'A P200 is ideal for 100µL as it is in the middle of its range.' },
      { id: 'B', title: 'P1000 (100-1000µL)', description: 'A P1000 can handle 100µL but is less accurate.' },
    ],
    correctOptionId: 'A',
    explanation: 'A P200 is the best choice for 100µL as it is designed for volumes in the 20-200µL range, providing optimal accuracy.'
  },
  {
    id: 31,
    category: Category.PIPETTE_SELECTION,
    difficulty: Difficulty.BEGINNER,
    questionText: 'What happens if you use a pipette at the very bottom of its range?',
    options: [
      { id: 'A', title: 'Reduced accuracy', description: 'Pipettes are less accurate at the extremes of their range.' },
      { id: 'B', title: 'Better accuracy', description: 'The bottom of the range is always most accurate.' },
    ],
    correctOptionId: 'A',
    explanation: 'Pipettes are most accurate in the middle to upper portion of their range. Using them at the minimum volume reduces accuracy.'
  },

  // Pipette Selection - Intermediate (need 4 more)
  {
    id: 32,
    category: Category.PIPETTE_SELECTION,
    difficulty: Difficulty.INTERMEDIATE,
    questionText: 'For a volume of 25µL, which pipette provides the best accuracy?',
    options: [
      { id: 'A', title: 'P20 (2-20µL)', description: 'A P20 cannot handle 25µL as it exceeds its maximum.' },
      { id: 'B', title: 'P200 (20-200µL)', description: 'A P200 is appropriate for 25µL, though near its minimum.' },
    ],
    correctOptionId: 'B',
    explanation: 'A P200 is the correct choice for 25µL. A P20 cannot handle this volume as it exceeds its maximum capacity.'
  },
  {
    id: 33,
    category: Category.PIPETTE_SELECTION,
    difficulty: Difficulty.INTERMEDIATE,
    questionText: 'When would you choose a fixed-volume pipette over a variable-volume pipette?',
    options: [
      { id: 'A', title: 'For repetitive tasks', description: 'Fixed-volume pipettes are more accurate and faster for repetitive dispensing of the same volume.' },
      { id: 'B', title: 'Never', description: 'Variable-volume pipettes are always better.' },
    ],
    correctOptionId: 'A',
    explanation: 'Fixed-volume pipettes offer superior accuracy and speed when you need to dispense the same volume repeatedly, reducing the risk of volume setting errors.'
  },
  {
    id: 34,
    category: Category.PIPETTE_SELECTION,
    difficulty: Difficulty.INTERMEDIATE,
    questionText: 'What is the advantage of using an electronic pipette?',
    options: [
      { id: 'A', title: 'Reduced user error and fatigue', description: 'Electronic pipettes reduce repetitive strain and minimize user variability.' },
      { id: 'B', title: 'They are cheaper', description: 'Electronic pipettes cost less than manual ones.' },
    ],
    correctOptionId: 'A',
    explanation: 'Electronic pipettes reduce user fatigue, minimize variability between users, and can improve accuracy for high-throughput work.'
  },
  {
    id: 35,
    category: Category.PIPETTE_SELECTION,
    difficulty: Difficulty.INTERMEDIATE,
    questionText: 'You need to transfer 500µL. Which pipette is best?',
    options: [
      { id: 'A', title: 'P1000 (100-1000µL)', description: 'A P1000 is appropriate, though 500µL is in the middle of its range.' },
      { id: 'B', title: 'P200 (20-200µL)', description: 'A P200 cannot handle 500µL as it exceeds its maximum.' },
    ],
    correctOptionId: 'A',
    explanation: 'A P1000 is the correct choice for 500µL. A P200 cannot handle this volume as it exceeds its maximum capacity of 200µL.'
  },

  // Pipette Selection - Advanced (need 4 more)
  {
    id: 36,
    category: Category.PIPETTE_SELECTION,
    difficulty: Difficulty.ADVANCED,
    questionText: 'When working with radioactive materials, what type of pipette is recommended?',
    options: [
      { id: 'A', title: 'Positive displacement pipette', description: 'Positive displacement pipettes prevent contamination of the pipette barrel with radioactive material.' },
      { id: 'B', title: 'Standard air-displacement pipette', description: 'Any standard pipette will work fine.' },
    ],
    correctOptionId: 'A',
    explanation: 'Positive displacement pipettes prevent radioactive aerosols from entering the pipette barrel, reducing contamination risk and exposure.'
  },
  {
    id: 37,
    category: Category.PIPETTE_SELECTION,
    difficulty: Difficulty.ADVANCED,
    questionText: 'What is the difference between a single-channel and multichannel pipette?',
    options: [
      { id: 'A', title: 'Multichannel handles multiple tips', description: 'Multichannel pipettes can aspirate and dispense from multiple wells simultaneously, increasing throughput.' },
      { id: 'B', title: 'No difference', description: 'They work exactly the same way.' },
    ],
    correctOptionId: 'A',
    explanation: 'Multichannel pipettes allow simultaneous pipetting into multiple wells (typically 8 or 12), dramatically increasing speed and consistency for plate-based work.'
  },
  {
    id: 38,
    category: Category.PIPETTE_SELECTION,
    difficulty: Difficulty.ADVANCED,
    questionText: 'For serial dilutions, which pipette feature is most important?',
    options: [
      { id: 'A', title: 'Accuracy and precision', description: 'High accuracy and precision are critical to maintain the correct dilution factor throughout the series.' },
      { id: 'B', title: 'Speed', description: 'Speed is the most important factor.' },
    ],
    correctOptionId: 'A',
    explanation: 'Serial dilutions require high accuracy and precision. Small errors compound with each dilution step, so accuracy is paramount.'
  },
  {
    id: 39,
    category: Category.PIPETTE_SELECTION,
    difficulty: Difficulty.ADVANCED,
    questionText: 'What should you consider when selecting a pipette for PCR work?',
    options: [
      { id: 'A', title: 'Use filter tips and accurate pipettes', description: 'PCR requires high accuracy and filter tips to prevent contamination with DNases/RNases.' },
      { id: 'B', title: 'Any pipette will work', description: 'Standard pipettes are fine for PCR.' },
    ],
    correctOptionId: 'A',
    explanation: 'PCR requires highly accurate pipetting and filter tips to prevent contamination. Even small volume errors or contamination can ruin results.'
  },

  // Contamination Prevention - Beginner (need 4 more)
  {
    id: 40,
    category: Category.CONTAMINATION_PREVENTION,
    difficulty: Difficulty.BEGINNER,
    questionText: 'Why should you never touch the tip of a pipette?',
    options: [
      { id: 'A', title: 'Prevents contamination', description: 'Touching the tip can transfer oils, bacteria, or other contaminants from your hands.' },
      { id: 'B', title: 'It will break', description: 'The tip is fragile and will break if touched.' },
    ],
    correctOptionId: 'A',
    explanation: 'Touching the tip can transfer contaminants from your hands, compromising the sterility of your samples.'
  },
  {
    id: 41,
    category: Category.CONTAMINATION_PREVENTION,
    difficulty: Difficulty.BEGINNER,
    questionText: 'What should you do if a pipette tip falls on the bench?',
    options: [
      { id: 'A', title: 'Discard and use a new tip', description: 'Always discard a tip that has touched a non-sterile surface.' },
      { id: 'B', title: 'Use it anyway', description: 'It is still clean enough to use.' },
    ],
    correctOptionId: 'A',
    explanation: 'Any tip that touches a non-sterile surface should be discarded immediately to prevent contamination.'
  },
  {
    id: 42,
    category: Category.CONTAMINATION_PREVENTION,
    difficulty: Difficulty.BEGINNER,
    questionText: 'How often should you change pipette tips when working with different samples?',
    options: [
      { id: 'A', title: 'Every time', description: 'Change the tip for each different sample or reagent.' },
      { id: 'B', title: 'Only when visible contamination occurs', description: 'Change tips only if you see contamination.' },
    ],
    correctOptionId: 'A',
    explanation: 'Always change tips between different samples or reagents, even if no visible contamination is present, to prevent cross-contamination.'
  },
  {
    id: 43,
    category: Category.CONTAMINATION_PREVENTION,
    difficulty: Difficulty.BEGINNER,
    questionText: 'What is the purpose of a waste container when pipetting?',
    options: [
      { id: 'A', title: 'Safe disposal of used tips', description: 'A designated waste container prevents contamination and ensures proper disposal.' },
      { id: 'B', title: 'To store extra tips', description: 'It is used to store additional pipette tips.' },
    ],
    correctOptionId: 'A',
    explanation: 'A designated waste container for used tips prevents contamination of your workspace and ensures safe disposal of potentially contaminated materials.'
  },

  // Contamination Prevention - Intermediate (need 4 more)
  {
    id: 44,
    category: Category.CONTAMINATION_PREVENTION,
    difficulty: Difficulty.INTERMEDIATE,
    questionText: 'What should you do before pipetting if you have been handling other materials?',
    options: [
      { id: 'A', title: 'Wash or sanitize hands', description: 'Clean your hands to prevent transferring contaminants to pipettes and samples.' },
      { id: 'B', title: 'Nothing', description: 'Hands do not need to be cleaned.' },
    ],
    correctOptionId: 'A',
    explanation: 'Washing or sanitizing hands before pipetting prevents the transfer of contaminants from your hands to pipettes, tips, and samples.'
  },
  {
    id: 45,
    category: Category.CONTAMINATION_PREVENTION,
    difficulty: Difficulty.INTERMEDIATE,
    questionText: 'Why should you avoid passing your hand over open containers?',
    options: [
      { id: 'A', title: 'Prevents contamination', description: 'Passing hands over open containers can drop contaminants into the sample.' },
      { id: 'B', title: 'It blocks the light', description: 'Your hand will block the light needed to see the sample.' },
    ],
    correctOptionId: 'A',
    explanation: 'Passing hands over open containers can cause skin cells, hair, or other contaminants to fall into samples, compromising sterility.'
  },
  {
    id: 46,
    category: Category.CONTAMINATION_PREVENTION,
    difficulty: Difficulty.INTERMEDIATE,
    questionText: 'What is the risk of reusing a pipette tip for different reagents?',
    options: [
      { id: 'A', title: 'Cross-contamination', description: 'Reusing tips can transfer traces of one reagent into another, contaminating samples.' },
      { id: 'B', title: 'No risk', description: 'Tips can be safely reused if cleaned.' },
    ],
    correctOptionId: 'A',
    explanation: 'Reusing tips, even if they appear clean, can transfer microscopic amounts of one reagent to another, causing cross-contamination.'
  },
  {
    id: 47,
    category: Category.CONTAMINATION_PREVENTION,
    difficulty: Difficulty.INTERMEDIATE,
    questionText: 'When working with DNA samples, what additional precaution should you take?',
    options: [
      { id: 'A', title: 'Use filter tips and work carefully', description: 'Use filter tips and be extra careful to prevent DNase contamination and cross-contamination.' },
      { id: 'B', title: 'No special precautions needed', description: 'DNA work requires no special handling.' },
    ],
    correctOptionId: 'A',
    explanation: 'DNA work requires filter tips to prevent DNase contamination and careful technique to avoid cross-contamination between samples.'
  },

  // Contamination Prevention - Advanced (need 4 more)
  {
    id: 48,
    category: Category.CONTAMINATION_PREVENTION,
    difficulty: Difficulty.ADVANCED,
    questionText: 'What is the purpose of using barrier tips in molecular biology?',
    options: [
      { id: 'A', title: 'Prevent aerosol contamination', description: 'Barrier tips prevent aerosols and enzymes from the pipette barrel from contaminating sensitive samples.' },
      { id: 'B', title: 'Make pipetting easier', description: 'They make it easier to attach tips to the pipette.' },
    ],
    correctOptionId: 'A',
    explanation: 'Barrier (filter) tips create a physical barrier that prevents aerosols, DNases, RNases, and other contaminants from entering the pipette barrel and contaminating samples.'
  },
  {
    id: 49,
    category: Category.CONTAMINATION_PREVENTION,
    difficulty: Difficulty.ADVANCED,
    questionText: 'How can you prevent carryover contamination in PCR?',
    options: [
      { id: 'A', title: 'Use filter tips and separate work areas', description: 'Use filter tips, separate pre- and post-PCR areas, and use dedicated pipettes for each area.' },
      { id: 'B', title: 'Just use new tips', description: 'Using new tips is sufficient.' },
    ],
    correctOptionId: 'A',
    explanation: 'PCR requires strict separation of pre- and post-PCR areas, dedicated pipettes for each area, and filter tips to prevent amplicon carryover contamination.'
  },
  {
    id: 50,
    category: Category.CONTAMINATION_PREVENTION,
    difficulty: Difficulty.ADVANCED,
    questionText: 'What is the risk of pipetting too quickly and creating aerosols?',
    options: [
      { id: 'A', title: 'Aerosol contamination', description: 'Rapid pipetting can create aerosols that spread contaminants throughout the workspace.' },
      { id: 'B', title: 'No risk', description: 'Speed does not affect contamination risk.' },
    ],
    correctOptionId: 'A',
    explanation: 'Rapid pipetting can create aerosols that spread contaminants through the air, potentially contaminating other samples and the workspace.'
  },
  {
    id: 51,
    category: Category.CONTAMINATION_PREVENTION,
    difficulty: Difficulty.ADVANCED,
    questionText: 'When working with cell cultures, what contamination prevention is critical?',
    options: [
      { id: 'A', title: 'Sterile technique and filter tips', description: 'Use sterile technique, filter tips, and work in a biosafety cabinet to prevent microbial contamination.' },
      { id: 'B', title: 'Just use clean tips', description: 'Regular tips are sufficient.' },
    ],
    correctOptionId: 'A',
    explanation: 'Cell culture work requires strict sterile technique, filter tips, and often a biosafety cabinet to prevent microbial contamination that could ruin cultures.'
  },

  // Sterile Technique - Beginner (need 4 more)
  {
    id: 52,
    category: Category.STERILE_TECHNIQUE,
    difficulty: Difficulty.BEGINNER,
    questionText: 'What does "sterile" mean in laboratory work?',
    options: [
      { id: 'A', title: 'Free of all microorganisms', description: 'Sterile means completely free of all living microorganisms.' },
      { id: 'B', title: 'Just clean', description: 'Sterile just means the surface looks clean.' },
    ],
    correctOptionId: 'A',
    explanation: 'Sterile means completely free of all living microorganisms, including bacteria, fungi, and viruses.'
  },
  {
    id: 53,
    category: Category.STERILE_TECHNIQUE,
    difficulty: Difficulty.BEGINNER,
    questionText: 'How should you open a sterile pipette tip box?',
    options: [
      { id: 'A', title: 'Minimize exposure', description: 'Open only when needed, remove one tip, and close quickly to minimize exposure to air.' },
      { id: 'B', title: 'Leave it open', description: 'Keep the box open for easy access to tips.' },
    ],
    correctOptionId: 'A',
    explanation: 'Minimize the time the tip box is open to reduce the chance of airborne contaminants entering the box.'
  },
  {
    id: 54,
    category: Category.STERILE_TECHNIQUE,
    difficulty: Difficulty.BEGINNER,
    questionText: 'What should you do if you drop a sterile item?',
    options: [
      { id: 'A', title: 'Discard it', description: 'Any sterile item that touches a non-sterile surface is no longer sterile and should be discarded.' },
      { id: 'B', title: 'Use it anyway', description: 'It is still sterile enough to use.' },
    ],
    correctOptionId: 'A',
    explanation: 'Once a sterile item touches a non-sterile surface, it is contaminated and must be discarded.'
  },
  {
    id: 55,
    category: Category.STERILE_TECHNIQUE,
    difficulty: Difficulty.BEGINNER,
    questionText: 'Why is it important to work quickly when handling sterile materials?',
    options: [
      { id: 'A', title: 'Minimize contamination risk', description: 'The longer sterile items are exposed to air, the greater the risk of contamination.' },
      { id: 'B', title: 'To save time', description: 'Working quickly just saves time in the lab.' },
    ],
    correctOptionId: 'A',
    explanation: 'Working quickly minimizes the time sterile materials are exposed to potentially contaminated air, reducing contamination risk.'
  },

  // Sterile Technique - Intermediate (need 4 more)
  {
    id: 56,
    category: Category.STERILE_TECHNIQUE,
    difficulty: Difficulty.INTERMEDIATE,
    questionText: 'What is the purpose of flaming the opening of a test tube before use?',
    options: [
      { id: 'A', title: 'Sterilize the opening', description: 'Briefly flaming the opening kills any microorganisms present, creating a sterile entry point.' },
      { id: 'B', title: 'Warm the tube', description: 'It just warms the tube for better handling.' },
    ],
    correctOptionId: 'A',
    explanation: 'Flaming the opening of containers kills microorganisms, creating a sterile entry point for pipettes or other tools.'
  },
  {
    id: 57,
    category: Category.STERILE_TECHNIQUE,
    difficulty: Difficulty.INTERMEDIATE,
    questionText: 'How should you handle the cap of a sterile bottle?',
    options: [
      { id: 'A', title: 'Hold it, do not set it down', description: 'Hold the cap in your hand with the inside facing down to prevent contamination.' },
      { id: 'B', title: 'Set it on the bench', description: 'Place it on the bench for easy access.' },
    ],
    correctOptionId: 'A',
    explanation: 'Hold the cap with the inside facing down to prevent contamination. Never set it on the bench where it can pick up contaminants.'
  },
  {
    id: 58,
    category: Category.STERILE_TECHNIQUE,
    difficulty: Difficulty.INTERMEDIATE,
    questionText: 'What is the "zone of sterility" around a Bunsen burner?',
    options: [
      { id: 'A', title: 'Area of rising hot air', description: 'The rising hot air creates a cone of relatively sterile space above the flame.' },
      { id: 'B', title: 'The flame itself', description: 'Only the flame is sterile.' },
    ],
    correctOptionId: 'A',
    explanation: 'The rising hot air from a Bunsen burner creates a cone of relatively sterile space (about 6 inches) above the flame where work can be performed.'
  },
  {
    id: 59,
    category: Category.STERILE_TECHNIQUE,
    difficulty: Difficulty.INTERMEDIATE,
    questionText: 'Why should you avoid talking directly over open sterile containers?',
    options: [
      { id: 'A', title: 'Prevent droplet contamination', description: 'Talking can release droplets from your mouth that may contain microorganisms.' },
      { id: 'B', title: 'It is impolite', description: 'Talking over containers is just bad manners.' },
    ],
    correctOptionId: 'A',
    explanation: 'Talking releases droplets from your mouth that can contain microorganisms, which may contaminate sterile materials.'
  },

  // Sterile Technique - Advanced (need 4 more)
  {
    id: 60,
    category: Category.STERILE_TECHNIQUE,
    difficulty: Difficulty.ADVANCED,
    questionText: 'What is the purpose of a HEPA filter in a biosafety cabinet?',
    options: [
      { id: 'A', title: 'Remove airborne contaminants', description: 'HEPA filters remove 99.97% of airborne particles, including microorganisms, creating sterile air.' },
      { id: 'B', title: 'Cool the air', description: 'It just cools the air in the cabinet.' },
    ],
    correctOptionId: 'A',
    explanation: 'HEPA (High Efficiency Particulate Air) filters remove virtually all airborne particles and microorganisms, providing sterile air for sensitive work.'
  },
  {
    id: 61,
    category: Category.STERILE_TECHNIQUE,
    difficulty: Difficulty.ADVANCED,
    questionText: 'How should you arrange materials in a biosafety cabinet?',
    options: [
      { id: 'A', title: 'Clean to dirty workflow', description: 'Arrange materials from clean (unused) to dirty (waste) to maintain sterile zones.' },
      { id: 'B', title: 'Any arrangement is fine', description: 'Material arrangement does not matter.' },
    ],
    correctOptionId: 'A',
    explanation: 'Organizing materials in a clean-to-dirty workflow helps maintain sterile zones and prevents contamination of clean materials.'
  },
  {
    id: 62,
    category: Category.STERILE_TECHNIQUE,
    difficulty: Difficulty.ADVANCED,
    questionText: 'What is the difference between sterile and aseptic technique?',
    options: [
      { id: 'A', title: 'Aseptic prevents contamination', description: 'Aseptic technique prevents contamination, while sterile technique works with already-sterile materials.' },
      { id: 'B', title: 'They are the same', description: 'There is no difference.' },
    ],
    correctOptionId: 'A',
    explanation: 'Aseptic technique prevents contamination during procedures, while sterile technique involves working with materials that are already sterile.'
  },
  {
    id: 63,
    category: Category.STERILE_TECHNIQUE,
    difficulty: Difficulty.ADVANCED,
    questionText: 'Why is it important to let a biosafety cabinet run for a few minutes before use?',
    options: [
      { id: 'A', title: 'Establish sterile airflow', description: 'Running the cabinet establishes proper sterile airflow and removes any contaminants.' },
      { id: 'B', title: 'Warm up the equipment', description: 'It just warms up the cabinet.' },
    ],
    correctOptionId: 'A',
    explanation: 'Allowing the cabinet to run establishes proper sterile airflow and removes any contaminants that may have entered while it was off.'
  },

  // Equipment Handling - Beginner (need 3 more)
  {
    id: 64,
    category: Category.EQUIPMENT_HANDLING,
    difficulty: Difficulty.BEGINNER,
    questionText: 'What should you check before using a pipette?',
    options: [
      { id: 'A', title: 'Volume setting and tip attachment', description: 'Verify the volume is set correctly and a proper tip is securely attached.' },
      { id: 'B', title: 'Nothing', description: 'Pipettes are always ready to use.' },
    ],
    correctOptionId: 'A',
    explanation: 'Always check that the volume is set correctly and the tip is properly attached before pipetting to ensure accuracy.'
  },
  {
    id: 65,
    category: Category.EQUIPMENT_HANDLING,
    difficulty: Difficulty.BEGINNER,
    questionText: 'How should you hold a pipette?',
    options: [
      { id: 'A', title: 'Vertically and comfortably', description: 'Hold the pipette vertically with a comfortable, relaxed grip.' },
      { id: 'B', title: 'At any angle', description: 'The angle does not matter.' },
    ],
    correctOptionId: 'A',
    explanation: 'Holding the pipette vertically with a comfortable grip ensures accurate operation and reduces hand fatigue.'
  },
  {
    id: 66,
    category: Category.EQUIPMENT_HANDLING,
    difficulty: Difficulty.BEGINNER,
    questionText: 'What should you do if a pipette feels sticky or hard to operate?',
    options: [
      { id: 'A', title: 'Report for maintenance', description: 'A sticky or difficult-to-operate pipette may need cleaning or maintenance.' },
      { id: 'B', title: 'Force it to work', description: 'Just use more force to operate it.' },
    ],
    correctOptionId: 'A',
    explanation: 'A pipette that feels sticky or difficult to operate may be damaged or need maintenance. Forcing it can cause further damage.'
  },

  // Equipment Handling - Intermediate (need 4 more)
  {
    id: 67,
    category: Category.EQUIPMENT_HANDLING,
    difficulty: Difficulty.INTERMEDIATE,
    questionText: 'How often should pipettes be calibrated?',
    options: [
      { id: 'A', title: 'Regularly, as per lab protocol', description: 'Pipettes should be calibrated regularly (typically every 6-12 months) or after any damage.' },
      { id: 'B', title: 'Only when broken', description: 'Calibration is only needed if the pipette breaks.' },
    ],
    correctOptionId: 'A',
    explanation: 'Regular calibration ensures pipettes maintain accuracy. Most labs calibrate every 6-12 months or after any damage or repair.'
  },
  {
    id: 68,
    category: Category.EQUIPMENT_HANDLING,
    difficulty: Difficulty.INTERMEDIATE,
    questionText: 'What is the purpose of pipette maintenance?',
    options: [
      { id: 'A', title: 'Ensure accuracy and longevity', description: 'Regular maintenance keeps pipettes accurate and extends their useful life.' },
      { id: 'B', title: 'Just to clean them', description: 'Maintenance is only about cleaning.' },
    ],
    correctOptionId: 'A',
    explanation: 'Regular maintenance, including cleaning, lubrication, and calibration, ensures pipettes remain accurate and function properly for years.'
  },
  {
    id: 69,
    category: Category.EQUIPMENT_HANDLING,
    difficulty: Difficulty.INTERMEDIATE,
    questionText: 'What should you do if liquid gets into the pipette barrel?',
    options: [
      { id: 'A', title: 'Clean and service immediately', description: 'Liquid in the barrel can damage the pipette and must be cleaned and serviced.' },
      { id: 'B', title: 'Ignore it', description: 'It will dry out on its own.' },
    ],
    correctOptionId: 'A',
    explanation: 'Liquid in the pipette barrel can cause corrosion and damage. The pipette should be cleaned and serviced immediately.'
  },
  {
    id: 70,
    category: Category.EQUIPMENT_HANDLING,
    difficulty: Difficulty.INTERMEDIATE,
    questionText: 'Why should you avoid dropping a pipette?',
    options: [
      { id: 'A', title: 'Can damage internal mechanisms', description: 'Dropping a pipette can damage internal mechanisms, affecting accuracy and requiring repair.' },
      { id: 'B', title: 'It will break the tip', description: 'It only breaks the tip, which can be replaced.' },
    ],
    correctOptionId: 'A',
    explanation: 'Dropping a pipette can damage internal mechanisms, affecting its accuracy. Even if it appears to work, it may need calibration or repair.'
  },

  // Equipment Handling - Advanced (need 4 more)
  {
    id: 71,
    category: Category.EQUIPMENT_HANDLING,
    difficulty: Difficulty.ADVANCED,
    questionText: 'What is the difference between accuracy and precision in pipetting?',
    options: [
      { id: 'A', title: 'Accuracy is correctness, precision is consistency', description: 'Accuracy measures how close to the target volume, while precision measures consistency between measurements.' },
      { id: 'B', title: 'They are the same', description: 'Accuracy and precision mean the same thing.' },
    ],
    correctOptionId: 'A',
    explanation: 'Accuracy refers to how close measurements are to the true value, while precision refers to how consistent repeated measurements are.'
  },
  {
    id: 72,
    category: Category.EQUIPMENT_HANDLING,
    difficulty: Difficulty.ADVANCED,
    questionText: 'What factors can affect pipette accuracy?',
    options: [
      { id: 'A', title: 'Temperature, technique, and maintenance', description: 'Temperature, user technique, tip quality, and proper maintenance all affect accuracy.' },
      { id: 'B', title: 'Only the pipette itself', description: 'Only the pipette design affects accuracy.' },
    ],
    correctOptionId: 'A',
    explanation: 'Multiple factors affect accuracy: temperature (affects liquid density), user technique, tip quality, pipette condition, and proper calibration.'
  },
  {
    id: 73,
    category: Category.EQUIPMENT_HANDLING,
    difficulty: Difficulty.ADVANCED,
    questionText: 'What is the purpose of pipette validation?',
    options: [
      { id: 'A', title: 'Verify performance meets specifications', description: 'Validation tests verify that the pipette performs within specified accuracy and precision limits.' },
      { id: 'B', title: 'Just to check if it works', description: 'Validation just checks if the pipette turns on.' },
    ],
    correctOptionId: 'A',
    explanation: 'Validation involves testing the pipette to verify it meets specified performance criteria for accuracy and precision, ensuring reliable results.'
  },
  {
    id: 74,
    category: Category.EQUIPMENT_HANDLING,
    difficulty: Difficulty.ADVANCED,
    questionText: 'How does temperature affect pipette accuracy?',
    options: [
      { id: 'A', title: 'Affects liquid density and air pressure', description: 'Temperature changes affect liquid density and air pressure inside the pipette, impacting volume accuracy.' },
      { id: 'B', title: 'No effect', description: 'Temperature does not affect pipetting accuracy.' },
    ],
    correctOptionId: 'A',
    explanation: 'Temperature affects liquid density and air pressure. Pipettes are typically calibrated at 20°C, and significant temperature differences can affect accuracy.'
  }
];
