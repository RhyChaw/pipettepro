'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { useAuth } from '../contexts/AuthContext';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../utils/firebaseConfig';

interface LeaderboardUser {
  email: string;
  name: string;
  level: number;
  profilePictureUrl?: string;
}

export default function LeaderboardPage() {
  const { user, userProfile } = useAuth();
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const studentsRef = collection(db, 'students');
        const q = query(studentsRef, orderBy('level', 'desc'));
        const querySnapshot = await getDocs(q);
        
        const users: LeaderboardUser[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          if (data.name && data.level !== undefined) {
            users.push({
              email: data.email || doc.id,
              name: data.name,
              level: data.level || 0,
              profilePictureUrl: data.profilePictureUrl,
            });
          }
        });
        
        setLeaderboard(users);
      } catch (error) {
        console.error('Error fetching leaderboard:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  const getRankIcon = (index: number) => {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return `#${index + 1}`;
  };

  const getRankColor = (index: number) => {
    if (index === 0) return 'bg-yellow-100 border-yellow-300';
    if (index === 1) return 'bg-gray-100 border-gray-300';
    if (index === 2) return 'bg-orange-100 border-orange-300';
    return 'bg-white border-slate-200';
  };

  return (
    <DashboardLayout>
      <div className="w-full max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Leaderboard</h1>
          <p className="text-slate-600">See who has the highest level in PipettePro</p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-slate-600">Loading leaderboard...</p>
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-600">No users found on the leaderboard yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {leaderboard.map((user, index) => (
              <div
                key={user.email}
                className={`flex items-center gap-4 p-6 rounded-xl border-2 transition-all ${
                  getRankColor(index)
                } ${user.email === userProfile?.email ? 'ring-2 ring-blue-500' : ''}`}
              >
                <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center text-2xl font-bold">
                  {getRankIcon(index)}
                </div>
                
                <div className="flex-shrink-0">
                  {user.profilePictureUrl ? (
                    <img
                      src={user.profilePictureUrl}
                      alt={user.name}
                      className="w-16 h-16 rounded-full object-cover border-2 border-slate-300"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-slate-200 flex items-center justify-center border-2 border-slate-300">
                      <span className="text-2xl font-semibold text-slate-600">
                        {user.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-slate-900">
                    {user.name}
                    {user.email === userProfile?.email && (
                      <span className="ml-2 text-sm text-blue-600 font-normal">(You)</span>
                    )}
                  </h3>
                  <p className="text-sm text-slate-600">{user.email}</p>
                </div>

                <div className="flex-shrink-0 text-right">
                  <div className="text-2xl font-bold text-slate-900">Level {user.level}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

