'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

type TabType =
  | 'dashboard'
  | 'simulation'
  | 'know-tools'
  | 'quiz'
  | 'mistakes'
  | 'challenge'
  | 'results';

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const [hoveredTab, setHoveredTab] = useState<string | null>(null);
  const [particlePositions, setParticlePositions] = useState<Array<{ left: number; top: number }>>([]);

  // Generate random positions only on client side to avoid hydration mismatch
  useEffect(() => {
    setParticlePositions(
      Array.from({ length: 5 }, () => ({
        left: Math.random() * 100,
        top: Math.random() * 100,
      }))
    );
  }, []);

  const tabs = [
    { id: 'dashboard' as TabType, name: 'Home', route: '/home' },
    { id: 'simulation' as TabType, name: 'Simulation', route: '/simulator' },
    { id: 'know-tools' as TabType, name: 'Know the tools', route: '/know-your-pipette' },
    { id: 'quiz' as TabType, name: 'Quiz', route: '/quiz' },
    { id: 'mistakes' as TabType, name: 'Mistakes', route: '/mistakes' },
    { id: 'challenge' as TabType, name: 'Challenge', route: '/challenge' },
    { id: 'results' as TabType, name: 'Results', route: '/results' },
  ];

  const routeToTab: Record<string, TabType> = {
    '/home': 'dashboard',
    '/simulator': 'simulation',
    '/know-your-pipette': 'know-tools',
    '/quiz': 'quiz',
    '/mistakes': 'mistakes',
    '/challenge': 'challenge',
    '/results': 'results',
  };

  const activeTab = routeToTab[pathname] || 'dashboard';

  return (
    <div
      className="min-h-screen relative overflow-hidden flex"
      style={{
        backgroundImage: 'linear-gradient(to bottom right, #9448B0, #332277, #001C3D)',
      }}
    >
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {particlePositions.length > 0 && [...Array(5)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full opacity-20 blur-3xl animate-pulse-slow"
            style={{
              width: `${100 + i * 50}px`,
              height: `${100 + i * 50}px`,
              left: `${particlePositions[i]?.left || 0}%`,
              top: `${particlePositions[i]?.top || 0}%`,
              backgroundColor: i % 2 === 0 ? '#D8F878' : '#E47CB8',
              animationDelay: `${i * 0.5}s`,
            }}
          />
        ))}
      </div>

      {/* Sidebar */}
      <div className="relative z-10 w-64 bg-white/5 backdrop-blur-xl border-r border-white/10 flex-shrink-0 flex flex-col">
        {/* Logo Section */}
        <div className="p-4 border-b border-white/10">
          <Link
            href="/"
            className="flex items-center gap-3 mb-4 group"
            onMouseEnter={() => setHoveredTab('logo')}
            onMouseLeave={() => setHoveredTab(null)}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-[#D8F878]"
            >
              <path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5S5 13 5 15a7 7 0 0 0 7 7z"></path>
            </svg>
            <h1 className="text-xl font-bold text-white">
              Pipette<span className="text-[#D8F878]">Pro</span>
            </h1>
          </Link>

          {/* Profile Icon */}
          <Link
            href="/profile"
            className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center mx-auto hover:bg-white/20 hover:shadow-[0_0_20px_rgba(216,248,120,0.4)] transition-all duration-300 cursor-pointer border border-white/20 group"
            onMouseEnter={() => setHoveredTab('profile')}
            onMouseLeave={() => setHoveredTab(null)}
          >
            <span className="text-2xl group-hover:scale-110 transition-transform duration-300">👤</span>
          </Link>
        </div>

        {/* Sidebar Tabs */}
        <div className="flex-1 p-2 flex flex-col">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <Link
                key={tab.id}
                href={tab.route}
                className={`relative flex items-center gap-3 px-3 py-3 rounded-xl mb-2 transition-all duration-300 group ${
                  isActive
                    ? 'bg-white/20 text-white shadow-lg shadow-[#9448B0]/30 border border-white/20'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
                onMouseEnter={() => setHoveredTab(tab.id)}
                onMouseLeave={() => setHoveredTab(null)}
              >
                {/* Glow effect on active */}
                {isActive && (
                  <div className="absolute inset-0 bg-gradient-to-r from-[#9448B0]/20 to-[#332277]/20 rounded-xl blur-sm"></div>
                )}

                {/* Label - always visible */}
                <span className="font-semibold relative z-10">
                  {tab.name}
                </span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-6 py-8 max-w-6xl">
          {children}
        </div>
      </div>
    </div>
  );
}

