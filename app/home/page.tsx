'use client';

import DashboardLayout from '../components/DashboardLayout';
import Link from 'next/link';
import { useState } from 'react';

export default function HomePage() {
  const username = 'Student';
  const xp = 1250;
  const level = 3;
  const accuracy = 87;
  const badges = ['Precision Master', 'Speed Demon', 'Perfect Technique'];
  const nextLevelXP = 1000 - (xp % 1000);
  const xpProgress = ((xp % 1000) / 10);

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Welcome Section */}
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/10 shadow-2xl relative overflow-hidden group hover:border-[#9448B0]/50 transition-all duration-500">
          {/* Animated background glow */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#9448B0]/10 via-transparent to-[#332277]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-2 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                Welcome back, {username}!
              </h2>
              <p className="text-xl text-gray-300">Ready to pipette like a pro?</p>
            </div>
            {/* Animated Profile Avatar */}
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#9448B0] via-[#E47CB8] to-[#332277] p-1 animate-pulse-slow">
                <div className="w-full h-full rounded-full bg-gradient-to-br from-[#9448B0] to-[#332277] flex items-center justify-center backdrop-blur-sm border-2 border-white/20 shadow-[0_0_30px_rgba(148,72,176,0.5)]">
                  <span className="text-4xl">👤</span>
                </div>
              </div>
              {/* Orbiting glow effect */}
              <div className="absolute inset-0 rounded-full bg-[#D8F878]/20 blur-xl animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Progress Tracker - 3 Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* XP Points Card */}
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 shadow-xl hover:border-[#9448B0]/50 hover:shadow-[0_0_30px_rgba(148,72,176,0.3)] transition-all duration-300 group relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-[#9448B0]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <span className="text-gray-400 font-semibold">XP Points</span>
                <span className="text-3xl animate-bounce-slow">⭐</span>
              </div>
              <div className="text-4xl font-bold text-white mb-4 bg-gradient-to-r from-[#9448B0] to-[#E47CB8] bg-clip-text text-transparent">
                {xp.toLocaleString()}
              </div>
              <div className="relative">
                <div className="w-full bg-gray-800/50 rounded-full h-3 overflow-hidden border border-white/10">
                  <div 
                    className="h-full bg-gradient-to-r from-[#9448B0] via-[#E47CB8] to-[#D8F878] rounded-full transition-all duration-1000 ease-out relative overflow-hidden"
                    style={{ width: `${xpProgress}%` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
                  </div>
                </div>
                <p className="text-sm text-gray-400 mt-2">Next level: {nextLevelXP} XP</p>
              </div>
            </div>
          </div>

          {/* Level Card */}
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 shadow-xl hover:border-[#E47CB8]/50 hover:shadow-[0_0_30px_rgba(228,124,184,0.3)] transition-all duration-300 group relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-[#E47CB8]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <span className="text-gray-400 font-semibold">Level</span>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#E47CB8] to-[#9448B0] flex items-center justify-center border-2 border-white/20 shadow-lg">
                  <span className="text-xl">🎯</span>
                </div>
              </div>
              <div className="text-4xl font-bold text-white mb-2 bg-gradient-to-r from-[#E47CB8] to-[#9448B0] bg-clip-text text-transparent">
                Level {level}
              </div>
              <p className="text-sm text-gray-400">Intermediate Pipetter</p>
            </div>
          </div>

          {/* Accuracy Card with Radial Progress */}
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 shadow-xl hover:border-[#22c55e]/50 hover:shadow-[0_0_30px_rgba(34,197,94,0.3)] transition-all duration-300 group relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-[#22c55e]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <span className="text-gray-400 font-semibold">Accuracy</span>
                <span className="text-3xl">🎯</span>
              </div>
              <div className="relative w-24 h-24 mx-auto mb-4">
                {/* Radial Progress Ring */}
                <svg className="transform -rotate-90 w-24 h-24">
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    stroke="rgba(255,255,255,0.1)"
                    strokeWidth="8"
                    fill="none"
                  />
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    stroke="url(#accuracyGradient)"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 40}`}
                    strokeDashoffset={`${2 * Math.PI * 40 * (1 - accuracy / 100)}`}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                  />
                  <defs>
                    <linearGradient id="accuracyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#22c55e" />
                      <stop offset="100%" stopColor="#D8F878" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">{accuracy}%</span>
                </div>
              </div>
              <p className="text-sm text-gray-400 text-center">Excellent work!</p>
            </div>
          </div>
        </div>

        {/* Badges Earned - Holographic Grid */}
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/10 shadow-2xl">
          <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
            <span className="text-3xl">🏆</span>
            <span className="bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              Badges Earned
            </span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {badges.map((badge, idx) => (
              <div
                key={idx}
                className="group relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:border-[#D8F878]/50 transition-all duration-300 hover:transform hover:scale-105 hover:shadow-[0_0_20px_rgba(216,248,120,0.4)]"
              >
                {/* Holographic shimmer effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 group-hover:animate-shimmer rounded-xl"></div>
                <div className="relative z-10">
                  <div className="text-center">
                    <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gradient-to-br from-[#D8F878]/30 to-[#22c55e]/30 flex items-center justify-center border border-[#D8F878]/50">
                      <span className="text-2xl">✨</span>
                    </div>
                    <p className="font-bold text-white text-sm">{badge}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Start Simulation Card */}
          <Link
            href="/simulator"
            className="group relative bg-gradient-to-br from-[#9448B0]/20 to-[#332277]/20 backdrop-blur-xl rounded-2xl p-8 border border-white/10 shadow-2xl hover:border-[#9448B0]/50 hover:shadow-[0_0_40px_rgba(148,72,176,0.5)] transition-all duration-300 hover:transform hover:scale-[1.02] overflow-hidden"
          >
            {/* Animated background */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#9448B0]/20 via-[#E47CB8]/20 to-[#9448B0]/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-gradient"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-3xl font-bold text-white mb-3">Start Simulation</h3>
                  <p className="text-gray-300">Enter the 3D lab environment</p>
                </div>
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#9448B0] to-[#332277] flex items-center justify-center border-2 border-white/20 shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <span className="text-4xl">🧪</span>
                </div>
              </div>
            </div>
            {/* Floating particles */}
            <div className="absolute top-4 right-4 w-2 h-2 bg-[#D8F878] rounded-full opacity-60 animate-float"></div>
            <div className="absolute bottom-6 left-6 w-1.5 h-1.5 bg-[#E47CB8] rounded-full opacity-60 animate-float" style={{ animationDelay: '1s' }}></div>
          </Link>

          {/* Quick Tutorial Card */}
          <div className="group relative bg-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/10 shadow-2xl hover:border-[#3b82f6]/50 hover:shadow-[0_0_30px_rgba(59,130,246,0.3)] transition-all duration-300 hover:transform hover:scale-[1.02]">
            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-[#3b82f6]/30 to-[#1e40af]/30 flex items-center justify-center border border-[#3b82f6]/50">
                  <span className="text-3xl">📚</span>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">Quick Tutorial</h3>
                  <p className="text-gray-400 text-sm">Learn the basics</p>
                </div>
              </div>
              <p className="text-gray-300 mb-6">Master pipetting fundamentals with step-by-step guidance</p>
              <button className="w-full bg-gradient-to-r from-[#3b82f6] to-[#1e40af] text-white font-bold py-3 px-6 rounded-xl hover:shadow-lg hover:shadow-[#3b82f6]/50 transform hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2">
                <span>▶</span>
                <span>Watch Tutorial</span>
              </button>
            </div>
          </div>
        </div>

        {/* Leaderboard */}
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/10 shadow-2xl">
          <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
            <span className="text-3xl">🏅</span>
            <span className="bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              Top Pipetters
            </span>
          </h3>
          <div className="space-y-3">
            {[
              { name: 'Alex Chen', xp: 3450, rank: 1, avatar: '👨‍🔬' },
              { name: 'Sarah Kim', xp: 3200, rank: 2, avatar: '👩‍🔬' },
              { name: 'Mike Johnson', xp: 2100, rank: 4, avatar: '👨‍💼' },
              { name: username, xp: xp, rank: 5, avatar: '👤' },
            ].map((user, idx) => (
              <div
                key={idx}
                className={`group relative flex items-center justify-between p-4 rounded-xl border transition-all duration-300 ${
                  user.name === username
                    ? 'bg-gradient-to-r from-[#9448B0]/30 to-[#332277]/30 border-[#9448B0] shadow-[0_0_20px_rgba(148,72,176,0.4)]'
                    : 'bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/10'
                }`}
              >
                <div className="flex items-center gap-4">
                  {/* Rank Badge */}
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg border-2 ${
                    user.rank === 1 
                      ? 'bg-gradient-to-br from-yellow-500/30 to-yellow-600/30 border-yellow-400/50 text-yellow-300'
                      : user.rank === 2
                      ? 'bg-gradient-to-br from-gray-400/30 to-gray-500/30 border-gray-300/50 text-gray-200'
                      : user.rank <= 3
                      ? 'bg-gradient-to-br from-orange-500/30 to-orange-600/30 border-orange-400/50 text-orange-300'
                      : 'bg-gradient-to-br from-[#9448B0]/30 to-[#332277]/30 border-[#9448B0]/50 text-white'
                  }`}>
                    #{user.rank}
                  </div>
                  
                  {/* Avatar */}
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#9448B0]/30 to-[#332277]/30 border-2 border-white/20 flex items-center justify-center text-2xl">
                    {user.avatar}
                  </div>
                  
                  {/* Name */}
                  <div>
                    <p className="font-semibold text-white">{user.name}</p>
                    {user.name === username && (
                      <p className="text-xs text-[#D8F878]">You</p>
                    )}
                  </div>
                </div>
                
                {/* XP */}
                <div className="flex items-center gap-2">
                  <span className="text-[#9448B0] font-bold text-lg">{user.xp.toLocaleString()}</span>
                  <span className="text-gray-400 text-sm">XP</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
