'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import TutorialOverlay from './TutorialOverlay';
import TutorialStepsOverlay from './TutorialStepsOverlay';
import InteractionTutorialOverlay from './InteractionTutorialOverlay';
import { useAuth } from '../contexts/AuthContext';
import { STICKY_NOTE_COLORS, StickyNote, StickyNoteColor } from '../constants/stickyNotes';

interface Pipette {
  id: string;
  name: string;
  min: number;
  max: number;
  color: number;
}

interface GameState {
  selectedPipette: Pipette | null;
  targetVolume: number;
  liquidInPipette: number;
  dispensedStop1: boolean;
  plungerState: 'rest' | 'stop1' | 'stop2';
  pipetteY: number;
  hasTip: boolean;
}

interface Container {
  group: THREE.Group;
  liquidMesh: THREE.Mesh;
  initialLiquidRatio: number;
  height: number;
  totalVolume: number;
  currentColor: THREE.Color;
  currentVolume: number;
}

interface PipetteTipMesh extends THREE.Mesh {
  tipLiquid: THREE.Mesh;
}

const pipettes: Pipette[] = [
  { id: 'p2', name: '2 µL', min: 0.2, max: 2, color: 0xef4444 },
  { id: 'p10', name: '10 µL', min: 1, max: 10, color: 0x22c55e },
  { id: 'p200', name: '200 µL', min: 20, max: 200, color: 0xeab308 },
  { id: 'p1000', name: '1000 µL', min: 100, max: 1000, color: 0x3b82f6 },
];

const proTips = [
  "Always attach a fresh tip before aspirating a new liquid to avoid cross-contamination.",
  "For volatile liquids, pre-wet the tip by aspirating and dispensing several times to improve accuracy.",
  "Use low-retention tips for viscous substances like glycerol to ensure the full volume is dispensed.",
  "Allow tips and liquids to reach room temperature before pipetting to reduce errors.",
  "Maintain a consistent vertical angle when aspirating to minimize volume variations.",
  "Immerse the tip just below the liquid surface; deep immersion can cause liquid to cling to the outside.",
  "Operate the plunger smoothly and steadily to avoid introducing air bubbles.",
  "Always use a pipette that matches the volume range you are handling for best accuracy.",
  "Regularly calibrate your micropipette to ensure accuracy and reproducibility.",
  "Ensure a proper, comfortable grip and take short breaks during long pipetting sessions to prevent fatigue.",
  "Always double-check the volume setting on the display before aspirating your liquid.",
  "Use filter tips for sensitive applications like PCR to prevent aerosol contamination.",
  "Regularly decontaminate, inspect, and lubricate your micropipette to ensure its longevity and performance.",
];

// Meme images for quiz results
const successMeme = {
  url: '/meme_success.png',
  text: "Excellent work! You're mastering pipetting techniques!"
};

const failureMeme = {
  url: '/meme_failure.png',
  text: "Keep practicing! Every attempt helps you improve."
};

const quizQuestions = [
  {
    question: "What is the very first step before aspirating a liquid?",
    options: ["Press the plunger", "Move to the source liquid", "Attach a new, sterile tip"],
    correctAnswerIndex: 2,
    explanation: "Correct! Always start by attaching a fresh tip to prevent contamination and ensure accuracy.",
  },
  {
    question: "When aspirating (drawing up) liquid, to what point should you press the plunger?",
    options: ["All the way down (second stop)", "To the first stop", "Halfway down"],
    correctAnswerIndex: 1,
    explanation: "Correct! Always press to the first stop before immersing the tip to aspirate the correct volume. The second stop is for dispensing.",
  },
  {
    question: "To dispense the full volume, including the last drop, you should...",
    options: ["Press to the first stop, then eject", "Press to the first stop, then the second stop (blow-out)", "Just touch the tip to the liquid"],
    correctAnswerIndex: 1,
    explanation: "Correct! Pressing to the second stop performs a 'blow-out,' which expels any remaining liquid from the tip.",
  },
  {
    question: "What is 'pre-wetting' a pipette tip useful for?",
    options: ["Cleaning the tip before use", "Volatile or viscous liquids", "Pipetting plain water"],
    correctAnswerIndex: 1,
    explanation: "Correct! Pre-wetting conditions the tip by coating its inner surface, which improves accuracy for volatile (evaporative) or viscous (thick) liquids.",
  },
  {
    question: "When pipetting a viscous liquid like glycerol, which technique is recommended?",
    options: ["Reverse pipetting", "Standard forward pipetting", "Pipetting very quickly"],
    correctAnswerIndex: 0,
    explanation: "Correct! Reverse pipetting is ideal for viscous solutions as it minimizes the formation of air bubbles and improves accuracy by compensating for the liquid that clings to the tip.",
  },
  {
    question: "What type of tip is best for handling sticky biological samples like DNA or proteins?",
    options: ["Standard tips", "Extra-long tips", "Low-retention tips"],
    correctAnswerIndex: 2,
    explanation: "Correct! Low-retention tips have a hydrophobic inner surface that minimizes liquid adhesion, ensuring that the full volume of a precious or sticky sample is dispensed.",
  },
];

export default function PipetteSimulator() {
  const { userProfile, updateUserProfile } = useAuth();
  const router = useRouter();
  const labContainerRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<'pipetting' | 'quiz'>('pipetting');
  const [selectedPipetteId, setSelectedPipetteId] = useState<string | null>(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackTitle, setFeedbackTitle] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [feedbackType, setFeedbackType] = useState<'correct' | 'error' | 'neutral'>('neutral');
  const [showProTip, setShowProTip] = useState(false);
  const [proTipText, setProTipText] = useState('');
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [showQuizResults, setShowQuizResults] = useState(false);
  const [selectedMeme, setSelectedMeme] = useState<{ url: string; text: string } | null>(null);
  const [quizData, setQuizData] = useState({
    currentQuestionIndex: 0,
    score: 0,
    incorrectQuestions: [] as typeof quizQuestions,
    questions: [] as typeof quizQuestions,
  });
  const [quizFeedback, setQuizFeedback] = useState<{
    show: boolean;
    isCorrect: boolean;
    explanation: string;
  }>({ show: false, isCorrect: false, explanation: '' });
  const [feedbackStates, setFeedbackStates] = useState({
    angle: { value: '--', status: 'neutral' as 'correct' | 'incorrect' | 'neutral' },
    depth: { value: '--', status: 'neutral' as 'correct' | 'incorrect' | 'neutral' },
    plunger: { value: 'Ready', status: 'neutral' as 'correct' | 'incorrect' | 'neutral' },
  });
  // Only show tutorial if user hasn't completed it yet
  const [showTutorial, setShowTutorial] = useState(false);
  const [feedbackConsole, setFeedbackConsole] = useState<string>('');
  const [showStickyNotesModal, setShowStickyNotesModal] = useState(false);
  const [stickyNotes, setStickyNotes] = useState<StickyNote[]>(userProfile?.stickyNotes || []);
  const [noteColor, setNoteColor] = useState<StickyNoteColor>('yellow');
  const [noteContent, setNoteContent] = useState('');
  const [noteSaving, setNoteSaving] = useState(false);
  const [noteError, setNoteError] = useState<string | null>(null);
  const [showPipettePalette, setShowPipettePalette] = useState(false);

  // Load tutorial scenario when in tutorial mode
  useEffect(() => {
    const loadTutorialScenario = async () => {
      try {
        const response = await fetch('/api/scenarios/tutorial');
        if (response.ok) {
          const data = await response.json();
          setTutorialScenario(data.scenario);
          if (data.scenario.question) {
            setCurrentTask(data.scenario.question);
          }
        }
      } catch (error) {
        console.error('Error loading tutorial scenario:', error);
      }
    };

    // Check if we're in tutorial mode (from URL)
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const isTutorial = urlParams.get('tutorial') === 'true' || urlParams.get('mode') === 'tutorial';
      
      if (isTutorial) {
        setIsTutorialMode(true);
        setShowMascotWelcome(true);
        loadTutorialScenario();
      }
    }
  }, []);

  // Listen for tutorial button click from DashboardLayout
  useEffect(() => {
    const handleShowTutorial = () => {
      setShowTutorial(true);
    };
    window.addEventListener('showTutorial', handleShowTutorial);
    return () => window.removeEventListener('showTutorial', handleShowTutorial);
  }, []);

  useEffect(() => {
    const handleToggleStickyNotes = () => setShowStickyNotesModal(true);
    window.addEventListener('toggleStickyNotes', handleToggleStickyNotes);
    return () => window.removeEventListener('toggleStickyNotes', handleToggleStickyNotes);
  }, []);

  useEffect(() => {
    setStickyNotes(userProfile?.stickyNotes || []);
  }, [userProfile?.stickyNotes]);

  // Sync slider with pipetteY value when scene is ready
  useEffect(() => {
    const syncSlider = () => {
      if (!sceneRef.current) return;
      const slider = document.getElementById('heightSlider') as HTMLInputElement;
      if (slider) {
        slider.value = sceneRef.current.gameState.pipetteY.toString();
      }
    };
    // Wait a bit for scene to initialize
    const timeout = setTimeout(syncSlider, 500);
    return () => clearTimeout(timeout);
  }, []);
  const [showContextualQuiz, setShowContextualQuiz] = useState(false);
  const [contextualQuizQuestion, setContextualQuizQuestion] = useState<{ question: string; options: string[]; correct: number; explanation: string } | null>(null);
  const [showMistakeSidebar, setShowMistakeSidebar] = useState(false);
  const [mistakeScenario, setMistakeScenario] = useState<{ title: string; question: string; options: string[]; correct: number; tip: string } | null>(null);
  const [pipetteSelectionFeedback, setPipetteSelectionFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [contextualQuizAnswer, setContextualQuizAnswer] = useState<number | null>(null);
  const [currentTask, setCurrentTask] = useState<string>('Select the correct pipette for your target volume and attach a tip.');
  const [tutorialScenario, setTutorialScenario] = useState<any>(null);
  const [showMascotWelcome, setShowMascotWelcome] = useState(false);
  const [isTutorialMode, setIsTutorialMode] = useState(false);
  const [showTutorialSteps, setShowTutorialSteps] = useState(false);
  const [currentTutorialStep, setCurrentTutorialStep] = useState(0);
  const [tutorialSubStep, setTutorialSubStep] = useState<'click-button' | 'select-pipette'>('click-button');
  // Second tutorial for interaction (starts after "Begin Pipetting")
  const [showInteractionTutorial, setShowInteractionTutorial] = useState(false);
  const [currentInteractionStep, setCurrentInteractionStep] = useState(0);

  // Auto-clear feedback console after 5 seconds
  useEffect(() => {
    if (feedbackConsole) {
      const timer = setTimeout(() => {
        setFeedbackConsole('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [feedbackConsole]);

  const sceneRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    labelRenderer: CSS2DRenderer;
    pipetteGroup: THREE.Group;
    plungerMesh: THREE.Mesh;
    pipetteTipMesh: PipetteTipMesh;
    sourceContainer: Container;
    destContainer: Container;
    wasteBin: THREE.Group;
    tipBoxes: Record<string, THREE.Group>;
    confettiSystem: THREE.Points | null;
    confettiParticles: Array<{ position: THREE.Vector3; velocity: THREE.Vector3 }>;
    gameState: GameState;
    raycaster: THREE.Raycaster;
    mouse: THREE.Vector2;
    intersectPlane: THREE.Plane;
    isPointerDown: boolean;
    liquidAnimation: { mesh: THREE.Mesh; targetScaleY: number; speed: number } | null;
    labels: {
      source: CSS2DObject | null;
      destination: CSS2DObject | null;
      pipette: CSS2DObject | null;
      tipsBox: CSS2DObject | null;
      waste: CSS2DObject | null;
    };
  } | null>(null);

  useEffect(() => {
    if (!labContainerRef.current) return;

    const labContainer = labContainerRef.current;
    let animationId: number;

    // Initialize Three.js scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffffff); // White background

    const width = labContainer.clientWidth;
    const height = labContainer.clientHeight;

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    // Position camera closer and adjust angle to look upwards
    camera.position.set(0, 6, 7); // Moved forward by 3 units (from z=10 to z=7)
    // Look at a point 20 degrees above the previous angle
    // Calculate: distance from camera to lookAt ≈ 7.83, rotate 20° up: y = 2.5 + 7.83 * sin(20°) ≈ 5.2
    camera.lookAt(0, 5.2, 0); // Looking 20 degrees higher (from y=2.5 to y=5.2)

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    labContainer.appendChild(renderer.domElement);

    // Create CSS2DRenderer for 3D labels
    const labelRenderer = new CSS2DRenderer();
    labelRenderer.setSize(width, height);
    labelRenderer.domElement.style.position = 'absolute';
    labelRenderer.domElement.style.top = '0';
    labelRenderer.domElement.style.left = '0';
    labelRenderer.domElement.style.pointerEvents = 'none';
    labContainer.appendChild(labelRenderer.domElement);

    // Lighting
    scene.add(new THREE.AmbientLight(0xffffff, 0.7));
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.9);
    directionalLight.position.set(5, 10, 7.5);
    directionalLight.castShadow = true;
    scene.add(directionalLight);
    
    // Top-down lighting towards the table
    const topLight = new THREE.DirectionalLight(0xffffff, 1.0);
    topLight.position.set(0, 15, 0); // Directly above the table
    topLight.target.position.set(0, 0, 0); // Pointing towards the table center
    topLight.castShadow = true;
    topLight.shadow.mapSize.width = 2048;
    topLight.shadow.mapSize.height = 2048;
    topLight.shadow.camera.near = 0.5;
    topLight.shadow.camera.far = 20;
    topLight.shadow.camera.left = -10;
    topLight.shadow.camera.right = 10;
    topLight.shadow.camera.top = 10;
    topLight.shadow.camera.bottom = -10;
    scene.add(topLight);
    scene.add(topLight.target);

    // Create a simple grey table using Three.js primitives
    const tableTopY = 3.7; // Table top surface height
    
    // Store references to objects that need to be repositioned after table loads
    const objectsToReposition: Array<{ obj: THREE.Object3D; originalY: number }> = [];
    
    // Create intersect plane
    const intersectPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -tableTopY);
    
    // Create table group
    const labTable = new THREE.Group();
    
    // Table top - large flat surface
    const tableTopGeo = new THREE.BoxGeometry(15, 0.2, 8);
    const tableTopMat = new THREE.MeshStandardMaterial({ 
      color: 0x808080, // Grey color
      roughness: 0.6, 
      metalness: 0.1 
    });
    const tableTop = new THREE.Mesh(tableTopGeo, tableTopMat);
    tableTop.position.y = tableTopY;
    tableTop.castShadow = true;
    tableTop.receiveShadow = true;
    labTable.add(tableTop);
    
    // Table legs - 4 legs at the corners
    const legGeo = new THREE.BoxGeometry(0.3, 3.5, 0.3);
    const legMat = new THREE.MeshStandardMaterial({ 
      color: 0x666666, // Darker grey for legs
      roughness: 0.5, 
      metalness: 0.1 
    });
    
    const legPositions = [
      { x: -7, z: -3.5 },
      { x: 7, z: -3.5 },
      { x: -7, z: 3.5 },
      { x: 7, z: 3.5 },
    ];
    
    legPositions.forEach((pos) => {
      const leg = new THREE.Mesh(legGeo, legMat);
      leg.position.set(pos.x, tableTopY - 1.85, pos.z); // Position legs below table top
      leg.castShadow = true;
      leg.receiveShadow = true;
      labTable.add(leg);
    });
    
    // Add table to scene immediately
    scene.add(labTable);
    
    // Reposition all objects that should be on top of the table
    objectsToReposition.forEach(({ obj, originalY }) => {
      // Position objects directly on the table surface
      if (obj !== wasteBin) {
        obj.position.y = tableTopY;
      } else {
        // For waste bin, update its position if it has already loaded
        if (obj.position.z !== undefined) {
          // Keep the z position but ensure y is correct
        }
      }
    });

    // Helper function to load beaker GLB and create container
    const createBeakerContainer = async (
      x: number, 
      z: number, 
      initialLiquidRatio: number, 
      color: number
    ): Promise<Container> => {
      return new Promise((resolve) => {
        const group = new THREE.Group();
        const adjustedX = x * 0.4;
        const adjustedZ = z + 1 - 0.5; // Move back 2.5 units (subtract from z)
        const initialY = tableTopY;
        group.position.set(adjustedX, initialY, adjustedZ);
        objectsToReposition.push({ obj: group, originalY: initialY });

        const beakerLoader = new GLTFLoader();
        beakerLoader.load(
          '/beaker.glb',
          (gltf) => {
            const beakerModel = gltf.scene.clone();
            
            // Calculate bounding box to scale appropriately
            const box = new THREE.Box3().setFromObject(beakerModel);
            const size = box.getSize(new THREE.Vector3());
            const maxDim = Math.max(size.x, size.y, size.z);
            const targetSize = 1.0; // Target size for beaker (doubled from 0.5)
            const scale = targetSize / maxDim;
            beakerModel.scale.set(scale, scale, scale);
            
            // Enable shadows
            beakerModel.traverse((child) => {
              if (child instanceof THREE.Mesh) {
                child.castShadow = true;
                child.receiveShadow = true;
              }
            });
            
            group.add(beakerModel);
            
            // Create liquid inside beaker
            const liquidHeight = size.y * scale * initialLiquidRatio;
            const liquidRadius = (size.x * scale) / 2 * 0.8; // 80% of beaker radius
            const liquidGeo = new THREE.CylinderGeometry(liquidRadius, liquidRadius, liquidHeight, 32);
            const liquidMat = new THREE.MeshStandardMaterial({ color: color, roughness: 0.2, transparent: true, opacity: 0.8 });
            const liquidMesh = new THREE.Mesh(liquidGeo, liquidMat);
            liquidMesh.position.y = liquidHeight / 2;
            group.add(liquidMesh);
            
            const totalVolume = Math.PI * Math.pow(liquidRadius, 2) * liquidHeight;
            const currentVolume = totalVolume * initialLiquidRatio;
            
            resolve({
              group,
              liquidMesh,
              initialLiquidRatio,
              height: size.y * scale,
              totalVolume: totalVolume,
              currentColor: new THREE.Color(color),
              currentVolume: currentVolume,
            });
          },
          undefined,
          (error) => {
            console.error('Error loading beaker:', error);
            // Fallback to simple geometry
            const fallbackGeo = new THREE.CylinderGeometry(0.5, 0.5, 1, 32);
            const fallbackMat = new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.3 });
            const fallbackMesh = new THREE.Mesh(fallbackGeo, fallbackMat);
            group.add(fallbackMesh);
            
            const liquidGeo = new THREE.CylinderGeometry(0.4, 0.4, 1 * initialLiquidRatio, 32);
            const liquidMat = new THREE.MeshStandardMaterial({ color: color, roughness: 0.2 });
            const liquidMesh = new THREE.Mesh(liquidGeo, liquidMat);
            liquidMesh.position.y = (1 * initialLiquidRatio) / 2;
            group.add(liquidMesh);
            
            // Text labels removed
            
            resolve({
              group,
              liquidMesh,
              initialLiquidRatio,
              height: 1,
              totalVolume: Math.PI * 0.4 * 0.4 * 1,
              currentColor: new THREE.Color(color),
              currentVolume: Math.PI * 0.4 * 0.4 * 1 * initialLiquidRatio,
            });
          }
        );
      });
    };

    // Create placeholder containers (will be replaced when GLB models load)
    const placeholderGroup = new THREE.Group();
    const placeholderLiquid = new THREE.Mesh(
      new THREE.CylinderGeometry(0.1, 0.1, 0.1, 8),
      new THREE.MeshStandardMaterial({ color: 0x000000 })
    );
    placeholderGroup.add(placeholderLiquid);
    placeholderGroup.visible = false;
    
    const placeholderContainer: Container = {
      group: placeholderGroup,
      liquidMesh: placeholderLiquid,
      initialLiquidRatio: 0,
      height: 1,
      totalVolume: 1,
      currentColor: new THREE.Color(0x000000),
      currentVolume: 0,
    };
    
    // Load beakers (labels will be added in the section below)
    let destContainer: Container = placeholderContainer;
    let sourceContainer: Container = placeholderContainer;

    // Create tip boxes
    const tipBoxes: Record<string, THREE.Group> = {};
    const createTipBox = (color: number) => {
      const tipBoxGroup = new THREE.Group();
      const boxBaseMat = new THREE.MeshStandardMaterial({ color: 0x374151 });
      const boxLidMat = new THREE.MeshStandardMaterial({ color: 0x4b5563, transparent: true, opacity: 0.8 });

      const baseGeo = new THREE.BoxGeometry(2, 1, 1.5);
      const baseMesh = new THREE.Mesh(baseGeo, boxBaseMat);
      baseMesh.position.y = 0.5;

      const lidGeo = new THREE.BoxGeometry(2.1, 0.2, 1.6);
      const lidMesh = new THREE.Mesh(lidGeo, boxLidMat);
      lidMesh.position.set(0, 1.1, 0.75);
      lidMesh.rotation.x = -Math.PI / 1.5;

      const tipMat = new THREE.MeshStandardMaterial({ color: color });
      const tipGeo = new THREE.ConeGeometry(0.05, 0.5, 8);
      for (let i = -0.4; i <= 0.4; i += 0.2) {
        for (let j = -0.6; j <= 0.6; j += 0.3) {
          const tipMesh = new THREE.Mesh(tipGeo, tipMat);
          tipMesh.position.set(i, 1, j);
          baseMesh.add(tipMesh);
        }
      }
      tipBoxGroup.add(baseMesh, lidMesh);
      // Scale to quarter size (half of current half size)
      tipBoxGroup.scale.set(0.25, 0.25, 0.25);
      // Position on table, centered and visible
      const initialY = tableTopY; // Start at table top, will be adjusted after table loads
      const adjustedZ = 1; // Keep it visible on the table
      tipBoxGroup.position.set(0, initialY, adjustedZ);
      objectsToReposition.push({ obj: tipBoxGroup, originalY: initialY });
      return tipBoxGroup;
    };

    pipettes.forEach((pipette) => {
      const tipBoxGroup = createTipBox(pipette.color);
      tipBoxGroup.visible = false;
      tipBoxes[pipette.id] = tipBoxGroup;
      scene.add(tipBoxGroup);
    });

    // Create waste bin as a red box - position it in the middle but backwards
    const binGroup = new THREE.Group();
    const initialY = tableTopY;
    // Position in the middle (x = 0) and move back (increase z)
    // Beakers are at z = 0 + 1 - 0.5 = 0.5, so move dustbin back by adding to z
    const adjustedX = 0; // Middle
    const adjustedZ = 0.5 + 2.5; // Move back 2.5 units from beakers (z = 3.0)
    
    // Create red box for waste bin
    const binGeo = new THREE.BoxGeometry(1.0, 1.2, 1.0);
    const binMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.6 });
    const binMesh = new THREE.Mesh(binGeo, binMat);
    binMesh.position.y = 0.6; // Half height above table
    binMesh.castShadow = true;
    binMesh.receiveShadow = true;
    binGroup.add(binMesh);
    
    binGroup.position.set(adjustedX, initialY, adjustedZ);
    objectsToReposition.push({ obj: binGroup, originalY: initialY });
    
    const wasteBin = binGroup;
    scene.add(wasteBin);

    // Create pipette
    const pipetteGroup = new THREE.Group();
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0xd1d5db, roughness: 0.3 });
    const plungerMat = new THREE.MeshStandardMaterial({ color: 0xe47cb8, roughness: 0.3 });
    const tipEjectorMat = new THREE.MeshStandardMaterial({ color: 0x6b7280, roughness: 0.4 });

    const mainBodyShape = new THREE.Shape();
    mainBodyShape.moveTo(0, 0);
    mainBodyShape.lineTo(0.25, 0);
    mainBodyShape.lineTo(0.25, 1.8);
    mainBodyShape.lineTo(0.4, 2.3);
    mainBodyShape.lineTo(0.4, 2.5);
    mainBodyShape.lineTo(0, 2.5);

    const bodyGeo = new THREE.LatheGeometry(mainBodyShape.getPoints(), 16);
    const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
    bodyMesh.position.y = -1.2;

    const plungerGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.4, 16);
    const plungerMesh = new THREE.Mesh(plungerGeo, plungerMat);
    plungerMesh.position.y = 1.5;

    const ejectorGeo = new THREE.BoxGeometry(0.2, 0.6, 0.7);
    const ejectorMesh = new THREE.Mesh(ejectorGeo, tipEjectorMat);
    ejectorMesh.position.set(0.2, 0.5, 0);

    const shaftGeo = new THREE.CylinderGeometry(0.1, 0.05, 1.5, 16);
    const shaftMesh = new THREE.Mesh(shaftGeo, bodyMat);
    shaftMesh.position.y = -2.0;
    shaftMesh.name = 'pipetteShaft';

    const tipShellGeo = new THREE.ConeGeometry(0.06, 0.9, 8, 1, true);
    const tipShellMat = new THREE.MeshStandardMaterial({
      color: 0xfde047,
      transparent: true,
      opacity: 0.6,
      side: THREE.DoubleSide,
    });
    const pipetteTipMesh = new THREE.Mesh(tipShellGeo, tipShellMat);
    pipetteTipMesh.position.y = -2.8;
    pipetteTipMesh.rotation.x = Math.PI;
    pipetteTipMesh.visible = false;

    const tipLiquidGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.8, 8);
    const tipLiquidMat = new THREE.MeshStandardMaterial({ color: 0x60a5fa, roughness: 0.2 });
    const tipLiquid = new THREE.Mesh(tipLiquidGeo, tipLiquidMat);
    tipLiquid.position.y = 0;
    tipLiquid.scale.y = 0;
    pipetteTipMesh.add(tipLiquid);
    (pipetteTipMesh as unknown as PipetteTipMesh).tipLiquid = tipLiquid;

    pipetteGroup.add(bodyMesh, plungerMesh, ejectorMesh, shaftMesh, pipetteTipMesh);
    pipetteGroup.scale.set(0.9, 0.9, 0.9);
    pipetteGroup.position.y = 3;
    // Set initial rotation to 75 degrees (so users can see it's wrong - should be 90 degrees)
    pipetteGroup.rotation.z = (75 * Math.PI) / 180;
    pipetteGroup.castShadow = true;
    scene.add(pipetteGroup);

    // Create confetti system
    const particleCount = 1000;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const palette = [
      new THREE.Color(0xd8f878),
      new THREE.Color(0xe47cb8),
      new THREE.Color(0x9448b0),
      new THREE.Color(0x3b82f6),
    ];

    const confettiParticles: Array<{ position: THREE.Vector3; velocity: THREE.Vector3 }> = [];
    for (let i = 0; i < particleCount; i++) {
      const particle = {
        position: new THREE.Vector3(
          (Math.random() - 0.5) * 30,
          Math.random() * 20,
          (Math.random() - 0.5) * 20
        ),
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 0.1,
          Math.random() * 0.1 + 0.1,
          (Math.random() - 0.5) * 0.1
        ),
      };
      confettiParticles.push(particle);
      particle.position.toArray(positions, i * 3);
      const color = palette[Math.floor(Math.random() * palette.length)];
      color.toArray(colors, i * 3);
    }
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    const confettiMaterial = new THREE.PointsMaterial({
      size: 0.2,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
    });
    const confettiSystem = new THREE.Points(geometry, confettiMaterial);
    confettiSystem.visible = false;
    scene.add(confettiSystem);

    // Game state
    const gameState: GameState = {
      selectedPipette: null,
      targetVolume: 150,
      liquidInPipette: 0,
      dispensedStop1: false,
      plungerState: 'rest',
      pipetteY: 3,
      hasTip: false,
    };

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    const isPointerDown = false;
    const liquidAnimation: { mesh: THREE.Mesh; targetScaleY: number; speed: number } | null = null;

    // Helper function to create 3D labels
    const createLabel = (text: string): CSS2DObject => {
      const labelDiv = document.createElement('div');
      labelDiv.className = 'label';
      labelDiv.textContent = text;
      labelDiv.style.color = '#001c3d';
      labelDiv.style.fontSize = '20px';
      labelDiv.style.fontWeight = 'bold';
      labelDiv.style.padding = '4px 8px';
      labelDiv.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
      labelDiv.style.border = '2px solid #001c3d';
      labelDiv.style.borderRadius = '4px';
      labelDiv.style.pointerEvents = 'none';
      labelDiv.style.userSelect = 'none';
      return new CSS2DObject(labelDiv);
    };

    // Create labels for each object
    const sourceLabel = createLabel('Source');
    const destLabel = createLabel('Destination');
    const pipetteLabel = createLabel('Pipette');
    const tipsBoxLabel = createLabel('Tips Box');
    const wasteLabel = createLabel('Waste');

    // Position labels above their objects
    // Labels will be positioned after containers are loaded
    const labels = {
      source: sourceLabel,
      destination: destLabel,
      pipette: pipetteLabel,
      tipsBox: tipsBoxLabel,
      waste: wasteLabel,
    };

    // Add labels to scene (will be positioned dynamically)
    pipetteGroup.add(pipetteLabel);
    pipetteLabel.position.set(0, 1, 0);
    wasteBin.add(wasteLabel);
    wasteLabel.position.set(0, 0.8, 0);

    // Position tip box label (will be updated when tip box is visible)
    const activeTipBox = tipBoxes[gameState.selectedPipette?.id || 'p200'];
    if (activeTipBox) {
      activeTipBox.add(tipsBoxLabel);
      tipsBoxLabel.position.set(0, 0.8, 0);
    }

    // Position source and destination labels after containers load
    createBeakerContainer(-4, 0, 0.2, 0x60a5fa).then((container) => {
      destContainer = container;
      scene.add(container.group);
      container.group.add(destLabel);
      destLabel.position.set(0, 1.2, 0);
      // Update sceneRef when container is loaded
      if (sceneRef.current) {
        sceneRef.current.destContainer = container;
      }
    });
    
    createBeakerContainer(4, 0, 0.9, 0x001c3d).then((container) => {
      sourceContainer = container;
      scene.add(container.group);
      container.group.add(sourceLabel);
      sourceLabel.position.set(0, 1.2, 0);
      // Update sceneRef when container is loaded
      if (sceneRef.current) {
        sceneRef.current.sourceContainer = container;
      }
    });

    // Store refs for use in handlers
    // Note: sourceContainer and destContainer will be updated when GLB models load
    sceneRef.current = {
      scene,
      camera,
      renderer,
      labelRenderer,
      pipetteGroup,
      plungerMesh,
      pipetteTipMesh: pipetteTipMesh as unknown as PipetteTipMesh,
      sourceContainer,
      destContainer,
      wasteBin,
      tipBoxes,
      confettiSystem,
      confettiParticles,
      gameState,
      raycaster,
      mouse,
      intersectPlane,
      isPointerDown,
      liquidAnimation,
      labels,
    };

    // Animation loop
    const animate = () => {
      animationId = requestAnimationFrame(animate);

      if (!sceneRef.current) return;

      const { plungerMesh, gameState, pipetteGroup, pipetteTipMesh, confettiSystem, confettiParticles, liquidAnimation: anim } = sceneRef.current;

      // Update plunger position
      let plungerTargetY = 1.5;
      if (gameState.plungerState === 'stop1') plungerTargetY = 1.3;
      else if (gameState.plungerState === 'stop2') plungerTargetY = 1.1;
      if (plungerMesh) {
        plungerMesh.position.y += (plungerTargetY - plungerMesh.position.y) * 0.2;
      }

      // Update liquid animation
      if (anim) {
        const { mesh, targetScaleY, speed } = anim;
        mesh.scale.y += (targetScaleY - mesh.scale.y) * speed;
        const geom = mesh.geometry as THREE.CylinderGeometry;
        const height = (geom.parameters?.height || 1) as number;
        const newHeight = height * mesh.scale.y;
        mesh.position.y = mesh.parent === pipetteTipMesh || mesh === pipetteTipMesh.tipLiquid ? 0 : newHeight / 2 + 0.05;
        if (Math.abs(mesh.scale.y - targetScaleY) < 0.001) {
          mesh.scale.y = targetScaleY;
          const finalHeight = height * mesh.scale.y;
          mesh.position.y = mesh.parent === pipetteTipMesh ? 0 : finalHeight / 2 + 0.05;
          sceneRef.current.liquidAnimation = null;
        }
      }

      // Update confetti
      if (confettiSystem && confettiSystem.visible) {
        const positions = confettiSystem.geometry.attributes.position.array as Float32Array;
        confettiParticles.forEach((p, i) => {
          p.velocity.y -= 0.003;
          p.position.add(p.velocity);
          if (p.position.y < -1) {
            p.position.y = 15;
          }
          p.position.toArray(positions, i * 3);
        });
        confettiSystem.geometry.attributes.position.needsUpdate = true;
      }

      // Update real-time feedback will be handled by checkInteraction outside
      renderer.render(scene, camera);
      // Render labels
      if (sceneRef.current?.labelRenderer) {
        sceneRef.current.labelRenderer.render(scene, camera);
      }
    };

    animate();

    // Handle window resize
    const handleResize = () => {
      if (!labContainer) return;
      const width = labContainer.clientWidth;
      const height = labContainer.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationId);
      
      // Dispose of Three.js resources
      if (sceneRef.current) {
        const { scene, renderer } = sceneRef.current;
        
        // Dispose of geometries, materials, and textures
        scene.traverse((object) => {
          if (object instanceof THREE.Mesh) {
            if (object.geometry) object.geometry.dispose();
            if (object.material) {
              if (Array.isArray(object.material)) {
                object.material.forEach((mat) => {
                  if (mat.map) mat.map.dispose();
                  mat.dispose();
                });
              } else {
                if (object.material.map) object.material.map.dispose();
                object.material.dispose();
              }
            }
          }
        });
        
        // Remove renderer from DOM
        if (labContainer && renderer.domElement.parentNode) {
          renderer.domElement.parentNode.removeChild(renderer.domElement);
        }
        
        // Dispose renderer
        renderer.dispose();
        
        // Clear scene reference
        sceneRef.current = null;
      }
    };
  }, []);

  // Helper functions
  const getPipetteTipPosition = (): THREE.Vector3 => {
    if (!sceneRef.current) return new THREE.Vector3();
    const { pipetteTipMesh } = sceneRef.current;
    const tipWorldPos = new THREE.Vector3();
    pipetteTipMesh.getWorldPosition(tipWorldPos);
    const tipGeom = pipetteTipMesh.geometry as THREE.ConeGeometry;
    const tipHeight = (tipGeom.parameters?.height || 0.9) as number;
    tipWorldPos.y -= tipHeight / 2;
    return tipWorldPos;
  };

  const isInLiquid = (container: Container): boolean => {
    if (!sceneRef.current || !sceneRef.current.gameState.hasTip) return false;
    const tipPos = getPipetteTipPosition();
    const containerBox = new THREE.Box3().setFromObject(container.liquidMesh);
    return containerBox.containsPoint(tipPos);
  };

  const checkImmersionDepth = (container: Container): string => {
    if (!sceneRef.current) return '--';
    const tipPos = getPipetteTipPosition();
    const liquidWorldPos = new THREE.Vector3();
    container.liquidMesh.getWorldPosition(liquidWorldPos);
    const liquidGeom = container.liquidMesh.geometry as THREE.CylinderGeometry;
    const liquidHeight = (liquidGeom.parameters?.height || 1) as number;
    const liquidSurfaceY = liquidWorldPos.y + (container.liquidMesh.scale.y * liquidHeight) / 2;
    const depth = liquidSurfaceY - tipPos.y;
    if (depth < 0.05) return 'Not in liquid';
    if (depth < 0.2) return 'Too Shallow';
    if (depth > 0.6) return 'Too Deep';
    return 'Good';
  };

  const checkInteraction = useCallback(() => {
    if (!sceneRef.current) return;
    const { pipetteGroup, sourceContainer, destContainer } = sceneRef.current;

    // Check angle
    const localUp = new THREE.Vector3(0, 1, 0);
    const worldUp = localUp.clone().applyQuaternion(pipetteGroup.quaternion);
    const globalUp = new THREE.Vector3(0, 1, 0);
    const angleDeg = THREE.MathUtils.radToDeg(worldUp.angleTo(globalUp));
    setFeedbackStates((prev) => ({
      ...prev,
      angle: {
        value: `${angleDeg.toFixed(0)}°`,
        status: angleDeg < 20 ? 'correct' : 'incorrect',
      },
    }));

    // Check depth
    const inSource = isInLiquid(sourceContainer);
    const inDest = isInLiquid(destContainer);
    let depthStatus = '--';
    let depthOk: 'correct' | 'incorrect' | 'neutral' = 'neutral';
    if (inSource || inDest) {
      depthStatus = checkImmersionDepth(inSource ? sourceContainer : destContainer);
      depthOk = depthStatus === 'Good' ? 'correct' : 'incorrect';
    }
    setFeedbackStates((prev) => ({
      ...prev,
      depth: { value: depthStatus, status: depthOk },
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Real-time feedback check
  useEffect(() => {
    if (!sceneRef.current) return;

    const interval = setInterval(() => {
      checkInteraction();
    }, 100); // Update every 100ms

    return () => clearInterval(interval);
  }, [checkInteraction]);

  const showFeedback = (title: string, message: string, type: 'correct' | 'error' | 'neutral' = 'neutral', showTip = false) => {
    setFeedbackTitle(title);
    setFeedbackMessage(message);
    setFeedbackType(type);
    if (showTip && type === 'correct') {
      setProTipText(proTips[Math.floor(Math.random() * proTips.length)]);
      setShowProTip(true);
    } else {
      setShowProTip(false);
    }
    setShowFeedbackModal(true);
  };

  const handleSetVolume = () => {
    const vol = parseFloat((document.getElementById('target-volume-input') as HTMLInputElement)?.value || '150');
    if (isNaN(vol) || vol < 0.2 || vol > 1000) {
      showFeedback('Invalid Volume', 'Please enter a volume between 0.2 and 1000 µL.', 'error');
      return;
    }
    if (sceneRef.current) {
      sceneRef.current.gameState.targetVolume = vol;
    }
    const bestPipette = pipettes.find((p) => vol <= p.max && vol >= p.min);
    if (!bestPipette) {
      showFeedback('No Suitable Pipette', `No single pipette is suitable for ${vol} µL.`, 'error');
      return;
    }
    showFeedback('Volume Set', `Target volume is ${vol} µL. The best pipette is ${bestPipette.name}.`, 'correct');
  };

  const selectPipette = (pipette: Pipette) => {
    if (!sceneRef.current) return;
    const { gameState, plungerMesh, tipBoxes, pipetteTipMesh } = sceneRef.current;

    if (gameState.targetVolume > pipette.max || gameState.targetVolume < pipette.min) {
      setPipetteSelectionFeedback('wrong');
      setFeedbackConsole(`❌ Wrong pipette for this volume. Try again!`);
      setTimeout(() => setPipetteSelectionFeedback(null), 2000);
      showFeedback(
        'Incorrect Pipette',
        `This ${pipette.name} pipette has a range of ${pipette.min}-${pipette.max} µL. It's not suitable for ${gameState.targetVolume} µL.`,
        'error'
      );
      return;
    }

    gameState.selectedPipette = pipette;
    setSelectedPipetteId(pipette.id);
    setPipetteSelectionFeedback('correct');
    setFeedbackConsole(`✅ CORRECT: ${pipette.name} selected!`);
    setShowConfetti(true);
    
    // If in tutorial step 2 and waiting for P200 selection, move to next step
    if (showTutorialSteps && currentTutorialStep === 1 && tutorialSubStep === 'select-pipette' && pipette.id === 'p200') {
      setTimeout(() => {
        setCurrentTutorialStep(2);
        setTutorialSubStep('click-button');
      }, 1000);
    }
    
    setTimeout(() => {
      setShowConfetti(false);
      setPipetteSelectionFeedback(null);
    }, 2000);

    if (plungerMesh && pipette.color) {
      const mat = plungerMesh.material as THREE.MeshStandardMaterial;
      if (mat && mat.color) {
        mat.color.set(pipette.color);
      }
    }

    Object.keys(tipBoxes).forEach((key) => {
      tipBoxes[key].visible = key === pipette.id;
    });

    const tipMat = pipetteTipMesh.material as THREE.MeshStandardMaterial;
    if (tipMat && tipMat.color) {
      tipMat.color.set(pipette.color);
    }
  };

  const attachTip = () => {
    if (!sceneRef.current) return;
    const { gameState, tipBoxes, pipetteGroup, pipetteTipMesh } = sceneRef.current;

    if (!gameState.selectedPipette) {
      showFeedback('No Pipette', 'Please select a pipette from the panel first.', 'error');
      return;
    }
    if (gameState.hasTip) {
      showFeedback('Already Have a Tip', 'Please eject the current tip before attaching a new one.', 'error');
      return;
    }

    const currentTipBox = tipBoxes[gameState.selectedPipette.id];
    if (currentTipBox) {
      const tipBox3D = new THREE.Box3().setFromObject(currentTipBox.children[0]);
      const pipetteShaftPos = new THREE.Vector3();
      pipetteGroup.getObjectByName('pipetteShaft')?.getWorldPosition(pipetteShaftPos);

      if (
        pipetteShaftPos.x > tipBox3D.min.x &&
        pipetteShaftPos.x < tipBox3D.max.x &&
        pipetteShaftPos.z > tipBox3D.min.z &&
        pipetteShaftPos.z < tipBox3D.max.z
      ) {
        gameState.hasTip = true;
        pipetteTipMesh.visible = true;
        pipetteGroup.position.y = 2.5;
        showFeedback('Tip Attached!', "You're ready to aspirate liquid.", 'correct');
      } else {
        showFeedback('Incorrect Position', 'Move the pipette over the correct tip box to attach a tip.', 'error');
      }
    }
  };

  const ejectTip = () => {
    if (!sceneRef.current) return;
    const { gameState, wasteBin, pipetteGroup, pipetteTipMesh } = sceneRef.current;

    if (!gameState.hasTip) {
      showFeedback('No Tip', 'There is no tip to eject.', 'error');
      return;
    }

    const binBox = new THREE.Box3().setFromObject(wasteBin);
    const pipettePos = new THREE.Vector3();
    pipetteGroup.getWorldPosition(pipettePos);

    if (
      pipettePos.x > binBox.min.x &&
      pipettePos.x < binBox.max.x &&
      pipettePos.z > binBox.min.z &&
      pipettePos.z < binBox.max.z
    ) {
      gameState.hasTip = false;
      pipetteTipMesh.visible = false;
      gameState.liquidInPipette = 0;
      pipetteTipMesh.tipLiquid.scale.y = 0;
      showFeedback('Tip Ejected', 'The tip has been discarded correctly in the waste bin.', 'correct');
    } else {
      showFeedback('Incorrect Position', 'Move over the red waste bin to eject the tip.', 'error');
    }
  };

  const aspirateLiquid = () => {
    if (!sceneRef.current) return;
    const { gameState, sourceContainer, pipetteTipMesh } = sceneRef.current;

    const depthStatus = checkImmersionDepth(sourceContainer);
    if (depthStatus === 'Good') {
      gameState.liquidInPipette = gameState.targetVolume;
      gameState.dispensedStop1 = false;
      const tipLiquidMat = pipetteTipMesh.tipLiquid.material as THREE.MeshStandardMaterial;
      if (tipLiquidMat && tipLiquidMat.color) {
        tipLiquidMat.color.set(sourceContainer.currentColor);
      }
      animateLiquidTransfer(sourceContainer.liquidMesh, 'out');
      animateLiquidTransfer(pipetteTipMesh.tipLiquid, 'in');
      setFeedbackConsole(`✅ Correct angle maintained. ${gameState.targetVolume} µL aspirated successfully!`);
      showFeedback('Success!', `${gameState.targetVolume} µL aspirated.`, 'correct', true);
      
      // Trigger contextual quiz after successful aspiration
      setTimeout(() => {
        const contextualQuestions = [
          {
            question: 'Why is maintaining the correct angle important while pipetting?',
            options: [
              'It looks more professional',
              'It ensures accurate volume measurement and prevents liquid from clinging to the tip',
              'It makes pipetting faster',
              'It prevents the pipette from breaking'
            ],
            correct: 1,
            explanation: 'Correct! Maintaining a vertical angle ensures accurate volume measurement and prevents liquid from clinging to the outside of the tip.'
          }
        ];
        const q = contextualQuestions[Math.floor(Math.random() * contextualQuestions.length)];
        setContextualQuizQuestion(q);
        setContextualQuizAnswer(null);
        setShowContextualQuiz(true);
      }, 1500);
    } else {
      gameState.liquidInPipette = gameState.targetVolume * 0.9;
      gameState.dispensedStop1 = false;
      const tipLiquidMat = pipetteTipMesh.tipLiquid.material as THREE.MeshStandardMaterial;
      if (tipLiquidMat && tipLiquidMat.color) {
        tipLiquidMat.color.set(sourceContainer.currentColor);
      }
      animateLiquidTransfer(sourceContainer.liquidMesh, 'out', 0.9);
      animateLiquidTransfer(pipetteTipMesh.tipLiquid, 'in', 0.9);
      setFeedbackConsole(`⚠️ Too deep — reduce immersion depth. Only ${gameState.liquidInPipette.toFixed(1)} µL aspirated.`);
      
      // Trigger mistake scenario
      setTimeout(() => {
        setMistakeScenario({
          title: 'Oops! You introduced air bubbles.',
          question: 'What should you do?',
          options: [
            'Continue with the current sample',
            'Re-aspirate slowly to avoid air bubbles',
            'Discard everything and start over',
            'Use a different pipette'
          ],
          correct: 1,
          tip: 'Pro Tip: When immersion depth is incorrect, re-aspirate slowly to avoid introducing air bubbles into your sample.'
        });
        setShowMistakeSidebar(true);
      }, 1000);
      
      showFeedback(
        'Aspiration Error',
        `Immersion depth is ${depthStatus}. This resulted in aspirating only ${gameState.liquidInPipette.toFixed(1)} µL.`,
        'error'
      );
    }
  };

  const dispenseLiquid = (stop: 'stop1' | 'stop2') => {
    if (!sceneRef.current) return;
    const { gameState, destContainer, pipetteTipMesh, sourceContainer } = sceneRef.current;

    let dispenseAmount = 0;
    if (stop === 'stop1') {
      dispenseAmount = gameState.liquidInPipette * 0.98;
      gameState.liquidInPipette -= dispenseAmount;
      gameState.dispensedStop1 = true;
      animateLiquidTransfer(pipetteTipMesh.tipLiquid, 'out', 0.98);
      showFeedback('Dispensed', 'Main volume dispensed. Use blow-out for the rest.', 'correct', true);
    } else if (stop === 'stop2') {
      dispenseAmount = gameState.liquidInPipette;
      gameState.liquidInPipette = 0;
      gameState.dispensedStop1 = false;
      animateLiquidTransfer(pipetteTipMesh.tipLiquid, 'out', 1);
      showFeedback('Blow-out Complete', 'All liquid dispensed.', 'correct', true);
      triggerConfetti();
    }

    if (dispenseAmount > 0) {
      const sourceColor = sourceContainer.currentColor;
      const destColor = destContainer.currentColor;
      const mixFactor = Math.min(dispenseAmount / (destContainer.currentVolume + dispenseAmount), 0.1);
      const newColor = destColor.clone().lerp(sourceColor, mixFactor);
      destContainer.currentColor.copy(newColor);
      const destLiquidMat = destContainer.liquidMesh.material as THREE.MeshStandardMaterial;
      if (destLiquidMat && destLiquidMat.color) {
        destLiquidMat.color.copy(newColor);
      }
      destContainer.currentVolume += dispenseAmount;
    }
  };

  const animateLiquidTransfer = (mesh: THREE.Mesh, direction: 'in' | 'out', ratio = 1) => {
    if (!sceneRef.current) return;
    const { pipetteTipMesh, gameState, sourceContainer } = sceneRef.current;

    const startScaleY = mesh.scale.y;
    let targetScaleY;
    if (direction === 'in') {
      targetScaleY = 1;
    } else {
      targetScaleY =
        mesh.parent === pipetteTipMesh || mesh === pipetteTipMesh.tipLiquid
          ? startScaleY * (1 - ratio)
          : startScaleY - (ratio * gameState.targetVolume) / sourceContainer.totalVolume;
    }
    targetScaleY = Math.max(0, targetScaleY);
    sceneRef.current.liquidAnimation = { mesh, targetScaleY, speed: 0.05 };
  };

  const triggerConfetti = () => {
    if (!sceneRef.current) return;
    const { confettiSystem, confettiParticles } = sceneRef.current;

    confettiParticles.forEach((p) => {
      p.position.set((Math.random() - 0.5) * 30, 15 + Math.random() * 5, (Math.random() - 0.5) * 20);
      p.velocity.set((Math.random() - 0.5) * 0.1, (Math.random() - 0.5) * 0.05, (Math.random() - 0.5) * 0.1);
    });
    if (confettiSystem) {
      confettiSystem.visible = true;
      setTimeout(() => {
        if (confettiSystem) confettiSystem.visible = false;
      }, 4000);
    }
  };

  const handlePlunger1Click = () => {
    if (!sceneRef.current) return;
    const { gameState, sourceContainer, destContainer } = sceneRef.current;

    if (!gameState.selectedPipette) {
      showFeedback('No Pipette', 'Please select a pipette from the panel first.', 'error');
      return;
    }
    if (!gameState.hasTip) {
      showFeedback('No Tip!', 'You must attach a tip from the tip box first.', 'error');
      return;
    }
    if (gameState.liquidInPipette === 0) {
      if (isInLiquid(sourceContainer)) {
        aspirateLiquid();
      } else {
        showFeedback('Incorrect Position', 'Move the pipette tip into the source liquid (dark blue) to aspirate.', 'error');
      }
    } else {
      if (isInLiquid(destContainer)) {
        dispenseLiquid('stop1');
      } else {
        showFeedback('Incorrect Position', 'Move the pipette tip into the destination liquid (light blue) to dispense.', 'error');
      }
    }
  };

  const handlePlunger2Click = () => {
    if (!sceneRef.current) return;
    const { gameState, destContainer } = sceneRef.current;

    if (!gameState.hasTip) {
      showFeedback('No Tip!', 'You must attach a tip from the tip box first.', 'error');
      return;
    }
    if (gameState.liquidInPipette > 0 && gameState.dispensedStop1) {
      if (isInLiquid(destContainer)) {
        dispenseLiquid('stop2');
      } else {
        showFeedback('Incorrect Position', 'Move the pipette tip into the destination liquid for blow-out.', 'error');
      }
    } else if (gameState.liquidInPipette === 0) {
      showFeedback('Pipette Empty', 'Nothing to blow-out.', 'error');
    } else if (!gameState.dispensedStop1) {
      showFeedback('Incorrect Order', 'You must dispense with the first stop before blowing out.', 'error');
    }
  };

  const movePipetteVertical = (deltaY: number) => {
    if (!sceneRef.current) return;
    const { gameState, pipetteGroup } = sceneRef.current;
    // Increased sensitivity for faster movement
    const stepSize = 0.3;
    gameState.pipetteY += deltaY * stepSize;
    gameState.pipetteY = Math.max(1.5, Math.min(5, gameState.pipetteY));
    pipetteGroup.position.y = gameState.pipetteY;
    
    // Update slider value if it exists
    const slider = document.getElementById('heightSlider') as HTMLInputElement;
    if (slider) {
      slider.value = gameState.pipetteY.toString();
    }
  };

  const movePipetteHorizontal = (deltaX: number, deltaZ: number) => {
    if (!sceneRef.current) return;
    const { pipetteGroup } = sceneRef.current;
    // Only move X and Z, keep Y position unchanged
    pipetteGroup.position.x += deltaX;
    pipetteGroup.position.z += deltaZ;
    // Ensure scale remains constant (no scaling based on position)
    if (pipetteGroup.scale.x !== 0.9 || pipetteGroup.scale.y !== 0.9 || pipetteGroup.scale.z !== 0.9) {
      pipetteGroup.scale.set(0.9, 0.9, 0.9);
    }
  };

  const tiltPipette = (angleDelta: number) => {
    if (!sceneRef.current) return;
    sceneRef.current.pipetteGroup.rotation.z += angleDelta;
  };

  // Keyboard controls - placed after function definitions
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent default behavior for arrow keys
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
      }

      switch (e.key) {
        case 'ArrowUp':
          movePipetteHorizontal(0, -0.2);
          break;
        case 'ArrowDown':
          movePipetteHorizontal(0, 0.2);
          break;
        case 'ArrowLeft':
          movePipetteHorizontal(-0.2, 0);
          break;
        case 'ArrowRight':
          movePipetteHorizontal(0.2, 0);
          break;
        case 'w':
        case 'W':
          movePipetteVertical(0.5); // Increased sensitivity
          break;
        case 's':
        case 'S':
          movePipetteVertical(-0.5); // Increased sensitivity
          break;
        case 'p':
        case 'P':
          handlePlunger1Click();
          break;
        case 'b':
        case 'B':
          handlePlunger2Click();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [movePipetteHorizontal, movePipetteVertical, handlePlunger1Click, handlePlunger2Click]);

  // Pointer event handlers
  useEffect(() => {
    if (!labContainerRef.current || !sceneRef.current) return;

    const labContainer = labContainerRef.current;
    const { renderer, camera, pipetteGroup, raycaster, mouse, intersectPlane } = sceneRef.current;

    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as HTMLElement;
      if (target.closest('#pipetteActionControls, #onScreenControls')) return;
      sceneRef.current!.isPointerDown = true;
    };

    const onPointerMove = (event: MouseEvent | TouchEvent) => {
      if (!sceneRef.current?.isPointerDown) return;

      if (event.type === 'touchmove') {
        (event as TouchEvent).preventDefault();
      }

      const clientX = (event as TouchEvent).touches
        ? (event as TouchEvent).touches[0].clientX
        : (event as MouseEvent).clientX;
      const clientY = (event as TouchEvent).touches
        ? (event as TouchEvent).touches[0].clientY
        : (event as MouseEvent).clientY;

      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersectPoint = new THREE.Vector3();
      raycaster.ray.intersectPlane(intersectPlane, intersectPoint);
      // Only update X and Z positions, preserve Y position
      const currentY = pipetteGroup.position.y;
      pipetteGroup.position.x = intersectPoint.x;
      pipetteGroup.position.z = intersectPoint.z;
      pipetteGroup.position.y = currentY; // Keep Y unchanged
      // Ensure scale remains constant
      if (pipetteGroup.scale.x !== 0.9 || pipetteGroup.scale.y !== 0.9 || pipetteGroup.scale.z !== 0.9) {
        pipetteGroup.scale.set(0.9, 0.9, 0.9);
      }
    };

    const onPointerUp = () => {
      if (sceneRef.current) {
        sceneRef.current.isPointerDown = false;
      }
    };

    labContainer.addEventListener('mousedown', onPointerDown);
    labContainer.addEventListener('mousemove', onPointerMove);
    window.addEventListener('mouseup', onPointerUp);
    labContainer.addEventListener('touchstart', onPointerDown, { passive: false });
    labContainer.addEventListener('touchmove', onPointerMove, { passive: false });
    window.addEventListener('touchend', onPointerUp);

    return () => {
      labContainer.removeEventListener('mousedown', onPointerDown);
      labContainer.removeEventListener('mousemove', onPointerMove);
      window.removeEventListener('mouseup', onPointerUp);
      labContainer.removeEventListener('touchstart', onPointerDown);
      labContainer.removeEventListener('touchmove', onPointerMove);
      window.removeEventListener('touchend', onPointerUp);
    };
  }, []);

  // Quiz functions
  const startQuiz = (questions: typeof quizQuestions = [...quizQuestions].sort(() => Math.random() - 0.5)) => {
    setQuizData({
      currentQuestionIndex: 0,
      score: 0,
      incorrectQuestions: [],
      questions,
    });
    setQuizFeedback({ show: false, isCorrect: false, explanation: '' });
    setSelectedMeme(null); // Reset meme selection for new quiz
    setShowQuizModal(true);
  };

  const handleQuizAnswer = (selectedIndex: number) => {
    const { questions, currentQuestionIndex } = quizData;
    const question = questions[currentQuestionIndex];
    const isCorrect = selectedIndex === question.correctAnswerIndex;

    setQuizData((prev) => ({
      ...prev,
      score: isCorrect ? prev.score + 1 : prev.score,
      incorrectQuestions: isCorrect ? prev.incorrectQuestions : [...prev.incorrectQuestions, question],
    }));

    setQuizFeedback({
      show: true,
      isCorrect,
      explanation: question.explanation,
    });
  };

  const nextQuestion = () => {
    setQuizFeedback({ show: false, isCorrect: false, explanation: '' });
    setQuizData((prev) => {
      const { questions, currentQuestionIndex } = prev;
    if (currentQuestionIndex < questions.length - 1) {
        return { ...prev, currentQuestionIndex: prev.currentQuestionIndex + 1 };
    } else {
        // Quiz is complete, calculate results
        const scorePercentage = (prev.score / prev.questions.length) * 100;
        const isGoodScore = scorePercentage >= 70;
        const meme = isGoodScore ? successMeme : failureMeme;
        
        // Set meme immediately to avoid state timing issues
        setSelectedMeme(meme);
        
        // Close quiz modal and show results with delay to prevent glitching
    setShowQuizModal(false);
        setTimeout(() => {
    setShowQuizResults(true);
        }, 300);
        
        return prev; // Return unchanged state since we're done
      }
    });
  };

  const retryIncorrectQuestions = () => {
    setShowQuizResults(false);
    setSelectedMeme(null); // Reset meme selection
    startQuiz(quizData.incorrectQuestions);
  };

  const saveStickyNotes = async (updatedNotes: StickyNote[]) => {
    try {
      setNoteSaving(true);
      await updateUserProfile({ stickyNotes: updatedNotes });
      setStickyNotes(updatedNotes);
      setNoteContent('');
      setNoteError(null);
    } catch (error) {
      console.error('Error saving sticky notes:', error);
      setNoteError('Unable to save note. Please try again.');
    } finally {
      setNoteSaving(false);
    }
  };

  const handleAddStickyNote = async () => {
    const text = noteContent.trim();
    if (!text) return;
    const newNote: StickyNote = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
      text: text.slice(0, 250),
      color: noteColor,
      createdAt: new Date().toISOString(),
    };
    await saveStickyNotes([newNote, ...stickyNotes]);
  };

  const handleDeleteStickyNote = async (id: string) => {
    await saveStickyNotes(stickyNotes.filter((note) => note.id !== id));
  };

  const handleTutorialComplete = async () => {
    setShowTutorial(false);
    // Mark tutorial as completed in user profile
    if (userProfile && !userProfile.gotSimulationTutorial) {
      await updateUserProfile({
        gotSimulationTutorial: true,
      });
    }
  };

  const handleTutorialSkip = async () => {
    setShowTutorial(false);
    // Mark tutorial as completed in user profile
    if (userProfile && !userProfile.gotSimulationTutorial) {
      await updateUserProfile({
        gotSimulationTutorial: true,
      });
    }
  };



  const currentQuestion = quizData.questions[quizData.currentQuestionIndex];

  return (
    <div className="flex flex-row h-full bg-white relative" style={{ fontFamily: "'Montserrat', sans-serif" }}>
      {/* Mascot Welcome Modal */}
      {showMascotWelcome && tutorialScenario && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8 relative animate-scale-in border-4 border-blue-200">
            <button
              onClick={() => setShowMascotWelcome(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
              aria-label="Close"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="flex items-start gap-4 mb-6">
              <img
                src="/mascot_floating.png"
                alt="PipettePal"
                className="w-20 h-20 flex-shrink-0"
              />
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-slate-900 mb-3">Welcome to the Tutorial!</h2>
                <p className="text-base text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {tutorialScenario.welcomeMessage}
                </p>
              </div>
            </div>
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
              <h3 className="text-sm font-semibold text-slate-700 mb-2">Your Task:</h3>
              <div className="text-sm text-slate-900 whitespace-pre-wrap leading-relaxed">
                {tutorialScenario.question}
              </div>
            </div>
            <button
              onClick={() => {
                setShowMascotWelcome(false);
                setShowTutorialSteps(true);
                setCurrentTutorialStep(0);
                setTutorialSubStep('click-button');
              }}
              className="mt-6 w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Let's Begin!
            </button>
          </div>
        </div>
      )}

      {/* Interactive Tutorial Steps Overlay */}
      {showTutorialSteps && (
        <TutorialStepsOverlay
          currentStep={currentTutorialStep}
          subStep={tutorialSubStep}
          onNext={() => {
            if (currentTutorialStep < 6) {
              setCurrentTutorialStep(currentTutorialStep + 1);
              setTutorialSubStep('click-button');
            } else {
              setShowTutorialSteps(false);
              // Start second tutorial (interaction tutorial) after first tutorial ends
              setShowInteractionTutorial(true);
              setCurrentInteractionStep(0);
            }
          }}
          onPrevious={() => {
            if (currentTutorialStep > 0) {
              setCurrentTutorialStep(currentTutorialStep - 1);
              setTutorialSubStep('click-button');
            }
          }}
          onSkip={() => {
            setShowTutorialSteps(false);
            // Start second tutorial (interaction tutorial) after first tutorial ends
            setShowInteractionTutorial(true);
            setCurrentInteractionStep(0);
          }}
        />
      )}

      {/* Interaction Tutorial Overlay - Shows after "Begin Pipetting" */}
      {showInteractionTutorial && (
        <InteractionTutorialOverlay
          currentStep={currentInteractionStep}
          onNext={() => {
            if (currentInteractionStep < 1) {
              setCurrentInteractionStep(currentInteractionStep + 1);
            } else {
              setShowInteractionTutorial(false);
            }
          }}
          onPrevious={() => {
            if (currentInteractionStep > 0) {
              setCurrentInteractionStep(currentInteractionStep - 1);
            }
          }}
          onSkip={() => setShowInteractionTutorial(false)}
        />
      )}

      {/* Tutorial Overlay - Shows immediately when entering Live Lab Simulation */}
      {showTutorial && (
        <TutorialOverlay
          onComplete={handleTutorialComplete}
          onSkip={handleTutorialSkip}
        />
      )}

      {/* Back Button - Top Left */}
      <button
        onClick={() => {
          // Clear scene reference before navigation
          if (sceneRef.current) {
            sceneRef.current = null;
          }
          router.push('/sim-dashboard');
        }}
        className="absolute top-4 left-4 z-30 bg-white rounded-lg px-4 py-2 border-2 border-slate-300 shadow-lg hover:bg-slate-50 transition-colors flex items-center gap-2"
      >
        <svg className="w-5 h-5 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        <span className="text-slate-700 font-semibold">Back to Dashboard</span>
      </button>

      {/* Main Simulation Area */}
      <div
        ref={labContainerRef}
        id="labContainer"
        className="flex-1 relative overflow-hidden"
        style={{
          cursor: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z"></path><path d="M13 13l6 6"></path></svg>') 16 16, auto`,
          background: '#ffffff',
        }}
      >
        {/* Confetti and effects will be here */}

        {/* Confetti Effect */}
        {showConfetti && (
          <div className="absolute inset-0 pointer-events-none z-30">
            {[...Array(50)].map((_, i) => (
              <div
                key={i}
                className="absolute w-2 h-2 rounded-full"
                style={{
                  backgroundColor: ['#D8F878', '#E47CB8', '#9448B0', '#22c55e'][Math.floor(Math.random() * 4)],
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animation: `confetti-fall ${1 + Math.random() * 2}s ease-out forwards`,
                  animationDelay: `${Math.random() * 0.5}s`,
                }}
              />
            ))}
          </div>
        )}

        {/* Green/Red Glow Effects */}
        {pipetteSelectionFeedback === 'correct' && (
          <div className="absolute inset-0 pointer-events-none z-25">
            <div className="absolute inset-0 bg-[#D8F878]/20 animate-pulse" />
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-transparent via-[#D8F878] to-transparent animate-shimmer" />
            <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-r from-transparent via-[#D8F878] to-transparent animate-shimmer" />
            <div className="absolute left-0 top-0 bottom-0 w-2 bg-gradient-to-b from-transparent via-[#D8F878] to-transparent animate-shimmer" />
            <div className="absolute right-0 top-0 bottom-0 w-2 bg-gradient-to-b from-transparent via-[#D8F878] to-transparent animate-shimmer" />
          </div>
        )}
        {pipetteSelectionFeedback === 'wrong' && (
          <div className="absolute inset-0 pointer-events-none z-25 animate-shake">
            <div className="absolute inset-0 bg-[#E47CB8]/20 animate-pulse" />
          </div>
        )}
      </div>

      {/* Control Panel - Right Side */}
      <div
        className="w-96 h-full p-4 overflow-y-auto relative flex flex-col border-l-2 border-slate-300 bg-gradient-to-b from-slate-50 to-slate-100"
        style={{
          color: '#1e293b',
        }}
      >
        <div className="relative z-10 flex flex-col h-full">
          {/* Mascot Welcome Message */}
          {showMascotWelcome && tutorialScenario && (
            <div className="shrink-0 mb-4 animate-fade-in">
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-4 border-2 border-blue-200 shadow-lg">
                <div className="flex items-start gap-3">
                  <img
                    src="/mascot_floating.png"
                    alt="PipettePal"
                    className="w-12 h-12 flex-shrink-0"
                  />
                  <div className="flex-1">
                    <p className="text-base text-slate-900 font-medium whitespace-pre-wrap">
                      {tutorialScenario.welcomeMessage}
                    </p>
                    <button
                      onClick={() => setShowMascotWelcome(false)}
                      className="mt-2 text-xs text-blue-600 hover:text-blue-700 font-semibold"
                    >
                      Got it! →
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Current Task - Top */}
          <div id="current-task-area" className="shrink-0 mb-4">
            <div className="bg-white rounded-xl p-4 border-2 border-slate-300 shadow-lg">
              <h3 className="text-sm font-semibold text-slate-700 mb-2">Current Task:</h3>
              <div className="text-sm text-slate-900 font-medium whitespace-pre-wrap leading-relaxed">
                {currentTask}
              </div>
            </div>
          </div>

          <div className="shrink-0 mb-4 flex justify-end">
            <div className="flex gap-2">
              <button
                id="pipette-colors-button"
                onClick={() => {
                  setShowPipettePalette(true);
                  // If in tutorial step 2 and waiting for button click, move to next substep
                  if (showTutorialSteps && currentTutorialStep === 1 && tutorialSubStep === 'click-button') {
                    setTutorialSubStep('select-pipette');
                  }
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-300 bg-white text-sm font-semibold text-slate-700 hover:border-slate-500 hover:text-slate-900 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-7 7-4-4-4 4 8 8 10-10L19 7z" />
                </svg>
                Pipette colors
              </button>
              <button
                onClick={() => setShowStickyNotesModal(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-300 bg-white text-sm font-semibold text-slate-700 hover:border-slate-500 hover:text-slate-900 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-9 4h7m2 4H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Sticky notes
              </button>
            </div>
          </div>

          {/* Practice/Quiz Tabs */}
          <div className="shrink-0 mb-4">
            <div className="grid grid-cols-2 gap-2">
              <button
                id="pipetting-tab-btn"
                onClick={() => setActiveTab('pipetting')}
                className={`tab-button font-semibold py-2 px-1 rounded-md text-sm transition-all ${
                  activeTab === 'pipetting'
                    ? 'bg-blue-600 text-white font-bold border-blue-600'
                    : 'bg-white border border-slate-300 text-slate-700'
                }`}
              >
                Practice
              </button>
              <button
                id="quiz-tab-btn"
                onClick={() => setActiveTab('quiz')}
                className={`tab-button font-semibold py-2 px-1 rounded-md text-sm transition-all ${
                  activeTab === 'quiz'
                    ? 'bg-blue-600 text-white font-bold border-blue-600'
                    : 'bg-white border border-slate-300 text-slate-700'
                }`}
              >
                Quiz
              </button>
            </div>
          </div>

          {/* Live Feedback - 3 boxes in a row */}
          <div id="live-feedback" className="shrink-0 mb-4">
            <h3 className="text-sm font-semibold mb-2 text-slate-700">Live Feedback:</h3>
            <div className="grid grid-cols-3 gap-2">
              {/* Angle Indicator */}
              <div className="bg-white rounded-lg p-2 border border-slate-300 shadow-sm">
                <div className="flex flex-col items-center">
                  <div className="relative w-10 h-10 mb-1">
                    {(() => {
                      const circumference = 2 * Math.PI * 15;
                      const angleValue = feedbackStates.angle.value === '--' ? 0 : parseFloat(feedbackStates.angle.value.replace('°', '')) || 0;
                      const progress = angleValue / 90;
                      const strokeDashoffset = circumference * (1 - progress);
                      const strokeColor = feedbackStates.angle.status === 'correct' ? '#22c55e' : feedbackStates.angle.status === 'incorrect' ? '#ef4444' : '#9ca3af';
                      
                      return (
                        <svg className="transform -rotate-90 w-10 h-10">
                          <circle
                            cx="20"
                            cy="20"
                            r="15"
                            stroke="rgba(0,0,0,0.1)"
                            strokeWidth="3"
                            fill="none"
                          />
                          <circle
                            cx="20"
                            cy="20"
                            r="15"
                            stroke={strokeColor}
                            strokeWidth="3"
                            fill="none"
                            strokeDasharray={circumference}
                            strokeDashoffset={strokeDashoffset}
                            strokeLinecap="round"
                            className="transition-all duration-300"
                          />
                        </svg>
                      );
                    })()}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xs font-bold text-slate-900">
                        {feedbackStates.angle.value === '--' ? '--' : feedbackStates.angle.value.replace('°', '')}
                      </span>
                    </div>
                  </div>
                  <div className="text-xs text-slate-600 text-center">Angle</div>
                </div>
              </div>

              {/* Depth Indicator */}
              <div className="bg-white rounded-lg p-2 border border-slate-300 shadow-sm">
                <div className="flex flex-col items-center">
                  <div className="relative w-10 h-10 mb-1 flex items-end justify-center">
                    {(() => {
                      const depthValue = feedbackStates.depth.value === '--' ? 0 : parseFloat(feedbackStates.depth.value.replace('mm', '')) || 0;
                      const depthPercent = Math.min(100, (depthValue / 5) * 100);
                      const depthColor = feedbackStates.depth.status === 'correct' ? 'bg-green-500' : 
                        feedbackStates.depth.status === 'incorrect' ? 'bg-red-500' : 'bg-slate-400';
                      
                      return (
                        <div className="w-3 h-10 bg-slate-200 rounded-full overflow-hidden border border-slate-300">
                          <div 
                            className={`w-full rounded-full transition-all duration-300 ${depthColor}`}
                            style={{ height: `${depthPercent}%` }}
                          />
                        </div>
                      );
                    })()}
                  </div>
                  <div className="text-xs text-slate-600 text-center">Depth</div>
                </div>
              </div>

              {/* Plunger State Indicator */}
              <div className="bg-white rounded-lg p-2 border border-slate-300 shadow-sm">
                <div className="flex flex-col items-center">
                  <div className={`w-3 h-3 rounded-full mb-1 ${
                    feedbackStates.plunger.status === 'correct' ? 'bg-green-500 animate-pulse' : 
                    feedbackStates.plunger.status === 'incorrect' ? 'bg-red-500' : 'bg-slate-400'
                  }`} />
                  <div className="text-xs text-slate-600 text-center">Plunger</div>
                </div>
              </div>
            </div>
          </div>

          {/* Scrollable Content Area */}
          <div className="relative z-10 flex-1 overflow-y-auto mb-4">
          {/* Pipetting Module */}
          {activeTab === 'pipetting' && (
            <div className="bg-white p-4 rounded-lg shadow-lg border border-slate-300 mb-4">
              <h2 className="text-xl font-semibold mb-4 text-slate-900">Pipetting Practice</h2>
              <div className="mb-4">
                <label htmlFor="volume-select" className="block text-sm font-medium mb-2 text-slate-700">
                  Target Volume (μL)
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    id="target-volume-input"
                    className="w-full p-2 border border-slate-300 rounded-md focus:ring-[#E47CB8] focus:border-[#E47CB8] text-[#001C3D]"
                    defaultValue={150}
                    min={0.2}
                    max={1000}
                    step={0.1}
                  />
                  <button
                    id="set-volume-btn"
                    onClick={handleSetVolume}
                    className="bg-[#E47CB8] text-white px-4 py-2 rounded-md shadow-sm hover:brightness-110"
                  >
                    Set
                  </button>
                </div>
              </div>
              <div className="mb-4">
                <h3 className="text-md font-medium mb-2 text-slate-700">Select Pipette:</h3>
                <div id="pipette-selection" className="grid grid-cols-2 gap-2 relative">
                  {pipettes.map((pipette) => {
                    const isSelected = selectedPipetteId === pipette.id;
                    const isCorrect = pipetteSelectionFeedback === 'correct' && isSelected;
                    const isWrong = pipetteSelectionFeedback === 'wrong' && isSelected;
                    
                    return (
                    <button
                      key={pipette.id}
                      onClick={() => selectPipette(pipette)}
                        className={`relative p-3 border rounded-xl text-sm hover:brightness-105 transition-all font-semibold ${
                          isSelected ? 'ring-2 ring-[#D8F878] ring-offset-2' : 'border-white/40'
                        } ${isCorrect ? 'animate-pulse' : ''} ${isWrong ? 'animate-shake' : ''}`}
                      style={{
                        backgroundColor:
                          pipette.id === 'p2'
                            ? '#ef4444'
                            : pipette.id === 'p10'
                              ? '#22c55e'
                              : pipette.id === 'p200'
                                ? '#eab308'
                                : '#3b82f6',
                        color: pipette.id === 'p200' ? '#001C3D' : '#f0f0f0',
                          boxShadow: isCorrect ? '0 0 20px rgba(216, 248, 120, 0.6)' : isWrong ? '0 0 20px rgba(228, 124, 184, 0.6)' : 'none',
                      }}
                    >
                      {pipette.name}
                        {isCorrect && (
                          <div className="absolute -top-2 -right-2 text-2xl animate-bounce">✅</div>
                        )}
                        {isWrong && (
                          <div className="absolute -top-2 -right-2 text-2xl animate-bounce">❌</div>
                        )}
                    </button>
                    );
                  })}
                  {/* Feedback Text Overlay */}
                  {pipetteSelectionFeedback === 'correct' && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                      <div className="bg-[#D8F878]/90 text-[#001C3D] px-4 py-2 rounded-lg font-bold text-lg animate-fade-in">
                        ✅ CORRECT
                      </div>
                    </div>
                  )}
                  {pipetteSelectionFeedback === 'wrong' && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                      <div className="bg-[#E47CB8]/90 text-white px-4 py-2 rounded-lg font-bold text-lg animate-fade-in">
                        ❌ WRONG
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="mb-4">
                <button
                  id="attach-tip-btn"
                  onClick={attachTip}
                  className="w-full bg-[#D8F878] text-[#001C3D] font-semibold px-4 py-2 rounded-md shadow-md hover:brightness-110"
                >
                  Attach Tip
                </button>
              </div>
            </div>
          )}

          {/* Quiz Module */}
          {activeTab === 'quiz' && (
            <div className="bg-white p-4 rounded-lg shadow-lg border border-slate-300 mb-4">
              <h2 className="text-xl font-semibold mb-4 text-slate-900">Pipetting Quiz</h2>
              <p className="text-sm text-slate-600 mb-4">Test your knowledge of proper pipetting techniques.</p>
              <p className="text-sm text-center text-slate-500 italic mb-4">
                You got this! Every question is a chance to learn.
              </p>
              <div className="space-y-3">
                <a
                  href="/quiz"
                  className="block w-full bg-blue-600 text-white px-4 py-2 rounded-md shadow-md hover:bg-blue-700 text-center font-semibold transition-all"
                >
                  Advanced Quiz System
                </a>
                <button
                  id="start-quiz-btn"
                  onClick={() => startQuiz()}
                  className="w-full bg-green-500 text-white px-4 py-2 rounded-md shadow-md hover:bg-green-600 font-semibold transition-all"
                >
                  Quick Practice Quiz
                </button>
              </div>
            </div>
          )}
          </div>

          {/* Control Toolkit - Bottom Right Section */}
          <div className="shrink-0 pt-4 border-t border-slate-300">
            <h3 className="text-lg font-semibold mb-3 text-slate-900">Controls</h3>
            
            {/* Actions - Above Controls */}
            <div className="mb-4">
              <h4 className="text-sm font-semibold mb-2 text-slate-700">Actions</h4>
              <div className="space-y-2">
                <div id="plunger-controls" className="space-y-2">
                  <button
                    id="plungerStop1Btn"
                    onClick={handlePlunger1Click}
                    className="control-btn bg-pink-500 hover:bg-pink-600 text-white rounded-lg w-full h-12 text-sm font-semibold shadow-md text-center"
                    title="Plunger (P)"
                  >
                    Plunger (P)
                    <div className="text-xs font-normal">Aspirate/Dispense</div>
                  </button>
                  <button
                    id="plungerStop2Btn"
                    onClick={handlePlunger2Click}
                    className="control-btn bg-purple-600 hover:bg-purple-700 text-white rounded-lg w-full h-12 text-sm font-semibold shadow-md text-center"
                    title="Blow-out (B)"
                  >
                    Blow-out (B)
                    <div className="text-xs font-normal">Stop 2</div>
                  </button>
                </div>
                <button
                  id="ejectTipBtn"
                  onClick={ejectTip}
                  className="control-btn bg-white border-2 border-slate-400 hover:border-slate-600 text-slate-900 rounded-lg w-full h-10 text-sm font-semibold shadow-md text-center"
                >
                  Eject Tip
                </button>
              </div>
            </div>

            {/* Movement Controls */}
            <div id="movement-controls" className="bg-white p-4 rounded-lg border border-slate-300">
              <h4 className="text-sm font-semibold mb-3 text-slate-700">Movement</h4>
              <div className="flex items-center gap-4 justify-center">
                {/* Arrow Keys */}
                <div className="grid grid-cols-3 gap-2 w-32">
                  <div></div>
                  <button
                    id="arrowUp"
                    onClick={() => movePipetteHorizontal(0, -0.2)}
                    className="d-pad-btn bg-slate-200 hover:bg-slate-300 text-slate-900 p-2 rounded-lg shadow-md text-lg font-semibold"
                    title="Move Forward (↑)"
                  >
                    ↑
                  </button>
                  <div></div>
                  <button
                    id="arrowLeft"
                    onClick={() => movePipetteHorizontal(-0.2, 0)}
                    className="d-pad-btn bg-slate-200 hover:bg-slate-300 text-slate-900 p-2 rounded-lg shadow-md text-lg font-semibold"
                    title="Move Left (←)"
                  >
                    ←
                  </button>
                  <div className="text-xs text-slate-500 text-center flex items-center justify-center">Arrow Keys</div>
                  <button
                    id="arrowRight"
                    onClick={() => movePipetteHorizontal(0.2, 0)}
                    className="d-pad-btn bg-slate-200 hover:bg-slate-300 text-slate-900 p-2 rounded-lg shadow-md text-lg font-semibold"
                    title="Move Right (→)"
                  >
                    →
                  </button>
                  <div></div>
                  <button
                    id="arrowDown"
                    onClick={() => movePipetteHorizontal(0, 0.2)}
                    className="d-pad-btn bg-slate-200 hover:bg-slate-300 text-slate-900 p-2 rounded-lg shadow-md text-lg font-semibold"
                    title="Move Backward (↓)"
                  >
                    ↓
                  </button>
                  <div></div>
                </div>
                
                {/* Height Controls - Side by side with arrow keys */}
                <div className="flex flex-col items-center gap-2">
                  <div className="text-center mb-1">
                    <div className="text-xs font-bold text-slate-700 uppercase">Height</div>
                    <div className="text-xs text-slate-500">W / S</div>
                  </div>
                  <div className="relative h-32 w-8 flex items-center justify-center">
                    <input
                      type="range"
                      id="heightSlider"
                      min="1.5"
                      max="5"
                      step="0.05"
                      defaultValue="3"
                      className="h-32 w-8"
                      style={{
                        writingMode: 'bt-lr' as React.CSSProperties['writingMode'],
                        WebkitAppearance: 'slider-vertical',
                      }}
                      onChange={(e) => {
                        if (!sceneRef.current) return;
                        const value = parseFloat(e.target.value);
                        sceneRef.current.gameState.pipetteY = value;
                        sceneRef.current.pipetteGroup.position.y = value;
                      }}
                      onWheel={(e) => {
                        e.preventDefault();
                        const delta = e.deltaY > 0 ? -0.5 : 0.5; // Increased sensitivity
                        movePipetteVertical(delta);
                      }}
                    />
                  </div>
                </div>
                
                {/* Tilt Controls */}
                <div id="tilt-controls" className="mt-4 flex items-center justify-center gap-2">
                  <button
                    onClick={() => tiltPipette(-0.1)}
                    className="bg-slate-200 hover:bg-slate-300 text-slate-900 px-4 py-2 rounded-lg shadow-md text-sm font-semibold"
                    title="Tilt Left"
                  >
                    ↺ Left
                  </button>
                  <button
                    onClick={() => tiltPipette(0.1)}
                    className="bg-slate-200 hover:bg-slate-300 text-slate-900 px-4 py-2 rounded-lg shadow-md text-sm font-semibold"
                    title="Tilt Right"
                  >
                    Right ↻
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Feedback Modal */}
      {showFeedbackModal && (
        <div
          className="fixed z-50 left-0 top-0 w-full h-full overflow-auto bg-[rgba(0,28,61,0.5)] flex justify-center items-center"
          onClick={() => setShowFeedbackModal(false)}
        >
          <div
            className="bg-white/90 backdrop-blur-md border border-white/20 rounded-lg p-8 max-w-md w-full shadow-2xl text-center text-[#001C3D]"
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              id="feedback-title"
              className="text-2xl font-bold mb-4"
              style={{
                color:
                  feedbackType === 'correct' ? '#22c55e' : feedbackType === 'error' ? '#E47CB8' : '#9448B0',
              }}
            >
              {feedbackTitle}
            </h2>
            <p id="feedback-message" className="mb-6 whitespace-pre-wrap">
              {feedbackMessage}
            </p>
            {showProTip && (
              <div className="mt-4 p-3 bg-lime-100 border border-lime-300 rounded-md text-sm text-left">
                <strong className="font-semibold text-green-700">Pro Tip:</strong>{' '}
                <span id="pro-tip-text">{proTipText}</span>
              </div>
            )}
            <button
              id="feedback-ok-btn"
              onClick={() => setShowFeedbackModal(false)}
              className="bg-[#9448B0] text-white px-6 py-2 rounded-md mt-6 hover:bg-[#A058C0]"
            >
              Got it!
            </button>
          </div>
        </div>
      )}

      {/* Quiz Modal */}
      {showQuizModal && quizData.questions.length > 0 && currentQuestion && (
        <div
          className="fixed z-50 left-0 top-0 w-full h-full overflow-auto bg-black/70 backdrop-blur-sm flex justify-center items-center p-4"
          onClick={() => setShowQuizModal(false)}
        >
          <div
            className="bg-white rounded-2xl p-8 max-w-xl w-full shadow-2xl border-2 border-[#9448B0] text-[#001C3D]"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="quiz-question" className="text-2xl font-bold mb-6 text-[#001C3D]">
              {currentQuestion.question}
            </h2>
            <div id="quiz-options" className="space-y-4 mb-6">
              {currentQuestion.options.map((option, index) => {
                const isSelected = quizFeedback.show;
                const isCorrect = index === currentQuestion.correctAnswerIndex;
                const isWrong = isSelected && index !== currentQuestion.correctAnswerIndex && quizFeedback.isCorrect === false;
                return (
                  <button
                    key={index}
                    onClick={() => !quizFeedback.show && handleQuizAnswer(index)}
                    disabled={quizFeedback.show}
                    className={`w-full text-left p-4 border-2 rounded-xl transition-all font-medium ${
                      isCorrect && quizFeedback.show
                        ? 'bg-green-500 text-white border-green-600 shadow-lg'
                        : isWrong
                          ? 'bg-red-500 text-white border-red-600 shadow-lg'
                          : 'bg-white text-[#001C3D] border-gray-400 hover:border-[#9448B0] hover:bg-[#9448B0]/10 hover:shadow-md'
                    } ${quizFeedback.show ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
            {quizFeedback.show && (
              <div
                id="quiz-feedback"
                className={`mt-6 p-6 rounded-xl border-2 ${
                  quizFeedback.isCorrect 
                    ? 'bg-green-50 border-green-500' 
                    : 'bg-red-50 border-red-500'
                }`}
              >
                <p
                  id="quiz-feedback-text"
                  className="mb-4 text-left font-semibold"
                  dangerouslySetInnerHTML={{
                    __html: `<strong class="${quizFeedback.isCorrect ? 'text-green-800' : 'text-red-800'} text-lg">${
                      quizFeedback.isCorrect ? '✅ Correct!' : '❌ Not quite...'
                    }</strong><br><span class="${quizFeedback.isCorrect ? 'text-green-900' : 'text-red-900'}">${quizFeedback.explanation}</span>`,
                  }}
                ></p>
                <button
                  id="quiz-next-btn"
                  onClick={nextQuestion}
                  className="w-full bg-[#9448B0] text-white px-6 py-3 rounded-xl hover:bg-[#A058C0] font-bold text-lg shadow-lg transition-all"
                >
                  {quizData.currentQuestionIndex === quizData.questions.length - 1
                    ? 'Finish Quiz'
                    : 'Next Question'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Quiz Results Modal */}
      {showQuizResults && (
        <div
          className="fixed z-50 left-0 top-0 w-full h-full overflow-auto bg-black/70 backdrop-blur-sm flex justify-center items-center p-4"
          onClick={() => setShowQuizResults(false)}
        >
          <div
            className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl border-2 border-[#9448B0] text-center text-[#001C3D] animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="quiz-results-title" className="text-2xl font-bold mb-2">
              {quizData.score === quizData.questions.length ? 'Flawless Victory!' : 'Great Effort!'}
            </h2>
            <p id="quiz-results-message" className="mb-4 font-semibold">
              You scored {quizData.score} out of {quizData.questions.length}.
            </p>
            {selectedMeme ? (
              <>
                <div className="relative w-full max-w-xs mx-auto mb-4 rounded-md overflow-hidden shadow-lg bg-gray-100 min-h-[240px] flex items-center justify-center">
                  <img
              id="quiz-meme"
                    src={selectedMeme.url}
                    alt={quizData.score / quizData.questions.length >= 0.7 ? "Success meme" : "Failure meme"}
                    className="max-w-xs mx-auto rounded-md object-contain"
                    onError={(e) => {
                      // Fallback if image fails to load
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const parent = target.parentElement;
                      if (parent) {
                        const emoji = quizData.score / quizData.questions.length >= 0.7 ? '🎉' : '💪';
                        const message = quizData.score / quizData.questions.length >= 0.7 ? 'Great job!' : 'Keep practicing!';
                        parent.innerHTML = `<div class="text-gray-400 text-center p-8"><p class="text-lg">${emoji}</p><p class="text-sm mt-2">${message}</p></div>`;
                      }
                    }}
                  />
                </div>
                <p id="quiz-results-encouragement" className="text-sm text-gray-600 mb-6 px-4">
                  {selectedMeme.text}
                </p>
              </>
            ) : (
              <div className="mb-6">
                <div className="w-full max-w-xs mx-auto h-60 bg-gray-100 rounded-md flex items-center justify-center mb-4">
                  <p className="text-gray-400 text-lg">🎉</p>
                </div>
                <p className="text-sm text-gray-600 mb-6 px-4">
                  {quizData.score === quizData.questions.length 
                    ? "Perfect score! You're a pipetting master!" 
                    : "Great effort! Keep practicing to improve your skills."}
                </p>
              </div>
            )}
            <div className="flex justify-center space-x-4">
              {quizData.incorrectQuestions.length > 0 && (
                <button
                  id="retry-incorrect-btn"
                  onClick={retryIncorrectQuestions}
                  className="bg-[#9448B0] text-white px-6 py-2 rounded-md hover:bg-[#A058C0]"
                >
                  Retry Incorrect
                </button>
              )}
              <button
                id="close-results-btn"
                onClick={() => setShowQuizResults(false)}
                className="bg-transparent text-gray-700 border-2 border-gray-400 px-6 py-2 rounded-md hover:bg-gray-100"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Feedback Console */}
      {feedbackConsole && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-40 max-w-2xl w-full px-4">
          <div className="bg-white/10 backdrop-blur-xl rounded-xl p-4 border border-white/20 shadow-2xl animate-fade-in">
            <p className="text-white font-semibold text-center">{feedbackConsole}</p>
    </div>
        </div>
      )}

      {/* Contextual Quiz Popup */}
      {showContextualQuiz && contextualQuizQuestion && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-8 max-w-lg w-full shadow-2xl border-2 border-[#9448B0] animate-slide-in-right">
            <h3 className="text-2xl font-bold text-[#001C3D] mb-4">Quick Question</h3>
            <p className="text-lg font-semibold text-[#001C3D] mb-6">{contextualQuizQuestion.question}</p>
            <div className="space-y-3 mb-6">
              {contextualQuizQuestion.options.map((option, idx) => {
                const isCorrect = contextualQuizAnswer !== null && idx === contextualQuizQuestion.correct;
                const isWrong = contextualQuizAnswer !== null && idx !== contextualQuizQuestion.correct && contextualQuizAnswer === idx;
                
                return (
                  <button
                    key={idx}
                    onClick={() => {
                      if (contextualQuizAnswer !== null) return;
                      setContextualQuizAnswer(idx);
                      const correct = idx === contextualQuizQuestion.correct;
                      if (correct) {
                        setShowConfetti(true);
                        setFeedbackConsole('✅ Great Job! ' + contextualQuizQuestion.explanation);
                        setTimeout(() => setShowConfetti(false), 2000);
                      } else {
                        setFeedbackConsole('❌ Not quite. Try again!');
                      }
                      setTimeout(() => {
                        setShowContextualQuiz(false);
                        setContextualQuizQuestion(null);
                        setContextualQuizAnswer(null);
                      }, correct ? 2000 : 1500);
                    }}
                    className={`w-full text-left p-4 border-2 rounded-xl transition-all font-medium ${
                      isCorrect
                        ? 'bg-green-500 text-white border-green-600 shadow-lg'
                        : isWrong
                          ? 'bg-red-500 text-white border-red-600 shadow-lg'
                          : 'bg-white text-[#001C3D] border-gray-400 hover:border-[#9448B0] hover:bg-[#9448B0]/10 hover:shadow-md'
                    }`}
                    disabled={contextualQuizAnswer !== null}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Sticky Notes Modal */}
      {showStickyNotesModal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white w-full max-w-4xl rounded-3xl border-4 border-slate-200 shadow-2xl relative">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div>
                <p className="text-sm uppercase tracking-wide text-slate-500 font-semibold">Sticky notes</p>
                <h3 className="text-2xl font-semibold text-slate-900">Pin simulation insights</h3>
              </div>
              <button
                onClick={() => setShowStickyNotesModal(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
                aria-label="Close sticky notes"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1 space-y-3">
                  <label className="text-sm font-semibold text-slate-700">Pick a color</label>
                  <div className="flex gap-3">
                    {Object.entries(STICKY_NOTE_COLORS).map(([key, palette]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setNoteColor(key as StickyNoteColor)}
                        className={`w-10 h-10 rounded-full border-2 transition-transform ${
                          noteColor === key ? 'ring-2 ring-slate-900 scale-105' : ''
                        } ${palette.bg} ${palette.border}`}
                        aria-label={palette.label}
                      />
                    ))}
                  </div>
                </div>
                <div className="flex-2 space-y-2">
                  <label htmlFor="sticky-note-content" className="text-sm font-semibold text-slate-700">
                    Write a note
                  </label>
                  <textarea
                    id="sticky-note-content"
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    maxLength={250}
                    rows={3}
                    className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-300"
                    placeholder="Example: Pre-wet tips twice before aspirating viscous buffers."
                  />
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>{noteContent.length}/250</span>
                    {noteError && <span className="text-red-500">{noteError}</span>}
                  </div>
                  <div className="flex justify-end">
                    <button
                      onClick={handleAddStickyNote}
                      disabled={!noteContent.trim() || noteSaving}
                      className="px-4 py-2 rounded-xl bg-slate-900 text-white font-semibold disabled:bg-slate-400"
                    >
                      {noteSaving ? 'Saving...' : 'Pin note'}
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[420px] overflow-y-auto pr-1">
                {stickyNotes.length === 0 ? (
                  <div className="col-span-full text-center text-slate-500 text-sm py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    No sticky notes yet. Add your first insight to remember pro moves.
                  </div>
                ) : (
                  stickyNotes.map((note) => {
                    const palette = STICKY_NOTE_COLORS[note.color] || STICKY_NOTE_COLORS.yellow;
                    return (
                      <div
                        key={note.id}
                        className={`rounded-2xl border shadow-sm p-4 min-h-[150px] flex flex-col ${palette.bg} ${palette.text} ${palette.border}`}
                      >
                        <p className="text-sm flex-1 whitespace-pre-wrap wrap-break-word">{note.text}</p>
                        <div className="mt-3 flex items-center justify-between text-xs opacity-75">
                          <span>{new Date(note.createdAt).toLocaleString()}</span>
                          <button onClick={() => handleDeleteStickyNote(note.id)} className="font-semibold underline">
                            Remove
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pipette Palette Modal */}
      {showPipettePalette && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white w-full max-w-3xl rounded-3xl border-4 border-slate-200 shadow-2xl relative">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div>
                <p className="text-sm uppercase tracking-wide text-slate-500 font-semibold">Select pipette</p>
                <h3 className="text-2xl font-semibold text-slate-900">Color-coded pipette families</h3>
                <p className="text-sm text-slate-600">
                  Choose the pipette that matches your target volume. Tip color updates instantly.
                </p>
              </div>
              <button
                onClick={() => setShowPipettePalette(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
                aria-label="Close pipette palette"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {pipettes.map((pipette) => (
                <button
                  key={pipette.id}
                  onClick={() => {
                    selectPipette(pipette);
                    setShowPipettePalette(false);
                  }}
                  className={`flex items-center gap-4 rounded-2xl border-2 p-4 text-left transition-all ${
                    selectedPipetteId === pipette.id
                      ? 'border-slate-900 shadow-lg'
                      : 'border-slate-200 hover:border-slate-400 hover:shadow-md'
                  }`}
                >
                  <div
                    className="w-16 h-16 rounded-2xl border-2 shadow-inner"
                    style={{ backgroundColor: `#${pipette.color.toString(16).padStart(6, '0')}` }}
                  />
                  <div>
                    <p className="text-xl font-semibold text-slate-900">{pipette.name}</p>
                    <p className="text-sm text-slate-600">{pipette.min} - {pipette.max} µL</p>
                    <p className="text-xs text-slate-500 mt-1">Tap to equip. Tip will glow in this color.</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Mistake Scenario Sidebar */}
      {showMistakeSidebar && mistakeScenario && (
        <div className="fixed right-0 top-0 h-full w-96 bg-white/95 backdrop-blur-xl z-50 shadow-2xl border-l border-white/20 animate-slide-in-right">
          <div className="p-6 h-full overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-[#001C3D]">⚠️ Mistake Detected</h3>
              <button
                onClick={() => {
                  setShowMistakeSidebar(false);
                  setMistakeScenario(null);
                }}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
            <div className="bg-red-50 border-2 border-red-500 rounded-xl p-4 mb-6">
              <h4 className="font-bold text-red-800 mb-2">{mistakeScenario.title}</h4>
              <p className="text-gray-700 mb-4">{mistakeScenario.question}</p>
              <div className="space-y-2">
                {mistakeScenario.options.map((option, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      if (idx === mistakeScenario.correct) {
                        setShowConfetti(true);
                        setTimeout(() => setShowConfetti(false), 2000);
                      }
                    }}
                    className={`w-full text-left p-3 border-2 rounded-lg transition-all ${
                      idx === mistakeScenario.correct
                        ? 'border-green-500 bg-green-50 hover:bg-green-100'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
            <div className="bg-[#D8F878]/20 border-2 border-[#D8F878] rounded-xl p-4">
              <p className="font-semibold text-[#001C3D]">💡 {mistakeScenario.tip}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

