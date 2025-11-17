'use client';

import { useEffect } from 'react';
import PipetteSimulator from '../components/PipetteSimulator';
import { useAuth } from '../contexts/AuthContext';

export default function SimulatorPage() {
  const { user, updateUserProfile } = useAuth();

  // Mark step 3 as completed when user visits this page
  useEffect(() => {
    if (user?.email) {
      localStorage.setItem(`visited_simulator_${user.email}`, 'true');
      // Update roadmap completion
      const stored = localStorage.getItem(`roadmap_${user.email}`);
      const completed = stored ? new Set(JSON.parse(stored)) : new Set<number>();
      completed.add(3);
      localStorage.setItem(`roadmap_${user.email}`, JSON.stringify(Array.from(completed)));
      
      // Save to Firebase
      updateUserProfile({
        roadmapProgress: Array.from(completed),
      }).catch((error) => {
        console.error('Error saving roadmap progress:', error);
      });
    }
  }, [user, updateUserProfile]);

  return <PipetteSimulator />;
}


