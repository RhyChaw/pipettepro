'use client';

import React, { useEffect, useRef, useState } from 'react';

interface InteractionTutorialOverlayProps {
  currentStep: number;
  onNext: () => void;
  onPrevious: () => void;
  onSkip: () => void;
  currentAngle?: number; // Current pipette angle in degrees
  tipAttached?: boolean; // Whether tip has been attached
  waterTransferred?: boolean;
  firstTipEjected?: boolean;
  secondTipAttached?: boolean;
  blueDyeTransferred?: boolean;
  liquidsMixed?: boolean;
  secondTipEjected?: boolean;
  labContainerRef?: React.RefObject<HTMLDivElement | null>; // Reference to the 3D canvas container
}

const interactionSteps = [
  {
    id: 'fix-orientation',
    title: 'Step 1: Fix the Orientation',
    description: 'The pipette should be at a 0-degree angle (perpendicular to the table). Currently it\'s at 75 degrees. Type 0 in the angle input box to set it to perpendicular.',
    highlightSelector: '#angle-input',
    focusArea: 'orientation',
  },
  {
    id: 'attach-tip',
    title: 'Step 2: Attach the Tip',
    description: 'Now hover the pipette over the tip box. You\'ll see an "Attach Tip" button appear. Click it to attach a tip to your pipette.',
    highlightSelector: null,
    focusArea: 'tip-attachment',
  },
  {
    id: 'transfer-water',
    title: 'Step 3: Take Water from Source and Put it in Destination',
    description: 'Move the pipette over the Water beaker (dark blue). Press the plunger to the first stop to aspirate water, then move to the Destination beaker (light blue) and press the plunger to dispense.',
    highlightSelector: null,
    focusArea: 'water-transfer',
  },
  {
    id: 'eject-first-tip',
    title: 'Step 4: Throw the First Tip in the Waste Bin',
    description: 'Move the pipette over the red waste bin. When you hover over it, you\'ll see a "Throw Tip" button. Click it to discard the used tip.',
    highlightSelector: null,
    focusArea: 'tip-ejection',
  },
  {
    id: 'attach-second-tip',
    title: 'Step 5: Attach New Tip for 2nd Source from Tip Box',
    description: 'Go back to the tip box and attach a new tip. Hover over the tip box and click "Attach Tip" again.',
    highlightSelector: null,
    focusArea: 'second-tip-attachment',
  },
  {
    id: 'transfer-blue-dye',
    title: 'Step 6: Take Blue Dye and Put it in Destination Beaker',
    description: 'Move the pipette over the Blue Dye beaker (bright blue). Aspirate the dye, then move to the Destination beaker and dispense it.',
    highlightSelector: null,
    focusArea: 'blue-dye-transfer',
  },
  {
    id: 'mix-liquids',
    title: 'Step 7: Mix Both Liquids to be Cohesive in the Destination',
    description: 'The water and blue dye should now be mixed in the destination beaker. You should see a light blue color forming. This shows the liquids have been successfully mixed together.',
    highlightSelector: null,
    focusArea: 'mixing',
  },
  {
    id: 'eject-second-tip',
    title: 'Step 8: Throw the 2nd Tip',
    description: 'Finally, move the pipette over the waste bin again and discard the second tip. Click "Throw Tip" when the button appears.',
    highlightSelector: null,
    focusArea: 'second-tip-ejection',
  },
];

const InteractionTutorialOverlay: React.FC<InteractionTutorialOverlayProps> = ({
  currentStep,
  onNext,
  onPrevious,
  onSkip,
  currentAngle = 75,
  tipAttached = false,
  waterTransferred = false,
  firstTipEjected = false,
  secondTipAttached = false,
  blueDyeTransferred = false,
  liquidsMixed = false,
  secondTipEjected = false,
  labContainerRef,
}) => {
  const step = interactionSteps[currentStep];
  const isLastStep = currentStep === interactionSteps.length - 1;
  const highlightRef = useRef<HTMLDivElement>(null);
  const [highlightPosition, setHighlightPosition] = useState<{
    top: number;
    left: number;
    width: number;
    height: number;
  } | null>(null);
  const [containerBounds, setContainerBounds] = useState<{
    left: number;
    width: number;
  } | null>(null);

  // Calculate container bounds
  useEffect(() => {
    const updateContainerBounds = () => {
      if (labContainerRef?.current) {
        const rect = labContainerRef.current.getBoundingClientRect();
        setContainerBounds({
          left: rect.left,
          width: rect.width,
        });
      }
    };

    updateContainerBounds();
    window.addEventListener('resize', updateContainerBounds);
    // Update on scroll in case layout changes
    const interval = setInterval(updateContainerBounds, 100);

    return () => {
      window.removeEventListener('resize', updateContainerBounds);
      clearInterval(interval);
    };
  }, [labContainerRef]);

  useEffect(() => {
    if (step.highlightSelector) {
      const timer = setTimeout(() => {
        const element = document.querySelector(step.highlightSelector!);
        if (element) {
          const rect = element.getBoundingClientRect();
          setHighlightPosition({
            top: rect.top + window.scrollY,
            left: rect.left + window.scrollX,
            width: rect.width,
            height: rect.height,
          });
        } else {
          console.warn(`Element not found: ${step.highlightSelector}`);
        }
      }, 100);
      
      return () => clearTimeout(timer);
    } else {
      setHighlightPosition(null);
    }
  }, [currentStep, step.highlightSelector]);

  return (
    <div className="fixed inset-0 z-[100]" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
      {/* Highlighted area */}
      {highlightPosition && (
        <div
          ref={highlightRef}
          className="fixed border-4 border-blue-500 rounded-lg shadow-2xl bg-blue-500/20 pointer-events-none transition-all duration-500 z-[100]"
          style={{
            top: `${highlightPosition.top - 8}px`,
            left: `${highlightPosition.left - 8}px`,
            width: `${highlightPosition.width + 16}px`,
            height: `${highlightPosition.height + 16}px`,
          }}
        />
      )}

      {/* Content overlay - Positioned at bottom, matching 3D canvas width */}
      <div 
        className="absolute bottom-0 z-[101] px-4 pb-4" 
        style={{ 
          pointerEvents: 'auto',
          left: containerBounds ? `${containerBounds.left}px` : '0',
          width: containerBounds ? `${containerBounds.width}px` : '100%',
        }}
      >
        <div className="bg-white rounded-t-2xl shadow-2xl w-full p-3 relative border-t-4 border-l-4 border-r-4 border-blue-200 max-h-[180px] overflow-y-auto">
          {/* Step indicator */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-semibold text-black">
                Interaction Tutorial - Step {currentStep + 1} of {interactionSteps.length}
              </span>
            </div>
            <button
              onClick={onSkip}
              className="text-black hover:text-slate-700 transition-colors"
              aria-label="Skip tutorial"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Step content */}
          <div className="mb-2">
            <h2 className="text-base font-bold text-black mb-1">{step.title}</h2>
            <p className="text-xs text-black leading-tight whitespace-pre-wrap">
              {step.description}
            </p>
            {currentStep === 1 && tipAttached && (
              <div className="mt-1 p-1.5 bg-green-100 border border-green-300 rounded-md">
                <p className="text-green-700 text-[10px] font-semibold">Good! Tip attached successfully. Let's continue!</p>
              </div>
            )}
            {currentStep === 2 && waterTransferred && (
              <div className="mt-1 p-1.5 bg-green-100 border border-green-300 rounded-md">
                <p className="text-green-700 text-[10px] font-semibold">Excellent! Water transferred successfully!</p>
              </div>
            )}
            {currentStep === 3 && firstTipEjected && (
              <div className="mt-1 p-1.5 bg-green-100 border border-green-300 rounded-md">
                <p className="text-green-700 text-[10px] font-semibold">Perfect! Tip discarded correctly!</p>
              </div>
            )}
            {currentStep === 4 && secondTipAttached && (
              <div className="mt-1 p-1.5 bg-green-100 border border-green-300 rounded-md">
                <p className="text-green-700 text-[10px] font-semibold">Great! Second tip attached!</p>
              </div>
            )}
            {currentStep === 5 && blueDyeTransferred && (
              <div className="mt-1 p-1.5 bg-green-100 border border-green-300 rounded-md">
                <p className="text-green-700 text-[10px] font-semibold">Well done! Blue dye transferred!</p>
              </div>
            )}
            {currentStep === 6 && liquidsMixed && (
              <div className="mt-1 p-1.5 bg-green-100 border border-green-300 rounded-md">
                <p className="text-green-700 text-[10px] font-semibold">Perfect! The liquids are now mixed and showing a light blue color!</p>
              </div>
            )}
            {currentStep === 7 && secondTipEjected && (
              <div className="mt-1 p-1.5 bg-green-100 border border-green-300 rounded-md">
                <p className="text-green-700 text-[10px] font-semibold">Excellent! Tutorial complete! 🎉</p>
              </div>
            )}
          </div>

          {/* Navigation buttons */}
          <div className="flex items-center justify-between gap-2 mt-2">
            <button
              onClick={onPrevious}
              disabled={currentStep === 0}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                currentStep === 0
                  ? 'bg-slate-200 text-black cursor-not-allowed opacity-50'
                  : 'bg-slate-200 text-black hover:bg-slate-300'
              }`}
            >
              Previous
            </button>

            <div className="flex gap-1.5">
              {[...Array(interactionSteps.length)].map((_, idx) => (
                <div
                  key={idx}
                  className={`w-1.5 h-1.5 rounded-full transition-colors ${
                    idx === currentStep ? 'bg-blue-600' : 'bg-slate-300'
                  }`}
                />
              ))}
            </div>

            <button
              onClick={isLastStep ? onSkip : onNext}
              disabled={
                (currentStep === 0 && currentAngle !== 0) ||
                (currentStep === 1 && !tipAttached) ||
                (currentStep === 2 && !waterTransferred) ||
                (currentStep === 3 && !firstTipEjected) ||
                (currentStep === 4 && !secondTipAttached) ||
                (currentStep === 5 && !blueDyeTransferred) ||
                (currentStep === 6 && !liquidsMixed) ||
                (currentStep === 7 && !secondTipEjected)
              }
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                (currentStep === 0 && currentAngle !== 0) ||
                (currentStep === 1 && !tipAttached) ||
                (currentStep === 2 && !waterTransferred) ||
                (currentStep === 3 && !firstTipEjected) ||
                (currentStep === 4 && !secondTipAttached) ||
                (currentStep === 5 && !blueDyeTransferred) ||
                (currentStep === 6 && !liquidsMixed) ||
                (currentStep === 7 && !secondTipEjected)
                  ? 'bg-slate-300 text-black cursor-not-allowed opacity-50'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {currentStep === 0 && currentAngle !== 0
                ? 'Set angle to 0° first'
                : currentStep === 1 && !tipAttached
                ? 'Attach tip first'
                : currentStep === 2 && !waterTransferred
                ? 'Transfer water first'
                : currentStep === 3 && !firstTipEjected
                ? 'Eject tip first'
                : currentStep === 4 && !secondTipAttached
                ? 'Attach second tip first'
                : currentStep === 5 && !blueDyeTransferred
                ? 'Transfer blue dye first'
                : currentStep === 6 && !liquidsMixed
                ? 'Wait for mixing'
                : currentStep === 7 && !secondTipEjected
                ? 'Eject second tip first'
                : isLastStep
                ? 'Tutorial Complete! 🎉'
                : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InteractionTutorialOverlay;

