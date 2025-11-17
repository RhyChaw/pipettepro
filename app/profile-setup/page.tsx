'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';

export default function ProfileSetupPage() {
  const { user, updateUserProfile, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    name: '',
    pipetteExperience: '',
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/signup');
    }
  }, [user, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim()) {
      setError('Please enter your name');
      return;
    }

    if (!formData.pipetteExperience) {
      setError('Please select your pipetting experience level');
      return;
    }

    try {
      setSubmitting(true);
      await updateUserProfile({
        name: formData.name,
        email: user?.email || '',
        'pipette experience': formData.pipetteExperience,
        profileComplete: true,
      });
      router.push('/home');
    } catch (err: any) {
      setError(err.message || 'Failed to save profile');
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{
          backgroundImage: 'linear-gradient(to bottom right, #9448B0, #332277, #001C3D)',
        }}
      >
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        backgroundImage: 'linear-gradient(to bottom right, #9448B0, #332277, #001C3D)',
      }}
    >
      <div className="w-full max-w-2xl">
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 border border-white/20 shadow-2xl">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">
              Complete Your Profile
            </h1>
            <p className="text-gray-300">Tell us about yourself to personalize your experience</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-white font-semibold mb-2">
                Full Name <span className="text-red-400">*</span>
              </label>
              <input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-[#D8F878] transition-colors"
                placeholder="Enter your full name"
              />
            </div>

            <div>
              <label htmlFor="pipetteExperience" className="block text-white font-semibold mb-2">
                Pipette Experience <span className="text-red-400">*</span>
              </label>
              <select
                id="pipetteExperience"
                value={formData.pipetteExperience}
                onChange={(e) => setFormData({ ...formData, pipetteExperience: e.target.value })}
                required
                className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white focus:outline-none focus:border-[#D8F878] transition-colors"
              >
                <option value="" className="bg-[#001C3D]">Select your experience level</option>
                <option value="beginner" className="bg-[#001C3D]">Beginner - Never used a pipette</option>
                <option value="novice" className="bg-[#001C3D]">Novice - Basic experience</option>
                <option value="intermediate" className="bg-[#001C3D]">Intermediate - Regular use</option>
                <option value="advanced" className="bg-[#001C3D]">Advanced - Expert level</option>
              </select>
            </div>

            {error && (
              <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4 text-red-200 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-gradient-to-r from-[#9448B0] to-[#332277] text-white font-bold py-3 rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Saving...' : 'Complete Setup'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

