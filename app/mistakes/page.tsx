'use client';

import DashboardLayout from '../components/DashboardLayout';

export default function MistakesPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 mb-2">Mistake Analysis</h1>
          <p className="text-slate-600">Learn from common pipetting errors and how to correct them</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-6">
          <div className="border-l-4 border-red-500 pl-4 mb-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">What went wrong?</h3>
            <p className="text-slate-700">
              You used a normal pipette for a viscous liquid, causing air bubbles to form in the sample.
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 mb-6">
            <h4 className="font-semibold text-slate-900 mb-4">What should you do now?</h4>
            <div className="space-y-3">
              {[
                { text: 'Re-aspirate slowly to avoid air bubbles', correct: true },
                { text: 'Use reverse pipetting technique', correct: false },
                { text: 'Discard the sample and start over', correct: false },
                { text: 'Continue with the current sample', correct: false },
              ].map((option, idx) => (
                <button
                  key={idx}
                  className={`w-full text-left border-2 rounded-lg p-4 transition-all ${
                    option.correct
                      ? 'border-green-500 bg-green-50 text-slate-900'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {option.correct && <span className="text-green-600 font-bold">✓</span>}
                    <span>{option.text}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
            <p className="font-medium text-slate-900">
              Corrective Action: Re-aspirate slowly to avoid air bubbles. For viscous liquids, consider using reverse pipetting technique.
            </p>
          </div>

          <div className="flex gap-4 mt-6">
            <button className="flex-1 bg-slate-900 text-white font-medium py-3 px-6 rounded-lg hover:bg-slate-800 transition-colors">
              Review Scenario
            </button>
            <button className="flex-1 bg-white border-2 border-slate-300 text-slate-900 font-medium py-3 px-6 rounded-lg hover:border-slate-400 hover:bg-slate-50 transition-colors">
              Practice Again
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
