'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';

export default function AuthRedirect() {
  const { user, userProfile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      // Check if user has a name
      if (userProfile?.name) {
        router.push('/home');
      } else {
        router.push('/setup');
      }
    }
  }, [user, userProfile, loading, router]);

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

