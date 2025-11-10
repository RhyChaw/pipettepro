'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import Image from 'next/image';

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

const memes = [
  { url: 'https://i.imgflip.com/3953od.jpg', text: "Great job! Even when experiments don't go as planned, every attempt is a step forward." },
  { url: 'https://i.redd.it/5p9e6z7q5t951.jpg', text: "You're doing amazing! Science is all about persistence." },
  { url: 'https://i.pinimg.com/736x/e0/75/95/e0759525413a1a64a37237855f135a58.jpg', text: "Fantastic work! Remember, every expert was once a beginner." },
];

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

  const sceneRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
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
  } | null>(null);

  useEffect(() => {
    if (!labContainerRef.current) return;

    const labContainer = labContainerRef.current;
    let animationId: number;

    // Initialize Three.js scene
    const scene = new THREE.Scene();
    scene.background = null;

    const width = labContainer.clientWidth;
    const height = labContainer.clientHeight;

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    camera.position.set(0, 8, 14);
    camera.lookAt(0, 1, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    labContainer.appendChild(renderer.domElement);

    // Lighting
    scene.add(new THREE.AmbientLight(0xffffff, 0.7));
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.9);
    directionalLight.position.set(5, 10, 7.5);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    // Create lab bench
    const benchGeo = new THREE.BoxGeometry(15, 0.2, 8);
    const benchMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 0.4, metalness: 0.1 });
    const labBench = new THREE.Mesh(benchGeo, benchMat);
    labBench.receiveShadow = true;
    scene.add(labBench);

    const intersectPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.1);

    // Helper function to create containers
    const createContainer = (x: number, z: number, radius: number, height: number, initialLiquidRatio: number, color: number): Container => {
      const group = new THREE.Group();
      group.position.set(x, 0.1, z);
      const wallThickness = 0.05;

      const points: THREE.Vector2[] = [];
      points.push(new THREE.Vector2(radius * 0.95, 0));
      points.push(new THREE.Vector2(radius, 0));
      points.push(new THREE.Vector2(radius, height - 0.2));
      points.push(new THREE.Vector2(radius + 0.15, height));

      const beakerGeo = new THREE.LatheGeometry(points, 32);
      const beakerMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.3,
        roughness: 0.1,
        metalness: 0.1,
        side: THREE.DoubleSide,
      });
      const beakerMesh = new THREE.Mesh(beakerGeo, beakerMat);
      group.add(beakerMesh);

      const liquidHeight = (height - wallThickness) * initialLiquidRatio;
      const liquidGeo = new THREE.CylinderGeometry(radius - wallThickness, radius - wallThickness, liquidHeight, 32);
      const liquidMat = new THREE.MeshStandardMaterial({ color: color, roughness: 0.2 });
      const liquidMesh = new THREE.Mesh(liquidGeo, liquidMat);
      liquidMesh.position.y = liquidHeight / 2 + wallThickness;
      group.add(liquidMesh);

      const totalVolume = Math.PI * Math.pow(radius - wallThickness, 2) * (height - wallThickness);
      const currentVolume = totalVolume * initialLiquidRatio;

      return {
        group,
        liquidMesh,
        initialLiquidRatio,
        height: height,
        totalVolume: totalVolume,
        currentColor: new THREE.Color(color),
        currentVolume: currentVolume,
      };
    };

    const destContainer = createContainer(-4, 0, 1.5, 2.5, 0.2, 0x60a5fa);
    const sourceContainer = createContainer(4, 0, 0.8, 2.0, 0.9, 0x001c3d);
    scene.add(sourceContainer.group, destContainer.group);

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
      tipBoxGroup.position.set(0, 0.1, 2);
      return tipBoxGroup;
    };

    pipettes.forEach((pipette) => {
      const tipBoxGroup = createTipBox(pipette.color);
      tipBoxGroup.visible = false;
      tipBoxes[pipette.id] = tipBoxGroup;
      scene.add(tipBoxGroup);
    });

    // Create waste bin
    const binGroup = new THREE.Group();
    const binGeo = new THREE.CylinderGeometry(0.8, 0.7, 1.5, 16);
    const binMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.6 });
    const binMesh = new THREE.Mesh(binGeo, binMat);
    binMesh.position.y = 0.75;
    binGroup.add(binMesh);
    binGroup.position.set(6, 0.1, 2);
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

    // Store refs for use in handlers
    sceneRef.current = {
      scene,
      camera,
      renderer,
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
      if (labContainer && renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
      renderer.dispose();
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
      showFeedback(
        'Incorrect Pipette',
        `This ${pipette.name} pipette has a range of ${pipette.min}-${pipette.max} µL. It's not suitable for ${gameState.targetVolume} µL.`,
        'error'
      );
      return;
    }

    gameState.selectedPipette = pipette;
    setSelectedPipetteId(pipette.id);

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
      showFeedback('Success!', `${gameState.targetVolume} µL aspirated.`, 'correct', true);
    } else {
      gameState.liquidInPipette = gameState.targetVolume * 0.9;
      gameState.dispensedStop1 = false;
      const tipLiquidMat = pipetteTipMesh.tipLiquid.material as THREE.MeshStandardMaterial;
      if (tipLiquidMat && tipLiquidMat.color) {
        tipLiquidMat.color.set(sourceContainer.currentColor);
      }
      animateLiquidTransfer(sourceContainer.liquidMesh, 'out', 0.9);
      animateLiquidTransfer(pipetteTipMesh.tipLiquid, 'in', 0.9);
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
    // Use smaller step size for finer control
    const stepSize = 0.1;
    gameState.pipetteY += deltaY * stepSize;
    gameState.pipetteY = Math.max(1.5, Math.min(5, gameState.pipetteY));
    pipetteGroup.position.y = gameState.pipetteY;
  };

  const movePipetteHorizontal = (deltaX: number, deltaZ: number) => {
    if (!sceneRef.current) return;
    sceneRef.current.pipetteGroup.position.x += deltaX;
    sceneRef.current.pipetteGroup.position.z += deltaZ;
  };

  const tiltPipette = (angleDelta: number) => {
    if (!sceneRef.current) return;
    sceneRef.current.pipetteGroup.rotation.z += angleDelta;
  };

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
      pipetteGroup.position.x = intersectPoint.x;
      pipetteGroup.position.z = intersectPoint.z;
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
    const { questions, currentQuestionIndex } = quizData;
    if (currentQuestionIndex < questions.length - 1) {
      setQuizData((prev) => ({ ...prev, currentQuestionIndex: prev.currentQuestionIndex + 1 }));
    } else {
      endQuiz();
    }
  };

  const endQuiz = () => {
    setShowQuizModal(false);
    setShowQuizResults(true);
    // Results will be shown in the modal
  };

  const retryIncorrectQuestions = () => {
    setShowQuizResults(false);
    startQuiz(quizData.incorrectQuestions);
  };

  const currentQuestion = quizData.questions[quizData.currentQuestionIndex];

  return (
    <div className="flex flex-col md:flex-row h-screen bg-slate-200" style={{ fontFamily: "'Montserrat', sans-serif" }}>
      {/* Main Simulation Area */}
      <div
        ref={labContainerRef}
        id="labContainer"
        className="w-full md:w-2/3 h-1/2 md:h-full relative overflow-hidden"
        style={{
          cursor: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z"></path><path d="M13 13l6 6"></path></svg>') 16 16, auto`,
          backgroundImage: 'radial-gradient(circle, #332277, #001C3D)',
        }}
      >
        {/* Pipette Action Controls */}
        <div
          id="pipetteActionControls"
          className="absolute bottom-4 left-4 flex flex-col items-center space-y-3 p-3 bg-slate-900/10 backdrop-blur-sm border border-white/20 rounded-xl shadow-lg z-10 w-40"
        >
          <div className="flex items-center justify-between space-x-2 w-full">
            <button
              id="heightDownBtn"
              onClick={() => movePipetteVertical(-0.2)}
              className="control-btn bg-white/30 backdrop-blur-sm text-[#001C3D] rounded-lg w-12 h-12 text-2xl font-semibold shadow-md grow"
            >
              -
            </button>
            <div className="text-center text-xs font-bold text-white uppercase tracking-wider">Height</div>
            <button
              id="heightUpBtn"
              onClick={() => movePipetteVertical(0.2)}
              className="control-btn bg-white/30 backdrop-blur-sm text-[#001C3D] rounded-lg w-12 h-12 text-2xl font-semibold shadow-md grow"
            >
              +
            </button>
          </div>
          <button
            id="plungerStop1Btn"
            onClick={handlePlunger1Click}
            className="control-btn bg-[#E47CB8] text-white rounded-lg w-full h-14 text-sm font-semibold shadow-md text-center leading-tight"
          >
            Plunger
            <br />
            <span className="text-[11px] font-normal">(Aspirate/Dispense)</span>
          </button>
          <button
            id="plungerStop2Btn"
            onClick={handlePlunger2Click}
            className="control-btn bg-[#9448B0] text-white rounded-lg w-full h-14 text-sm font-semibold shadow-md text-center leading-tight"
          >
            Blow-out
            <br />
            <span className="text-xs font-normal">(Stop 2)</span>
          </button>
          <button
            id="ejectTipBtn"
            onClick={ejectTip}
            className="control-btn bg-transparent text-white border-2 border-white rounded-lg w-full h-12 text-sm font-semibold shadow-md text-center leading-tight"
          >
            Eject Tip
          </button>
        </div>

        {/* On-screen Controls */}
        <div id="onScreenControls" className="absolute bottom-4 right-4 grid grid-cols-3 gap-1 w-48 text-2xl z-10">
          <div className="flex justify-center items-center">
            <button
              id="tiltLeftBtn"
              onClick={() => tiltPipette(0.1)}
              className="d-pad-btn bg-white/40 backdrop-blur-sm text-[#001C3D] p-3 rounded-full aspect-square shadow-md"
              title="Tilt Left"
            >
              &#x21B6;
            </button>
          </div>
          <div className="flex justify-center items-center">
            <button
              id="arrowUp"
              onClick={() => movePipetteHorizontal(0, -0.2)}
              className="d-pad-btn bg-white/40 backdrop-blur-sm text-[#001C3D] p-3 rounded-full aspect-square shadow-md"
              title="Move Forward"
            >
              &uarr;
            </button>
          </div>
          <div className="flex justify-center items-center">
            <button
              id="tiltRightBtn"
              onClick={() => tiltPipette(-0.1)}
              className="d-pad-btn bg-white/40 backdrop-blur-sm text-[#001C3D] p-3 rounded-full aspect-square shadow-md"
              title="Tilt Right"
            >
              &#x21B7;
            </button>
          </div>
          <div className="flex justify-center items-center">
            <button
              id="arrowLeft"
              onClick={() => movePipetteHorizontal(-0.2, 0)}
              className="d-pad-btn bg-white/40 backdrop-blur-sm text-[#001C3D] p-3 rounded-full aspect-square shadow-md"
              title="Move Left"
            >
              &larr;
            </button>
          </div>
          <div className="flex justify-center items-center"></div>
          <div className="flex justify-center items-center">
            <button
              id="arrowRight"
              onClick={() => movePipetteHorizontal(0.2, 0)}
              className="d-pad-btn bg-white/40 backdrop-blur-sm text-[#001C3D] p-3 rounded-full aspect-square shadow-md"
              title="Move Right"
            >
              &rarr;
            </button>
          </div>
          <div></div>
          <div className="flex justify-center items-center">
            <button
              id="arrowDown"
              onClick={() => movePipetteHorizontal(0, 0.2)}
              className="d-pad-btn bg-white/40 backdrop-blur-sm text-[#001C3D] p-3 rounded-full aspect-square shadow-md"
              title="Move Backward"
            >
              &darr;
            </button>
          </div>
          <div></div>
        </div>
      </div>

      {/* Control Panel */}
      <div
        className="w-full md:w-1/3 h-1/2 md:h-full p-4 overflow-y-auto relative flex flex-col"
        style={{
          backgroundImage: 'linear-gradient(to bottom right, #9448B0, #332277, #001C3D)',
          color: '#f0f0f0',
        }}
      >
        {/* Bacteria Animation Container */}
        <div
          id="panel-bacteria-animation-container"
          className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden z-0"
        >
          <div
            className="absolute bottom-[-20px] left-[15%] opacity-0"
            style={{
              width: '25px',
              height: '10px',
              animation: 'floatPanel 25s infinite linear 0s',
            }}
          >
            <svg viewBox="0 0 25 10" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="25" height="10" rx="5" fill="#D8F878" />
            </svg>
          </div>
          <div
            className="absolute bottom-[-20px] left-[45%] opacity-0"
            style={{
              width: '15px',
              height: '15px',
              animation: 'floatPanel 22s infinite linear 3s',
            }}
          >
            <svg viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="7.5" cy="7.5" r="7.5" fill="#E47CB8" />
            </svg>
          </div>
          <div
            className="absolute bottom-[-20px] left-[75%] opacity-0"
            style={{
              width: '30px',
              height: '12px',
              animation: 'floatPanel 28s infinite linear 1s',
            }}
          >
            <svg viewBox="0 0 30 12" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="30" height="12" rx="6" fill="#D8F878" />
            </svg>
          </div>
        </div>

        <div className="relative z-10 shrink-0">
          <h1 className="text-3xl font-bold mb-6 border-b border-white/20 pb-4 flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mr-2 text-[#D8F878]"
            >
              <path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5S5 13 5 15a7 7 0 0 0 7 7z"></path>
            </svg>
            <span>
              Pipette<span style={{ color: '#D8F878' }}>Pro</span>
            </span>
          </h1>
          <div className="grid grid-cols-2 gap-2 mb-6">
            <button
              id="pipetting-tab-btn"
              onClick={() => setActiveTab('pipetting')}
              className={`tab-button font-semibold py-2 px-1 rounded-md text-sm transition-all ${
                activeTab === 'pipetting'
                  ? 'bg-[#D8F878] text-[#001C3D] font-bold border-[#D8F878]'
                  : 'bg-white/10 border border-white/20'
              }`}
            >
              Practice
            </button>
            <button
              id="quiz-tab-btn"
              onClick={() => setActiveTab('quiz')}
              className={`tab-button font-semibold py-2 px-1 rounded-md text-sm transition-all ${
                activeTab === 'quiz'
                  ? 'bg-[#D8F878] text-[#001C3D] font-bold border-[#D8F878]'
                  : 'bg-white/10 border border-white/20'
              }`}
            >
              Quiz
            </button>
          </div>
        </div>

        <div className="relative z-10 grow overflow-y-auto">
          {/* Pipetting Module */}
          {activeTab === 'pipetting' && (
            <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg shadow-lg border border-white/20">
              <h2 className="text-xl font-semibold mb-4">Pipetting Practice</h2>
              <div className="mb-4">
                <label htmlFor="volume-select" className="block text-sm font-medium mb-2">
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
                <h3 className="text-md font-medium mb-2">Select Pipette:</h3>
                <div id="pipette-selection" className="grid grid-cols-2 gap-2">
                  {pipettes.map((pipette) => (
                    <button
                      key={pipette.id}
                      onClick={() => selectPipette(pipette)}
                      className={`p-2 border border-white/40 rounded-md text-sm hover:brightness-105 transition-all font-semibold ${
                        selectedPipetteId === pipette.id ? 'ring-2 ring-[#D8F878] ring-offset-2' : ''
                      }`}
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
                      }}
                    >
                      {pipette.name}
                    </button>
                  ))}
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
              <div id="technique-feedback" className="mt-6 space-y-2">
                <h3 className="text-md font-medium mb-2">Real-Time Feedback:</h3>
                <div id="feedback-angle" className="flex items-center p-2 bg-black/20 rounded-md">
                  <span
                    className="w-6 h-6 rounded-full mr-3"
                    style={{
                      backgroundColor:
                        feedbackStates.angle.status === 'correct'
                          ? '#D8F878'
                          : feedbackStates.angle.status === 'incorrect'
                            ? '#E47CB8'
                            : '#9ca3af',
                    }}
                  ></span>
                  <span>
                    Angle: <span className="font-semibold">{feedbackStates.angle.value}</span>
                  </span>
                </div>
                <div id="feedback-depth" className="flex items-center p-2 bg-black/20 rounded-md">
                  <span
                    className="w-6 h-6 rounded-full mr-3"
                    style={{
                      backgroundColor:
                        feedbackStates.depth.status === 'correct'
                          ? '#D8F878'
                          : feedbackStates.depth.status === 'incorrect'
                            ? '#E47CB8'
                            : '#9ca3af',
                    }}
                  ></span>
                  <span>
                    Immersion Depth: <span className="font-semibold">{feedbackStates.depth.value}</span>
                  </span>
                </div>
                <div id="feedback-plunger" className="flex items-center p-2 bg-black/20 rounded-md">
                  <span
                    className="w-6 h-6 rounded-full mr-3"
                    style={{
                      backgroundColor:
                        feedbackStates.plunger.status === 'correct'
                          ? '#D8F878'
                          : feedbackStates.plunger.status === 'incorrect'
                            ? '#E47CB8'
                            : '#9ca3af',
                    }}
                  ></span>
                  <span>
                    Plunger: <span className="font-semibold">{feedbackStates.plunger.value}</span>
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Quiz Module */}
          {activeTab === 'quiz' && (
            <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg shadow-lg border border-white/20">
              <h2 className="text-xl font-semibold mb-4">Pipetting Quiz</h2>
              <p className="text-sm text-gray-300 mb-4">Test your knowledge of proper pipetting techniques.</p>
              <p className="text-sm text-center text-gray-400 italic mb-4">
                You got this! Every question is a chance to learn.
              </p>
              <div className="space-y-3">
                <a
                  href="/quiz"
                  className="block w-full bg-[#9448B0] text-white px-4 py-2 rounded-md shadow-md hover:bg-[#A058C0] text-center font-semibold transition-all"
                >
                  Advanced Quiz System
                </a>
                <button
                  id="start-quiz-btn"
                  onClick={() => startQuiz()}
                  className="w-full bg-[#D8F878] text-[#001C3D] px-4 py-2 rounded-md shadow-md hover:bg-[#C8E868] font-semibold transition-all"
                >
                  Quick Practice Quiz
                </button>
              </div>
            </div>
          )}
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
          className="fixed z-50 left-0 top-0 w-full h-full overflow-auto bg-[rgba(0,28,61,0.5)] flex justify-center items-center"
          onClick={() => setShowQuizModal(false)}
        >
          <div
            className="bg-white/90 backdrop-blur-md border border-white/20 rounded-lg p-8 max-w-xl w-full shadow-2xl text-[#001C3D]"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="quiz-question" className="text-xl font-bold mb-4">
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
                    className={`w-full text-left p-3 border rounded-md transition-colors ${
                      isCorrect && quizFeedback.show
                        ? 'bg-lime-200 border-lime-400'
                        : isWrong
                          ? 'bg-red-200 border-red-400'
                          : 'border-gray-300 hover:bg-gray-100'
                    } ${quizFeedback.show ? 'cursor-not-allowed' : ''}`}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
            {quizFeedback.show && (
              <div
                id="quiz-feedback"
                className={`mt-6 p-4 rounded-md ${quizFeedback.isCorrect ? 'bg-lime-100' : 'bg-red-100'}`}
              >
                <p
                  id="quiz-feedback-text"
                  className="mb-4 text-left"
                  dangerouslySetInnerHTML={{
                    __html: `<strong class="${quizFeedback.isCorrect ? 'text-green-700' : 'text-red-700'}">${
                      quizFeedback.isCorrect ? 'Correct!' : 'Not quite...'
                    }</strong><br>${quizFeedback.explanation}`,
                  }}
                ></p>
                <button
                  id="quiz-next-btn"
                  onClick={nextQuestion}
                  className="w-full bg-[#9448B0] text-white px-6 py-2 rounded-md hover:bg-[#A058C0]"
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
          className="fixed z-50 left-0 top-0 w-full h-full overflow-auto bg-[rgba(0,28,61,0.5)] flex justify-center items-center"
          onClick={() => setShowQuizResults(false)}
        >
          <div
            className="bg-white/90 backdrop-blur-md border border-white/20 rounded-lg p-8 max-w-md w-full shadow-2xl text-center text-[#001C3D]"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="quiz-results-title" className="text-2xl font-bold mb-2">
              {quizData.score === quizData.questions.length ? 'Flawless Victory!' : 'Great Effort!'}
            </h2>
            <p id="quiz-results-message" className="mb-4 font-semibold">
              You scored {quizData.score} out of {quizData.questions.length}.
            </p>
            <Image
              id="quiz-meme"
              src={memes[Math.floor(Math.random() * memes.length)].url}
              alt="Encouraging meme"
              width={320}
              height={240}
              className="max-w-xs mx-auto rounded-md shadow-lg mb-4"
              unoptimized
            />
            <p id="quiz-results-encouragement" className="text-sm text-gray-600 mb-6">
              {memes[Math.floor(Math.random() * memes.length)].text}
            </p>
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
    </div>
  );
}

