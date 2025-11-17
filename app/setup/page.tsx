'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';

export default function SetupPage() {
  const { user, userProfile, updateUserProfile, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    name: '',
    pipetteExperience: '',
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/signup');
      } else if (userProfile?.name) {
        // If user already has a name, redirect to home
        router.push('/home');
      }
    }
  }, [user, userProfile, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim()) {
      setError('Please enter your name');
      return;
    }

    if (!formData.pipetteExperience) {
      setError('Please select your pipette experience level');
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

  const experienceOptions = [
    { value: 'Never done before', label: 'Never done before' },
    { value: 'Have some experience', label: 'Have some experience' },
    { value: 'Good with Pipetting', label: 'Good with Pipetting' },
    { value: 'The pipette master', label: 'The pipette master' },
  ];

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
            <p className="text-gray-300">Tell us about yourself to get started</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div>
              <label htmlFor="name" className="block text-white font-semibold mb-3 text-lg">
                What's your name? <span className="text-red-400">*</span>
              </label>
              <input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-[#D8F878] transition-colors text-lg"
                placeholder="Enter your name"
              />
            </div>

            <div>
              <label className="block text-white font-semibold mb-4 text-lg">
                What's your pipette experience? <span className="text-red-400">*</span>
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {experienceOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, pipetteExperience: option.value })}
                    className={`px-6 py-4 rounded-xl border-2 transition-all duration-300 text-left ${
                      formData.pipetteExperience === option.value
                        ? 'bg-gradient-to-r from-[#9448B0] to-[#332277] border-[#D8F878] text-white shadow-lg transform scale-105'
                        : 'bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20 hover:border-white/40'
                    }`}
                  >
                    <span className="font-semibold text-lg">{option.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4 text-red-200 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || !formData.name.trim() || !formData.pipetteExperience}
              className="w-full bg-gradient-to-r from-[#9448B0] to-[#332277] text-white font-bold py-4 rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-lg"
            >
              {submitting ? 'Saving...' : 'Continue to Dashboard'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

