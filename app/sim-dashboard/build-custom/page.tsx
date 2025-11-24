'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '../../../components/DashboardLayout';
import { useAuth } from '../../../contexts/AuthContext';

type ExperimentType = 'titration' | 'pipetting' | 'dilution' | 'mixing' | 'other';

interface TitrationConfig {
  analyte: string;
  titrant: string;
  indicator: string;
  targetVolume: number;
  concentration: number;
}

export default function BuildCustomSimulationPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [experimentType, setExperimentType] = useState<ExperimentType | null>(null);
  const [titrationConfig, setTitrationConfig] = useState<TitrationConfig>({
    analyte: '',
    titrant: '',
    indicator: '',
    targetVolume: 0,
    concentration: 0,
  });

  const experimentTypes: { value: ExperimentType; label: string; description: string }[] = [
    {
      value: 'titration',
      label: 'Titration',
      description: 'Acid-base or redox titration experiment',
    },
    {
      value: 'pipetting',
      label: 'Pipetting',
      description: 'Precise liquid transfer and measurement',
    },
    {
      value: 'dilution',
      label: 'Dilution',
      description: 'Prepare solutions of specific concentrations',
    },
    {
      value: 'mixing',
      label: 'Mixing',
      description: 'Combine reagents and solutions',
    },
    {
      value: 'other',
      label: 'Other',
      description: 'Custom experiment configuration',
    },
  ];

  const commonAnalytes = [
    'Acetic Acid (CH₃COOH)',
    'Hydrochloric Acid (HCl)',
    'Sulfuric Acid (H₂SO₄)',
    'Sodium Hydroxide (NaOH)',
    'Potassium Hydroxide (KOH)',
    'Citric Acid',
    'Ascorbic Acid',
  ];

  const commonTitrants = [
    'Sodium Hydroxide (NaOH)',
    'Hydrochloric Acid (HCl)',
    'Potassium Permanganate (KMnO₄)',
    'Iodine (I₂)',
    'EDTA',
  ];

  const commonIndicators = [
    'Phenolphthalein',
    'Methyl Orange',
    'Bromothymol Blue',
    'Universal Indicator',
    'Starch (for Iodine)',
  ];

  const handleExperimentTypeSelect = (type: ExperimentType) => {
    setExperimentType(type);
  };

  const handleBuildSimulation = async () => {
    if (!user?.email) {
      alert('Please log in to build simulations.');
      return;
    }

    if (experimentType === 'titration') {
      if (!titrationConfig.analyte || !titrationConfig.titrant || !titrationConfig.indicator) {
        alert('Please fill in all titration parameters.');
        return;
      }

      // Generate simulation scenario based on titration config
      const scenario = {
        title: `${titrationConfig.analyte} Titration`,
        description: `Titration of ${titrationConfig.analyte} with ${titrationConfig.titrant} using ${titrationConfig.indicator}`,
        experimentType: 'titration',
        equipment: ['Burette', 'Pipette', 'Erlenmeyer Flask', 'Magnetic Stirrer', 'pH Meter'],
        reagents: [
          { name: titrationConfig.analyte, volume: titrationConfig.targetVolume },
          { name: titrationConfig.titrant, volume: 0 },
          { name: titrationConfig.indicator, volume: 2 },
        ],
        steps: [
          {
            id: 'step-1',
            type: SimulatorActionType.SELECT_PIPETTE,
            order: 1,
            instruction: `Select an appropriate pipette for ${titrationConfig.targetVolume} mL`,
            targetVolume: titrationConfig.targetVolume,
          },
          {
            id: 'step-2',
            type: SimulatorActionType.ASPIRATE,
            order: 2,
            instruction: `Pipette ${titrationConfig.targetVolume} mL of ${titrationConfig.analyte} into an Erlenmeyer flask`,
            targetVolume: titrationConfig.targetVolume,
          },
          {
            id: 'step-3',
            type: SimulatorActionType.WAIT,
            order: 3,
            instruction: `Add 2-3 drops of ${titrationConfig.indicator} to the flask`,
            waitTime: 5,
          },
          {
            id: 'step-4',
            type: SimulatorActionType.CHECK,
            order: 4,
            instruction: `Slowly add ${titrationConfig.titrant} from the burette while stirring. Observe the color change and record the volume at the endpoint`,
            checkCondition: 'Color change observed',
          },
        ],
      };

      // Save scenario and navigate to simulator
      try {
        const response = await fetch('/api/scenarios/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.email,
            scenario,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          router.push(`/simulator?scenarioId=${data.scenarioId}`);
        } else {
          throw new Error('Failed to save scenario');
        }
      } catch (error) {
        console.error('Error saving scenario:', error);
        alert('Failed to create simulation. Please try again.');
      }
    } else {
      // For other experiment types, navigate to simulator with basic config
      router.push(`/simulator?experimentType=${experimentType}`);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="mb-6">
          <button
            onClick={() => router.push('/sim-dashboard')}
            className="flex items-center gap-2 text-slate-700 hover:text-slate-900 font-medium mb-4"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Simulation Dashboard
          </button>
          <h1 className="text-3xl font-semibold text-slate-900 mb-2">Build Custom Simulation</h1>
          <p className="text-slate-700">Choose your experiment type and configure the parameters</p>
        </div>

        {/* Experiment Type Selection */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Select Experiment Type</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {experimentTypes.map((type) => (
              <button
                key={type.value}
                onClick={() => handleExperimentTypeSelect(type.value)}
                className={`p-4 border-2 rounded-xl text-left transition-all ${
                  experimentType === type.value
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-slate-300 hover:border-purple-300 hover:bg-slate-50'
                }`}
              >
                <h3 className="font-semibold text-slate-900 mb-1">{type.label}</h3>
                <p className="text-sm text-slate-700">{type.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Titration Configuration */}
        {experimentType === 'titration' && (
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">Titration Configuration</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  Analyte (Substance being titrated)
                </label>
                <select
                  value={titrationConfig.analyte}
                  onChange={(e) =>
                    setTitrationConfig({ ...titrationConfig, analyte: e.target.value })
                  }
                  className="w-full p-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Select analyte...</option>
                  {commonAnalytes.map((analyte) => (
                    <option key={analyte} value={analyte}>
                      {analyte}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  Titrant (Solution being added)
                </label>
                <select
                  value={titrationConfig.titrant}
                  onChange={(e) =>
                    setTitrationConfig({ ...titrationConfig, titrant: e.target.value })
                  }
                  className="w-full p-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Select titrant...</option>
                  {commonTitrants.map((titrant) => (
                    <option key={titrant} value={titrant}>
                      {titrant}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  Indicator
                </label>
                <select
                  value={titrationConfig.indicator}
                  onChange={(e) =>
                    setTitrationConfig({ ...titrationConfig, indicator: e.target.value })
                  }
                  className="w-full p-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Select indicator...</option>
                  {commonIndicators.map((indicator) => (
                    <option key={indicator} value={indicator}>
                      {indicator}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">
                    Target Volume (mL)
                  </label>
                  <input
                    type="number"
                    value={titrationConfig.targetVolume || ''}
                    onChange={(e) =>
                      setTitrationConfig({
                        ...titrationConfig,
                        targetVolume: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full p-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="e.g., 25.0"
                    step="0.1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">
                    Concentration (M)
                  </label>
                  <input
                    type="number"
                    value={titrationConfig.concentration || ''}
                    onChange={(e) =>
                      setTitrationConfig({
                        ...titrationConfig,
                        concentration: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full p-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="e.g., 0.1"
                    step="0.01"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Other Experiment Types */}
        {experimentType && experimentType !== 'titration' && (
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">
              {experimentTypes.find((t) => t.value === experimentType)?.label} Configuration
            </h2>
            <p className="text-slate-700">
              Configuration options for {experimentType} experiments are coming soon. For now, you can start with
              default settings.
            </p>
          </div>
        )}

        {/* Build Button */}
        {experimentType && (
          <div className="flex justify-end gap-4">
            <button
              onClick={() => router.push('/sim-dashboard')}
              className="px-6 py-3 border border-slate-300 text-slate-700 rounded-lg font-semibold hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleBuildSimulation}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors"
            >
              Build & Start Simulation
            </button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

