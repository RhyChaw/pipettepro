'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

// Tutorial Button Component - Passes tutorial state to simulator
function TutorialButton() {
  const [showTooltip, setShowTooltip] = useState(false);
  
  const handleClick = () => {
    // Dispatch a custom event that the simulator can listen to
    window.dispatchEvent(new CustomEvent('showTutorial'));
  };

  return (
    <>
      <button
        onClick={handleClick}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className="fixed top-20 left-4 z-50 bg-blue-600 hover:bg-blue-700 text-white rounded-full w-12 h-12 shadow-lg transition-colors flex items-center justify-center"
        aria-label="Get Tutorial"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </button>
      {showTooltip && (
        <div className="fixed top-20 left-20 z-50 bg-slate-900 text-white px-3 py-2 rounded-lg text-sm shadow-lg whitespace-nowrap">
          Get Tutorial
        </div>
      )}
    </>
  );
}

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
  const { userProfile } = useAuth();
  const [hoveredTab, setHoveredTab] = useState<string | null>(null);
  const [particlePositions, setParticlePositions] = useState<Array<{ left: number; top: number }>>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar Toggle Button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="fixed top-4 left-4 z-50 bg-white border-2 border-slate-300 rounded-lg p-2 shadow-md hover:bg-slate-50 transition-colors"
        aria-label="Toggle sidebar"
      >
        <svg
          className="w-6 h-6 text-slate-700"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          {sidebarOpen ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>

      {/* Tutorial Button - Only show on simulator page */}
      {pathname === '/simulator' && (
        <TutorialButton />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-slate-200 flex-shrink-0 flex flex-col shadow-sm transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Sidebar Toggle Button (inside sidebar) */}
        <button
          onClick={() => setSidebarOpen(false)}
          className="absolute top-4 right-4 bg-slate-100 hover:bg-slate-200 rounded-lg p-2 transition-colors"
          aria-label="Close sidebar"
        >
          <svg
            className="w-5 h-5 text-slate-700"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        {/* Logo Section */}
        <div className="p-6 border-b border-slate-200">
          <Link
            href="/"
            className="flex items-center gap-3 mb-6 group"
            onMouseEnter={() => setHoveredTab('logo')}
            onMouseLeave={() => setHoveredTab(null)}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-slate-700"
            >
              <path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5S5 13 5 15a7 7 0 0 0 7 7z"></path>
            </svg>
            <h1 className="text-lg font-semibold text-slate-900">
              Pipette<span className="text-slate-600">Pro</span>
            </h1>
          </Link>

          {/* Profile Icon */}
          <Link
            href="/profile"
            className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto hover:bg-slate-200 transition-all duration-200 cursor-pointer border-2 border-slate-200 group overflow-hidden"
            onMouseEnter={() => setHoveredTab('profile')}
            onMouseLeave={() => setHoveredTab(null)}
          >
            {userProfile?.profilePictureUrl ? (
              <img
                src={userProfile.profilePictureUrl}
                alt="Profile"
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const parent = target.parentElement;
                  if (parent) {
                    const fallback = document.createElement('div');
                    fallback.className = 'w-full h-full flex items-center justify-center bg-slate-200 text-slate-500 text-sm font-medium';
                    fallback.textContent = userProfile?.name?.charAt(0).toUpperCase() || 'U';
                    parent.appendChild(fallback);
                  }
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-slate-200 text-slate-500 text-sm font-medium">
                {userProfile?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
            )}
          </Link>
        </div>

        {/* Sidebar Tabs */}
        <div className="flex-1 p-3 flex flex-col">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <Link
                key={tab.id}
                href={tab.route}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg mb-1 transition-all duration-200 ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                }`}
                onMouseEnter={() => setHoveredTab(tab.id)}
                onMouseLeave={() => setHoveredTab(null)}
              >
                <span className={`font-medium text-sm ${isActive ? 'text-white' : 'text-slate-700'}`}>
                  {tab.name}
                </span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Overlay when sidebar is open */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto bg-slate-50">
        <div className="container mx-auto px-8 py-8 max-w-7xl">
          {children}
        </div>
      </div>
    </div>
  );
}

