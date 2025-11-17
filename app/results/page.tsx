'use client';

import DashboardLayout from '../components/DashboardLayout';

export default function ResultsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 mb-2">Results & Performance</h1>
          <p className="text-slate-600">Review your performance history and track your progress</p>
        </div>

        {/* Performance Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white border border-slate-200 rounded-lg p-6">
            <div className="text-sm text-slate-600 mb-1">Overall Accuracy</div>
            <div className="text-3xl font-semibold text-slate-900">87%</div>
            <div className="text-xs text-slate-500 mt-1">Based on last 10 sessions</div>
          </div>
          <div className="bg-white border border-slate-200 rounded-lg p-6">
            <div className="text-sm text-slate-600 mb-1">Average Speed</div>
            <div className="text-3xl font-semibold text-slate-900">Good</div>
            <div className="text-xs text-slate-500 mt-1">Within acceptable range</div>
          </div>
          <div className="bg-white border border-slate-200 rounded-lg p-6">
            <div className="text-sm text-slate-600 mb-1">Total Errors</div>
            <div className="text-3xl font-semibold text-slate-900">2</div>
            <div className="text-xs text-slate-500 mt-1">Last 30 days</div>
          </div>
        </div>

        {/* Strengths & Weaknesses */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white border border-slate-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Strengths</h3>
            <ul className="space-y-2">
              <li className="flex items-start gap-2 text-slate-700">
                <span className="text-green-600 mt-0.5">✓</span>
                <span>Excellent pipette control and handling</span>
              </li>
              <li className="flex items-start gap-2 text-slate-700">
                <span className="text-green-600 mt-0.5">✓</span>
                <span>Consistent volume accuracy</span>
              </li>
              <li className="flex items-start gap-2 text-slate-700">
                <span className="text-green-600 mt-0.5">✓</span>
                <span>Good technique with standard liquids</span>
              </li>
            </ul>
          </div>
          <div className="bg-white border border-slate-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Areas for Improvement</h3>
            <ul className="space-y-2">
              <li className="flex items-start gap-2 text-slate-700">
                <span className="text-slate-400 mt-0.5">→</span>
                <span>Slower release for viscous liquids</span>
              </li>
              <li className="flex items-start gap-2 text-slate-700">
                <span className="text-slate-400 mt-0.5">→</span>
                <span>Practice reverse pipetting technique</span>
              </li>
              <li className="flex items-start gap-2 text-slate-700">
                <span className="text-slate-400 mt-0.5">→</span>
                <span>Improve multichannel coordination</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Suggested Modules */}
        <div className="bg-white border border-slate-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Recommended Practice</h3>
          <div className="space-y-3">
            {[
              'Advanced Reverse Pipetting',
              'Multichannel Techniques',
              'Viscous Liquid Handling'
            ].map((module, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
                <span className="font-medium text-slate-900">{module}</span>
                <button className="bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors text-sm font-medium">
                  Start Practice
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          <button className="flex-1 bg-slate-900 text-white font-medium py-3 px-6 rounded-lg hover:bg-slate-800 transition-colors">
            Download Report
          </button>
          <button className="flex-1 bg-white border-2 border-slate-300 text-slate-900 font-medium py-3 px-6 rounded-lg hover:border-slate-400 hover:bg-slate-50 transition-colors">
            Share with Instructor
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}
