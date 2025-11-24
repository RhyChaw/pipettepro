'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '../components/DashboardLayout';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../utils/firebaseConfig';
import { SimulationScenario } from '../types/simulation';

export default function SimDashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [customScenarios, setCustomScenarios] = useState<SimulationScenario[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.email) {
      loadCustomScenarios();
    }
  }, [user]);

  const loadCustomScenarios = async () => {
    if (!user?.email) return;

    setLoading(true);
    try {
      // Load custom scenarios from Firestore
      // Assuming we have a userScenarios collection
      const scenariosRef = collection(db, 'userScenarios');
      const q = query(scenariosRef, where('userId', '==', user.email));
      const querySnapshot = await getDocs(q);
      const scenariosData: SimulationScenario[] = [];
      querySnapshot.forEach((doc) => {
        scenariosData.push({ id: doc.id, ...doc.data() } as SimulationScenario);
      });
      setCustomScenarios(scenariosData);
    } catch (error) {
      console.error('Error loading custom scenarios:', error);
      setCustomScenarios([]);
    } finally {
      setLoading(false);
    }
  };

  const handleTutorialSimulation = () => {
    router.push('/simulator?tutorial=true');
  };

  const handleBuildCustom = () => {
    router.push('/sim-dashboard/build-custom');
  };

  const handleUseNotes = () => {
    router.push('/notes');
  };

  const handleStartScenario = (scenario: SimulationScenario) => {
    // Navigate to simulator with scenario data
    router.push(`/simulator?scenarioId=${scenario.id}`);
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900 mb-2">Simulation Dashboard</h1>
          <p className="text-slate-700">Practice lab procedures through interactive simulations</p>
        </div>

        {/* Tutorial Simulation Section */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Tutorial Simulation</h2>
          <p className="text-slate-700 mb-4">
            Learn the basics with our guided tutorial simulation. Perfect for beginners!
          </p>
          <button
            onClick={handleTutorialSimulation}
            className="px-6 py-3 bg-[#9448B0] text-white rounded-lg font-semibold hover:bg-[#A058C0] transition-colors"
          >
            Start Tutorial Simulation
          </button>
        </div>

        {/* Template Questions Section */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Template Questions</h2>
          <p className="text-slate-700 mb-4">
            Practice with pre-built simulation scenarios covering common lab procedures.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div
              className="aspect-square border-2 border-slate-200 rounded-xl p-6 hover:border-purple-500 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
              onClick={() => router.push('/simulator?template=basic-pipetting')}
            >
              <div>
                <span className="inline-block px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold mb-3">
                  Easy
                </span>
                <h3 className="font-semibold text-slate-900 text-lg mb-2">Basic Pipetting</h3>
                <p className="text-sm text-slate-700">
                  Learn fundamental pipetting techniques: selecting the right pipette, setting volume, and transferring liquids accurately.
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  router.push('/simulator?template=basic-pipetting');
                }}
                className="mt-4 w-full px-4 py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors text-sm"
              >
                Start
              </button>
            </div>

            <div
              className="aspect-square border-2 border-slate-200 rounded-xl p-6 hover:border-purple-500 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
              onClick={() => router.push('/simulator?template=serial-dilution')}
            >
              <div>
                <span className="inline-block px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold mb-3">
                  Easy
                </span>
                <h3 className="font-semibold text-slate-900 text-lg mb-2">Serial Dilution</h3>
                <p className="text-sm text-slate-700">
                  Practice creating a series of dilutions with decreasing concentrations. Master the technique of sequential dilutions.
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  router.push('/simulator?template=serial-dilution');
                }}
                className="mt-4 w-full px-4 py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors text-sm"
              >
                Start
              </button>
            </div>

            <div
              className="aspect-square border-2 border-slate-200 rounded-xl p-6 hover:border-purple-500 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
              onClick={() => router.push('/simulator?template=reagent-preparation')}
            >
              <div>
                <span className="inline-block px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold mb-3">
                  Easy
                </span>
                <h3 className="font-semibold text-slate-900 text-lg mb-2">Reagent Preparation</h3>
                <p className="text-sm text-slate-700">
                  Learn to prepare solutions accurately by measuring volumes and mixing reagents properly for experiments.
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  router.push('/simulator?template=reagent-preparation');
                }}
                className="mt-4 w-full px-4 py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors text-sm"
              >
                Start
              </button>
            </div>
          </div>
        </div>

        {/* Custom Simulations Section */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Your Custom Simulations</h2>
          {loading ? (
            <div className="text-center text-slate-700 py-8">Loading your simulations...</div>
          ) : customScenarios.length === 0 ? (
            <div className="text-center text-slate-700 py-8">
              <p className="mb-4">No custom simulations yet.</p>
              <p className="text-sm text-slate-600">Build your first custom simulation below!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {customScenarios.map((scenario) => (
                <div
                  key={scenario.id}
                  className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => handleStartScenario(scenario)}
                >
                  <h3 className="font-semibold text-slate-900 mb-2">{scenario.title}</h3>
                  <p className="text-sm text-slate-700 mb-3 line-clamp-2">{scenario.description}</p>
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <span>{scenario.steps.length} steps</span>
                    {scenario.experimentType && (
                      <>
                        <span>•</span>
                        <span>{scenario.experimentType}</span>
                      </>
                    )}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStartScenario(scenario);
                    }}
                    className="mt-3 w-full px-4 py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors text-sm"
                  >
                    Start Simulation
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Build Custom Simulation Section */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Build a Custom Simulation</h2>
          <p className="text-slate-700 mb-6">
            Create your own simulation or use notes you've uploaded to generate a simulation scenario.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={handleBuildCustom}
              className="p-6 border-2 border-slate-300 rounded-xl hover:border-purple-500 hover:bg-purple-50 transition-all text-left"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-slate-900">Build Custom Simulation</h3>
              </div>
              <p className="text-sm text-slate-700">
                Choose your experiment type (e.g., titration) and configure your simulation parameters.
              </p>
            </button>

            <button
              onClick={handleUseNotes}
              className="p-6 border-2 border-slate-300 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all text-left"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-slate-900">Use Uploaded Notes</h3>
              </div>
              <p className="text-sm text-slate-700">
                Generate a simulation from your scanned notes and lab manuals.
              </p>
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

