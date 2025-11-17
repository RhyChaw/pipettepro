'use client';

import DashboardLayout from '../components/DashboardLayout';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';

export default function HomePage() {
  const { user, userProfile, loading, updateUserProfile } = useAuth();
  const router = useRouter();
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);

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
        setCompletedSteps(new Set<number>(userProfile.roadmapProgress));
        // Sync to localStorage
        localStorage.setItem(`roadmap_${user.email}`, JSON.stringify(userProfile.roadmapProgress));
      } else {
        // Fallback to localStorage
        const stored = localStorage.getItem(`roadmap_${user.email}`);
        if (stored) {
          try {
            const completed = JSON.parse(stored) as number[];
            setCompletedSteps(new Set<number>(completed));
          } catch (e) {
            console.error('Error parsing completed steps:', e);
          }
        }
      }
    }
  }, [user, userProfile]);

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
      href: '/simulator',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
        </svg>
      ),
      primary: true,
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
      title: 'Review Mistakes',
      description: 'Analyze common pipetting errors and learn how to avoid them',
      href: '/mistakes',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
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
      title: 'View Results',
      description: 'Review your performance history and track your progress',
      href: '/results',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      primary: false,
    },
  ];

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

        {/* Learning Roadmap */}
        <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-md">
          <h2 className="text-2xl font-semibold text-slate-900 mb-6">Your Learning Roadmap</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Roadmap Steps */}
            <div className="lg:col-span-2 relative">
            {[
              { id: 1, title: 'Onboarding', route: null },
              { id: 2, title: 'Know your tools', route: '/know-your-pipette', canSkip: userProfile?.canSkipKnowTools },
              { id: 3, title: 'Understanding the simulation', route: '/simulator' },
              { id: 4, title: 'A basic quiz', route: '/quiz' },
              { id: 5, title: 'Explore the app', route: null },
            ].map((step, index, array) => {
              const isLast = index === array.length - 1;
              const stepCompleted = completedSteps.has(step.id);
              
              return (
                <div key={step.id} className="relative">
                  {/* Step Item */}
                  <div
                    className={`relative flex items-center gap-4 mb-8 transition-all duration-500 ${
                      stepCompleted ? 'opacity-40 -translate-x-4' : 'opacity-100 translate-x-0'
                    }`}
                  >
                    {/* Circle */}
                    <div className={`relative z-10 flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center border-4 transition-all duration-300 ${
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
                            href={step.route}
                            className={`block p-4 rounded-lg border-2 transition-all duration-200 ${
                              stepCompleted
                                ? 'bg-slate-50 border-slate-200 text-slate-500 cursor-default'
                                : 'bg-white border-slate-300 text-slate-900 hover:border-blue-500 hover:shadow-md cursor-pointer'
                            }`}
                          >
                            <h3 className={`font-semibold text-lg ${stepCompleted ? 'text-slate-500' : 'text-slate-900'}`}>
                              {step.title}
                            </h3>
                          </Link>
                        )
                      ) : step.id === 1 ? (
                        <button
                          onClick={() => {
                            if (!stepCompleted) {
                              setShowOnboardingModal(true);
                            }
                          }}
                          className={`block w-full text-left p-4 rounded-lg border-2 transition-all duration-200 ${
                            stepCompleted
                              ? 'bg-slate-50 border-slate-200 text-slate-500 cursor-default'
                              : 'bg-white border-slate-300 text-slate-900 hover:border-blue-500 hover:shadow-md cursor-pointer'
                          }`}
                        >
                          <h3 className={`font-semibold text-lg ${stepCompleted ? 'text-slate-500' : 'text-slate-900'}`}>
                            {step.title}
                          </h3>
                        </button>
                      ) : (
                        <div
                          className={`p-4 rounded-lg border-2 ${
                            stepCompleted
                              ? 'bg-slate-50 border-slate-200 text-slate-500'
                              : 'bg-white border-slate-300 text-slate-900'
                          }`}
                        >
                          <h3 className={`font-semibold text-lg ${stepCompleted ? 'text-slate-500' : 'text-slate-900'}`}>
                            {step.title}
                          </h3>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Connecting Line */}
                  {!isLast && (
                    <div className={`absolute left-6 top-12 w-0.5 h-16 transition-all duration-500 ${
                      stepCompleted ? 'bg-green-500' : 'bg-slate-300'
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

        {/* Main Actions Grid */}
        <div>
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Explore the rest</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mainActions.map((action, idx) => (
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
            ))}
          </div>
        </div>

      </div>

      {/* Onboarding Modal */}
      {showOnboardingModal && (
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
                  Hi there! 👋
                </p>
                <p className="text-slate-700 text-center">
                  Start onboarding process?
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                onClick={async () => {
                  if (!user?.email) return;
                  
                            // Mark onboarding as completed
                            const stored = localStorage.getItem(`roadmap_${user.email}`);
                            const completed = stored ? new Set<number>(JSON.parse(stored) as number[]) : new Set<number>();
                            completed.add(1);
                            const completedArray = Array.from(completed) as number[];
                            localStorage.setItem(`roadmap_${user.email}`, JSON.stringify(completedArray));
                            
                            // Save to Firebase
                            try {
                              await updateUserProfile({
                                onboardingCompleted: true,
                                roadmapProgress: completedArray,
                              });
                    setCompletedSteps(completed);
                    setShowOnboardingModal(false);
                  } catch (error) {
                    console.error('Error saving onboarding progress:', error);
                  }
                }}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-4 px-6 rounded-xl hover:from-blue-700 hover:to-purple-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl animate-pulse-slow"
              >
                Yes! Let's go! 🚀
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
    </DashboardLayout>
  );
}
