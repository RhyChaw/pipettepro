'use client';

import DashboardLayout from '../components/DashboardLayout';
import Link from 'next/link';

export default function ChallengePage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="bg-white/95 backdrop-blur-sm rounded-xl p-6 shadow-lg">
          <h2 className="text-3xl font-bold text-[#001C3D] mb-6">🎮 Challenge Mode</h2>
          
          <div className="bg-gradient-to-r from-[#ef4444] to-[#dc2626] text-white rounded-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-bold">Multichannel ELISA Wash</h3>
              <div className="bg-white/20 rounded-lg px-4 py-2">
                <span className="text-3xl font-bold">⏱️ 02:34</span>
              </div>
            </div>
            <p className="text-lg mb-4">Complete 8-well plate wash in under 5 minutes</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/20 rounded-lg p-3">
                <div className="text-sm opacity-90">Efficiency</div>
                <div className="text-2xl font-bold">92%</div>
              </div>
              <div className="bg-white/20 rounded-lg p-3">
                <div className="text-sm opacity-90">Accuracy</div>
                <div className="text-2xl font-bold">95%</div>
              </div>
            </div>
          </div>

          <div className="bg-white border-2 border-gray-300 rounded-lg p-6 mb-6">
            <h3 className="text-xl font-bold text-[#001C3D] mb-4">Performance Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Time Remaining</span>
                <span className="font-bold text-[#22c55e]">02:26</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Wells Completed</span>
                <span className="font-bold text-[#3b82f6]">6/8</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Errors</span>
                <span className="font-bold text-[#ef4444]">0</span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-[#22c55e] to-[#16a34a] text-white rounded-lg p-4">
            <p className="text-center font-bold text-lg">
              🎉 Level 4: Specialized Applications Unlocked!
            </p>
          </div>

          <Link
            href="/simulator"
            className="block w-full bg-gradient-to-r from-[#ef4444] to-[#dc2626] text-white text-center font-bold py-4 px-6 rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 mt-6"
          >
            Start Challenge →
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
}

