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

interface PipetteSimulatorProps {
  handTrackingEnabled?: boolean;
  handLandmarks?: number[][];
  selectedHand?: 'left' | 'right' | null;
  calibrationOffset?: { angle: number; position: { x: number; y: number; z: number } } | null;
}

export default function PipetteSimulator({ 
  handTrackingEnabled = false, 
  handLandmarks = [],
  selectedHand = null,
  calibrationOffset = null
}: PipetteSimulatorProps = {}) {
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
  type FeedbackStatus = 'correct' | 'incorrect' | 'neutral';
  type FeedbackSection = { value: string; status: FeedbackStatus };
  type FeedbackStates = {
    angle: FeedbackSection;
    depth: FeedbackSection;
    plunger: FeedbackSection;
    beaker: FeedbackSection;
  };

  const initialFeedbackState: FeedbackStates = {
    angle: { value: '--', status: 'neutral' },
    depth: { value: '--', status: 'neutral' },
    plunger: { value: 'Ready', status: 'neutral' },
    beaker: { value: '--', status: 'neutral' },
  };

  const [feedbackStates, setFeedbackStates] = useState<FeedbackStates>(initialFeedbackState);
  // Thumb open timer for blow-out detection
  const thumbOpenTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [thumbOpenStartTime, setThumbOpenStartTime] = useState<number | null>(null);
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
  const updateFeedbackStates = useCallback((updates: Partial<FeedbackStates>) => {
    setFeedbackStates((prev) => {
      let changed = false;
      const next = { ...prev };
      (Object.keys(updates) as Array<keyof FeedbackStates>).forEach((key) => {
        const update = updates[key];
        if (!update) return;
        if (prev[key].value !== update.value || prev[key].status !== update.status) {
          next[key] = update;
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, []);

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
  const [showInteractionTutorial, setShowInteractionTutorial] = useState(handTrackingEnabled);
  const [currentInteractionStep, setCurrentInteractionStep] = useState(0);
  const [currentAngle, setCurrentAngle] = useState(75); // Initial angle in degrees
  const currentAngleRef = useRef(currentAngle);
  useEffect(() => {
    currentAngleRef.current = currentAngle;
  }, [currentAngle]);
  const [zoomLevel, setZoomLevel] = useState(7); // Camera Z position (7 = default, lower = zoomed in, higher = zoomed out)
  const [isHoveringTipBox, setIsHoveringTipBox] = useState(false);
  const [tipBoxHoverPosition, setTipBoxHoverPosition] = useState<{ x: number; y: number } | null>(null);
  const isHoveringTipBoxRef = useRef(false);
  const tipBoxHoverPositionRef = useRef<{ x: number; y: number } | null>(null);
  const [showTipAttachedNotification, setShowTipAttachedNotification] = useState(false);
  const [tipAttachedStepCompleted, setTipAttachedStepCompleted] = useState(false);
  const [isHoveringWasteBin, setIsHoveringWasteBin] = useState(false);
  const [wasteBinHoverPosition, setWasteBinHoverPosition] = useState<{ x: number; y: number } | null>(null);
  const isHoveringWasteBinRef = useRef(false);
  const wasteBinHoverPositionRef = useRef<{ x: number; y: number } | null>(null);
  const [waterTransferred, setWaterTransferred] = useState(false);
  const [blueDyeTransferred, setBlueDyeTransferred] = useState(false);
  const [firstTipEjected, setFirstTipEjected] = useState(false);
  const [secondTipAttached, setSecondTipAttached] = useState(false);
  const [secondTipEjected, setSecondTipEjected] = useState(false);
  const [liquidsMixed, setLiquidsMixed] = useState(false);
  const [showPlungerBar, setShowPlungerBar] = useState(false);
  const [plungerProgress, setPlungerProgress] = useState(0);
  const [plungerInterval, setPlungerInterval] = useState<NodeJS.Timeout | null>(null);
  const [plungerTargetStop, setPlungerTargetStop] = useState(80); // Default 80%, changes to 20% for blue dye
  const [isAspirating, setIsAspirating] = useState(false);
  const [activeSourceForAspiration, setActiveSourceForAspiration] = useState<Container | null>(null);
  const [pipetteLiquidType, setPipetteLiquidType] = useState<'Water' | 'Blue Dye' | null>(null);
  const [dispensedAtDestination, setDispensedAtDestination] = useState(false);
  const [blownOutAtDestination, setBlownOutAtDestination] = useState(false);

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
    sourceContainer2: Container | null;
    destContainer: Container;
    wasteBin: THREE.Group;
    tipBoxes: Record<string, THREE.Group>;
    tipMeshes: Record<string, THREE.Mesh[]>; // Track individual tip meshes for removal
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
    const tipMeshes: Record<string, THREE.Mesh[]> = {};
    const createTipBox = (color: number, pipetteId: string) => {
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
      const tips: THREE.Mesh[] = [];
      for (let i = -0.4; i <= 0.4; i += 0.2) {
        for (let j = -0.6; j <= 0.6; j += 0.3) {
          const tipMesh = new THREE.Mesh(tipGeo, tipMat);
          tipMesh.position.set(i, 1, j);
          baseMesh.add(tipMesh);
          tips.push(tipMesh);
        }
      }
      tipMeshes[pipetteId] = tips; // Store tips array for this pipette
      tipBoxGroup.add(baseMesh, lidMesh);
      // Scale to double the previous size (was 0.25, now 0.5)
      tipBoxGroup.scale.set(0.5, 0.5, 0.5);
      // Position on table, centered and visible
      const initialY = tableTopY; // Start at table top, will be adjusted after table loads
      const adjustedZ = 1; // Keep it visible on the table
      tipBoxGroup.position.set(0, initialY, adjustedZ);
      objectsToReposition.push({ obj: tipBoxGroup, originalY: initialY });
      return tipBoxGroup;
    };

    pipettes.forEach((pipette) => {
      const tipBoxGroup = createTipBox(pipette.color, pipette.id);
      tipBoxGroup.visible = false;
      tipBoxes[pipette.id] = tipBoxGroup;
      scene.add(tipBoxGroup);
    });

    // Create waste bin as a red box - position it beside the destination beaker
    const binGroup = new THREE.Group();
    const initialY = tableTopY;
    // Position beside destination beaker (destination is at x = -4, waste at x = -3)
    // Same z position as destination beaker (z = 0) and same height
    const adjustedX = -3; // Beside destination beaker (moved 2 units to positive x)
    const adjustedZ = 0; // Same z as destination beaker
    
    // Create red box for waste bin (0.75 of original size)
    const binGeo = new THREE.BoxGeometry(0.75, 0.9, 0.75); // 0.75 of original (1.0, 1.2, 1.0)
        const binMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.6 });
        const binMesh = new THREE.Mesh(binGeo, binMat);
    binMesh.position.y = 0.45; // Half height above table (0.9 / 2 = 0.45)
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
    pipetteGroup.scale.set(0.675, 0.675, 0.675); // 0.75 of original 0.9 scale
    pipetteGroup.position.y = 5; // Closer to camera, above table (table is at 3.7)
    // Set initial rotation: vertical (0 degrees) for hand tracking, 75 degrees otherwise
    pipetteGroup.rotation.z = handTrackingEnabled ? 0 : (75 * Math.PI) / 180;
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
      pipetteY: 5, // Closer to camera, above table
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
    const sourceLabel = createLabel('Water');
    const sourceLabel2 = createLabel('Blue Dye');
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
    pipetteLabel.position.set(0, -0.8, 0); // Bottom of pipette
    // Add waste label to waste bin
    wasteBin.add(wasteLabel);
    wasteLabel.position.set(0, -0.6, 0); // Bottom of waste bin

    // Position tip box label (will be updated when tip box is visible)
    const activeTipBox = tipBoxes[gameState.selectedPipette?.id || 'p200'];
    if (activeTipBox) {
      activeTipBox.add(tipsBoxLabel);
      tipsBoxLabel.position.set(0, -0.5, 0); // Bottom of tip box
    }

    // Position source and destination labels after containers load
    createBeakerContainer(-4, 0, 0, 0x60a5fa).then((container) => {
      destContainer = container;
      // Calculate totalVolume based on full beaker capacity (not initial ratio)
      // The totalVolume should represent the full beaker capacity
      const fullHeight = container.height;
      const liquidGeo = container.liquidMesh.geometry as THREE.CylinderGeometry;
      const liquidRadius = liquidGeo.parameters.radiusTop;
      const fullTotalVolume = Math.PI * Math.pow(liquidRadius, 2) * fullHeight;
      container.totalVolume = fullTotalVolume; // Set to full capacity
      container.currentVolume = 0; // Start empty
      // Reset liquid mesh to start empty but ready to fill
      container.liquidMesh.scale.y = 0; // Start with no liquid
      container.liquidMesh.position.y = 0; // Position at bottom
      container.liquidMesh.visible = false; // Hide until liquid is added
      
      scene.add(container.group);
      container.group.add(destLabel);
      destLabel.position.set(0, -0.6, 0); // Bottom of destination beaker
      // Update sceneRef when container is loaded
      if (sceneRef.current) {
        sceneRef.current.destContainer = container;
      }
    });
    
    // Source 1 - Water - Set to exactly 100 µL (visually full)
    createBeakerContainer(4, 0, 0.9, 0x001c3d).then((container) => {
      sourceContainer = container;
      // Keep visual at 0.9 (90% full) - liquid should already be visible from createBeakerContainer
      // Set currentVolume to 100 µL for volume calculations
      container.currentVolume = 100; // Set to 100 µL
      // Ensure liquid mesh is visible and properly scaled
      container.liquidMesh.visible = true;
      // Make sure scale is correct (should be 1.0 since initialLiquidRatio is applied during creation)
      if (container.liquidMesh.scale.y === 0) {
        container.liquidMesh.scale.y = container.initialLiquidRatio || 0.9;
      }
      
      scene.add(container.group);
      container.group.add(sourceLabel);
      sourceLabel.position.set(0, -0.6, 0); // Bottom of source beaker
      // Update sceneRef when container is loaded
      if (sceneRef.current) {
        sceneRef.current.sourceContainer = container;
      }
    });

    // Source 2 - Blue Dye - Set to exactly 100 µL (visually full)
    createBeakerContainer(6, 0, 0.9, 0x0066ff).then((container) => {
      const sourceContainer2 = container;
      // Keep visual at 0.9 (90% full) - liquid should already be visible from createBeakerContainer
      // Set currentVolume to 100 µL for volume calculations
      container.currentVolume = 100; // Set to 100 µL
      // Ensure liquid mesh is visible and properly scaled
      container.liquidMesh.visible = true;
      // Make sure scale is correct (should be 1.0 since initialLiquidRatio is applied during creation)
      if (container.liquidMesh.scale.y === 0) {
        container.liquidMesh.scale.y = container.initialLiquidRatio || 0.9;
      }
      
      scene.add(container.group);
      container.group.add(sourceLabel2);
      sourceLabel2.position.set(0, -0.6, 0); // Bottom of source beaker 2
      // Update sceneRef when container is loaded
      if (sceneRef.current) {
        sceneRef.current.sourceContainer2 = container;
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
      sourceContainer2: null,
      destContainer,
      wasteBin,
      tipBoxes,
      tipMeshes,
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
      
      // Update current angle display
      if (pipetteGroup) {
        const angleInDegrees = (pipetteGroup.rotation.z * 180) / Math.PI;
        const roundedAngle = Math.round(angleInDegrees);
        if (roundedAngle !== currentAngleRef.current) {
          currentAngleRef.current = roundedAngle;
          setCurrentAngle(roundedAngle);
        }
      }

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

      // Check if pipette is hovering over tip box
      if (pipetteGroup && gameState.selectedPipette && !gameState.hasTip) {
        const currentTipBox = sceneRef.current.tipBoxes[gameState.selectedPipette.id];
        if (currentTipBox && currentTipBox.visible) {
          const tipBox3D = new THREE.Box3().setFromObject(currentTipBox.children[0]);
          const pipetteShaftPos = new THREE.Vector3();
          pipetteGroup.getObjectByName('pipetteShaft')?.getWorldPosition(pipetteShaftPos);

          const isOverTipBox =
            pipetteShaftPos.x > tipBox3D.min.x &&
            pipetteShaftPos.x < tipBox3D.max.x &&
            pipetteShaftPos.z > tipBox3D.min.z &&
            pipetteShaftPos.z < tipBox3D.max.z;

          if (isOverTipBox) {
            // Convert 3D position to screen coordinates
            const tipBoxCenter = new THREE.Vector3();
            tipBox3D.getCenter(tipBoxCenter);
            tipBoxCenter.project(camera);
            const x = (tipBoxCenter.x * 0.5 + 0.5) * window.innerWidth;
            const y = (tipBoxCenter.y * -0.5 + 0.5) * window.innerHeight;
            
            // Only update state if it changed
            if (!isHoveringTipBoxRef.current) {
              setIsHoveringTipBox(true);
              isHoveringTipBoxRef.current = true;
            }
            if (!tipBoxHoverPositionRef.current || 
                tipBoxHoverPositionRef.current.x !== x || 
                tipBoxHoverPositionRef.current.y !== y) {
              setTipBoxHoverPosition({ x, y });
              tipBoxHoverPositionRef.current = { x, y };
            }
          } else {
            // Only update state if it changed
            if (isHoveringTipBoxRef.current) {
              setIsHoveringTipBox(false);
              isHoveringTipBoxRef.current = false;
            }
            if (tipBoxHoverPositionRef.current !== null) {
              setTipBoxHoverPosition(null);
              tipBoxHoverPositionRef.current = null;
            }
          }
        } else {
          // Only update state if it changed
          if (isHoveringTipBoxRef.current) {
            setIsHoveringTipBox(false);
            isHoveringTipBoxRef.current = false;
          }
          if (tipBoxHoverPositionRef.current !== null) {
            setTipBoxHoverPosition(null);
            tipBoxHoverPositionRef.current = null;
          }
        }
      } else {
        // Only update state if it changed
        if (isHoveringTipBoxRef.current) {
          setIsHoveringTipBox(false);
          isHoveringTipBoxRef.current = false;
        }
        if (tipBoxHoverPositionRef.current !== null) {
          setTipBoxHoverPosition(null);
          tipBoxHoverPositionRef.current = null;
        }
      }

      // Check if pipette is hovering over waste bin (for tip ejection)
      if (pipetteGroup && gameState.hasTip && sceneRef.current.wasteBin) {
        const binBox = new THREE.Box3().setFromObject(sceneRef.current.wasteBin);
        const pipettePos = new THREE.Vector3();
        pipetteGroup.getWorldPosition(pipettePos);

        const isOverWasteBin =
          pipettePos.x > binBox.min.x &&
          pipettePos.x < binBox.max.x &&
          pipettePos.z > binBox.min.z &&
          pipettePos.z < binBox.max.z;

        if (isOverWasteBin) {
          // Convert 3D position to screen coordinates
          const binCenter = new THREE.Vector3();
          binBox.getCenter(binCenter);
          binCenter.project(camera);
          const x = (binCenter.x * 0.5 + 0.5) * window.innerWidth;
          const y = (binCenter.y * -0.5 + 0.5) * window.innerHeight;
          
          // Only update state if it changed
          if (!isHoveringWasteBinRef.current) {
            setIsHoveringWasteBin(true);
            isHoveringWasteBinRef.current = true;
          }
          if (!wasteBinHoverPositionRef.current || 
              wasteBinHoverPositionRef.current.x !== x || 
              wasteBinHoverPositionRef.current.y !== y) {
            setWasteBinHoverPosition({ x, y });
            wasteBinHoverPositionRef.current = { x, y };
          }
        } else {
          // Only update state if it changed
          if (isHoveringWasteBinRef.current) {
            setIsHoveringWasteBin(false);
            isHoveringWasteBinRef.current = false;
          }
          if (wasteBinHoverPositionRef.current !== null) {
            setWasteBinHoverPosition(null);
            wasteBinHoverPositionRef.current = null;
          }
        }
      } else {
        // Only update state if it changed
        if (isHoveringWasteBinRef.current) {
          setIsHoveringWasteBin(false);
          isHoveringWasteBinRef.current = false;
        }
        if (wasteBinHoverPositionRef.current !== null) {
          setWasteBinHoverPosition(null);
          wasteBinHoverPositionRef.current = null;
        }
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

  const checkImmersionDepth = (container: Container): { depth: number; status: 'correct' | 'incorrect' | 'neutral'; message: string } => {
    if (!sceneRef.current) return { depth: 0, status: 'neutral', message: '--' };
    const tipPos = getPipetteTipPosition();
    const liquidWorldPos = new THREE.Vector3();
    container.liquidMesh.getWorldPosition(liquidWorldPos);
    const liquidGeom = container.liquidMesh.geometry as THREE.CylinderGeometry;
    const liquidHeight = (liquidGeom.parameters?.height || 1) as number;
    const liquidSurfaceY = liquidWorldPos.y + (container.liquidMesh.scale.y * liquidHeight) / 2;
    const depth = liquidSurfaceY - tipPos.y;
    // Convert depth from Three.js units to mm (assuming 1 unit = 10mm for display)
    const depthMm = depth * 10;
    
    if (depth < 0.05) {
      return { depth: 0, status: 'neutral', message: 'Not in liquid' };
    }
    if (depth < 0.2) {
      return { depth: depthMm, status: 'incorrect', message: 'Too Shallow' };
    }
    if (depth > 0.6) {
      return { depth: depthMm, status: 'incorrect', message: 'Too Deep' };
    }
    return { depth: depthMm, status: 'correct', message: 'Good' };
  };

  const checkInteraction = useCallback(() => {
    if (!sceneRef.current) return;
    const { pipetteGroup, sourceContainer, sourceContainer2, destContainer } = sceneRef.current;

    // Check angle
    const localUp = new THREE.Vector3(0, 1, 0);
    const worldUp = localUp.clone().applyQuaternion(pipetteGroup.quaternion);
    const globalUp = new THREE.Vector3(0, 1, 0);
    const angleDeg = THREE.MathUtils.radToDeg(worldUp.angleTo(globalUp));
    const angleState: FeedbackSection = {
      value: `${angleDeg.toFixed(0)}°`,
      status: angleDeg < 20 ? 'correct' : 'incorrect',
    };

    // Check depth - check all containers
    const tipPos = getPipetteTipPosition();
    const inSource = sourceContainer && isTipInContainer(tipPos, sourceContainer);
    const inSource2 = sourceContainer2 ? isTipInContainer(tipPos, sourceContainer2) : false;
    const inDest = destContainer && isTipInContainer(tipPos, destContainer);
    
    let depthResult = { depth: 0, status: 'neutral' as 'correct' | 'incorrect' | 'neutral', message: '--' };
    
    if (inSource) {
      depthResult = checkImmersionDepth(sourceContainer);
    } else if (inSource2 && sourceContainer2) {
      depthResult = checkImmersionDepth(sourceContainer2);
    } else if (inDest) {
      depthResult = checkImmersionDepth(destContainer);
    }
    
    const depthState: FeedbackSection = {
      value: depthResult.message === '--' ? '--' : `${depthResult.depth.toFixed(1)}mm`,
      status: depthResult.status,
    };

    // Check beaker status based on tutorial step
    let beakerState: FeedbackSection = { value: '--', status: 'neutral' };
    if (showInteractionTutorial) {
      let requiredBeaker: 'water' | 'blueDye' | 'destination' | 'waste' | null = null;
      let currentBeaker: 'water' | 'blueDye' | 'destination' | 'waste' | 'none' = 'none';
      
      // Determine required beaker based on current step
      if (currentInteractionStep === 2) {
        // Step 3: Transfer water - need to be in Water beaker first
        requiredBeaker = 'water';
      } else if (currentInteractionStep === 3) {
        // Step 4: Eject tip - need to be over waste bin
        requiredBeaker = 'waste';
      } else if (currentInteractionStep === 5) {
        // Step 6: Transfer blue dye - need to be in Blue Dye beaker
        requiredBeaker = 'blueDye';
      } else if (currentInteractionStep === 6) {
        // Step 7: Mix liquids - need to be in Destination
        requiredBeaker = 'destination';
      } else if (currentInteractionStep === 7) {
        // Step 8: Eject second tip - need to be over waste bin
        requiredBeaker = 'waste';
      }
      
      // Determine current beaker
      if (inSource) {
        currentBeaker = 'water';
      } else if (inSource2 && sourceContainer2) {
        currentBeaker = 'blueDye';
      } else if (inDest) {
        currentBeaker = 'destination';
      } else {
        // Check if over waste bin (using pipetteGroup position like elsewhere)
        if (sceneRef.current.wasteBin && sceneRef.current.gameState.hasTip) {
          const binBox = new THREE.Box3().setFromObject(sceneRef.current.wasteBin);
          const pipettePos = new THREE.Vector3();
          pipetteGroup.getWorldPosition(pipettePos);
          const isOverWasteBin =
            pipettePos.x > binBox.min.x &&
            pipettePos.x < binBox.max.x &&
            pipettePos.z > binBox.min.z &&
            pipettePos.z < binBox.max.z;
          if (isOverWasteBin) {
            currentBeaker = 'waste';
          }
        }
      }
      
      if (requiredBeaker) {
        const isCorrect = currentBeaker === requiredBeaker;
        const beakerNames: Record<string, string> = {
          water: 'Water',
          blueDye: 'Blue Dye',
          destination: 'Destination',
          waste: 'Waste',
        };

        beakerState = {
          value: isCorrect
            ? `Correct beaker: ${beakerNames[requiredBeaker]}`
            : currentBeaker !== 'none'
            ? `Incorrect: ${beakerNames[currentBeaker]}`
            : 'Not in any beaker',
          status: isCorrect ? 'correct' : 'incorrect',
        };
      } else {
        beakerState = { value: '--', status: 'neutral' };
      }
    } else {
      beakerState = { value: '--', status: 'neutral' };
    }

    updateFeedbackStates({
      angle: angleState,
      depth: depthState,
      beaker: beakerState,
    });
  }, [showInteractionTutorial, currentInteractionStep, updateFeedbackStates]);

  // Real-time feedback check
  useEffect(() => {
    if (!sceneRef.current) return;

    const interval = setInterval(() => {
      checkInteraction();
    }, 100); // Update every 100ms

    return () => clearInterval(interval);
  }, [checkInteraction]);

  const showFeedback = (title: string, message: string, type: 'correct' | 'error' | 'neutral' = 'neutral', showTip = false) => {
    // Skip error messages when hand tracking is enabled (ML5 simulation)
    if (type === 'error' && handTrackingEnabled) {
      return;
    }
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
        // Don't reset pipette position - keep it where it is
        
        // Remove one tip from the tip box visually
        const tips = sceneRef.current.tipMeshes[gameState.selectedPipette.id];
        if (tips && tips.length > 0) {
          const tipToRemove = tips.pop(); // Remove last tip
          if (tipToRemove && tipToRemove.parent) {
            tipToRemove.parent.remove(tipToRemove);
            tipToRemove.geometry.dispose();
            (tipToRemove.material as THREE.Material).dispose();
          }
        }
        
        // Keep the tip box visible (don't hide it)
        
        // Show notification in bottom right
        setShowTipAttachedNotification(true);
        setTimeout(() => {
          setShowTipAttachedNotification(false);
        }, 3000);
        
        // Mark tutorial step as completed
        if (!tipAttachedStepCompleted) {
          setTipAttachedStepCompleted(true);
        } else if (!secondTipAttached) {
          setSecondTipAttached(true);
        }
        
        setIsHoveringTipBox(false);
        setTipBoxHoverPosition(null);
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
      setPipetteLiquidType(null); // Reset liquid type when tip is ejected
      
      // Track tutorial progress
      if (!firstTipEjected) {
        setFirstTipEjected(true);
      } else if (!secondTipEjected) {
        setSecondTipEjected(true);
      }
      
      setIsHoveringWasteBin(false);
      setWasteBinHoverPosition(null);
      isHoveringWasteBinRef.current = false;
      wasteBinHoverPositionRef.current = null;
      showFeedback('Tip Ejected', 'The tip has been discarded correctly in the waste bin.', 'correct');
    } else {
      showFeedback('Incorrect Position', 'Move over the red waste bin to eject the tip.', 'error');
    }
  };

  // Helper function to check if tip is in a container
  const isTipInContainer = (tipPos: THREE.Vector3, container: Container): boolean => {
    if (!container || !container.group) return false;
    // Use container group to detect even when liquid is empty
    const containerBox = new THREE.Box3().setFromObject(container.group);
    // Expand the box slightly to make detection more forgiving
    containerBox.expandByScalar(0.1);
    return containerBox.containsPoint(tipPos);
  };

  const stopPlunger = () => {
    if (plungerInterval) {
      clearInterval(plungerInterval);
      setPlungerInterval(null);
    }
    
    if (!sceneRef.current || !activeSourceForAspiration) return;
    const { gameState, pipetteTipMesh, sourceContainer, sourceContainer2 } = sceneRef.current;
    
    // Determine target stop point based on source
    const isBlueDye = sourceContainer2 && activeSourceForAspiration === sourceContainer2;
    const targetStop = isBlueDye ? 20 : 80; // Blue dye stops at 20%, Water at 80%
    const tolerance = 5;
    
    // Check if stopped at correct point (±5% tolerance)
    const stoppedAtCorrectPoint = plungerProgress >= (targetStop - tolerance) && plungerProgress <= (targetStop + tolerance);
    
    if (stoppedAtCorrectPoint) {
      // Success - aspirate based on source
      const aspirationRatio = isBlueDye ? 0.2 : 0.8; // 20% for blue dye, 80% for water
      const sourceVolume = 100; // Both sources have exactly 100 µL
      const aspiratedVolume = sourceVolume * aspirationRatio; // 80 µL for water, 20 µL for blue dye
      
      gameState.liquidInPipette = aspiratedVolume;
      gameState.dispensedStop1 = false;
      
      const tipLiquidMat = pipetteTipMesh.tipLiquid.material as THREE.MeshStandardMaterial;
      if (tipLiquidMat && tipLiquidMat.color) {
        tipLiquidMat.color.set(activeSourceForAspiration.currentColor);
      }
      
      // Remove aspirated volume from source beaker
      const volumeToRemove = aspiratedVolume;
      const volumeRatio = volumeToRemove / activeSourceForAspiration.totalVolume;
      const currentRatio = activeSourceForAspiration.liquidMesh.scale.y;
      const newRatio = Math.max(0, currentRatio - volumeRatio);
      activeSourceForAspiration.liquidMesh.scale.y = newRatio;
      activeSourceForAspiration.currentVolume -= volumeToRemove;
      
      // Hide liquid mesh if empty
      if (newRatio <= 0) {
        activeSourceForAspiration.liquidMesh.visible = false;
    } else {
        // Update liquid position
        const originalHeight = activeSourceForAspiration.height;
        activeSourceForAspiration.liquidMesh.position.y = (originalHeight * newRatio) / 2;
      }
      
      // Show liquid in pipette tip
      animateLiquidTransfer(pipetteTipMesh.tipLiquid, 'in', aspirationRatio);
      
      setFeedbackConsole(`✅ Successfully stopped at ${plungerProgress.toFixed(0)}%! ${aspiratedVolume.toFixed(1)} µL aspirated successfully!`);
      showFeedback('Success!', `Stopped at ${plungerProgress.toFixed(0)}%. ${aspiratedVolume.toFixed(1)} µL aspirated.`, 'correct', true);
      
      // Track liquid type in pipette
      if (activeSourceForAspiration === sourceContainer) {
        setPipetteLiquidType('Water');
        if (!waterTransferred) {
          setWaterTransferred(true);
        }
      } else if (sourceContainer2 && activeSourceForAspiration === sourceContainer2) {
        setPipetteLiquidType('Blue Dye');
        if (!blueDyeTransferred) {
          setBlueDyeTransferred(true);
        }
      }
    } else {
      // Stopped at wrong point
      const isBlueDye = sourceContainer2 && activeSourceForAspiration === sourceContainer2;
      const targetStop = isBlueDye ? 20 : 80;
      showFeedback('Try Again!', `You stopped at ${plungerProgress.toFixed(0)}%. You need to stop at ${targetStop}% (±5%) for accurate aspiration.`, 'error');
    }
    
    setShowPlungerBar(false);
    setIsAspirating(false);
    setPlungerProgress(0);
    setActiveSourceForAspiration(null);
  };

  const aspirateLiquid = () => {
    // This function is now handled by stopPlunger
    // The actual aspiration happens when user clicks stop at 80%
  };

  const dispenseLiquid = (stop: 'stop1' | 'stop2') => {
    if (!sceneRef.current) return;
    const { gameState, destContainer, pipetteTipMesh, sourceContainer, sourceContainer2 } = sceneRef.current;

    // Check if in destination beaker
    const tipPos = getPipetteTipPosition();
    const inDest = destContainer && isTipInContainer(tipPos, destContainer);
    
    if (!inDest) {
      showFeedback('Incorrect Position', 'Move the pipette tip into the destination beaker to dispense.', 'error');
      return;
    }

    // Get the color from the pipette tip (which was set during aspiration)
    const tipLiquidMat = pipetteTipMesh.tipLiquid.material as THREE.MeshStandardMaterial;
    const sourceColor = tipLiquidMat?.color?.clone() || sourceContainer.currentColor.clone();

    let dispenseAmount = 0;
    if (stop === 'stop1') {
      dispenseAmount = gameState.liquidInPipette * 0.98;
      gameState.liquidInPipette -= dispenseAmount;
      gameState.dispensedStop1 = true;
      setDispensedAtDestination(true); // Track that P was pressed at destination
      animateLiquidTransfer(pipetteTipMesh.tipLiquid, 'out', 0.98);
      showFeedback('Dispensed', 'Main volume dispensed. Press B for blow-out.', 'correct', true);
    } else if (stop === 'stop2') {
      dispenseAmount = gameState.liquidInPipette;
      gameState.liquidInPipette = 0;
      gameState.dispensedStop1 = false;
      setBlownOutAtDestination(true); // Track that B was pressed at destination
      setPipetteLiquidType(null); // Reset liquid type when fully dispensed
      animateLiquidTransfer(pipetteTipMesh.tipLiquid, 'out', 1);
      showFeedback('Blow-out Complete', 'All liquid dispensed.', 'correct', true);
      triggerConfetti();
    }

    if (dispenseAmount > 0) {
      const destColor = destContainer.currentColor;
      
      // Update destination beaker volume and visual
      destContainer.currentVolume += dispenseAmount;
      
      // Calculate new liquid height ratio based on volume
      // Use a reference: if 100 µL fills 0.9 of beaker height, calculate ratio
      const referenceVolume = 100; // µL (full beaker capacity)
      const referenceRatio = 0.9; // 90% of beaker height represents 100 µL
      const volumeRatio = Math.min(1.0, (destContainer.currentVolume / referenceVolume) * referenceRatio);
      
      // Get the original geometry height (before any scaling)
      const liquidGeo = destContainer.liquidMesh.geometry as THREE.CylinderGeometry;
      const originalLiquidHeight = liquidGeo.parameters.height;
      const scaledHeight = originalLiquidHeight * volumeRatio;
      
      // Scale the liquid mesh to show the correct height
      destContainer.liquidMesh.scale.y = volumeRatio;
      // Position the liquid at the bottom of the beaker, accounting for the scaled height
      // The beaker's liquid mesh should be positioned relative to the beaker bottom
      destContainer.liquidMesh.position.y = scaledHeight / 2;
      destContainer.liquidMesh.visible = true;
      
      // Update liquid material color and appearance
      const destLiquidMat = destContainer.liquidMesh.material as THREE.MeshStandardMaterial;
      if (destLiquidMat) {
        destLiquidMat.opacity = 0.8;
        
        // If both liquids are in destination, mix to light blue
        if (waterTransferred && blueDyeTransferred && destContainer.currentVolume > dispenseAmount) {
          // Mix to light blue (0x87CEEB)
          const lightBlue = new THREE.Color(0x87CEEB);
          const mixFactor = Math.min(dispenseAmount / destContainer.currentVolume, 0.5);
          const newColor = destColor.clone().lerp(lightBlue, mixFactor);
          destContainer.currentColor.copy(newColor);
          setLiquidsMixed(true);
        } else {
          // Set color based on source (water or blue dye)
          destContainer.currentColor.copy(sourceColor);
        }
        
        if (destLiquidMat.color) {
          destLiquidMat.color.copy(destContainer.currentColor);
        }
      }
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
    const { gameState, sourceContainer, sourceContainer2, destContainer } = sceneRef.current;

    // Auto-select default pipette if in hand tracking mode and none selected
    if (!gameState.selectedPipette) {
      if (handTrackingEnabled) {
        // Auto-select P200 as default for hand tracking
        const defaultPipette = pipettes.find(p => p.id === 'p200');
        if (defaultPipette) {
          gameState.selectedPipette = defaultPipette;
          setSelectedPipetteId(defaultPipette.id);
        }
      } else {
        // Only show error if not in hand tracking mode
        showFeedback('No Pipette', 'Please select a pipette from the panel first.', 'error');
        return;
      }
    }
    if (!gameState.hasTip) {
      showFeedback('No Tip!', 'You must attach a tip from the tip box first.', 'error');
      return;
    }
    if (gameState.liquidInPipette === 0) {
      // Check depth status first
      if (feedbackStates.depth.status !== 'correct') {
        showFeedback('Depth Not Correct', 'Please adjust the pipette depth to the correct level (green indicator) before plunging.', 'error');
        return;
      }
      
      // Check which source container the tip is in
      const tipPos = getPipetteTipPosition();
      const inSource1 = sourceContainer && isTipInContainer(tipPos, sourceContainer);
      const inSource2 = sourceContainer2 && isTipInContainer(tipPos, sourceContainer2);
      
      let activeSource = sourceContainer;
      if (inSource2 && sourceContainer2) {
        activeSource = sourceContainer2;
      } else if (!inSource1 && !inSource2) {
        showFeedback('Incorrect Position', 'Move the pipette tip into a source liquid to aspirate.', 'error');
        return;
      }
      
      // Determine target stop point based on source
      const isBlueDye = sourceContainer2 && activeSource === sourceContainer2;
      const targetStop = isBlueDye ? 20 : 80; // Blue dye stops at 20%, Water at 80%
      
      // Start plunger progress bar from 0% to target stop
      setActiveSourceForAspiration(activeSource);
      setIsAspirating(true);
      setShowPlungerBar(true);
      setPlungerProgress(0); // Start at 0%
      setPlungerTargetStop(targetStop); // Store target stop for UI
      // Reset destination flags when starting new aspiration
      setDispensedAtDestination(false);
      setBlownOutAtDestination(false);
      
      // Start progress animation - stops automatically at target stop for tutorial
      const interval = setInterval(() => {
        setPlungerProgress((prev) => {
          if (prev >= targetStop) {
            clearInterval(interval);
            setPlungerInterval(null); // Clear interval reference
            return targetStop; // Stop at target stop
          }
          // Normal speed progression
          return prev + 2; // Increase by 2% every 50ms
        });
      }, 50);
      setPlungerInterval(interval);
    } else {
      // Check if tip is in destination beaker (use container group, not liquid mesh)
      const tipPos = getPipetteTipPosition();
      const inDest = destContainer && isTipInContainer(tipPos, destContainer);
      if (inDest) {
        dispenseLiquid('stop1');
      } else {
        showFeedback('Incorrect Position', 'Move the pipette tip into the destination beaker (light blue) to dispense.', 'error');
      }
    }
  };

  const handlePlunger2Click = () => {
    if (!sceneRef.current) return;
    const { gameState, destContainer } = sceneRef.current;

    // Auto-select default pipette if in hand tracking mode and none selected
    if (!gameState.selectedPipette && handTrackingEnabled) {
      const defaultPipette = pipettes.find(p => p.id === 'p200');
      if (defaultPipette) {
        gameState.selectedPipette = defaultPipette;
        setSelectedPipetteId(defaultPipette.id);
      }
    }

    if (!gameState.hasTip) {
      showFeedback('No Tip!', 'You must attach a tip from the tip box first.', 'error');
      return;
    }
    if (gameState.liquidInPipette > 0 && gameState.dispensedStop1) {
      // Check if tip is in destination beaker (use container group, not liquid mesh)
      const tipPos = getPipetteTipPosition();
      const inDest = destContainer && isTipInContainer(tipPos, destContainer);
      if (inDest) {
        dispenseLiquid('stop2');
      } else {
        showFeedback('Incorrect Position', 'Move the pipette tip into the destination beaker for blow-out.', 'error');
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
    // Keep pipette above table (tableTopY = 3.7, so minimum should be around 4.5 to stay well above)
    gameState.pipetteY = Math.max(4.5, Math.min(19, gameState.pipetteY)); // Keep above table, max range up to 19
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
    if (pipetteGroup.scale.x !== 0.675 || pipetteGroup.scale.y !== 0.675 || pipetteGroup.scale.z !== 0.675) {
      pipetteGroup.scale.set(0.675, 0.675, 0.675);
    }
  };

  const tiltPipette = (angleDelta: number) => {
    if (!sceneRef.current) return;
    sceneRef.current.pipetteGroup.rotation.z += angleDelta;
    // Update current angle display (convert radians to degrees)
    const angleInDegrees = (sceneRef.current.pipetteGroup.rotation.z * 180) / Math.PI;
    setCurrentAngle(Math.round(angleInDegrees));
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

  // Hand tracking control
  useEffect(() => {
    if (!handTrackingEnabled || !handLandmarks || handLandmarks.length === 0 || !sceneRef.current) {
      // Ensure pipette is vertical when no hand tracking
      if (sceneRef.current?.pipetteGroup) {
        sceneRef.current.pipetteGroup.rotation.z = 0; // Vertical
        setCurrentAngle(0);
      }
      return;
    }

    // Hand landmarks structure (21 points):
    // 0: wrist, 1-4: thumb, 5-8: index, 9-12: middle, 13-16: ring, 17-20: pinky
    const wrist = handLandmarks[0];
    const indexTip = handLandmarks[8];
    const middleTip = handLandmarks[12];
    const thumbTip = handLandmarks[4];
    
    if (!wrist || !indexTip || !middleTip) return;

    // Map hand position to pipette position
    // Normalize hand coordinates (assuming 640x480 video) to 3D space
    // Hand X: 0-640 maps to pipette X: -10 to 10
    // Hand Y: 0-480 maps to pipette Y (height) - keep stable
    // Hand Z (depth estimate) maps to pipette Z: closer = positive Z, further = negative Z
    
    // Mirror X coordinate (flip horizontally) so movement matches hand naturally
    const normalizedX = -((wrist[0] / 640) - 0.5) * 20; // Mirrored: -10 to 10 (flipped)
    // Mirror Y coordinate (flip vertically) so up goes up and down goes down
    // Increased sensitivity for Y movement (multiplier increased from 2 to 8)
    const normalizedY = Math.max(4.5, Math.min(19, 5 + -((wrist[1] / 480) - 0.5) * 8)); // Mirrored Y: inverted, higher sensitivity
    // Map hand depth (Z) to pipette Z: closer to camera = positive Z, further = negative Z
    // wrist[2] is depth: typically ranges from -0.5 to 0.5, where positive is closer
    const normalizedZ = (wrist[2] || 0) * 10; // Depth-based Z: -5 to 5, positive = closer
    
    // Smooth movement
    const { pipetteGroup, gameState } = sceneRef.current;
    const smoothingFactor = 0.1;
    pipetteGroup.position.x += (normalizedX - pipetteGroup.position.x) * smoothingFactor;
    pipetteGroup.position.z += (normalizedZ - pipetteGroup.position.z) * smoothingFactor;
    gameState.pipetteY = normalizedY;
    pipetteGroup.position.y = normalizedY;
    
    // Update slider if exists
    const slider = document.getElementById('heightSlider') as HTMLInputElement;
    if (slider) {
      slider.value = gameState.pipetteY.toString();
    }
    
    // Keep pipette vertical (0 degrees) - don't rotate based on hand orientation
    // Only update position, not rotation
    pipetteGroup.rotation.z = 0; // Always vertical
    setCurrentAngle(0);
    
    // Gesture detection for plunger actions
    // Pinch gesture: thumb and index finger close together
    const thumbToIndexDistance = Math.sqrt(
      Math.pow(thumbTip[0] - indexTip[0], 2) + 
      Math.pow(thumbTip[1] - indexTip[1], 2)
    );
    
    // Thumb open detection: thumb extended away from index finger
    const thumbOpenThreshold = 60; // Distance threshold for thumb open
    
    // Fist gesture: all fingers curled (tips close to base)
    const indexToBaseDistance = Math.sqrt(
      Math.pow(indexTip[0] - handLandmarks[5][0], 2) + 
      Math.pow(indexTip[1] - handLandmarks[5][1], 2)
    );
    const middleToBaseDistance = Math.sqrt(
      Math.pow(middleTip[0] - handLandmarks[9][0], 2) + 
      Math.pow(middleTip[1] - handLandmarks[9][1], 2)
    );
    
    // Thumb click (pinch) for plunger stop 1 (P)
    // Only trigger if not already plunging
    if (thumbToIndexDistance < 30) {
      // Clear thumb open timer if thumb is clicked
      if (thumbOpenTimerRef.current) {
        clearTimeout(thumbOpenTimerRef.current);
        thumbOpenTimerRef.current = null;
      }
      setThumbOpenStartTime(null);
      
      // Update feedback to show "Plunge"
      updateFeedbackStates({
        plunger: { value: 'Plunge', status: 'correct' }
      });
      
      if (!sceneRef.current.gameState.plungerState || sceneRef.current.gameState.plungerState === 'rest') {
        handlePlunger1Click();
      }
    }
    // Thumb open detection
    else if (thumbToIndexDistance > thumbOpenThreshold) {
      // Start timer if not already started
      if (thumbOpenStartTime === null) {
        const startTime = Date.now();
        setThumbOpenStartTime(startTime);
        
        // Set timer for "too long" detection (1.5 seconds)
        thumbOpenTimerRef.current = setTimeout(() => {
          updateFeedbackStates({
            plunger: { value: 'Blow out', status: 'correct' }
          });
        }, 1500);
      }
    }
    // Thumb in neutral position (between click and open)
    else {
      // Clear timer and reset if thumb returns to neutral
      if (thumbOpenTimerRef.current) {
        clearTimeout(thumbOpenTimerRef.current);
        thumbOpenTimerRef.current = null;
      }
      if (thumbOpenStartTime !== null) {
        setThumbOpenStartTime(null);
        // Reset to ready if thumb was open but timer was cleared
        setFeedbackStates((prev) => {
          if (prev.plunger.value === 'Blow out') {
            return {
              ...prev,
              plunger: { value: 'Ready', status: 'neutral' }
            };
          }
          return prev;
        });
      }
    }
    
    // Fist for plunger stop 2 / blow-out (B)
    if (indexToBaseDistance < 40 && middleToBaseDistance < 40 && sceneRef.current.gameState.dispensedStop1) {
      handlePlunger2Click();
    }
    
  }, [handTrackingEnabled, handLandmarks, handlePlunger1Click, handlePlunger2Click, thumbOpenStartTime, updateFeedbackStates]);

  // Cleanup thumb open timer on unmount or when hand tracking is disabled
  useEffect(() => {
    return () => {
      if (thumbOpenTimerRef.current) {
        clearTimeout(thumbOpenTimerRef.current);
        thumbOpenTimerRef.current = null;
      }
    };
  }, [handTrackingEnabled]);

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
      if (pipetteGroup.scale.x !== 0.675 || pipetteGroup.scale.y !== 0.675 || pipetteGroup.scale.z !== 0.675) {
        pipetteGroup.scale.set(0.675, 0.675, 0.675);
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
              className="absolute top-4 right-4 text-black hover:text-slate-700 transition-colors"
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
                <h2 className="text-2xl font-bold text-black mb-3">Welcome to the Tutorial!</h2>
                <p className="text-base text-black leading-relaxed whitespace-pre-wrap">
                  {tutorialScenario.welcomeMessage}
                </p>
              </div>
            </div>
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
              <h3 className="text-sm font-semibold text-black mb-2">Your Task:</h3>
              <div className="text-sm text-black whitespace-pre-wrap leading-relaxed">
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
              Let&apos;s Begin!
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
          currentAngle={currentAngle}
          tipAttached={tipAttachedStepCompleted}
          waterTransferred={waterTransferred}
          firstTipEjected={firstTipEjected}
          secondTipAttached={secondTipAttached}
          blueDyeTransferred={blueDyeTransferred}
          liquidsMixed={liquidsMixed}
          secondTipEjected={secondTipEjected}
          labContainerRef={labContainerRef}
          onNext={() => {
            // Only allow next if prerequisites are met
            if (currentInteractionStep === 0 && currentAngle !== 0) return;
            if (currentInteractionStep === 1 && !tipAttachedStepCompleted) return;
            if (currentInteractionStep === 2 && (!waterTransferred || !dispensedAtDestination || !blownOutAtDestination)) return;
            if (currentInteractionStep === 3 && !firstTipEjected) return;
            if (currentInteractionStep === 4 && !secondTipAttached) return;
            if (currentInteractionStep === 5 && (!blueDyeTransferred || !dispensedAtDestination || !blownOutAtDestination)) return;
            if (currentInteractionStep === 6 && !liquidsMixed) return;
            if (currentInteractionStep === 7 && !secondTipEjected) return;
            
            if (currentInteractionStep < 7) {
              // Reset destination flags when moving to next step
              if (currentInteractionStep === 2 || currentInteractionStep === 5) {
                setDispensedAtDestination(false);
                setBlownOutAtDestination(false);
              }
              setCurrentInteractionStep(currentInteractionStep + 1);
            } else {
              // Tutorial complete
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
        <span className="text-black font-semibold">Back to Dashboard</span>
      </button>

      {/* Zoom Controls - Left Side, Outside Canvas */}
      <div className="fixed top-56 left-4 z-30 bg-white rounded-xl p-3 border-2 border-slate-300 shadow-lg">
        <div className="flex flex-col items-center gap-2">
          <button
            onClick={() => {
              const newZoom = Math.max(3, zoomLevel - 0.5);
              setZoomLevel(newZoom);
              if (sceneRef.current?.camera) {
                sceneRef.current.camera.position.z = newZoom;
              }
            }}
            className="w-8 h-8 flex items-center justify-center rounded-lg border-2 border-slate-300 bg-white text-black hover:bg-slate-50 hover:border-slate-400 transition-colors"
            title="Zoom In"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
            </svg>
          </button>
          <input
            type="range"
            min="3"
            max="12"
            step="0.1"
            value={zoomLevel}
            onChange={(e) => {
              const newZoom = parseFloat(e.target.value);
              setZoomLevel(newZoom);
              if (sceneRef.current?.camera) {
                sceneRef.current.camera.position.z = newZoom;
              }
            }}
            className="h-32 w-8"
            style={{
              writingMode: 'vertical-lr' as React.CSSProperties['writingMode'],
              direction: 'rtl',
            }}
            title={`Zoom: ${zoomLevel.toFixed(1)}`}
          />
          <button
            onClick={() => {
              const newZoom = Math.min(12, zoomLevel + 0.5);
              setZoomLevel(newZoom);
              if (sceneRef.current?.camera) {
                sceneRef.current.camera.position.z = newZoom;
              }
            }}
            className="w-8 h-8 flex items-center justify-center rounded-lg border-2 border-slate-300 bg-white text-black hover:bg-slate-50 hover:border-slate-400 transition-colors"
            title="Zoom Out"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
            </svg>
          </button>
        </div>
      </div>

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
                    <p className="text-base text-black font-medium whitespace-pre-wrap">
                      {tutorialScenario.welcomeMessage}
                    </p>
                    <button
                      onClick={() => setShowMascotWelcome(false)}
                      className="mt-2 text-xs text-black hover:text-slate-700 font-semibold underline"
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
              <h3 className="text-sm font-semibold text-black mb-2">Current Task:</h3>
              <div className="text-sm text-black font-medium whitespace-pre-wrap leading-relaxed">
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
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-300 bg-white text-sm font-semibold text-black hover:border-slate-500 hover:text-black transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-7 7-4-4-4 4 8 8 10-10L19 7z" />
                </svg>
                Pipette colors
              </button>
              <button
                onClick={() => setShowStickyNotesModal(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-300 bg-white text-sm font-semibold text-black hover:border-slate-500 hover:text-black transition-colors"
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
                    : 'bg-white border border-slate-300 text-black'
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
                    : 'bg-white border border-slate-300 text-black'
                }`}
              >
                Quiz
              </button>
            </div>
          </div>

          {/* Live Feedback - 4 boxes in a row */}
          <div id="live-feedback" className="shrink-0 mb-4">
            <h3 className="text-sm font-semibold mb-2 text-black">Live Feedback:</h3>
            <div className="grid grid-cols-4 gap-2">
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
                      <span className="text-xs font-bold text-black">
                        {feedbackStates.angle.value === '--' ? '--' : feedbackStates.angle.value.replace('°', '')}
                      </span>
                    </div>
                  </div>
                  <div className="text-xs text-black text-center">Angle</div>
                </div>
              </div>

              {/* Depth Indicator */}
              <div className="bg-white rounded-lg p-2 border border-slate-300 shadow-sm">
                <div className="flex flex-col items-center">
                  <div className="relative w-10 h-10 mb-1 flex items-end justify-center">
                    {(() => {
                      const depthValue = feedbackStates.depth.value === '--' ? 0 : parseFloat(feedbackStates.depth.value.replace('mm', '')) || 0;
                      // Scale depth for visualization: 0-6mm maps to 0-100% (good range is 2-6mm)
                      const maxDepth = 6;
                      const depthPercent = Math.min(100, Math.max(0, (depthValue / maxDepth) * 100));
                      const depthColor = feedbackStates.depth.status === 'correct' ? 'bg-green-500' : 
                        feedbackStates.depth.status === 'incorrect' ? 'bg-red-500' : 'bg-slate-400';
                      
                      return (
                        <div className="w-3 h-10 bg-slate-200 rounded-full overflow-hidden border border-slate-300 relative">
                          <div 
                            className={`w-full rounded-full transition-all duration-300 ${depthColor}`}
                            style={{ height: `${depthPercent}%` }}
                          />
                        </div>
                      );
                    })()}
                  </div>
                  <div className="text-xs text-black text-center font-semibold">
                    {feedbackStates.depth.value === '--' ? 'Depth' : feedbackStates.depth.value}
                  </div>
                  {feedbackStates.depth.status === 'correct' && feedbackStates.depth.value !== '--' && (
                    <div className="text-[10px] text-green-600 font-semibold mt-0.5">✓ Good</div>
                  )}
                  {feedbackStates.depth.status === 'incorrect' && feedbackStates.depth.value !== '--' && (
                    <div className="text-[10px] text-red-600 font-semibold mt-0.5">✗ Adjust</div>
                  )}
                </div>
              </div>

              {/* Plunger State Indicator */}
              <div className="bg-white rounded-lg p-2 border border-slate-300 shadow-sm">
                <div className="flex flex-col items-center">
                  <div className={`w-3 h-3 rounded-full mb-1 ${
                    feedbackStates.plunger.status === 'correct' ? 'bg-green-500 animate-pulse' : 
                    feedbackStates.plunger.status === 'incorrect' ? 'bg-red-500' : 'bg-slate-400'
                  }`} />
                  <div className="text-xs text-black text-center font-semibold">
                    {feedbackStates.plunger.value}
                  </div>
                </div>
              </div>

              {/* Beaker Status Indicator */}
              <div className="bg-white rounded-lg p-2 border border-slate-300 shadow-sm">
                <div className="flex flex-col items-center">
                  <div className={`w-3 h-3 rounded-full mb-1 ${
                    feedbackStates.beaker.status === 'correct' ? 'bg-green-500 animate-pulse' : 
                    feedbackStates.beaker.status === 'incorrect' ? 'bg-red-500' : 'bg-slate-400'
                  }`} />
                  <div className="text-xs text-black text-center font-semibold mb-0.5">Beaker</div>
                  {feedbackStates.beaker.value !== '--' && (
                    <div className={`text-[9px] text-center font-semibold mt-0.5 leading-tight ${
                      feedbackStates.beaker.status === 'correct' ? 'text-green-600' : 
                      feedbackStates.beaker.status === 'incorrect' ? 'text-red-600' : 
                      'text-black'
                    }`}>
                      {feedbackStates.beaker.status === 'correct' ? '✓' : feedbackStates.beaker.status === 'incorrect' ? '✗' : ''}
            </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Beaker Status Text - Below boxes */}
            {feedbackStates.beaker.value !== '--' && (
              <div className={`mt-2 p-2 rounded-lg border-2 text-xs font-semibold text-center ${
                feedbackStates.beaker.status === 'correct' 
                  ? 'bg-green-50 border-green-300 text-green-700' 
                  : feedbackStates.beaker.status === 'incorrect'
                  ? 'bg-red-50 border-red-300 text-black'
                  : 'bg-slate-50 border-slate-300 text-black'
              }`}>
                {feedbackStates.beaker.value}
              </div>
            )}
            
            {/* Live Feedback - Pipette Contents */}
            {sceneRef.current && sceneRef.current.gameState.liquidInPipette > 0 && pipetteLiquidType && (
              <div className="mt-4 bg-white rounded-lg p-3 border border-slate-300 shadow-sm">
                <div className="text-xs font-semibold text-black mb-1">Pipette Contains:</div>
                <div className="text-sm font-bold text-black">
                  {pipetteLiquidType}: {sceneRef.current.gameState.liquidInPipette.toFixed(1)} µL
                </div>
              </div>
            )}
          </div>

          {/* Scrollable Content Area */}
          <div className="relative z-10 flex-1 overflow-y-auto mb-4">
          {/* Pipetting Module */}
          {activeTab === 'pipetting' && (
            <div className="bg-white p-4 rounded-lg shadow-lg border border-slate-300 mb-4">
              <h2 className="text-xl font-semibold mb-4 text-black">Pipetting Practice</h2>
              <div className="mb-4">
                <label htmlFor="volume-select" className="block text-sm font-medium mb-2 text-black">
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
                <h3 className="text-md font-medium mb-2 text-black">Select Pipette:</h3>
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
              <h2 className="text-xl font-semibold mb-4 text-black">Pipetting Quiz</h2>
              <p className="text-sm text-black mb-4">Test your knowledge of proper pipetting techniques.</p>
              <p className="text-sm text-center text-black italic mb-4">
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
            <h3 className="text-lg font-semibold mb-3 text-black">Controls</h3>
            
            {/* Actions - Above Controls */}
            <div className="mb-4">
              <h4 className="text-sm font-semibold mb-2 text-black">Actions</h4>
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
                  className="control-btn bg-white border-2 border-slate-400 hover:border-slate-600 text-black rounded-lg w-full h-10 text-sm font-semibold shadow-md text-center"
                >
                  Eject Tip
                </button>
              </div>
            </div>

            {/* Movement Controls */}
            <div id="movement-controls" className="bg-white p-4 rounded-lg border border-slate-300">
              <h4 className="text-sm font-semibold mb-3 text-black">Movement</h4>
              
              {/* Row 1: Arrow Keys | Height */}
              <div className="flex items-center gap-4 justify-center mb-4">
                {/* Arrow Keys */}
                <div className="flex flex-col items-center gap-2">
                  <div className="text-xs font-bold text-slate-700 uppercase">Arrow Keys</div>
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
                    <div></div>
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
                </div>
                
                {/* Separator */}
                <div className="h-32 w-px bg-slate-300"></div>
                
                {/* Height Controls */}
                <div className="flex flex-col items-center gap-2">
                  <div className="text-center mb-1">
                    <div className="text-xs font-bold text-slate-700 uppercase">Height</div>
                    <div className="text-xs text-black">W / S</div>
                  </div>
                  <div className="relative h-32 w-8 flex items-center justify-center">
                    <input
                      type="range"
                      id="heightSlider"
                      min="4.5"
                      max="19"
                      step="0.1"
                      defaultValue="5"
                      className="h-32 w-8"
                      style={{
                        writingMode: 'vertical-lr' as React.CSSProperties['writingMode'],
                        direction: 'rtl',
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
              </div>
              
              {/* Row 2: Orientation | Current Angle */}
              <div className="flex items-center gap-4 justify-center pt-4 border-t border-slate-200">
                {/* Orientation Controls */}
                <div className="flex flex-col items-center gap-2">
                  <div className="text-xs font-bold text-slate-700 uppercase mb-2">Orientation</div>
                  <div className="flex items-center gap-2">
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
                
                {/* Separator */}
                <div className="h-12 w-px bg-slate-300"></div>
                
                {/* Current Angle Display */}
                <div className="flex flex-col items-center gap-1">
                  <div className="text-xs font-bold text-slate-700 uppercase">Current Angle</div>
                  <div className="relative">
                    <input
                      id="angle-input"
                      type="number"
                      value={currentAngle}
                      onChange={(e) => {
                        const newAngle = parseInt(e.target.value) || 0;
                        setCurrentAngle(newAngle);
                        if (sceneRef.current) {
                          // Convert degrees to radians and set rotation
                          sceneRef.current.pipetteGroup.rotation.z = (newAngle * Math.PI) / 180;
                        }
                      }}
                      className={`px-2 pr-6 py-2 rounded-lg border-2 w-[100px] text-center text-lg font-bold transition-colors ${
                        currentAngle === 0
                          ? 'bg-green-50 border-green-500 text-green-700'
                          : 'bg-slate-100 border-slate-300 text-slate-900'
                      }`}
                      style={{ WebkitAppearance: 'textfield', MozAppearance: 'textfield' }}
                    />
                    <span className={`absolute right-1 top-1/2 -translate-y-1/2 pointer-events-none text-sm font-semibold ${
                      currentAngle === 0 ? 'text-green-600' : 'text-black'
                    }`}>°</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tip Attached Notification - Bottom Right */}
      {showTipAttachedNotification && (
        <div className="fixed bottom-4 right-4 z-[200] bg-green-500 text-white px-6 py-4 rounded-lg shadow-2xl animate-fade-in">
          <div className="flex items-center gap-3">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="font-semibold text-lg">Tip Attached!</span>
          </div>
        </div>
      )}

      {/* Attach Tip Button - Shows when hovering over tip box */}
      {isHoveringTipBox && tipBoxHoverPosition && !sceneRef.current?.gameState.hasTip && (
        <div
          className="fixed z-[200] pointer-events-auto"
          style={{
            left: `${tipBoxHoverPosition.x}px`,
            top: `${tipBoxHoverPosition.y - 60}px`,
            transform: 'translateX(-50%)',
          }}
        >
          <button
            onClick={attachTip}
            className="bg-[#D8F878] text-[#001C3D] font-semibold px-6 py-3 rounded-lg shadow-2xl hover:brightness-110 transition-all border-2 border-[#001C3D]"
          >
            Attach Tip
          </button>
        </div>
      )}

      {/* Throw Tip Button - Shows when hovering over waste bin */}
      {isHoveringWasteBin && wasteBinHoverPosition && sceneRef.current?.gameState.hasTip && (
        <div
          className="fixed z-[200] pointer-events-auto"
          style={{
            left: `${wasteBinHoverPosition.x}px`,
            top: `${wasteBinHoverPosition.y - 60}px`,
            transform: 'translateX(-50%)',
          }}
        >
          <button
            onClick={ejectTip}
            className="bg-red-500 text-white font-semibold px-6 py-3 rounded-lg shadow-2xl hover:brightness-110 transition-all border-2 border-red-700"
          >
            Throw Tip
          </button>
        </div>
      )}

      {/* Plunger Bar - Shows when plunging */}
      {showPlungerBar && (
        <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 z-[200] bg-white/95 backdrop-blur-xl rounded-xl p-6 shadow-2xl border-2 border-blue-500 min-w-[400px]">
          <div className="text-center mb-4">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Plunger Progress</h3>
            <p className="text-sm text-black">
              {plungerProgress >= plungerTargetStop 
                ? `Paused at ${plungerTargetStop}% - Click Stop to confirm` 
                : `Plunger will pause at ${plungerTargetStop}% - Click Stop when it pauses`}
            </p>
          </div>
          <div className="relative w-full h-12 bg-slate-200 rounded-full overflow-hidden border-2 border-slate-300 mb-4">
            <div 
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-100 ease-linear"
              style={{ width: `${plungerProgress}%` }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-lg font-bold text-slate-900 z-10">
                {plungerProgress.toFixed(1)}%
              </span>
            </div>
            {/* Target stop marker */}
            <div 
              className="absolute top-0 bottom-0 w-0.5 bg-green-500 z-20"
              style={{ left: `${plungerTargetStop}%` }}
            />
          </div>
          <div className="flex justify-center">
            <button
              onClick={stopPlunger}
              className={`font-semibold px-8 py-3 rounded-lg shadow-lg hover:brightness-110 transition-all border-2 ${
                plungerProgress >= plungerTargetStop
                  ? 'bg-green-500 text-white border-green-700 animate-pulse'
                  : 'bg-red-500 text-white border-red-700'
              }`}
            >
              {plungerProgress >= plungerTargetStop ? `Click to Confirm Stop at ${plungerTargetStop}%` : 'Stop'}
            </button>
          </div>
        </div>
      )}

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
                        parent.innerHTML = `<div class="text-black text-center p-8"><p class="text-lg">${emoji}</p><p class="text-sm mt-2">${message}</p></div>`;
                      }
                    }}
                  />
                </div>
                <p id="quiz-results-encouragement" className="text-sm text-black mb-6 px-4">
                  {selectedMeme.text}
                </p>
              </>
            ) : (
              <div className="mb-6">
                <div className="w-full max-w-xs mx-auto h-60 bg-gray-100 rounded-md flex items-center justify-center mb-4">
                  <p className="text-black text-lg">🎉</p>
                </div>
                <p className="text-sm text-black mb-6 px-4">
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
                <p className="text-sm uppercase tracking-wide text-black font-semibold">Sticky notes</p>
                <h3 className="text-2xl font-semibold text-black">Pin simulation insights</h3>
              </div>
              <button
                onClick={() => setShowStickyNotesModal(false)}
                className="text-black hover:text-slate-700 transition-colors"
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
                  <label className="text-sm font-semibold text-black">Pick a color</label>
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
                  <label htmlFor="sticky-note-content" className="text-sm font-semibold text-black">
                    Write a note
                  </label>
                  <textarea
                    id="sticky-note-content"
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    maxLength={250}
                    rows={3}
                    className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-black focus:outline-none focus:ring-2 focus:ring-slate-300"
                    placeholder="Example: Pre-wet tips twice before aspirating viscous buffers."
                  />
                  <div className="flex items-center justify-between text-xs text-black">
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
                  <div className="col-span-full text-center text-black text-sm py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
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
                <p className="text-sm uppercase tracking-wide text-black font-semibold">Select pipette</p>
                <h3 className="text-2xl font-semibold text-black">Color-coded pipette families</h3>
                <p className="text-sm text-black">
                  Choose the pipette that matches your target volume. Tip color updates instantly.
                </p>
              </div>
              <button
                onClick={() => setShowPipettePalette(false)}
                className="text-black hover:text-slate-700 transition-colors"
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
                    <p className="text-xl font-semibold text-black">{pipette.name}</p>
                    <p className="text-sm text-black">{pipette.min} - {pipette.max} µL</p>
                    <p className="text-xs text-black mt-1">Tap to equip. Tip will glow in this color.</p>
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
                className="text-black hover:text-slate-700 text-2xl"
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

