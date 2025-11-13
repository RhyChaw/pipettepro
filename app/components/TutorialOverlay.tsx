'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

interface TutorialStep {
  id: string;
  title: string;
  description: string;
  highlightSelector?: string; // CSS selector for element to highlight
  highlightPosition?: { top: number; left: number; width: number; height: number }; // Manual position
  action?: () => void; // Optional action to perform
}

interface TutorialOverlayProps {
  onComplete: () => void;
  onSkip: () => void;
}

const tutorialSteps: TutorialStep[] = [
  {
    id: 'see-target',
    title: 'Step 1: See the Target',
    description: 'Look at the target volume input field. This is where you\'ll set the volume you want to pipette.',
    highlightSelector: '#target-volume-input',
  },
  {
    id: 'select-pipette',
    title: 'Step 2: Select the Pipette',
    description: 'Choose the appropriate pipette from the selection below. Make sure it matches your target volume range.',
    highlightSelector: '#pipette-selection',
  },
  {
    id: 'attach-tip',
    title: 'Step 3: Attach a Tip',
    description: 'Click the "Attach Tip" button to place a sterile tip on your pipette. Always use a fresh tip!',
    highlightSelector: '#attach-tip-btn',
  },
  {
    id: 'move-to-source',
    title: 'Step 4: Move to Source Container',
    description: 'Use the arrow buttons or drag on the 3D view to position the pipette over the source liquid container.',
    highlightSelector: '#onScreenControls',
  },
  {
    id: 'aspirate',
    title: 'Step 5: Aspirate (Draw Up) Liquid',
    description: 'Press the "Plunger (Aspirate/Dispense)" button to the first stop, then immerse the tip and release to draw up the liquid.',
    highlightSelector: '#plungerStop1Btn',
  },
  {
    id: 'move-to-target',
    title: 'Step 6: Move to Target Container',
    description: 'Move the pipette to the target container where you want to dispense the liquid.',
    highlightSelector: '#onScreenControls',
  },
  {
    id: 'dispense',
    title: 'Step 7: Dispense the Liquid',
    description: 'Press the plunger button again to dispense. Press to the second stop (Blow-out) to ensure all liquid is dispensed.',
    highlightSelector: '#plungerStop2Btn',
  },
  {
    id: 'eject-tip',
    title: 'Step 8: Eject the Tip',
    description: 'Finally, click "Eject Tip" to remove the used tip. Always eject tips after use to prevent contamination!',
    highlightSelector: '#ejectTipBtn',
  },
];

export default function TutorialOverlay({ onComplete, onSkip }: TutorialOverlayProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [highlightBox, setHighlightBox] = useState<{ top: number; left: number; width: number; height: number } | null>(null);

  const currentStep = tutorialSteps[currentStepIndex];

  useEffect(() => {
    const updateHighlight = () => {
      if (currentStep.highlightSelector) {
        const element = document.querySelector(currentStep.highlightSelector);
        if (element) {
          const rect = element.getBoundingClientRect();
          setHighlightBox({
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
          });
        } else {
          // Fallback to manual position if selector not found
          if (currentStep.highlightPosition) {
            setHighlightBox(currentStep.highlightPosition);
          } else {
            setHighlightBox(null);
          }
        }
      } else if (currentStep.highlightPosition) {
        setHighlightBox(currentStep.highlightPosition);
      } else {
        setHighlightBox(null);
      }
    };

    updateHighlight();
    window.addEventListener('resize', updateHighlight);
    window.addEventListener('scroll', updateHighlight);

    // Small delay to ensure DOM is ready
    const timeout = setTimeout(updateHighlight, 100);

    return () => {
      window.removeEventListener('resize', updateHighlight);
      window.removeEventListener('scroll', updateHighlight);
      clearTimeout(timeout);
    };
  }, [currentStep]);

  const handleNext = () => {
    if (currentStepIndex < tutorialSteps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    } else {
      onComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 pointer-events-auto">
      {/* Dark overlay with spotlight effect - lighter */}
      <div className="absolute inset-0 bg-black/40">
        {highlightBox && (
          <div
            className="absolute rounded-lg border-4 border-[#D8F878] pointer-events-none"
            style={{
              top: `${highlightBox.top}px`,
              left: `${highlightBox.left}px`,
              width: `${highlightBox.width}px`,
              height: `${highlightBox.height}px`,
              boxShadow: `0 0 0 9999px rgba(0, 0, 0, 0.4), 0 0 20px rgba(216, 248, 120, 0.5)`,
            }}
          />
        )}
      </div>

      {/* Tutorial Cloud/Speech Bubble */}
      <div className="absolute top-8 left-8 w-full max-w-2xl z-10">
        <div className="relative bg-white rounded-3xl shadow-2xl p-6 border-4 border-[#D8F878]">
          {/* Mascot Image */}
          <div className="absolute -top-12 -left-12">
            <div className="relative w-24 h-24">
              <Image
                src="/mascot.png"
                alt="PipettePro Mascot"
                width={96}
                height={96}
                className="drop-shadow-2xl"
                unoptimized
                priority
              />
            </div>
          </div>

          {/* Cloud decoration */}
          <div className="absolute -top-8 -left-8 w-32 h-16 bg-white rounded-full opacity-20 blur-xl" />

          {/* Content */}
          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-bold text-[#001C3D]">
                {currentStep.title}
              </h3>
              <span className="text-sm text-[#001C3D] font-semibold opacity-70">
                {currentStepIndex + 1} / {tutorialSteps.length}
              </span>
            </div>
            <p className="text-[#001C3D] text-lg mb-6 leading-relaxed opacity-90">
              {currentStep.description}
            </p>

            {/* Progress Bar */}
            <div className="mb-6">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-[#9448B0] to-[#D8F878] h-2 rounded-full transition-all duration-300"
                  style={{ width: `${((currentStepIndex + 1) / tutorialSteps.length) * 100}%` }}
                />
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between gap-4">
              <button
                onClick={handlePrevious}
                disabled={currentStepIndex === 0}
                className={`px-6 py-2 rounded-lg font-semibold transition-all ${
                  currentStepIndex === 0
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-300 text-[#001C3D] hover:bg-gray-400'
                }`}
              >
                ← Previous
              </button>

              <button
                onClick={onSkip}
                className="px-6 py-2 rounded-lg font-semibold bg-gray-200 text-[#001C3D] hover:bg-gray-300 transition-all"
              >
                Skip Tutorial
              </button>

              <button
                onClick={handleNext}
                className="px-8 py-2 rounded-lg font-semibold bg-gradient-to-r from-[#9448B0] to-[#332277] text-white hover:from-[#A058C0] hover:to-[#443288] transition-all shadow-lg"
              >
                {currentStepIndex === tutorialSteps.length - 1 ? 'Get Started!' : 'Next →'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

