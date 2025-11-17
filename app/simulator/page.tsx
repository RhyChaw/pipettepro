'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import PipetteSimulator from '../components/PipetteSimulator';
import { useAuth } from '../contexts/AuthContext';
import DashboardLayout from '../components/DashboardLayout';

export default function SimulatorPage() {
  const { user, updateUserProfile } = useAuth();

  // Mark step 3 as completed when user visits this page
  useEffect(() => {
    if (user?.email) {
      localStorage.setItem(`visited_simulator_${user.email}`, 'true');
      // Update roadmap completion
      const stored = localStorage.getItem(`roadmap_${user.email}`);
      const completed = stored ? new Set<number>(JSON.parse(stored) as number[]) : new Set<number>();
      completed.add(3);
      const completedArray = Array.from(completed) as number[];
      localStorage.setItem(`roadmap_${user.email}`, JSON.stringify(completedArray));
      
      // Save to Firebase
      updateUserProfile({
        roadmapProgress: completedArray,
      }).catch((error) => {
        console.error('Error saving roadmap progress:', error);
      });
    }
  }, [user, updateUserProfile]);

  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-4rem)] -m-8 relative">
        <PipetteSimulator />
      </div>
    </DashboardLayout>
  );
}


