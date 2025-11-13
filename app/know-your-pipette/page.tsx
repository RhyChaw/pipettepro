'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export default function KnowYourPipettePage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showObjectButtons, setShowObjectButtons] = useState(false);
  const [freeRoamMode, setFreeRoamMode] = useState(false);
  const [showWelcomeScreen, setShowWelcomeScreen] = useState(false);
  const [showLearningPage, setShowLearningPage] = useState(false);
  const [activeTab, setActiveTab] = useState('Pipette');
  const [debugInfo, setDebugInfo] = useState({
    cameraPosition: { x: 0, y: 0, z: 0 },
    modelPosition: { x: 0, y: 0, z: 0 },
    modelScale: { x: 1, y: 1, z: 1 },
    modelRotation: { x: 0, y: 0, z: 0 },
    boundingBox: { min: { x: 0, y: 0, z: 0 }, max: { x: 0, y: 0, z: 0 }, size: { x: 0, y: 0, z: 0 } },
  });
  const sceneRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    model: THREE.Group | null;
    controls: { rotationX: number; rotationY: number; zoom: number };
    isAnimating: boolean;
    freeRoam: boolean;
    cameraVelocity: { x: number; y: number; z: number };
    lockedRotation: boolean;
  } | null>(null);
  const showLearningPageRef = useRef(false);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    let animationId: number;

    // Initialize Three.js scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffffff); // White background

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;
    console.log('Container dimensions:', width, 'x', height);
    console.log('Container element:', container);
    console.log('Container computed style:', window.getComputedStyle(container));
    
    // Ensure container has proper size
    if (width === 0 || height === 0) {
      console.error('Container has zero size!', { width, height });
    }

    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 5000);
    // Start position for animation
    const startCameraPos = new THREE.Vector3(-8.77, 3.6, -21.89);
    camera.position.copy(startCameraPos);
    const initialModelCenter = new THREE.Vector3(3.08, -8.07, -0.84);
    camera.lookAt(initialModelCenter);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.setClearColor(0xffffff, 1); // White background
    renderer.domElement.style.position = 'absolute';
    renderer.domElement.style.top = '0';
    renderer.domElement.style.left = '0';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.zIndex = '1';
    renderer.domElement.style.pointerEvents = 'auto';
    container.appendChild(renderer.domElement);
    console.log('Renderer canvas added. Canvas size:', renderer.domElement.width, 'x', renderer.domElement.height);

    // Lighting - brighter for better visibility
    scene.add(new THREE.AmbientLight(0xffffff, 1.5)); // Increased ambient light
    const directionalLight1 = new THREE.DirectionalLight(0xffffff, 1.5);
    directionalLight1.position.set(5, 10, 5);
    directionalLight1.castShadow = true;
    scene.add(directionalLight1);

    const directionalLight2 = new THREE.DirectionalLight(0xffffff, 1.0);
    directionalLight2.position.set(-5, 8, -5);
    scene.add(directionalLight2);

    const directionalLight3 = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight3.position.set(0, 5, 0);
    scene.add(directionalLight3);
    
    // Add a hemisphere light for more even illumination
    const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x444444, 1.0);
    hemisphereLight.position.set(0, 10, 0);
    scene.add(hemisphereLight);

    // Add helper axes - smaller to not interfere
    const axesHelper = new THREE.AxesHelper(5);
    scene.add(axesHelper);

    // Grid helper removed as requested

    // Controls state - starting position for classroom
    // Calculate initial rotation based on default camera position
    const defaultCameraPos = new THREE.Vector3(-2.03, 0.99, -3.45);
    const defaultModelCenter = new THREE.Vector3(0.56, -1.47, -0.15);
    const defaultDirection = new THREE.Vector3().subVectors(defaultCameraPos, defaultModelCenter).normalize();
    const initialRotationY = Math.atan2(defaultDirection.x, defaultDirection.z);
    const initialRotationX = Math.asin(defaultDirection.y);
    
    const controls = {
      rotationX: initialRotationX, // Match default camera position
      rotationY: initialRotationY, // Match default camera position
      zoom: 1.0, // Normal zoom
    };

    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };
    let model: THREE.Group | null = null;

    // Load GLB model
    const loader = new GLTFLoader();
    // Use setTimeout to avoid synchronous setState in effect
    setTimeout(() => {
      setIsLoading(true);
      setError(null);
    }, 0);
    
    console.log('Starting to load model from: /chemestry_lab_classroom.glb');
    loader.load(
      '/chemestry_lab_classroom.glb',
      (gltf) => {
        console.log('GLTF loaded successfully:', gltf);
        console.log('GLTF scene:', gltf.scene);
        console.log('GLTF scene children:', gltf.scene.children.length);
        try {
          model = gltf.scene;
          model.visible = true; // Ensure model is visible
          
          // Enable shadows and ensure materials are visible
          model.traverse((child) => {
            child.visible = true; // Ensure all children are visible
            if (child instanceof THREE.Mesh) {
              child.castShadow = true;
              child.receiveShadow = true;
              // Ensure material is visible and properly configured
              if (child.material) {
                if (Array.isArray(child.material)) {
                  child.material.forEach((mat: THREE.Material) => {
                    mat.needsUpdate = true;
                    if (mat instanceof THREE.MeshStandardMaterial || mat instanceof THREE.MeshPhysicalMaterial) {
                      mat.emissive = new THREE.Color(0x000000);
                      mat.emissiveIntensity = 0;
                      // Ensure material is not too dark
                      if (mat.color) {
                        const brightness = mat.color.r + mat.color.g + mat.color.b;
                        if (brightness < 0.3) {
                          mat.color.multiplyScalar(1.5); // Brighten dark materials
                        }
                      }
                    }
                    // Make sure transparent materials are handled
                    if (mat.transparent) {
                      mat.opacity = Math.max(0.5, mat.opacity || 1);
                    }
                  });
                } else {
                  (child.material as THREE.Material).needsUpdate = true;
                  if (child.material instanceof THREE.MeshStandardMaterial || child.material instanceof THREE.MeshPhysicalMaterial) {
                    child.material.emissive = new THREE.Color(0x000000);
                    child.material.emissiveIntensity = 0;
                    // Ensure material is not too dark
                    if (child.material.color) {
                      const brightness = child.material.color.r + child.material.color.g + child.material.color.b;
                      if (brightness < 0.3) {
                        child.material.color.multiplyScalar(1.5); // Brighten dark materials
                      }
                    }
                  }
                  // Make sure transparent materials are handled
                  if (child.material.transparent) {
                    child.material.opacity = Math.max(0.5, child.material.opacity || 1);
                  }
                }
              }
            }
          });

          // Calculate bounding box to center and scale the model
          const box = new THREE.Box3().setFromObject(model);
          if (box.isEmpty()) {
            console.warn('Model bounding box is empty, using default scale');
            model.scale.set(1, 1, 1);
          } else {
            const center = box.getCenter(new THREE.Vector3());
            const size = box.getSize(new THREE.Vector3());
            
            console.log('Model bounding box:', {
              min: { x: box.min.x, y: box.min.y, z: box.min.z },
              max: { x: box.max.x, y: box.max.y, z: box.max.z },
              size: { x: size.x, y: size.y, z: size.z },
              center: { x: center.x, y: center.y, z: center.z },
            });
            
            // First, center the model at origin, then scale, then position
            // Center the model
            model.position.x = -center.x;
            model.position.y = -center.y;
            model.position.z = -center.z;
            
            // Set model scale to 5x as requested
            model.scale.set(5, 5, 5);
            
            // Update matrix to apply scale changes
            model.updateMatrixWorld(true);
            
            // Recalculate bounding box after scaling
            const scaledBox = new THREE.Box3().setFromObject(model);
            const scaledCenter = scaledBox.getCenter(new THREE.Vector3());
            
            // Now position the model so its center is at the desired location (3.08, -8.07, -0.84)
            const targetCenter = new THREE.Vector3(3.08, -8.07, -0.84);
            model.position.add(targetCenter).sub(scaledCenter);
            
            // Update matrix again after positioning
            model.updateMatrixWorld(true);
            
            // Final bounding box calculation
            const finalBox = new THREE.Box3().setFromObject(model);
            const finalCenter = finalBox.getCenter(new THREE.Vector3());
            const finalSize = finalBox.getSize(new THREE.Vector3());
            
            // Update model center for camera targeting
            modelCenter.copy(finalCenter);
            
            // Camera is already at start position, animation will handle transition
            camera.lookAt(finalCenter);
            camera.updateProjectionMatrix();
            
            // Start camera animation
            if (sceneRef.current) {
              sceneRef.current.isAnimating = true;
            }
            const animationDuration = 3000; // 3 seconds
            const startTime = Date.now();
            const startPos = new THREE.Vector3(-8.77, 3.6, -21.89);
            const endPos = new THREE.Vector3(-0.51, -6.06, -3.26);
            
            const animateCamera = () => {
              const elapsed = Date.now() - startTime;
              const progress = Math.min(elapsed / animationDuration, 1);
              
              // Use easing function for smooth animation (ease-in-out)
              const easedProgress = progress < 0.5
                ? 2 * progress * progress
                : 1 - Math.pow(-2 * progress + 2, 2) / 2;
              
              // Interpolate camera position
              camera.position.lerpVectors(startPos, endPos, easedProgress);
              camera.lookAt(finalCenter);
              
              if (progress < 1) {
                requestAnimationFrame(animateCamera);
              } else {
                // Animation complete - ensure camera is exactly at end position
                camera.position.copy(endPos);
                camera.lookAt(finalCenter);
                camera.updateProjectionMatrix();
                
                // Update controls to match end position for initial view
                const direction = new THREE.Vector3().subVectors(endPos, finalCenter).normalize();
                controls.rotationY = Math.atan2(direction.x, direction.z);
                controls.rotationX = Math.asin(direction.y);
                
                // Mark animation as complete
                if (sceneRef.current) {
                  sceneRef.current.isAnimating = false;
                  // Keep camera locked - no movement allowed after animation
                  sceneRef.current.freeRoam = false;
                }
                
                // Show buttons after a small delay to ensure smooth transition
                setTimeout(() => {
                  setShowObjectButtons(true);
                }, 100);
              }
            };
            
            // Start animation after a brief delay to ensure model is rendered
            setTimeout(() => {
              animateCamera();
            }, 100);
            
            console.log('Model positioned and scaled:', {
              position: { x: model.position.x, y: model.position.y, z: model.position.z },
              scale: { x: model.scale.x, y: model.scale.y, z: model.scale.z },
              boundingBox: {
                min: { x: finalBox.min.x, y: finalBox.min.y, z: finalBox.min.z },
                max: { x: finalBox.max.x, y: finalBox.max.y, z: finalBox.max.z },
                size: { x: finalSize.x, y: finalSize.y, z: finalSize.z },
                center: { x: finalCenter.x, y: finalCenter.y, z: finalCenter.z },
              },
              camera: {
                position: { x: camera.position.x, y: camera.position.y, z: camera.position.z },
                lookingAt: { x: finalCenter.x, y: finalCenter.y, z: finalCenter.z }
              }
            });
          }
          
          scene.add(model);
          
          // Force a render after adding the model
          renderer.render(scene, camera);
          
          // Verify model is in scene
          console.log('Model added to scene. Scene children count:', scene.children.length);
          console.log('Model position after centering:', model.position.x, model.position.y, model.position.z);
          console.log('Model scale:', model.scale.x, model.scale.y, model.scale.z);
          console.log('Model visible:', model.visible);
          console.log('Model children count:', model.children.length);
          
          // Update scene ref
          if (sceneRef.current) {
            sceneRef.current.model = model;
          }
          
          // Update debug info
          if (model) {
            const box = new THREE.Box3().setFromObject(model);
            const size = box.getSize(new THREE.Vector3());
            setDebugInfo({
              cameraPosition: { x: camera.position.x, y: camera.position.y, z: camera.position.z },
              modelPosition: { x: model.position.x, y: model.position.y, z: model.position.z },
              modelScale: { x: model.scale.x, y: model.scale.y, z: model.scale.z },
              modelRotation: { x: model.rotation.x, y: model.rotation.y, z: model.rotation.z },
              boundingBox: {
                min: { x: box.min.x, y: box.min.y, z: box.min.z },
                max: { x: box.max.x, y: box.max.y, z: box.max.z },
                size: { x: size.x, y: size.y, z: size.z },
              },
            });
          }
          
          setIsLoading(false);
          console.log('Model loaded successfully');
        } catch (err) {
          console.error('Error processing model:', err);
          setError('Failed to process model');
          setIsLoading(false);
        }
      },
      (progress) => {
        // Loading progress
        const percent = progress.total > 0 ? (progress.loaded / progress.total) * 100 : 0;
        console.log('Loading progress:', percent.toFixed(1) + '%');
      },
      (error) => {
        console.error('Error loading model:', error);
        const errorObj = error as Error;
        console.error('Error details:', {
          message: errorObj.message,
          stack: errorObj.stack,
          type: errorObj.constructor.name
        });
        const errorMessage = errorObj instanceof Error ? errorObj.message : 'Unknown error';
        setError(`Failed to load model: ${errorMessage}. Check console for details.`);
        setIsLoading(false);
      }
    );

    // Mouse/touch controls
    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      isDragging = true;
      if (container) {
        container.style.cursor = 'grabbing';
      }
      const clientX = (event as TouchEvent).touches
        ? (event as TouchEvent).touches[0].clientX
        : (event as MouseEvent).clientX;
      const clientY = (event as TouchEvent).touches
        ? (event as TouchEvent).touches[0].clientY
        : (event as MouseEvent).clientY;
      previousMousePosition = { x: clientX, y: clientY };
    };

    const onPointerMove = (event: MouseEvent | TouchEvent) => {
      if (!isDragging) return; // Don't require model to be loaded

      const clientX = (event as TouchEvent).touches
        ? (event as TouchEvent).touches[0].clientX
        : (event as MouseEvent).clientX;
      const clientY = (event as TouchEvent).touches
        ? (event as TouchEvent).touches[0].clientY
        : (event as MouseEvent).clientY;

      const deltaX = clientX - previousMousePosition.x;
      const deltaY = clientY - previousMousePosition.y;

      const inFreeRoam = sceneRef.current?.freeRoam || false;
      const lockedRotation = sceneRef.current?.lockedRotation || false;
      
      // Allow camera rotation if in free roam OR locked rotation mode
      if (inFreeRoam || lockedRotation) {
        // Rotate camera based on mouse movement (first-person style)
        const rotationSpeed = 0.002;
        
        // Update camera rotation directly (yaw and pitch)
        camera.rotation.y -= deltaX * rotationSpeed; // Yaw (left/right)
        camera.rotation.x -= deltaY * rotationSpeed; // Pitch (up/down)
        
        // Limit pitch to prevent flipping
        camera.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, camera.rotation.x));
        
        // Update controls to match camera rotation for consistency
        controls.rotationY = camera.rotation.y;
        controls.rotationX = camera.rotation.x;
      } else {
        // Camera is completely locked, don't update
        previousMousePosition = { x: clientX, y: clientY };
        return;
      }

      previousMousePosition = { x: clientX, y: clientY };
    };

    const onPointerUp = () => {
      isDragging = false;
      if (container) {
        container.style.cursor = 'grab';
      }
    };

    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const inFreeRoam = sceneRef.current?.freeRoam || false;
      
      const lockedRotation = sceneRef.current?.lockedRotation || false;
      if (inFreeRoam && !lockedRotation) {
        // In free roam (not locked), wheel moves camera forward/backward in camera's facing direction
        const moveSpeed = 0.5;
        const forward = new THREE.Vector3(0, 0, -1);
        forward.applyQuaternion(camera.quaternion);
        const moveAmount = event.deltaY > 0 ? -moveSpeed : moveSpeed;
        camera.position.add(forward.multiplyScalar(moveAmount));
      } else if (lockedRotation) {
        // In locked rotation mode, disable wheel movement
        // Do nothing - camera stays in place
      } else {
        // Normal zoom
        controls.zoom += event.deltaY * -0.001;
        controls.zoom = Math.max(0.1, Math.min(10, controls.zoom)); // Increased max zoom for better zooming capability
      }
    };
    
    // Keyboard controls for free roam
    const keysPressed = new Set<string>();
    const onKeyDown = (event: KeyboardEvent) => {
      keysPressed.add(event.key.toLowerCase());
    };
    const onKeyUp = (event: KeyboardEvent) => {
      keysPressed.delete(event.key.toLowerCase());
    };
    
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    container.addEventListener('mousedown', onPointerDown);
    container.addEventListener('mousemove', onPointerMove);
    window.addEventListener('mouseup', onPointerUp);
    container.addEventListener('touchstart', onPointerDown);
    container.addEventListener('touchmove', onPointerMove);
    window.addEventListener('touchend', onPointerUp);
    container.addEventListener('wheel', onWheel, { passive: false });

    // Store model center for camera targeting (will be updated when model loads)
    const modelCenter = new THREE.Vector3(3.08, -8.07, -0.84); // Model center position
    
    // Store refs
    sceneRef.current = {
      scene,
      camera,
      renderer,
      model: null,
      controls,
      isAnimating: false,
      freeRoam: false,
      cameraVelocity: { x: 0, y: 0, z: 0 },
      lockedRotation: false,
    };

    // Animation loop
    const animate = () => {
      animationId = requestAnimationFrame(animate);

      // Only update camera position if not animating (check state via closure)
      const currentlyAnimating = sceneRef.current?.isAnimating || false;
      const inFreeRoam = sceneRef.current?.freeRoam || false;
      const lockedRotation = sceneRef.current?.lockedRotation || false;
      
      // After animation completes, camera stays locked in place
      // Only allow movement if in free roam mode or locked rotation mode
      if (!currentlyAnimating && !inFreeRoam && !lockedRotation) {
        // Camera is locked after animation - do nothing, keep position
      }
      
      // If camera is in locked rotation mode, enforce position every frame
      if (lockedRotation) {
        // Lock camera to exact position (prevent any drift)
        const lockedPosition = new THREE.Vector3(8.68, -10.72, -6.88);
        camera.position.copy(lockedPosition);
      }
      
      // In free roam mode, handle keyboard movement (but not in locked rotation mode)
      if (inFreeRoam && !sceneRef.current?.lockedRotation) {
        const moveSpeed = 0.15;
        const moveVector = new THREE.Vector3();
        
        // Get camera's forward and right vectors
        const forward = new THREE.Vector3(0, 0, -1);
        const right = new THREE.Vector3(1, 0, 0);
        forward.applyQuaternion(camera.quaternion);
        right.applyQuaternion(camera.quaternion);
        
        // Calculate movement direction based on camera orientation
        if (keysPressed.has('w')) moveVector.add(forward);
        if (keysPressed.has('s')) moveVector.sub(forward);
        if (keysPressed.has('a')) moveVector.sub(right);
        if (keysPressed.has('d')) moveVector.add(right);
        if (keysPressed.has('q')) moveVector.y += 1; // Up
        if (keysPressed.has('e')) moveVector.y -= 1; // Down
        
        if (moveVector.length() > 0) {
          moveVector.normalize();
          moveVector.multiplyScalar(moveSpeed);
          camera.position.add(moveVector);
        }
      }

      if (model && sceneRef.current) {
        // Update debug info every frame
        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3());
        setDebugInfo({
          cameraPosition: { 
            x: parseFloat(camera.position.x.toFixed(2)), 
            y: parseFloat(camera.position.y.toFixed(2)), 
            z: parseFloat(camera.position.z.toFixed(2)) 
          },
          modelPosition: { 
            x: parseFloat(model.position.x.toFixed(2)), 
            y: parseFloat(model.position.y.toFixed(2)), 
            z: parseFloat(model.position.z.toFixed(2)) 
          },
          modelScale: { 
            x: parseFloat(model.scale.x.toFixed(3)), 
            y: parseFloat(model.scale.y.toFixed(3)), 
            z: parseFloat(model.scale.z.toFixed(3)) 
          },
          modelRotation: { 
            x: parseFloat((model.rotation.x * 180 / Math.PI).toFixed(1)), 
            y: parseFloat((model.rotation.y * 180 / Math.PI).toFixed(1)), 
            z: parseFloat((model.rotation.z * 180 / Math.PI).toFixed(1)) 
          },
          boundingBox: {
            min: { 
              x: parseFloat(box.min.x.toFixed(2)), 
              y: parseFloat(box.min.y.toFixed(2)), 
              z: parseFloat(box.min.z.toFixed(2)) 
            },
            max: { 
              x: parseFloat(box.max.x.toFixed(2)), 
              y: parseFloat(box.max.y.toFixed(2)), 
              z: parseFloat(box.max.z.toFixed(2)) 
            },
            size: { 
              x: parseFloat(size.x.toFixed(2)), 
              y: parseFloat(size.y.toFixed(2)), 
              z: parseFloat(size.z.toFixed(2)) 
            },
          },
        });
      } else {
        // Update camera position even if model isn't loaded
        setDebugInfo((prev) => ({
          ...prev,
          cameraPosition: { 
            x: parseFloat(camera.position.x.toFixed(2)), 
            y: parseFloat(camera.position.y.toFixed(2)), 
            z: parseFloat(camera.position.z.toFixed(2)) 
          },
        }));
      }

      // Only render if learning page is not shown
      if (!showLearningPageRef.current) {
        renderer.render(scene, camera);
      }
    };

    animate();

    // Handle window resize
    const handleResize = () => {
      if (!container) return;
      const width = container.clientWidth;
      const height = container.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      container.removeEventListener('mousedown', onPointerDown);
      container.removeEventListener('mousemove', onPointerMove);
      window.removeEventListener('mouseup', onPointerUp);
      container.removeEventListener('touchstart', onPointerDown);
      container.removeEventListener('touchmove', onPointerMove);
      window.removeEventListener('touchend', onPointerUp);
      container.removeEventListener('wheel', onWheel);
      cancelAnimationFrame(animationId);
      if (container && renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  // Update ref when showLearningPage changes to stop/start rendering
  useEffect(() => {
    showLearningPageRef.current = showLearningPage;
    if (sceneRef.current?.renderer) {
      if (showLearningPage) {
        // Hide the canvas
        sceneRef.current.renderer.domElement.style.display = 'none';
      } else {
        // Show the canvas
        sceneRef.current.renderer.domElement.style.display = 'block';
      }
    }
  }, [showLearningPage]);

  // Handle object button click - show welcome screen
  const handleObjectClick = () => {
    // Show welcome screen when any button is clicked
    setShowWelcomeScreen(true);
  };

  // Handle welcome screen responses
  const handleWelcomeYes = () => {
    setShowWelcomeScreen(false);
    setShowLearningPage(true);
  };

  const handleWelcomeNo = () => {
    setShowWelcomeScreen(false);
    // Reset to show the 3D room view
    setShowLearningPage(false);
  };

  // Show learning page if enabled
  if (showLearningPage) {
    return (
      <div className="min-h-screen" style={{ backgroundImage: 'linear-gradient(to bottom right, #9448B0, #332277, #001C3D)' }}>
        {/* Navbar */}
        <nav className="bg-[#9448B0]/95 backdrop-blur-sm border-b border-[#D8F878]/30 p-4 shadow-lg">
          <div className="container mx-auto flex items-center justify-between">
            <button
              onClick={() => {
                setShowLearningPage(false);
                setShowWelcomeScreen(false);
              }}
              className="flex items-center text-white hover:text-[#D8F878] transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                <path d="m12 19-7-7 7-7" />
                <path d="M19 12H5" />
              </svg>
              <span className="font-semibold">Back to 3D View</span>
            </button>
            <h1 className="text-2xl font-bold text-white">
              Know Your <span className="text-[#D8F878]">Pipette</span>
            </h1>
            <div className="w-32"></div>
          </div>
        </nav>

        {/* Navigation Tabs */}
        <div className="bg-white/10 backdrop-blur-sm border-b border-white/20">
          <div className="container mx-auto px-4 py-2">
            <div className="flex space-x-2 overflow-x-auto">
              {['Pipette', 'Tip', 'Box', 'Source Beaker', 'Destination Beaker', 'Waste Box'].map((item) => (
                <button
                  key={item}
                  onClick={() => setActiveTab(item)}
                  className={`px-4 py-2 rounded-lg font-semibold whitespace-nowrap transition-colors ${
                    activeTab === item
                      ? 'bg-white text-[#001C3D] shadow-lg'
                      : 'bg-white/20 hover:bg-white/30 text-white'
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="bg-white/95 backdrop-blur-sm rounded-xl p-8 shadow-2xl">
            {/* Tab Content */}
            {activeTab === 'Pipette' && (
              <div>
                <h2 className="text-3xl font-bold text-[#001C3D] mb-6">Pipette</h2>
                <div className="space-y-4">
                  <p className="text-gray-700 text-lg leading-relaxed">
                    The pipette is the main instrument used to aspirate and dispense precise volumes of liquid. 
                    It consists of a body, plunger with two stops, volume adjustment dial, and a tip ejector. 
                    Different pipettes are designed for specific volume ranges (e.g., 2µL, 10µL, 200µL, 1000µL).
                  </p>
                  {/* Placeholder for images/models - add here later */}
                </div>
              </div>
            )}

            {activeTab === 'Tip' && (
              <div>
                <h2 className="text-3xl font-bold text-[#001C3D] mb-6">Tip</h2>
                <div className="space-y-4">
                  <p className="text-gray-700 text-lg leading-relaxed">
                    Disposable tips are attached to the pipette to prevent contamination. They come in various types: 
                    standard tips for general use, low-retention tips for viscous liquids, and filter tips for 
                    sensitive applications. Always use a fresh tip for each sample to ensure accuracy and prevent cross-contamination.
                  </p>
                  {/* Placeholder for images/models - add here later */}
                </div>
              </div>
            )}

            {activeTab === 'Box' && (
              <div>
                <h2 className="text-3xl font-bold text-[#001C3D] mb-6">Box</h2>
                <div className="space-y-4">
                  <p className="text-gray-700 text-lg leading-relaxed">
                    Tip boxes contain sterile, disposable pipette tips. They are color-coded to match specific pipette 
                    sizes and are designed to maintain sterility. Tips should be loaded into the pipette directly from 
                    the box without touching them to maintain aseptic technique.
                  </p>
                  {/* Placeholder for images/models - add here later */}
                </div>
              </div>
            )}

            {activeTab === 'Source Beaker' && (
              <div>
                <h2 className="text-3xl font-bold text-[#001C3D] mb-6">Source Beaker</h2>
                <div className="space-y-4">
                  <p className="text-gray-700 text-lg leading-relaxed">
                    The source container holds the liquid you want to transfer. It can be a beaker, test tube, 
                    microcentrifuge tube, or any container with the liquid sample. When aspirating, immerse the 
                    tip just below the liquid surface (2-3mm) to ensure accurate volume measurement.
                  </p>
                  {/* Placeholder for images/models - add here later */}
                </div>
              </div>
            )}

            {activeTab === 'Destination Beaker' && (
              <div>
                <h2 className="text-3xl font-bold text-[#001C3D] mb-6">Destination Beaker</h2>
                <div className="space-y-4">
                  <p className="text-gray-700 text-lg leading-relaxed">
                    The destination container is where you dispense the liquid. It should be clean and appropriate 
                    for the volume being transferred. When dispensing, touch the tip to the inner wall of the 
                    container and use the blow-out function (second stop) to ensure all liquid is expelled.
                  </p>
                  {/* Placeholder for images/models - add here later */}
                </div>
              </div>
            )}

            {activeTab === 'Waste Box' && (
              <div>
                <h2 className="text-3xl font-bold text-[#001C3D] mb-6">Waste Box</h2>
                <div className="space-y-4">
                  <p className="text-gray-700 text-lg leading-relaxed">
                    The waste container is used to safely dispose of used pipette tips. It should be clearly marked 
                    and positioned conveniently near your workspace. Always eject tips into the waste container 
                    immediately after use to prevent contamination and maintain a clean work environment.
                  </p>
                  {/* Placeholder for images/models - add here later */}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative"
      style={{
        height: '100vh',
        backgroundImage: 'linear-gradient(to bottom right, #9448B0, #332277, #001C3D)',
        overflow: 'hidden',
      }}
    >
      {/* Header - Fixed at top */}
      <div className="bg-[#9448B0]/95 backdrop-blur-sm border-b border-[#D8F878]/30 p-4 absolute top-0 left-0 right-0 z-30 shadow-lg">
        <div className="container mx-auto flex items-center justify-between">
          <Link
            href="/home"
            className="flex items-center text-white hover:text-[#D8F878] transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mr-2"
            >
              <path d="m12 19-7-7 7-7" />
              <path d="M19 12H5" />
            </svg>
            <span className="font-semibold">Back to Home</span>
          </Link>
          <h1 className="text-2xl font-bold text-white">
            Know Your <span className="text-[#D8F878]">Pipette</span>
          </h1>
          <div className="w-32"></div> {/* Spacer for centering */}
        </div>
      </div>

      {/* 3D Viewer - Full screen - Hide when learning page is shown */}
      {!showLearningPage && (
        <div className="relative z-10" style={{ height: '100vh', backgroundColor: 'transparent' }}>
          <div
            ref={containerRef}
            className="w-full h-full relative z-20"
            style={{ cursor: 'grab', position: 'relative', backgroundColor: 'transparent' }}
          />
        
          {/* Loading Overlay */}
          {isLoading && (
            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-30">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#9448B0] mb-4"></div>
                <p className="text-[#001C3D] font-semibold">Loading 3D Model...</p>
              </div>
            </div>
          )}

          {/* Error Overlay */}
          {error && (
            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-30">
              <div className="text-center bg-white rounded-lg p-6 shadow-xl max-w-md mx-4">
                <p className="text-red-600 font-semibold mb-2">Error Loading Model</p>
                <p className="text-gray-700 text-sm mb-4">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="bg-[#9448B0] text-white px-4 py-2 rounded-lg hover:bg-[#A058C0] transition-colors"
                >
                  Retry
                </button>
              </div>
            </div>
          )}
        
        {/* Instructions Overlay - COMMENTED OUT */}
        {/* {!isLoading && !error && (
          <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-4 shadow-lg max-w-xs z-10">
            <h3 className="font-bold text-[#001C3D] mb-2">Controls</h3>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>🖱️ Drag to rotate</li>
              <li>🔍 Scroll to zoom</li>
              <li>📱 Touch and drag on mobile</li>
            </ul>
          </div>
        )} */}

        {/* Welcome Screen Overlay */}
        {showWelcomeScreen && (
          <div className="absolute inset-0 bg-white z-50 flex items-center justify-center">
            <div className="text-center max-w-2xl px-8">
              <h2 className="text-4xl font-bold text-[#001C3D] mb-6">
                Welcome to learn about the parts required in a pipetting system
              </h2>
              <p className="text-2xl text-gray-700 mb-8">Are you ready?</p>
              <div className="flex justify-center gap-6">
                <button
                  onClick={handleWelcomeYes}
                  className="bg-gradient-to-r from-[#9448B0] to-[#332277] text-white font-bold py-4 px-12 rounded-lg shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 text-xl"
                >
                  Yes
                </button>
                <button
                  onClick={handleWelcomeNo}
                  className="bg-gray-300 text-[#001C3D] font-bold py-4 px-12 rounded-lg shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 text-xl"
                >
                  No
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Debug Info Panel */}
        {!isLoading && !error && !showWelcomeScreen && (
          <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg p-4 shadow-lg max-w-sm z-40 text-xs">
            <h3 className="font-bold text-[#001C3D] mb-3 text-sm">Debug Info</h3>
            <div className="space-y-2 text-gray-700">
              <div>
                <strong className="text-[#9448B0]">Camera Position:</strong>
                <div className="ml-2 font-mono">
                  X: {debugInfo.cameraPosition.x}, Y: {debugInfo.cameraPosition.y}, Z: {debugInfo.cameraPosition.z}
                </div>
              </div>
              <div>
                <strong className="text-[#9448B0]">Model Position:</strong>
                <div className="ml-2 font-mono">
                  X: {debugInfo.modelPosition.x}, Y: {debugInfo.modelPosition.y}, Z: {debugInfo.modelPosition.z}
                </div>
              </div>
              <div>
                <strong className="text-[#9448B0]">Model Scale:</strong>
                <div className="ml-2 font-mono">
                  X: {debugInfo.modelScale.x}, Y: {debugInfo.modelScale.y}, Z: {debugInfo.modelScale.z}
                </div>
              </div>
              <div>
                <strong className="text-[#9448B0]">Model Rotation (deg):</strong>
                <div className="ml-2 font-mono">
                  X: {debugInfo.modelRotation.x}°, Y: {debugInfo.modelRotation.y}°, Z: {debugInfo.modelRotation.z}°
                </div>
              </div>
              <div>
                <strong className="text-[#9448B0]">Bounding Box:</strong>
                <div className="ml-2 font-mono text-[10px]">
                  <div>Min: ({debugInfo.boundingBox.min.x}, {debugInfo.boundingBox.min.y}, {debugInfo.boundingBox.min.z})</div>
                  <div>Max: ({debugInfo.boundingBox.max.x}, {debugInfo.boundingBox.max.y}, {debugInfo.boundingBox.max.z})</div>
                  <div>Size: ({debugInfo.boundingBox.size.x}, {debugInfo.boundingBox.size.y}, {debugInfo.boundingBox.size.z})</div>
                </div>
              </div>
            </div>
          </div>
        )}
        </div>
      )}

      {/* Object Buttons - Show after animation - Outside 3D viewer so they can show on learning page */}
      {showObjectButtons && !isLoading && !error && !showWelcomeScreen && (
        <div 
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-40"
          style={{
            animation: 'fadeIn 0.5s ease-out',
          }}
        >
          <div className="bg-white/95 backdrop-blur-sm rounded-xl p-4 shadow-2xl border border-white/20">
            <h3 className="text-lg font-bold text-[#001C3D] mb-4 text-center">Explore Objects</h3>
            <div className="grid grid-cols-3 gap-3 min-w-[500px]">
              <button
                onClick={handleObjectClick}
                className="bg-gradient-to-br from-[#9448B0] to-[#332277] text-white font-semibold py-3 px-4 rounded-lg shadow-md hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
              >
                Pipette
              </button>
              <button
                onClick={handleObjectClick}
                className="bg-gradient-to-br from-[#E47CB8] to-[#9448B0] text-white font-semibold py-3 px-4 rounded-lg shadow-md hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
              >
                Tip
              </button>
              <button
                onClick={handleObjectClick}
                className="bg-gradient-to-br from-[#D8F878] to-[#22c55e] text-[#001C3D] font-semibold py-3 px-4 rounded-lg shadow-md hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
              >
                Box
              </button>
              <button
                onClick={handleObjectClick}
                className="bg-gradient-to-br from-[#3b82f6] to-[#1e40af] text-white font-semibold py-3 px-4 rounded-lg shadow-md hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
              >
                Source Beaker
              </button>
              <button
                onClick={handleObjectClick}
                className="bg-gradient-to-br from-[#60a5fa] to-[#3b82f6] text-white font-semibold py-3 px-4 rounded-lg shadow-md hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
              >
                Destination Beaker
              </button>
              <button
                onClick={handleObjectClick}
                className="bg-gradient-to-br from-[#ef4444] to-[#dc2626] text-white font-semibold py-3 px-4 rounded-lg shadow-md hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
              >
                Waste Box
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

