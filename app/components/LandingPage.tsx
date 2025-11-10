'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

export default function LandingPage() {
  const router = useRouter();

  return (
    <div
      className="min-h-screen relative overflow-hidden"
      style={{
        backgroundImage: 'linear-gradient(to bottom right, #9448B0, #332277, #001C3D)',
      }}
    >
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-20 left-10 w-32 h-32 rounded-full opacity-20"
          style={{
            background: 'radial-gradient(circle, #D8F878, transparent)',
            animation: 'float 6s ease-in-out infinite',
          }}
        />
        <div
          className="absolute bottom-20 right-10 w-40 h-40 rounded-full opacity-15"
          style={{
            background: 'radial-gradient(circle, #E47CB8, transparent)',
            animation: 'float 8s ease-in-out infinite 2s',
          }}
        />
        <div
          className="absolute top-1/2 left-1/2 w-24 h-24 rounded-full opacity-10"
          style={{
            background: 'radial-gradient(circle, #3b82f6, transparent)',
            animation: 'float 10s ease-in-out infinite 4s',
            transform: 'translate(-50%, -50%)',
          }}
        />
      </div>

      {/* Mascot - Floating character */}
      <div
        className="absolute top-10 right-10 md:top-20 md:right-20 pointer-events-none z-20"
        style={{
          animation: 'float 4s ease-in-out infinite',
        }}
      >
        <div className="relative w-32 h-32 md:w-40 md:h-40">
          <Image
            src="/mascot.png"
            alt="PipettePro Mascot"
            width={160}
            height={160}
            className="drop-shadow-2xl"
            unoptimized
            priority
          />
        </div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-12 md:py-20">
        {/* Header */}
        <div className="text-center mb-16 md:mb-24">
          <div className="flex items-center justify-center mb-6">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="64"
              height="64"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-[#D8F878] mr-4"
            >
              <path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5S5 13 5 15a7 7 0 0 0 7 7z"></path>
            </svg>
            <h1 className="text-5xl md:text-7xl font-bold text-white">
              Pipette<span className="text-[#D8F878]">Pro</span>
            </h1>
          </div>
          <p className="text-xl md:text-2xl text-gray-300 max-w-2xl mx-auto">
            Master pipetting techniques with interactive 3D simulations and comprehensive quizzes
          </p>
        </div>

        {/* Main Sections */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 max-w-6xl mx-auto">
          {/* Section 1: Live Lab Simulation */}
          <div className="group relative">
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 h-full transform transition-all duration-300 hover:scale-105 hover:shadow-3xl">
              <div className="flex flex-col items-center text-center h-full">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#9448B0] to-[#332277] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="40"
                    height="40"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M7 21h10" />
                    <path d="M12 21V8" />
                    <path d="M12 8a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v2" />
                    <path d="m16 8 4-4" />
                    <path d="M12 3v5" />
                  </svg>
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-[#001C3D] mb-4">
                  Live Lab Simulation
                </h2>
                <p className="text-gray-600 mb-6 flex-grow">
                  Experience realistic 3D pipetting in an interactive laboratory environment. Practice proper techniques with real-time feedback.
                </p>
                <Link
                  href="/simulator"
                  className="w-full bg-gradient-to-r from-[#9448B0] to-[#332277] text-white font-bold py-4 px-6 rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
                >
                  Enter Lab →
                </Link>
              </div>
            </div>
          </div>

          {/* Section 2: Know Your Pipette */}
          <div className="group relative">
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 h-full transform transition-all duration-300 hover:scale-105 hover:shadow-3xl">
              <div className="flex flex-col items-center text-center h-full">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#E47CB8] to-[#9448B0] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="40"
                    height="40"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 6v6l4 2" />
                  </svg>
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-[#001C3D] mb-4">
                  Know Your Pipette
                </h2>
                <p className="text-gray-600 mb-6 flex-grow">
                  Explore a detailed 3D model of a mechanical pipette. Rotate, zoom, and examine every component up close.
                </p>
                <Link
                  href="/know-your-pipette"
                  className="w-full bg-gradient-to-r from-[#E47CB8] to-[#9448B0] text-white font-bold py-4 px-6 rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
                >
                  Explore Model →
                </Link>
              </div>
            </div>
          </div>

          {/* Section 3: Practice Your Knowledge */}
          <div className="group relative">
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 h-full transform transition-all duration-300 hover:scale-105 hover:shadow-3xl">
              <div className="flex flex-col items-center text-center h-full">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#D8F878] to-[#22c55e] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="40"
                    height="40"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#001C3D"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
                    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
                  </svg>
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-[#001C3D] mb-4">
                  Practice Your Knowledge
                </h2>
                <p className="text-gray-600 mb-6 flex-grow">
                  Test your understanding with interactive quizzes covering pipetting techniques, equipment handling, and best practices.
                </p>
                <Link
                  href="/quiz"
                  className="w-full bg-gradient-to-r from-[#D8F878] to-[#22c55e] text-[#001C3D] font-bold py-4 px-6 rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
                >
                  Start Quiz →
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-16 md:mt-24 text-center">
          <p className="text-gray-400 text-sm">
            Master the art of precision pipetting with PipettePro
          </p>
        </div>
      </div>

    </div>
  );
}

