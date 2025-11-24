'use client';

import React, { useEffect, useRef, useState } from 'react';

interface InteractionTutorialOverlayProps {
  currentStep: number;
  onNext: () => void;
  onPrevious: () => void;
  onSkip: () => void;
  currentAngle?: number; // Current pipette angle in degrees
}

const interactionSteps = [
  {
    id: 'fix-orientation',
    title: 'Fix the Orientation',
    description: 'The pipette should be at a 0-degree angle (perpendicular to the table). Currently it\'s at 75 degrees. Type 0 in the angle input box to set it to perpendicular.',
    highlightSelector: '#angle-input',
    focusArea: 'orientation',
  },
  {
    id: 'overview-objects',
    title: 'Overview of Objects',
    description: 'Let\'s go over all the objects on the table:\n\n• Source: The blue beaker containing the liquid you need to pipette\n• Destination: The light blue beaker where you\'ll dispense the liquid\n• Pipette: Your tool for transferring liquid\n• Tips Box: Contains sterile pipette tips\n• Waste: The red box for discarding used tips',
    highlightSelector: null,
    focusArea: 'overview',
  },
];

const InteractionTutorialOverlay: React.FC<InteractionTutorialOverlayProps> = ({
  currentStep,
  onNext,
  onPrevious,
  onSkip,
  currentAngle = 75,
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

      {/* Content overlay - Positioned below Back to Dashboard button */}
      <div className="absolute top-20 left-4 z-[101]" style={{ position: 'absolute', maxWidth: '600px', pointerEvents: 'auto' }}>
        <div className="bg-white rounded-2xl shadow-2xl w-full p-8 relative border-4 border-blue-200">
          {/* Step indicator */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-slate-600">
                Interaction Tutorial - Step {currentStep + 1} of {interactionSteps.length}
              </span>
            </div>
            <button
              onClick={onSkip}
              className="text-slate-400 hover:text-slate-600 transition-colors"
              aria-label="Skip tutorial"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Step content */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">{step.title}</h2>
            <p className="text-lg text-slate-700 leading-relaxed whitespace-pre-wrap">
              {step.description}
            </p>
          </div>

          {/* Navigation buttons */}
          <div className="flex items-center justify-between gap-4">
            <button
              onClick={onPrevious}
              disabled={currentStep === 0}
              className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
                currentStep === 0
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
              }`}
            >
              Previous
            </button>

            <div className="flex gap-2">
              {[...Array(interactionSteps.length)].map((_, idx) => (
                <div
                  key={idx}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    idx === currentStep ? 'bg-blue-600' : 'bg-slate-300'
                  }`}
                />
              ))}
            </div>

            <button
              onClick={isLastStep ? onSkip : onNext}
              disabled={currentStep === 0 && currentAngle !== 0}
              className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
                currentStep === 0 && currentAngle !== 0
                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {currentStep === 0 && currentAngle !== 0
                ? 'Set angle to 0° first'
                : isLastStep
                ? 'Got it!'
                : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InteractionTutorialOverlay;

