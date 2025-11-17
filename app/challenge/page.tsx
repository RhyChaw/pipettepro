'use client';

import DashboardLayout from '../components/DashboardLayout';
import Link from 'next/link';

export default function ChallengePage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 mb-2">Challenge Mode</h1>
          <p className="text-slate-600">Complete timed challenges to improve your speed and accuracy</p>
        </div>

        <div className="bg-white border-2 border-slate-900 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-slate-900">Multichannel ELISA Wash</h3>
            <div className="bg-slate-100 border border-slate-300 rounded-lg px-4 py-2">
              <span className="text-2xl font-semibold text-slate-900">02:34</span>
            </div>
          </div>
          <p className="text-slate-700 mb-4">Complete 8-well plate wash in under 5 minutes</p>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
              <div className="text-sm text-slate-600 mb-1">Efficiency</div>
              <div className="text-2xl font-semibold text-slate-900">92%</div>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
              <div className="text-sm text-slate-600 mb-1">Accuracy</div>
              <div className="text-2xl font-semibold text-slate-900">95%</div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Performance Summary</h3>
          <div className="space-y-3">
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-600">Time Remaining</span>
              <span className="font-semibold text-slate-900">02:26</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-600">Wells Completed</span>
              <span className="font-semibold text-slate-900">6/8</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-slate-600">Errors</span>
              <span className="font-semibold text-slate-900">0</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-900 text-white rounded-lg p-4">
          <p className="text-center font-semibold">
            Level 4: Specialized Applications Unlocked
          </p>
        </div>

        <Link
          href="/simulator"
          className="block w-full bg-slate-900 text-white text-center font-medium py-4 px-6 rounded-lg hover:bg-slate-800 transition-colors"
        >
          Start Challenge
        </Link>
      </div>
    </DashboardLayout>
  );
}
