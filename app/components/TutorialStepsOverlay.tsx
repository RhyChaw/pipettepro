'use client';

import React, { useEffect, useRef, useState } from 'react';

interface TutorialStepsOverlayProps {
  currentStep: number;
  subStep?: 'click-button' | 'select-pipette';
  onNext: () => void;
  onPrevious: () => void;
  onSkip: () => void;
}

const tutorialSteps = [
  {
    id: 'question-area',
    title: 'Question Area',
    description: 'This is where you can see the question',
    highlightSelector: '#current-task-area',
    focusArea: 'question',
  },
  {
    id: 'pipette-selection',
    title: 'Pipette Selection',
    description: 'From our question, you should pick the P200 pipette here from the pipette colors',
    highlightSelector: '#pipette-colors-button',
    focusArea: 'pipette',
    subStepDescription: {
      'click-button': 'Click the "Pipette colors" button to open the pipette selection',
      'select-pipette': 'Now select the P200 pipette (yellow/gold colored) from the options',
    },
  },
  {
    id: 'quiz-section',
    title: 'Live Quiz',
    description: 'You can do a random live quiz here',
    highlightSelector: '#quiz-tab-btn',
    focusArea: 'quiz',
  },
  {
    id: 'live-feedback',
    title: 'Live Feedback',
    description: 'This shows real-time feedback on your pipetting technique, including angle, depth, and plunger position',
    highlightSelector: '#live-feedback',
    focusArea: 'feedback',
  },
  {
    id: 'movement-controls',
    title: 'Movement Controls',
    description: 'Use arrow keys or these buttons to move the pipette horizontally. Use W/S keys or the height slider to adjust vertical position',
    highlightSelector: '#movement-controls',
    focusArea: 'movement',
  },
  {
    id: 'plunger-controls',
    title: 'Plunger Controls',
    description: 'Press the plunger buttons to aspirate (draw up) and dispense liquid. First stop for aspirating, second stop for complete dispensing',
    highlightSelector: '#plunger-controls',
    focusArea: 'plunger',
  },
  {
    id: 'ready-to-begin',
    title: 'Ready to Begin',
    description: 'You\'re all set! Click "Begin Pipetting" to start practicing with the tutorial scenario',
    highlightSelector: null,
    focusArea: 'ready',
  },
];

const TutorialStepsOverlay: React.FC<TutorialStepsOverlayProps> = ({
  currentStep,
  subStep = 'click-button',
  onNext,
  onPrevious,
  onSkip,
}) => {
  const step = tutorialSteps[currentStep];
  const isLastStep = currentStep === tutorialSteps.length - 1;
  const highlightRef = useRef<HTMLDivElement>(null);
  const [highlightPosition, setHighlightPosition] = useState<{
    top: number;
    left: number;
    width: number;
    height: number;
  } | null>(null);

  // Get the description based on substep for step 2
  const getDescription = () => {
    if (currentStep === 1 && step.subStepDescription) {
      return step.subStepDescription[subStep] || step.description;
    }
    return step.description;
  };
  
  // Get the highlight selector based on substep for step 2
  const getHighlightSelector = () => {
    if (currentStep === 1) {
      if (subStep === 'click-button') {
        return '#pipette-colors-button';
      } else {
        return '#pipette-selection';
      }
    }
    return step.highlightSelector;
  };

  useEffect(() => {
    const selector = getHighlightSelector();
    if (selector) {
      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        const element = document.querySelector(selector);
        if (element) {
          // Scroll the element into view if it's in a scrollable container
          // Check if it's in the right panel (control panel) - look for the side panel
          const controlPanel = element.closest('[class*="overflow-y-auto"]') || 
                               element.closest('[class*="overflow-y"]') ||
                               document.querySelector('[class*="Control Panel"]') ||
                               document.querySelector('.w-96');
          
          if (controlPanel && controlPanel !== document.body) {
            // Scroll within the control panel container
            const containerRect = controlPanel.getBoundingClientRect();
            const elementRect = element.getBoundingClientRect();
            const scrollTop = controlPanel.scrollTop;
            const elementTop = elementRect.top - containerRect.top + scrollTop;
            const containerHeight = controlPanel.clientHeight;
            const elementHeight = elementRect.height;
            
            // Calculate the scroll position to center the element
            const targetScroll = elementTop - (containerHeight / 2) + (elementHeight / 2);
            
            controlPanel.scrollTo({
              top: targetScroll,
              behavior: 'smooth'
            });
          } else {
            // Fallback: scroll the element itself into view
            element.scrollIntoView({ 
              behavior: 'smooth', 
              block: 'center',
              inline: 'nearest'
            });
          }
          
          // Wait a bit for scroll to complete before setting highlight position
          setTimeout(() => {
            const rect = element.getBoundingClientRect();
            setHighlightPosition({
              top: rect.top + window.scrollY,
              left: rect.left + window.scrollX,
              width: rect.width,
              height: rect.height,
            });
          }, 300);
        } else {
          console.warn(`Element not found: ${selector}`);
        }
      }, 100);
      
      return () => clearTimeout(timer);
    } else {
      setHighlightPosition(null);
    }
  }, [currentStep, subStep]);

  return (
    <div className="fixed inset-0 z-[100]" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
      {/* Highlighted area - Hide when selecting pipette to avoid overlay mismatch */}
      {highlightPosition && !(currentStep === 1 && subStep === 'select-pipette') && (
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
                Step {currentStep + 1} of {tutorialSteps.length}
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
              {getDescription()}
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
              {[...Array(tutorialSteps.length)].map((_, idx) => (
                <div
                  key={idx}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    idx === currentStep ? 'bg-blue-600' : 'bg-slate-300'
                  }`}
                />
              ))}
            </div>

            {currentStep === 1 && subStep === 'click-button' ? (
              <button
                disabled
                className="px-6 py-3 bg-slate-300 text-slate-500 rounded-lg font-semibold cursor-not-allowed"
              >
                Click the button above
              </button>
            ) : currentStep === 1 && subStep === 'select-pipette' ? (
              <button
                disabled
                className="px-6 py-3 bg-slate-300 text-slate-500 rounded-lg font-semibold cursor-not-allowed"
              >
                Select P200 pipette
              </button>
            ) : (
              <button
                onClick={isLastStep ? onSkip : onNext}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                {isLastStep ? 'Begin Pipetting!' : 'Next'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TutorialStepsOverlay;

