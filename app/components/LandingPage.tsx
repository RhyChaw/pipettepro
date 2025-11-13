'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';

export default function LandingPage() {
  const heroRef = useRef<HTMLDivElement>(null);

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

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#001C3D] via-[#332277] to-[#001C3D]">
      {/* Animated Background Particles */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute inset-0 opacity-30">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-[#D8F878] rounded-full animate-float"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${3 + Math.random() * 4}s`,
              }}
            />
          ))}
        </div>
        <div className="absolute inset-0 opacity-20">
          {[...Array(15)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-[#E47CB8] rounded-full animate-float"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${4 + Math.random() * 3}s`,
              }}
            />
          ))}
        </div>
      </div>

      {/* Hero Section */}
      <section
        ref={heroRef}
        className="relative min-h-screen flex items-center justify-center overflow-hidden z-10"
      >
        <div className="container mx-auto px-4 py-20 text-center relative z-20">
          {/* 3D Pipette Visual Placeholder */}
          <div className="mb-12 flex justify-center">
            <div className="relative w-64 h-96">
              {/* Pipette Illustration */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="relative">
                  {/* Pipette Body */}
                  <div className="w-16 h-48 bg-gradient-to-b from-white/20 to-white/10 backdrop-blur-sm rounded-t-2xl border border-white/30 shadow-2xl mx-auto relative">
                    <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-12 h-8 bg-gradient-to-b from-[#9448B0]/50 to-[#332277]/50 rounded-lg"></div>
                    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-8 h-16 bg-gradient-to-b from-white/30 to-transparent rounded-b-lg"></div>
                  </div>
                  {/* Tip */}
                  <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 w-4 h-12 bg-gradient-to-b from-white/40 to-[#D8F878]/60 rounded-b-full border border-[#D8F878]/50"></div>
                  {/* Test Tube with Glowing Liquid */}
                  <div className="absolute -bottom-20 left-1/2 transform -translate-x-1/2">
                    <div className="w-12 h-20 bg-white/10 backdrop-blur-sm rounded-b-lg border border-white/20 relative overflow-hidden">
                      <div className="absolute bottom-0 w-full h-12 bg-gradient-to-t from-[#D8F878]/60 to-[#D8F878]/30 animate-pulse"></div>
                      <div className="absolute bottom-0 w-full h-8 bg-[#D8F878]/40 blur-sm animate-pulse"></div>
                    </div>
                  </div>
                </div>
              </div>
              {/* Glow Effect */}
              <div className="absolute inset-0 bg-gradient-radial from-[#D8F878]/20 via-transparent to-transparent blur-3xl animate-pulse"></div>
            </div>
          </div>

          <h1 className="text-7xl md:text-9xl font-bold text-white mb-6 animate-fade-in">
            Pipette<span className="text-[#D8F878]">Pro</span>
          </h1>
          <p className="text-2xl md:text-3xl text-gray-300 mb-8 max-w-3xl mx-auto animate-fade-in">
            Master pipetting accuracy through immersive 3D simulation.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-6 animate-fade-in">
            <Link
              href="/simulator"
              className="px-8 py-4 bg-gradient-to-r from-[#9448B0] to-[#332277] text-white font-bold text-lg rounded-xl shadow-2xl hover:shadow-[#9448B0]/50 transform hover:scale-105 transition-all duration-300 border border-white/20"
            >
              Start Simulation
            </Link>
            <Link
              href="/home"
              className="px-8 py-4 bg-white/10 backdrop-blur-sm text-white font-bold text-lg rounded-xl shadow-xl hover:bg-white/20 transform hover:scale-105 transition-all duration-300 border border-white/20"
            >
              Explore App
            </Link>
          </div>
          <p className="text-sm text-gray-400 animate-fade-in">
            <Link href="/home" className="underline hover:text-[#D8F878] transition-colors">
              Sign up to save your progress
            </Link>
          </p>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center">
            <div className="w-1 h-3 bg-white/50 rounded-full mt-2 animate-pulse"></div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="relative py-32 px-4 z-10">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-5xl md:text-6xl font-bold text-white text-center mb-4 scroll-animate">
            How It Works
          </h2>
          <p className="text-xl text-gray-400 text-center mb-16 scroll-animate">
            Three powerful ways to master pipetting
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Simulation Card */}
            <div className="bg-white/5 backdrop-blur-md rounded-2xl p-8 border border-white/10 hover:border-[#9448B0]/50 transition-all duration-300 hover:transform hover:scale-105 scroll-animate">
              <div className="w-16 h-16 bg-gradient-to-br from-[#9448B0] to-[#332277] rounded-xl flex items-center justify-center mb-6 text-3xl">
                🧪
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Simulation</h3>
              <p className="text-gray-300 leading-relaxed">
                Practice real pipetting techniques in a virtual lab environment with realistic physics and feedback.
              </p>
              <Link
                href="/simulator"
                className="inline-block mt-6 text-[#D8F878] hover:text-[#D8F878]/80 font-semibold"
              >
                Try it now →
              </Link>
            </div>

            {/* Quiz Card */}
            <div className="bg-white/5 backdrop-blur-md rounded-2xl p-8 border border-white/10 hover:border-[#E47CB8]/50 transition-all duration-300 hover:transform hover:scale-105 scroll-animate">
              <div className="w-16 h-16 bg-gradient-to-br from-[#E47CB8] to-[#9448B0] rounded-xl flex items-center justify-center mb-6 text-3xl">
                💬
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Quiz</h3>
              <p className="text-gray-300 leading-relaxed">
                Test your precision and understanding with interactive quizzes covering all pipetting fundamentals.
              </p>
              <Link
                href="/quiz"
                className="inline-block mt-6 text-[#D8F878] hover:text-[#D8F878]/80 font-semibold"
              >
                Start quiz →
              </Link>
            </div>

            {/* Challenge Card */}
            <div className="bg-white/5 backdrop-blur-md rounded-2xl p-8 border border-white/10 hover:border-[#D8F878]/50 transition-all duration-300 hover:transform hover:scale-105 scroll-animate">
              <div className="w-16 h-16 bg-gradient-to-br from-[#D8F878] to-[#22c55e] rounded-xl flex items-center justify-center mb-6 text-3xl">
                🎮
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Challenge</h3>
              <p className="text-gray-300 leading-relaxed">
                Compete and improve your accuracy with timed challenges and performance tracking.
              </p>
              <Link
                href="/challenge"
                className="inline-block mt-6 text-[#D8F878] hover:text-[#D8F878]/80 font-semibold"
              >
                Take challenge →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Preview Section */}
      <section className="relative py-32 px-4 z-10">
        <div className="container mx-auto max-w-6xl">
          <div className="bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-md rounded-3xl p-12 border border-white/20 relative overflow-hidden scroll-animate">
            {/* Mock 3D Environment Visual */}
            <div className="grid grid-cols-3 gap-4 mb-8 opacity-60">
              {[...Array(9)].map((_, i) => (
                <div
                  key={i}
                  className="aspect-square bg-gradient-to-br from-[#9448B0]/20 to-[#332277]/20 rounded-lg border border-white/10 flex items-center justify-center"
                >
                  <div className="w-8 h-8 bg-[#D8F878]/30 rounded-full"></div>
                </div>
              ))}
            </div>
            <div className="text-center">
              <h3 className="text-4xl font-bold text-white mb-4">
                Realistic Physics. Real Lab Experience.
              </h3>
              <p className="text-xl text-gray-300 max-w-2xl mx-auto">
                Experience accurate liquid handling, precise volume measurements, and authentic lab scenarios in a fully interactive 3D environment.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Highlight Section */}
      <section className="relative py-32 px-4 z-10">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-5xl md:text-6xl font-bold text-white text-center mb-16 scroll-animate">
            Powerful Features
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Mistake Analyzer */}
            <div className="bg-white/5 backdrop-blur-md rounded-2xl p-8 border border-white/10 scroll-animate">
              <div className="w-20 h-20 bg-gradient-to-br from-red-500/20 to-orange-500/20 rounded-2xl flex items-center justify-center mb-6 text-4xl">
                ⚠️
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Mistake Analyzer</h3>
              <p className="text-gray-300">
                Learn from errors with detailed feedback and corrective guidance for every mistake.
              </p>
            </div>

            {/* Results Dashboard */}
            <div className="bg-white/5 backdrop-blur-md rounded-2xl p-8 border border-white/10 scroll-animate">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-2xl flex items-center justify-center mb-6 text-4xl">
                📊
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Results Dashboard</h3>
              <p className="text-gray-300">
                Track your improvement with comprehensive analytics and performance metrics.
              </p>
            </div>

            {/* AI Guidance */}
            <div className="bg-white/5 backdrop-blur-md rounded-2xl p-8 border border-white/10 scroll-animate">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-2xl flex items-center justify-center mb-6 text-4xl">
                🤖
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">AI Guidance</h3>
              <p className="text-gray-300">
                Receive personalized feedback and recommendations to enhance your technique.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="relative py-32 px-4 z-10">
        <div className="container mx-auto max-w-6xl">
          <div className="bg-white/5 backdrop-blur-md rounded-3xl p-12 border border-white/10 scroll-animate">
            <h2 className="text-4xl font-bold text-white text-center mb-4">
              Trusted by Educators and Lab Enthusiasts
            </h2>
            <p className="text-xl text-gray-400 text-center mb-12">
              Join thousands of students and professionals mastering pipetting skills
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                <p className="text-gray-300 mb-4 italic">
                  "PipettePro transformed how I teach pipetting. Students learn faster and make fewer mistakes in the real lab."
                </p>
                <p className="text-white font-semibold">— Dr. Sarah Chen, Biology Professor</p>
              </div>
              <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                <p className="text-gray-300 mb-4 italic">
                  "The 3D simulation feels incredibly realistic. I've improved my accuracy by 30% in just two weeks."
                </p>
                <p className="text-white font-semibold">— Alex Martinez, Research Technician</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Sign-Up CTA Section */}
      <section className="relative py-32 px-4 z-10">
        <div className="container mx-auto max-w-4xl">
          <div className="bg-gradient-to-r from-[#9448B0]/20 to-[#332277]/20 backdrop-blur-md rounded-3xl p-12 border border-white/20 text-center scroll-animate">
            <h2 className="text-4xl font-bold text-white mb-4">
              Create a Free Account
            </h2>
            <p className="text-xl text-gray-300 mb-8">
              Save your progress and unlock advanced challenges
            </p>
            <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-6 py-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-[#D8F878] transition-colors"
              />
              <button className="px-8 py-4 bg-gradient-to-r from-[#9448B0] to-[#332277] text-white font-bold rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-300">
                Sign Up
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative py-16 px-4 border-t border-white/10 z-10">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="text-2xl font-bold text-white mb-4">
                Pipette<span className="text-[#D8F878]">Pro</span>
              </h3>
              <p className="text-gray-400 text-sm">
                Master pipetting through immersive 3D simulation.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Navigation</h4>
              <ul className="space-y-2">
                <li><Link href="/" className="text-gray-400 hover:text-[#D8F878] transition-colors">Home</Link></li>
                <li><Link href="/simulator" className="text-gray-400 hover:text-[#D8F878] transition-colors">Simulation</Link></li>
                <li><Link href="/quiz" className="text-gray-400 hover:text-[#D8F878] transition-colors">Quiz</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Learn</h4>
              <ul className="space-y-2">
                <li><Link href="/mistakes" className="text-gray-400 hover:text-[#D8F878] transition-colors">Mistakes</Link></li>
                <li><Link href="/challenge" className="text-gray-400 hover:text-[#D8F878] transition-colors">Challenge</Link></li>
                <li><Link href="/results" className="text-gray-400 hover:text-[#D8F878] transition-colors">Results</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Connect</h4>
              <div className="flex gap-4">
                <a href="#" className="text-gray-400 hover:text-[#D8F878] transition-colors">Twitter</a>
                <a href="#" className="text-gray-400 hover:text-[#D8F878] transition-colors">LinkedIn</a>
                <a href="#" className="text-gray-400 hover:text-[#D8F878] transition-colors">GitHub</a>
              </div>
            </div>
          </div>
          <div className="border-t border-white/10 pt-8 text-center text-gray-400 text-sm">
            <p>© 2024 PipettePro. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
