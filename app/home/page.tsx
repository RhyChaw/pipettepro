'use client';

import DashboardLayout from '../components/DashboardLayout';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import { STICKY_NOTE_COLORS, StickyNote } from '../constants/stickyNotes';

export default function HomePage() {
  const { user, userProfile, loading, updateUserProfile } = useAuth();
  const router = useRouter();
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);
  const [showMascotIntroduction, setShowMascotIntroduction] = useState(false);
  const [roadmapExpanded, setRoadmapExpanded] = useState(false);
  const [showSimulationModal, setShowSimulationModal] = useState(false);
  const [showExploreAppModal, setShowExploreAppModal] = useState(false);
  const [mascotInCorner, setMascotInCorner] = useState(false);
  const stickyNotes = (userProfile?.stickyNotes || []) as StickyNote[];

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/signup');
        return;
      }
      // Only redirect to setup if:
      // 1. User exists
      // 2. UserProfile has been loaded (not null)
      // 3. Profile is incomplete (no name and not marked as complete)
      // This prevents redirect loops when userProfile is still loading
      if (user && userProfile !== null && !userProfile.name && !userProfile.profileComplete) {
        router.push('/setup');
        return;
      }
      // If userProfile is null but user exists, it's still loading - don't redirect yet
    }
  }, [user, userProfile, loading, router]);

  // Load completed steps from localStorage and Firebase
  useEffect(() => {
    if (user?.email) {
      // First check Firebase for saved progress
      if (userProfile?.roadmapProgress) {
        const completed = new Set<number>(userProfile.roadmapProgress);
        // Use setTimeout to avoid synchronous setState in effect
        setTimeout(() => {
          setCompletedSteps(completed);
        }, 0);
        // Sync to localStorage
        localStorage.setItem(`roadmap_${user.email}`, JSON.stringify(userProfile.roadmapProgress));
        // Show mascot in corner if all steps are completed
        if (completed.has(2) && completed.has(3) && completed.has(4)) {
          setTimeout(() => {
            setMascotInCorner(true);
          }, 0);
        }
      } else {
        // Fallback to localStorage
        const stored = localStorage.getItem(`roadmap_${user.email}`);
        if (stored) {
          try {
            const completed = JSON.parse(stored) as number[];
            setTimeout(() => {
              setCompletedSteps(new Set<number>(completed));
            }, 0);
            // Show mascot in corner if step 5 is completed
            if (completed.includes(5)) {
              setTimeout(() => {
                setMascotInCorner(true);
              }, 0);
            }
          } catch (e) {
            console.error('Error parsing completed steps:', e);
          }
        }
      }
    }
  }, [user, userProfile]);

  // Check if all steps are completed and mark onboarding as done
  useEffect(() => {
    if (!user?.email || !userProfile) return;
    
    const allStepsDone = completedSteps.has(2) && 
                        completedSteps.has(3) && 
                        completedSteps.has(4);
    
    // Only mark onboarding as done if all steps are completed and it's not already marked
    if (allStepsDone && !userProfile.onboardingCompleted) {
      const currentLevel = userProfile.level || 0;
      const newLevel = currentLevel + 1; // Level up on onboarding completion
      updateUserProfile({
        onboardingCompleted: true,
        level: newLevel,
      }).catch((error) => {
        console.error('Error marking onboarding as completed:', error);
      });
    }
  }, [completedSteps, user, userProfile, updateUserProfile]);

  // Check for step completion based on user activity
  useEffect(() => {
    if (!user?.email) return;

    const checkCompletion = () => {
      const completed = new Set<number>();
      
      // Step 2: Know your tools - check if user can skip (has experience) or visited
      if (userProfile?.canSkipKnowTools) {
        completed.add(2);
      } else if (localStorage.getItem(`visited_know-your-pipette_${user.email}`)) {
        completed.add(2);
      }
      
      // Step 3: Understanding the simulation - check if visited
      if (localStorage.getItem(`visited_simulator_${user.email}`)) {
        completed.add(3);
      }
      
      // Step 4: A basic quiz - check if quiz completed
      if (localStorage.getItem(`quiz_completed_${user.email}`)) {
        completed.add(4);
      }
      
      const completedArray = Array.from(completed) as number[];
      setCompletedSteps(completed);
      localStorage.setItem(`roadmap_${user.email}`, JSON.stringify(completedArray));
    };

    checkCompletion();
    
    // Listen for storage changes (when user completes steps in other tabs)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === `roadmap_${user.email}`) {
        checkCompletion();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [user, userProfile]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-slate-700 text-lg">Loading...</div>
        </div>
      </DashboardLayout>
    );
  }

  if (!user || !userProfile || !userProfile.name) {
    return null;
  }

  const mainActions = [
    {
      title: 'Start Simulation',
      description: 'Practice pipetting techniques in a realistic 3D lab environment',
      href: '/sim-dashboard',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
        </svg>
      ),
      primary: true,
      isSimulation: true,
    },
    {
      title: 'Scan Lab Manual',
      description: 'Upload your lab manual and generate 3D simulation steps automatically',
      href: '/your-docs',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-6h6v6m2 4H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      primary: false,
    },
    {
      title: 'Take Quiz',
      description: 'Test your knowledge of pipetting techniques and best practices',
      href: '/quiz',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      primary: false,
    },
    {
      title: 'Know the Tools',
      description: 'Learn about pipettes, tips, and essential lab equipment',
      href: '/know-your-pipette',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
      primary: false,
    },
    {
      title: 'Challenge Mode',
      description: 'Complete timed challenges to improve your speed and accuracy',
      href: '/challenge',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      primary: false,
    },
    {
      title: 'Your Sticky Notes',
      description: 'Review and organize notes captured during simulations',
      href: '/sticky-notes',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-6 4h6m-9 4h12a2 2 0 002-2V7.414a2 2 0 00-.586-1.414L16.414 3.586A2 2 0 0015 3H5a2 2 0 00-2 2v16a2 2 0 002 2z" />
        </svg>
      ),
      primary: false,
    },
    {
      title: '(Beta Version) Pipette with your hands!',
      description: 'Control the pipette using hand gestures and motion tracking',
      href: '/ml',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 10-3 0m3 0h11.48M21 12l-8.5 8.5M13 12l8.5-8.5M3 12h18" />
        </svg>
      ),
      primary: false,
    },
  ];

  // Check if all roadmap steps are completed (steps 2-4)
  const allStepsCompleted = completedSteps.has(2) && 
                            completedSteps.has(3) && 
                            completedSteps.has(4);

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Welcome Header */}
        <div className="border-b border-slate-200 pb-6">
          <h1 className="text-3xl font-semibold text-slate-900 mb-2">
            Welcome back, {userProfile.name}
          </h1>
          <p className="text-slate-600">
            {userProfile['pipette experience'] 
              ? `Continue improving your ${userProfile['pipette experience'].toLowerCase()} pipetting skills`
              : 'Continue your pipetting training'}
          </p>
        </div>

        {/* Main Actions Grid - Show first if roadmap is completed */}
        {allStepsCompleted && (
          <div>
            <h2 className="text-xl font-semibold text-slate-900 mb-4">Explore the rest</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {mainActions.map((action, idx) => {
                if (action.isSimulation) {
                  return (
                    <button
                      key={idx}
                      onClick={() => router.push('/sim-dashboard')}
                      className={`group block p-6 rounded-lg border-2 transition-all duration-200 text-left w-full ${
                        action.primary
                          ? 'bg-slate-900 border-slate-900 text-white hover:bg-slate-800 hover:border-slate-800'
                          : 'bg-white border-slate-200 text-slate-900 hover:border-slate-400 hover:shadow-md'
                      }`}
                    >
                      <div className={`mb-4 ${action.primary ? 'text-white' : 'text-slate-700'}`}>
                        {action.icon}
                      </div>
                      <h3 className={`text-lg font-semibold mb-2 ${action.primary ? 'text-white' : 'text-slate-900'}`}>
                        {action.title}
                      </h3>
                      <p className={`text-sm ${action.primary ? 'text-slate-300' : 'text-slate-600'}`}>
                        {action.description}
                      </p>
                      <div className={`mt-4 text-sm font-medium flex items-center gap-2 ${
                        action.primary ? 'text-white' : 'text-slate-700 group-hover:text-slate-900'
                      }`}>
                        <span>Get started</span>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </button>
                  );
                }
                return (
                  <Link
                    key={idx}
                    href={action.href}
                    className={`group block p-6 rounded-lg border-2 transition-all duration-200 ${
                      action.primary
                        ? 'bg-slate-900 border-slate-900 text-white hover:bg-slate-800 hover:border-slate-800'
                        : 'bg-white border-slate-200 text-slate-900 hover:border-slate-400 hover:shadow-md'
                    }`}
                  >
                    <div className={`mb-4 ${action.primary ? 'text-white' : 'text-slate-700'}`}>
                      {action.icon}
                    </div>
                    <h3 className={`text-lg font-semibold mb-2 ${action.primary ? 'text-white' : 'text-slate-900'}`}>
                      {action.title}
                    </h3>
                    <p className={`text-sm ${action.primary ? 'text-slate-300' : 'text-slate-600'}`}>
                      {action.description}
                    </p>
                    <div className={`mt-4 text-sm font-medium flex items-center gap-2 ${
                      action.primary ? 'text-white' : 'text-slate-700 group-hover:text-slate-900'
                    }`}>
                      <span>Get started</span>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Sticky Notes Wall Preview */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm uppercase tracking-wide text-slate-500 font-semibold">Your sticky notes</p>
              <h3 className="text-2xl font-semibold text-slate-900">Pinned from simulations</h3>
            </div>
            <Link
              href="/sticky-notes"
              className="px-4 py-2 rounded-xl border border-slate-300 text-sm font-semibold text-slate-700 hover:border-slate-500 hover:text-slate-900 transition-colors"
            >
              Open wall
            </Link>
          </div>
          {stickyNotes.length === 0 ? (
            <div className="text-slate-500 text-sm bg-slate-50 border border-dashed border-slate-200 rounded-xl py-8 text-center">
              You have not saved any sticky notes yet. Capture insights in the simulator to see them here.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {stickyNotes.slice(0, 4).map((note) => {
                const palette = STICKY_NOTE_COLORS[note.color] || STICKY_NOTE_COLORS.yellow;
                return (
                  <div
                    key={note.id}
                    className={`rounded-xl border shadow-sm p-4 min-h-[140px] flex flex-col ${palette.bg} ${palette.text} ${palette.border}`}
                  >
                    <p className="text-sm flex-1 whitespace-pre-wrap break-words">{note.text}</p>
                    <p className="text-xs mt-3 opacity-70">
                      {new Date(note.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Learning Roadmap */}
        <div className={`bg-white border border-slate-200 rounded-xl shadow-md transition-all duration-300 ${
          allStepsCompleted ? 'p-4' : 'p-8'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className={`font-semibold text-slate-900 ${allStepsCompleted ? 'text-xl' : 'text-2xl'}`}>
              Your Onboarding Roadmap
            </h2>
            {allStepsCompleted && (
              <button
                onClick={() => setRoadmapExpanded(!roadmapExpanded)}
                className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
                aria-label={roadmapExpanded ? 'Collapse roadmap' : 'Expand roadmap'}
              >
                <span className="text-sm font-medium">
                  {roadmapExpanded ? 'Hide' : 'Show'} completed roadmap
                </span>
                <svg 
                  className={`w-5 h-5 transition-transform duration-200 ${roadmapExpanded ? 'rotate-180' : ''}`}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            )}
          </div>
          
          <div className={`grid grid-cols-1 lg:grid-cols-3 gap-8 transition-all duration-300 ${
            allStepsCompleted && !roadmapExpanded 
              ? 'max-h-0 opacity-0 overflow-hidden' 
              : 'max-h-[2000px] opacity-100'
          }`}>
            {/* Roadmap Steps */}
            <div className="lg:col-span-2 relative">
            {[
              { id: 2, title: 'Know your tools', route: '/know-your-pipette', canSkip: userProfile?.canSkipKnowTools },
              { id: 3, title: 'Understanding the simulation', route: '/sim-dashboard' },
              { id: 4, title: 'A basic quiz', route: '/quiz' },
            ].map((step, index, array) => {
              const isLast = index === array.length - 1;
              const stepCompleted = completedSteps.has(step.id);
              // Check if previous step is completed (disable if not)
              const previousStepCompleted = index === 0 ? true : completedSteps.has(array[index - 1].id);
              const isDisabled = !previousStepCompleted && !stepCompleted;
              
              return (
                <div key={step.id} className="relative">
                  {/* Step Item */}
                  <div
                    className={`relative flex items-center gap-4 mb-8 transition-all duration-500 ${
                      stepCompleted ? 'opacity-40 -translate-x-4' : 'opacity-100 translate-x-0'
                    }`}
                  >
                    {/* Circle */}
                    <div className={`relative z-10 shrink-0 w-12 h-12 rounded-full flex items-center justify-center border-4 transition-all duration-300 ${
                      stepCompleted
                        ? 'bg-green-500 border-green-600'
                        : 'bg-white border-slate-300'
                    }`}>
                      {stepCompleted ? (
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <span className="text-slate-700 font-semibold">{step.id}</span>
                      )}
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1">
                      {step.route ? (
                        step.id === 2 && step.canSkip && !stepCompleted ? (
                          <button
                            onClick={async () => {
                              if (!user?.email) return;
                              
                              // Mark step 2 as completed (skip)
                              const stored = localStorage.getItem(`roadmap_${user.email}`);
                              const completed = stored ? new Set<number>(JSON.parse(stored) as number[]) : new Set<number>();
                              completed.add(2);
                              const completedArray = Array.from(completed) as number[];
                              localStorage.setItem(`roadmap_${user.email}`, JSON.stringify(completedArray));
                              
                              // Save to Firebase
                              try {
                                await updateUserProfile({
                                  roadmapProgress: completedArray,
                                });
                                setCompletedSteps(completed);
                              } catch (error) {
                                console.error('Error saving roadmap progress:', error);
                              }
                            }}
                            className="block w-full text-left p-4 rounded-lg border-2 transition-all duration-200 bg-white border-slate-300 text-slate-900 hover:border-green-500 hover:shadow-md cursor-pointer"
                          >
                            <h3 className="font-semibold text-lg text-slate-900">
                              {step.title} <span className="text-sm font-normal text-green-600">(Skip)</span>
                            </h3>
                          </button>
                        ) : (
                          <Link
                            href={isDisabled ? '#' : step.route}
                            onClick={(e) => {
                              if (isDisabled) {
                                e.preventDefault();
                              }
                            }}
                            className={`block p-4 rounded-lg border-2 transition-all duration-200 ${
                              stepCompleted
                                ? 'bg-slate-50 border-slate-200 text-slate-500 cursor-default'
                                : isDisabled
                                ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed opacity-50'
                                : 'bg-white border-slate-300 text-slate-900 hover:border-blue-500 hover:shadow-md cursor-pointer'
                            }`}
                          >
                            <h3 className={`font-semibold text-lg ${stepCompleted ? 'text-slate-500' : isDisabled ? 'text-slate-400' : 'text-slate-900'}`}>
                              {step.title}
                            </h3>
                          </Link>
                        )
                      ) : (
                        <div
                          className={`p-4 rounded-lg border-2 ${
                            stepCompleted
                              ? 'bg-slate-50 border-slate-200 text-slate-500'
                              : isDisabled
                              ? 'bg-slate-100 border-slate-200 text-slate-400 opacity-50'
                              : 'bg-white border-slate-300 text-slate-900'
                          }`}
                        >
                          <h3 className={`font-semibold text-lg ${stepCompleted ? 'text-slate-500' : isDisabled ? 'text-slate-400' : 'text-slate-900'}`}>
                            {step.title}
                          </h3>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Connecting Line */}
                  {!isLast && (
                    <div className={`absolute left-6 top-12 w-0.5 h-16 transition-all duration-500 ${
                      stepCompleted && previousStepCompleted ? 'bg-green-500' : 'bg-slate-300'
                    }`} />
                  )}
                </div>
              );
            })}
            </div>
            
            {/* Mascot Section */}
            <div className="lg:col-span-1 flex items-start justify-center lg:justify-end">
              <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 max-w-xs">
                <div className="flex flex-col items-center text-center">
                  <img
                    src="/mascot.png"
                    alt="PipettePro Mascot"
                    className="w-32 h-32 mb-4"
                  />
                  <p className="text-slate-800 font-medium text-sm leading-relaxed">
                    Hi! Follow these steps to get all set on our platform
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Actions Grid - Show after roadmap if not completed */}
        {!allStepsCompleted && (
          <div>
            <h2 className="text-xl font-semibold text-slate-900 mb-4">Explore the rest</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {mainActions.map((action, idx) => {
                if (action.isSimulation) {
                  return (
                    <button
                      key={idx}
                      onClick={() => router.push('/sim-dashboard')}
                      className={`group block p-6 rounded-lg border-2 transition-all duration-200 text-left w-full ${
                        action.primary
                          ? 'bg-slate-900 border-slate-900 text-white hover:bg-slate-800 hover:border-slate-800'
                          : 'bg-white border-slate-200 text-slate-900 hover:border-slate-400 hover:shadow-md'
                      }`}
                    >
                      <div className={`mb-4 ${action.primary ? 'text-white' : 'text-slate-700'}`}>
                        {action.icon}
                      </div>
                      <h3 className={`text-lg font-semibold mb-2 ${action.primary ? 'text-white' : 'text-slate-900'}`}>
                        {action.title}
                      </h3>
                      <p className={`text-sm ${action.primary ? 'text-slate-300' : 'text-slate-600'}`}>
                        {action.description}
                      </p>
                      <div className={`mt-4 text-sm font-medium flex items-center gap-2 ${
                        action.primary ? 'text-white' : 'text-slate-700 group-hover:text-slate-900'
                      }`}>
                        <span>Get started</span>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </button>
                  );
                }
                return (
                  <Link
                    key={idx}
                    href={action.href}
                    className={`group block p-6 rounded-lg border-2 transition-all duration-200 ${
                      action.primary
                        ? 'bg-slate-900 border-slate-900 text-white hover:bg-slate-800 hover:border-slate-800'
                        : 'bg-white border-slate-200 text-slate-900 hover:border-slate-400 hover:shadow-md'
                    }`}
                  >
                    <div className={`mb-4 ${action.primary ? 'text-white' : 'text-slate-700'}`}>
                      {action.icon}
                    </div>
                    <h3 className={`text-lg font-semibold mb-2 ${action.primary ? 'text-white' : 'text-slate-900'}`}>
                      {action.title}
                    </h3>
                    <p className={`text-sm ${action.primary ? 'text-slate-300' : 'text-slate-600'}`}>
                      {action.description}
                    </p>
                    <div className={`mt-4 text-sm font-medium flex items-center gap-2 ${
                      action.primary ? 'text-white' : 'text-slate-700 group-hover:text-slate-900'
                    }`}>
                      <span>Get started</span>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

      </div>

      {/* Onboarding Modal */}
      {showOnboardingModal && !showMascotIntroduction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 relative animate-scale-in border-4 border-blue-200">
            {/* Close button */}
            <button
              onClick={() => setShowOnboardingModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
              aria-label="Close"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Mascot and Speech Bubble */}
            <div className="flex flex-col items-center mb-6">
              {/* Mascot */}
              <div className="relative mb-4 animate-bounce-slow">
                <img
                  src="/mascot.png"
                  alt="PipettePro Mascot"
                  className="w-32 h-32 drop-shadow-lg"
                />
                {/* Sparkle effect */}
                <div className="absolute -top-2 -right-2 w-6 h-6 animate-pulse">
                  <svg className="w-full h-full text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                </div>
              </div>

              {/* Speech Bubble */}
              <div className="relative bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 border-2 border-blue-200 shadow-lg animate-slide-up">
                <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent border-t-blue-50"></div>
                <p className="text-slate-800 font-semibold text-lg text-center mb-2">
                  Hi there!
                </p>
                <p className="text-slate-700 text-center">
                  Start onboarding process?
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                onClick={() => {
                  setShowMascotIntroduction(true);
                }}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-4 px-6 rounded-xl hover:from-blue-700 hover:to-purple-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl animate-pulse-slow"
              >
                Yes! Let&apos;s go!
              </button>
              <button
                onClick={() => setShowOnboardingModal(false)}
                className="flex-1 bg-slate-200 text-slate-700 font-semibold py-4 px-6 rounded-xl hover:bg-slate-300 transform hover:scale-105 transition-all duration-200"
              >
                Not now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mascot Introduction Modal */}
      {showMascotIntroduction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 relative animate-scale-in border-4 border-blue-200">
            {/* Mascot and Speech Bubble */}
            <div className="flex flex-col items-center mb-6">
              {/* Mascot */}
              <div className="relative mb-4 animate-bounce-slow">
                <img
                  src="/mascot.png"
                  alt="PipettePro Mascot"
                  className="w-32 h-32 drop-shadow-lg"
                />
                {/* Sparkle effect */}
                <div className="absolute -top-2 -right-2 w-6 h-6 animate-pulse">
                  <svg className="w-full h-full text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                </div>
              </div>

              {/* Speech Bubble */}
              <div className="relative bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 border-2 border-blue-200 shadow-lg animate-slide-up">
                <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent border-t-blue-50"></div>
                <p className="text-slate-800 font-semibold text-lg text-center mb-3">
                  Welcome to PipettePro!
                </p>
                <p className="text-slate-700 text-center leading-relaxed">
                  I&apos;m here to guide you through pipetting step by step. Together, we&apos;ll master the art of precise liquid handling!
                </p>
              </div>
            </div>

            {/* Action Button */}
            <div className="flex justify-center">
              <button
                onClick={async () => {
                  if (!user?.email) return;
                  
                  // Mark onboarding as completed
                  const stored = localStorage.getItem(`roadmap_${user.email}`);
                  const completed = stored ? new Set<number>(JSON.parse(stored) as number[]) : new Set<number>();
                  completed.add(1);
                  const completedArray = Array.from(completed) as number[];
                  localStorage.setItem(`roadmap_${user.email}`, JSON.stringify(completedArray));
                  
                  // Save to Firebase - Only mark step 1 as done, not onboarding
                  try {
                    await updateUserProfile({
                      roadmapProgress: completedArray,
                    });
                    setCompletedSteps(completed);
                    setShowMascotIntroduction(false);
                    setShowOnboardingModal(false);
                  } catch (error) {
                    console.error('Error saving roadmap progress:', error);
                  }
                }}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-4 px-6 rounded-xl hover:from-blue-700 hover:to-purple-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Let&apos;s begin!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Simulation Modal */}
      {showSimulationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 relative animate-scale-in border-4 border-blue-200">
            {/* Close button */}
            <button
              onClick={() => setShowSimulationModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
              aria-label="Close"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="mb-6">
              <h3 className="text-2xl font-bold text-slate-900 mb-4 text-center">Choose Simulation Mode</h3>
              <p className="text-slate-600 text-center mb-6">How would you like to practice?</p>
            </div>

            <div className="space-y-4">
              <Link
                href="/simulator"
                onClick={() => setShowSimulationModal(false)}
                className="block w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-4 px-6 rounded-xl hover:from-blue-700 hover:to-purple-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl text-center"
              >
                Free Simulation
              </Link>
              <button
                onClick={() => {
                  setShowSimulationModal(false);
                  router.push('/quiz');
                }}
                className="w-full bg-slate-200 text-slate-700 font-semibold py-4 px-6 rounded-xl hover:bg-slate-300 transform hover:scale-105 transition-all duration-200"
              >
                Practice a Particular Question
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Explore the App Modal */}
      {showExploreAppModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 relative animate-scale-in border-4 border-blue-200">
            {/* Mascot and Speech Bubble */}
            <div className="flex flex-col items-center mb-6">
              {/* Mascot */}
              <div className="relative mb-4 animate-bounce-slow" id="explore-mascot-container">
                <img
                  src="/mascot.png"
                  alt="PipettePro Mascot"
                  id="explore-mascot-img"
                  className="w-32 h-32 drop-shadow-lg transition-all duration-500"
                />
                {/* Sparkle effect */}
                <div className="absolute -top-2 -right-2 w-6 h-6 animate-pulse">
                  <svg className="w-full h-full text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                </div>
              </div>

              {/* Speech Bubble */}
              <div className="relative bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 border-2 border-blue-200 shadow-lg animate-slide-up">
                <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent border-t-blue-50"></div>
                <p className="text-slate-800 font-semibold text-lg text-center leading-relaxed">
                  Great to see you are excited to become the next pipette pro! I will rest in the side till you need me again :) Explore this app and have fun!
                </p>
              </div>
            </div>

            {/* Action Button */}
            <div className="flex justify-center">
              <button
                onClick={async () => {
                  if (!user?.email) return;
                  
                  // Animate mascot image change and movement
                  const mascotImg = document.querySelector<HTMLImageElement>('#explore-mascot-img');
                  const mascotContainer = document.getElementById('explore-mascot-container');
                  
                  if (mascotImg && mascotContainer) {
                    // Change image to floating version
                    mascotImg.src = '/mascot_floating.png';
                    
                    // Animate movement to bottom right
                    mascotContainer.style.transition = 'all 1s ease-in-out';
                    mascotContainer.style.position = 'fixed';
                    mascotContainer.style.bottom = '16px';
                    mascotContainer.style.right = '16px';
                    mascotContainer.style.zIndex = '40';
                    mascotContainer.style.transform = 'scale(0.75)';
                  }
                  
                  // Mark step 5 as completed
                  const stored = localStorage.getItem(`roadmap_${user.email}`);
                  const completed = stored ? new Set<number>(JSON.parse(stored) as number[]) : new Set<number>();
                  completed.add(5);
                  const completedArray = Array.from(completed) as number[];
                  localStorage.setItem(`roadmap_${user.email}`, JSON.stringify(completedArray));
                  
                  // Save to Firebase
                  try {
                    await updateUserProfile({
                      roadmapProgress: completedArray,
                    });
                    setCompletedSteps(completed);
                    
                    // Check if all steps are now completed
                    const allStepsDone = completed.has(2) && 
                                       completed.has(3) && 
                                       completed.has(4);
                    
                    // If all steps are done, mark onboarding as completed and level up
                    if (allStepsDone) {
                      const currentLevel = userProfile?.level || 0;
                      const newLevel = currentLevel + 1; // Level up on onboarding completion
                      await updateUserProfile({
                        onboardingCompleted: true,
                        level: newLevel,
                      });
                    }
                    
                    // Close modal after animation
                    setTimeout(() => {
                      setShowExploreAppModal(false);
                      setMascotInCorner(true);
                    }, 1000);
                  } catch (error) {
                    console.error('Error saving roadmap progress:', error);
                    setShowExploreAppModal(false);
                    setMascotInCorner(true);
                  }
                }}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-4 px-6 rounded-xl hover:from-blue-700 hover:to-purple-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Got it!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mascot in Bottom Right Corner */}
      {mascotInCorner && (
        <div className="fixed bottom-4 right-4 z-40 animate-slide-in-right">
          <img
            src="/mascot_floating.png"
            alt="PipettePro Mascot"
            className="w-24 h-24 drop-shadow-2xl"
          />
        </div>
      )}
    </DashboardLayout>
  );
}
