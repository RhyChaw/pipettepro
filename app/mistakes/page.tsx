'use client';

import DashboardLayout from '../components/DashboardLayout';
import Link from 'next/link';

export default function MistakesPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="bg-white/95 backdrop-blur-sm rounded-xl p-6 shadow-lg">
          <h2 className="text-3xl font-bold text-[#001C3D] mb-6">⚠️ Mistake Scenario</h2>
          
          <div className="bg-red-50 border-2 border-red-500 rounded-lg p-6 mb-6">
            <h3 className="text-xl font-bold text-red-800 mb-4">❌ What went wrong?</h3>
            <p className="text-lg text-gray-700 mb-4">
              You used a normal pipette for a viscous liquid, causing air bubbles to form in the sample.
            </p>
            <div className="bg-white rounded-lg p-4 mb-4">
              <h4 className="font-bold text-[#001C3D] mb-2">What should you do now?</h4>
              <div className="space-y-2">
                {[
                  'Re-aspirate slowly to avoid air bubbles',
                  'Use reverse pipetting technique',
                  'Discard the sample and start over',
                  'Continue with the current sample'
                ].map((option, idx) => (
                  <button
                    key={idx}
                    className={`w-full text-left border-2 rounded-lg p-3 transition-all ${
                      idx === 0 
                        ? 'border-green-500 bg-green-50' 
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
            <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4">
              <p className="font-semibold text-yellow-800">
                💡 Corrective Action: Re-aspirate slowly to avoid air bubbles.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <button className="flex-1 bg-[#3b82f6] text-white font-bold py-3 px-6 rounded-lg hover:bg-[#2563eb] transition-colors">
              Replay Scenario
            </button>
            <button className="flex-1 bg-[#22c55e] text-white font-bold py-3 px-6 rounded-lg hover:bg-[#16a34a] transition-colors">
              Redo Practice
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

