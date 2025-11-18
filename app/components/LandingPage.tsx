'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function LandingPage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const pipetteRef = useRef<HTMLDivElement>(null);
  const physicsSectionRef = useRef<HTMLDivElement>(null);
  const ballRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const router = useRouter();
  const [showBall, setShowBall] = useState(false);
  const [dropStartScroll, setDropStartScroll] = useState<number | null>(null);
  const [dropStartPosition, setDropStartPosition] = useState<{ top: number; left: number }>({
    top: 140,
    left: 0,
  });
  const [ballPosition, setBallPosition] = useState({ top: 0, left: 0 });
  const [hasExploded, setHasExploded] = useState(false);
  const [showPurpleBackground, setShowPurpleBackground] = useState(false);
  const [purpleReveal, setPurpleReveal] = useState({ active: false, x: 0, y: 0 });

  useEffect(() => {
    // Add scroll-based animations
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -100px 0px',
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-fade-in');
        }
      });
    }, observerOptions);

    const elements = document.querySelectorAll('.scroll-animate');
    elements.forEach((el) => observer.observe(el));

    return () => {
      elements.forEach((el) => observer.unobserve(el));
    };
  }, []);

  useEffect(() => {
    let scrollTimeout: NodeJS.Timeout;
    let animationFrameId: number;

    const handleScroll = () => {
      const scrollY = window.scrollY;
      const windowHeight = window.innerHeight;
      const heroHeight = heroRef.current?.offsetHeight || windowHeight;
      const releaseThreshold = Math.max(60, heroHeight * 0.35);

      if (!showBall && scrollY > releaseThreshold) {
        if (pipetteRef.current) {
          const rect = pipetteRef.current.getBoundingClientRect();
          const tipY = rect.top + rect.height * 0.85;
          const tipX = rect.left + rect.width * 0.45;
          setDropStartPosition({ top: tipY, left: tipX });
        }
        setShowBall(true);
        if (dropStartScroll === null) {
          setDropStartScroll(scrollY);
        }
      } else if (showBall && dropStartScroll === null) {
        setDropStartScroll(scrollY);
      }

      if (showBall && !hasExploded && physicsSectionRef.current) {
        const physicsSection = physicsSectionRef.current;
        const physicsRect = physicsSection.getBoundingClientRect();
        const physicsTopDoc = physicsRect.top + scrollY;

        // Calculate ball position (right side, following scroll)
        const rightOffset = 155;
        const pipetteOffsetFromTop = dropStartPosition.top ?? 140;
        const dropSpeed = 0.35;
        const startScroll = dropStartScroll ?? scrollY;
        const scrollDelta = Math.max(0, scrollY - startScroll);
        const fallbackLeft = Math.max(40, window.innerWidth - rightOffset);
        const baseLeft = dropStartPosition.left || fallbackLeft;
        const ballLeft = Math.max(20, baseLeft);

        let ballViewportTop = pipetteOffsetFromTop + scrollDelta * dropSpeed;
        const targetViewportTop = physicsRect.top - 40;
        if (targetViewportTop > pipetteOffsetFromTop) {
          ballViewportTop = Math.min(ballViewportTop, targetViewportTop);
        }
        ballViewportTop = Math.max(pipetteOffsetFromTop, ballViewportTop);

        setBallPosition({ top: ballViewportTop, left: ballLeft });

        const ballDocTop = scrollY + ballViewportTop;
        const ballBottomDoc = ballDocTop + 20;

        if (ballBottomDoc >= physicsTopDoc && !hasExploded) {
          // Ball has hit the section - explode!
          setHasExploded(true);

          const hitX = physicsRect.left + physicsRect.width / 2;
          const hitY = physicsRect.top;

          setPurpleReveal({ active: true, x: hitX, y: hitY });

          setTimeout(() => {
            setShowPurpleBackground(true);
            setShowBall(false);
            setPurpleReveal((prev) => ({ ...prev, active: false }));
          }, 1000);
        }
      }
    };

    const onScroll = () => {
      if (scrollTimeout) clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        animationFrameId = requestAnimationFrame(handleScroll);
      }, 10);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    handleScroll(); // Initial call

    return () => {
      window.removeEventListener('scroll', onScroll);
      if (scrollTimeout) clearTimeout(scrollTimeout);
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [showBall, hasExploded, dropStartScroll, dropStartPosition.top, dropStartPosition.left]);

  return (
    <div className={`min-h-screen relative ${showPurpleBackground ? 'bg-linear-to-b from-purple-100 to-purple-200' : 'bg-slate-50'}`}>
      {/* Purple Background Reveal Animation */}
      {purpleReveal.active && (
        <>
          <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 12 }}>
            <div
              className="absolute rounded-full bg-linear-to-br from-purple-500/90 to-pink-400/80 shadow-[0_0_40px_rgba(168,85,247,0.7)]"
              style={{
                width: '60px',
                height: '60px',
                left: `${purpleReveal.x}px`,
                top: `${purpleReveal.y}px`,
                transform: 'translate(-50%, -50%)',
                animation: 'purpleSplash 1s ease-out forwards',
              }}
            />
          </div>
          <div
            className="fixed inset-0 pointer-events-none z-10"
            style={{
              '--reveal-x': `${purpleReveal.x}px`,
              '--reveal-y': `${purpleReveal.y}px`,
            } as React.CSSProperties & { '--reveal-x': string; '--reveal-y': string }}
          >
            <div
              className="absolute inset-0 bg-linear-to-b from-purple-100 to-purple-200 opacity-90"
              style={{ animation: 'purpleReveal 1s ease-out forwards' }}
            />
          </div>
        </>
      )}

      {/* Pink Ball */}
      {showBall && !hasExploded && (
        <div
          ref={ballRef}
          className="fixed z-50 pointer-events-none transition-all duration-100"
          style={{
            top: `${ballPosition.top}px`,
            left: `${ballPosition.left}px`,
            width: '20px',
            height: '20px',
          }}
        >
          <div className="w-full h-full bg-pink-200 rounded-full shadow-lg opacity-80 animate-pulse" />
        </div>
      )}

      {/* Explosion Effect */}
      {hasExploded && (
        <div
          className="fixed z-50 pointer-events-none"
          style={{
            top: `${ballPosition.top}px`,
            left: `${ballPosition.left}px`,
          }}
        >
          <div className="relative">
            {[...Array(12)].map((_, i) => {
              const angle = (i * 30) * (Math.PI / 180); // Convert to radians
              const distance = 100;
              const x = Math.cos(angle) * distance;
              const y = Math.sin(angle) * distance;
              return (
                <div
                  key={i}
                  className="absolute w-2 h-2 bg-pink-300 rounded-full"
                  style={{
                    animation: `explode 0.6s ease-out forwards`,
                    '--x': `${x}px`,
                    '--y': `${y}px`,
                    transformOrigin: 'center',
                  } as React.CSSProperties & { '--x': string; '--y': string }}
                />
              );
            })}
          </div>
        </div>
      )}

      <div className="relative z-40">
        {/* Hero Section */}
        <section
          ref={heroRef}
          className="relative min-h-screen flex items-center justify-center overflow-hidden"
        >
          {/* Pipette Image - Right Side */}
          <div
            ref={pipetteRef}
            className="hidden lg:block absolute right-12 top-1/2 -translate-y-1/2 transform z-30 pointer-events-none"
          >
            <Image
              src="/2D_pipette.png"
              alt="Pipette"
              width={200}
              height={400}
              className="opacity-90"
              unoptimized
              priority
            />
          </div>

          <div className="container mx-auto px-4 py-20 text-center">
            <h1 className="text-6xl md:text-8xl font-bold text-slate-900 mb-6 animate-fade-in">
              Pipette<span className="text-slate-600">Pro</span>
            </h1>
            <p className="text-xl md:text-2xl text-slate-600 mb-8 max-w-3xl mx-auto animate-fade-in">
              Master pipetting accuracy through immersive 3D simulation.
            </p>
            <div className="flex justify-center items-center mb-6 animate-fade-in">
              <button
                onClick={() => {
                  if (user) {
                    router.push('/home');
                  } else {
                    router.push('/signup');
                  }
                }}
                className="px-12 py-5 bg-slate-900 text-white font-bold text-xl rounded-xl shadow-lg hover:bg-slate-800 transform hover:scale-105 transition-all duration-300"
              >
                Get Started
              </button>
            </div>
          </div>

          {/* Scroll Indicator */}
          <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 animate-bounce z-20">
            <div className="w-6 h-10 border-2 border-slate-300 rounded-full flex justify-center">
              <div className="w-1 h-3 bg-slate-400 rounded-full mt-2 animate-pulse"></div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="relative py-20 px-4 bg-white">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-4xl md:text-5xl font-semibold text-slate-900 text-center mb-4 scroll-animate">
            How It Works
          </h2>
          <p className="text-lg text-slate-600 text-center mb-12 scroll-animate">
            Three powerful ways to master pipetting
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Simulation Card */}
            <div className="bg-white border-2 border-slate-200 rounded-xl p-8 hover:border-slate-400 hover:shadow-md transition-all duration-300 scroll-animate">
              <div className="w-16 h-16 bg-slate-100 rounded-xl flex items-center justify-center mb-6 text-3xl">
                🧪
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-4">Simulation</h3>
              <p className="text-slate-600 leading-relaxed mb-4">
                Practice real pipetting techniques in a virtual lab environment with realistic physics and feedback.
              </p>
              <Link
                href="/simulator"
                className="inline-block mt-4 text-slate-900 hover:text-slate-700 font-semibold"
              >
                Try it now →
              </Link>
            </div>

            {/* Quiz Card */}
            <div className="bg-white border-2 border-slate-200 rounded-xl p-8 hover:border-slate-400 hover:shadow-md transition-all duration-300 scroll-animate">
              <div className="w-16 h-16 bg-slate-100 rounded-xl flex items-center justify-center mb-6 text-3xl">
                💬
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-4">Quiz</h3>
              <p className="text-slate-600 leading-relaxed mb-4">
                Test your precision and understanding with interactive quizzes covering all pipetting fundamentals.
              </p>
              <Link
                href="/quiz"
                className="inline-block mt-4 text-slate-900 hover:text-slate-700 font-semibold"
              >
                Start quiz →
              </Link>
            </div>

            {/* Challenge Card */}
            <div className="bg-white border-2 border-slate-200 rounded-xl p-8 hover:border-slate-400 hover:shadow-md transition-all duration-300 scroll-animate">
              <div className="w-16 h-16 bg-slate-100 rounded-xl flex items-center justify-center mb-6 text-3xl">
                🎮
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-4">Challenge</h3>
              <p className="text-slate-600 leading-relaxed mb-4">
                Compete and improve your accuracy with timed challenges and performance tracking.
              </p>
              <Link
                href="/challenge"
                className="inline-block mt-4 text-slate-900 hover:text-slate-700 font-semibold"
              >
                Take challenge →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Preview Section */}
      <section 
        ref={physicsSectionRef}
        className={`relative py-20 px-4 ${showPurpleBackground ? 'bg-purple-200' : 'bg-slate-50'}`}
      >
        <div className="container mx-auto max-w-6xl">
          <div className={`border-2 rounded-2xl p-12 relative overflow-hidden scroll-animate ${
            showPurpleBackground ? 'bg-purple-100 border-purple-300' : 'bg-white border-slate-200'
          }`}>
            <div className="text-center">
              <h3 className={`text-3xl font-semibold mb-4 ${
                showPurpleBackground ? 'text-purple-900' : 'text-slate-900'
              }`}>
                Realistic Physics. Real Lab Experience.
              </h3>
              <p className={`text-lg max-w-2xl mx-auto ${
                showPurpleBackground ? 'text-purple-800' : 'text-slate-600'
              }`}>
                Experience accurate liquid handling, precise volume measurements, and authentic lab scenarios in a fully interactive 3D environment.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Highlight Section */}
      <section className={`relative py-20 px-4 ${showPurpleBackground ? 'bg-purple-200' : 'bg-white'}`}>
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-4xl md:text-5xl font-semibold text-slate-900 text-center mb-12 scroll-animate">
            Powerful Features
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Mistake Analyzer */}
            <div className="bg-white border-2 border-slate-200 rounded-xl p-8 scroll-animate">
              <div className="w-16 h-16 bg-slate-100 rounded-xl flex items-center justify-center mb-6 text-3xl">
                ⚠️
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-4">Mistake Analyzer</h3>
              <p className="text-slate-600">
                Learn from errors with detailed feedback and corrective guidance for every mistake.
              </p>
            </div>

            {/* AI Guidance */}
            <div className="bg-white border-2 border-slate-200 rounded-xl p-8 scroll-animate">
              <div className="w-16 h-16 bg-slate-100 rounded-xl flex items-center justify-center mb-6 text-3xl">
                🤖
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-4">AI Guidance</h3>
              <p className="text-slate-600">
                Receive personalized feedback and recommendations to enhance your technique.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className={`relative py-20 px-4 ${showPurpleBackground ? 'bg-purple-100' : 'bg-slate-50'}`}>
        <div className="container mx-auto max-w-6xl">
          <div className="bg-white border-2 border-slate-200 rounded-2xl p-12 scroll-animate">
            <h2 className="text-3xl font-semibold text-slate-900 text-center mb-4">
              Trusted by Educators and Lab Enthusiasts
            </h2>
            <p className="text-lg text-slate-600 text-center mb-12">
              Join thousands of students and professionals mastering pipetting skills
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-6">
                <p className="text-slate-700 mb-4 italic">
                  &ldquo;PipettePro transformed how I teach pipetting. Students learn faster and make fewer mistakes in the real lab.&rdquo;
                </p>
                <p className="text-slate-900 font-semibold">— Dr. Sarah Chen, Biology Professor</p>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-6">
                <p className="text-slate-700 mb-4 italic">
                  &ldquo;The 3D simulation feels incredibly realistic. I&rsquo;ve improved my accuracy by 30% in just two weeks.&rdquo;
                </p>
                <p className="text-slate-900 font-semibold">— Alex Martinez, Research Technician</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Sign-Up CTA Section */}
      <section className={`relative py-20 px-4 ${showPurpleBackground ? 'bg-purple-200' : 'bg-white'}`}>
        <div className="container mx-auto max-w-4xl">
          <div className="bg-slate-50 border-2 border-slate-200 rounded-2xl p-12 text-center scroll-animate">
            <h2 className="text-3xl font-semibold text-slate-900 mb-4">
              Create a Free Account
            </h2>
            <p className="text-lg text-slate-600 mb-8">
              Save your progress and unlock advanced challenges
            </p>
            <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-6 py-4 bg-white border-2 border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-400 transition-colors"
              />
              <button 
                onClick={() => router.push('/signup')}
                className="px-8 py-4 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-800 transform hover:scale-105 transition-all duration-300"
              >
                Sign Up
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={`relative py-12 px-4 border-t ${showPurpleBackground ? 'border-purple-300 bg-purple-100' : 'border-slate-200 bg-white'}`}>
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="text-2xl font-semibold text-slate-900 mb-4">
                Pipette<span className="text-slate-600">Pro</span>
              </h3>
              <p className="text-slate-600 text-sm">
                Master pipetting through immersive 3D simulation.
              </p>
            </div>
            <div>
              <h4 className="text-slate-900 font-semibold mb-4">Navigation</h4>
              <ul className="space-y-2">
                <li><Link href="/" className="text-slate-600 hover:text-slate-900 transition-colors">Home</Link></li>
                <li><Link href="/simulator" className="text-slate-600 hover:text-slate-900 transition-colors">Simulation</Link></li>
                <li><Link href="/quiz" className="text-slate-600 hover:text-slate-900 transition-colors">Quiz</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-slate-900 font-semibold mb-4">Learn</h4>
              <ul className="space-y-2">
                <li><Link href="/mistakes" className="text-slate-600 hover:text-slate-900 transition-colors">Mistakes</Link></li>
                <li><Link href="/challenge" className="text-slate-600 hover:text-slate-900 transition-colors">Challenge</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-slate-900 font-semibold mb-4">Connect</h4>
              <div className="flex gap-4">
                <a href="#" className="text-slate-600 hover:text-slate-900 transition-colors">Twitter</a>
                <a href="#" className="text-slate-600 hover:text-slate-900 transition-colors">LinkedIn</a>
                <a href="#" className="text-slate-600 hover:text-slate-900 transition-colors">GitHub</a>
              </div>
            </div>
          </div>
          <div className="border-t border-slate-200 pt-8 text-center text-slate-600 text-sm">
            <p>© 2024 PipettePro. All rights reserved.</p>
          </div>
        </div>
      </footer>
      </div>
    </div>
  );
}
