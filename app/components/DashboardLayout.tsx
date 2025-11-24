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

function StickyNotesToggleButton() {
  const [showTooltip, setShowTooltip] = useState(false);

  const handleClick = () => {
    window.dispatchEvent(new CustomEvent('toggleStickyNotes'));
  };

  return (
    <>
      <button
        onClick={handleClick}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className="fixed top-36 left-4 z-50 bg-white border-2 border-slate-300 hover:bg-slate-50 text-slate-800 rounded-full w-12 h-12 shadow-lg transition-colors flex items-center justify-center"
        aria-label="Open sticky notes"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 6h13M8 12h13M8 18h7M3 6h.01M3 12h.01M3 18h.01" />
        </svg>
      </button>
      {showTooltip && (
        <div className="fixed top-36 left-20 z-50 bg-slate-900 text-white px-3 py-2 rounded-lg text-sm shadow-lg whitespace-nowrap">
          Sticky notes
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
  | 'challenge'
  | 'leaderboard'
  | 'notes'
  | 'flashcards';

type AssistantMessage = {
  role: 'assistant' | 'user';
  content: string;
};

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const { userProfile } = useAuth();
  const [hoveredTab, setHoveredTab] = useState<string | null>(null);
  const [particlePositions, setParticlePositions] = useState<Array<{ left: number; top: number }>>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [assistantMessages, setAssistantMessages] = useState<AssistantMessage[]>([
    {
      role: 'assistant',
      content:
        'Hi! I’m PipettePal. Ask me anything about pipetting technique, lab etiquette, or pipette care.',
    },
  ]);
  const [assistantInput, setAssistantInput] = useState('');
  const [assistantLoading, setAssistantLoading] = useState(false);
  const [assistantError, setAssistantError] = useState<string | null>(null);

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
    { id: 'know-tools' as TabType, name: 'Know the tools', route: '/know-your-pipette' },
    { id: 'quiz' as TabType, name: 'Quiz', route: '/quiz' },
    { id: 'simulation' as TabType, name: 'Simulation (practice anything)', route: '/sim-dashboard' },
    { id: 'challenge' as TabType, name: 'Challenges', route: '/challenge' },
    { id: 'leaderboard' as TabType, name: 'Leaderboard', route: '/leaderboard' },
    { id: 'notes' as TabType, name: 'Notes', route: '/notes' },
    { id: 'flashcards' as TabType, name: 'Flashcards', route: '/flashcards' },
  ];

  const routeToTab: Record<string, TabType> = {
    '/home': 'dashboard',
    '/simulator': 'simulation',
    '/sim-dashboard': 'simulation',
    '/know-your-pipette': 'know-tools',
    '/quiz': 'quiz',
    '/challenge': 'challenge',
    '/leaderboard': 'leaderboard',
    '/notes': 'notes',
    '/your-docs': 'notes', // Also highlight notes when on scan page
    '/flashcards': 'flashcards',
  };

  const activeTab = routeToTab[pathname] || 'dashboard';

  const handleAssistantSend = async () => {
    const trimmed = assistantInput.trim();
    if (!trimmed || assistantLoading) return;

    const newMessages: AssistantMessage[] = [...assistantMessages, { role: 'user', content: trimmed }];
    setAssistantMessages(newMessages);
    setAssistantInput('');
    setAssistantLoading(true);
    setAssistantError(null);

    try {
      const response = await fetch('/api/pipette-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages.slice(-8) }),
      });

      if (!response.ok) {
        throw new Error('Failed to reach PipettePal');
      }

      const data = await response.json();
      const reply =
        typeof data.reply === 'string'
          ? data.reply
          : 'I had trouble generating a response. Please try again.';

      setAssistantMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
    } catch (error) {
      setAssistantError('Unable to contact PipettePal right now. Try again soon.');
    } finally {
      setAssistantLoading(false);
    }
  };

  const handleAssistantToggle = () => {
    setAssistantOpen((prev) => !prev);
    setAssistantError(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar Toggle Button - Only show when sidebar is closed */}
      {!sidebarOpen && (
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
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      )}

      {/* Tutorial Button - Only show on simulator page */}
      {pathname === '/simulator' && (
        <>
          <TutorialButton />
          <StickyNotesToggleButton />
        </>
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

      {/* Floating Mascot */}
      <button
        onClick={handleAssistantToggle}
        className="fixed bottom-4 right-4 z-40 rounded-full shadow-xl hover:scale-105 transition-transform focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        aria-label="Open Pipette assistant"
      >
        <img
          src="/mascot_floating.png"
          alt="Pipette assistant mascot"
          className="w-20 h-20 drop-shadow-lg pointer-events-none select-none"
        />
      </button>

      {/* Assistant Chat Box */}
      {assistantOpen && (
        <div className="fixed bottom-4 right-28 w-80 bg-white border-2 border-slate-200 rounded-2xl shadow-2xl z-50 flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <div>
              <p className="text-sm uppercase text-slate-500 font-semibold tracking-wide">PipettePal</p>
              <p className="text-slate-900 font-semibold text-base">Your pipette buddy</p>
            </div>
            <button
              onClick={handleAssistantToggle}
              className="text-slate-400 hover:text-slate-600 transition-colors"
              aria-label="Close assistant"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 text-sm bg-slate-50">
            {assistantMessages.map((message, idx) => (
              <div
                key={idx}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-3 py-2 ${
                    message.role === 'user'
                      ? 'bg-slate-900 text-white'
                      : 'bg-white text-slate-900 border border-slate-200'
                  }`}
                >
                  {message.content}
                </div>
              </div>
            ))}
            {assistantError && (
              <div className="text-xs text-red-500 bg-red-50 border border-red-200 rounded-lg px-2 py-1">
                {assistantError}
              </div>
            )}
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleAssistantSend();
            }}
            className="border-t border-slate-100 bg-white p-3"
          >
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={assistantInput}
                onChange={(e) => setAssistantInput(e.target.value)}
                placeholder="Ask about pipettes..."
            className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300"
              />
              <button
                type="submit"
                disabled={assistantLoading}
                className="px-3 py-2 rounded-xl bg-slate-900 text-white text-sm font-semibold disabled:bg-slate-400"
              >
                {assistantLoading ? '...' : 'Send'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

