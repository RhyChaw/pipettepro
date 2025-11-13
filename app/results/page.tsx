'use client';

import DashboardLayout from '../components/DashboardLayout';

export default function ResultsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="bg-white/95 backdrop-blur-sm rounded-xl p-6 shadow-lg">
          <h2 className="text-3xl font-bold text-[#001C3D] mb-6">📊 Results & Feedback</h2>
          
          {/* Performance Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 border-2 border-blue-500 rounded-lg p-4">
              <div className="text-sm text-gray-600 mb-1">Accuracy</div>
              <div className="text-3xl font-bold text-blue-600">87%</div>
            </div>
            <div className="bg-green-50 border-2 border-green-500 rounded-lg p-4">
              <div className="text-sm text-gray-600 mb-1">Speed Rating</div>
              <div className="text-3xl font-bold text-green-600">Fast</div>
            </div>
            <div className="bg-red-50 border-2 border-red-500 rounded-lg p-4">
              <div className="text-sm text-gray-600 mb-1">Error Count</div>
              <div className="text-3xl font-bold text-red-600">2</div>
            </div>
          </div>

          {/* Strengths & Weaknesses */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-green-50 border-2 border-green-500 rounded-lg p-4">
              <h3 className="text-xl font-bold text-green-800 mb-3">✅ Strengths</h3>
              <ul className="space-y-2">
                <li className="flex items-center gap-2">
                  <span>✓</span>
                  <span>Excellent pipette control</span>
                </li>
                <li className="flex items-center gap-2">
                  <span>✓</span>
                  <span>Consistent volume accuracy</span>
                </li>
                <li className="flex items-center gap-2">
                  <span>✓</span>
                  <span>Good technique on standard liquids</span>
                </li>
              </ul>
            </div>
            <div className="bg-yellow-50 border-2 border-yellow-500 rounded-lg p-4">
              <h3 className="text-xl font-bold text-yellow-800 mb-3">⚠️ Areas for Improvement</h3>
              <ul className="space-y-2">
                <li className="flex items-center gap-2">
                  <span>→</span>
                  <span>Slower release for viscous liquids</span>
                </li>
                <li className="flex items-center gap-2">
                  <span>→</span>
                  <span>Practice reverse pipetting technique</span>
                </li>
                <li className="flex items-center gap-2">
                  <span>→</span>
                  <span>Improve multichannel coordination</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Suggested Modules */}
          <div className="bg-white border-2 border-gray-300 rounded-lg p-4 mb-6">
            <h3 className="text-xl font-bold text-[#001C3D] mb-3">📚 Suggested Modules</h3>
            <div className="space-y-2">
              {[
                'Advanced Reverse Pipetting',
                'Multichannel Techniques',
                'Viscous Liquid Handling'
              ].map((module, idx) => (
                <div key={idx} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                  <span className="font-semibold text-[#001C3D]">{module}</span>
                  <button className="bg-[#9448B0] text-white px-4 py-1 rounded-lg hover:bg-[#A058C0] transition-colors text-sm">
                    Start
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <button className="flex-1 bg-[#3b82f6] text-white font-bold py-3 px-6 rounded-lg hover:bg-[#2563eb] transition-colors">
              Download Report
            </button>
            <button className="flex-1 bg-[#22c55e] text-white font-bold py-3 px-6 rounded-lg hover:bg-[#16a34a] transition-colors">
              Share with Instructor
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

