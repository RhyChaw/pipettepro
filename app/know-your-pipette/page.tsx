'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export default function KnowYourPipettePage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
  } | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    let animationId: number;

    // Initialize Three.js scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffffff);

    const width = container.clientWidth;
    const height = container.clientHeight;

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    camera.position.set(0, 0, 3.33);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    // Lighting - brighter for better visibility
    scene.add(new THREE.AmbientLight(0xffffff, 1.0));
    const directionalLight1 = new THREE.DirectionalLight(0xffffff, 1.2);
    directionalLight1.position.set(5, 5, 5);
    scene.add(directionalLight1);

    const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight2.position.set(-5, 3, -5);
    scene.add(directionalLight2);

    const directionalLight3 = new THREE.DirectionalLight(0xffffff, 0.6);
    directionalLight3.position.set(0, -5, 0);
    scene.add(directionalLight3);

    // Add helper axes
    const axesHelper = new THREE.AxesHelper(5);
    scene.add(axesHelper);

    // Add grid helper
    const gridHelper = new THREE.GridHelper(10, 10, 0x888888, 0xcccccc);
    scene.add(gridHelper);

    // Controls state - starting from user's preferred position
    const controls = {
      rotationX: 8.6 * (Math.PI / 180), // Convert 8.6° to radians
      rotationY: -56.7 * (Math.PI / 180), // Convert -56.7° to radians
      zoom: 3.0, // Zoomed in 3x
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
    
    loader.load(
      '/mechanical_pipette.glb',
      (gltf) => {
        try {
          model = gltf.scene;
          
          // Enable shadows and ensure materials are visible
          model.traverse((child) => {
            if (child instanceof THREE.Mesh) {
              child.castShadow = true;
              child.receiveShadow = true;
              // Ensure material is visible
              if (child.material) {
                if (Array.isArray(child.material)) {
                  child.material.forEach((mat: THREE.Material) => {
                    mat.needsUpdate = true;
                  });
                } else {
                  (child.material as THREE.Material).needsUpdate = true;
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
            
            // Center the model at origin
            model.position.sub(center);
            model.position.set(0, 0, 0); // Explicitly center at origin
            
            // Apply user's preferred scale (1.268)
            model.scale.set(1.268, 1.268, 1.268);
            console.log('Model centered and scaled to:', 1.268);
          }
          
          scene.add(model);
          
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
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        setError(`Failed to load model: ${errorMessage}`);
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
      if (!isDragging || !model) return;

      const clientX = (event as TouchEvent).touches
        ? (event as TouchEvent).touches[0].clientX
        : (event as MouseEvent).clientX;
      const clientY = (event as TouchEvent).touches
        ? (event as TouchEvent).touches[0].clientY
        : (event as MouseEvent).clientY;

      const deltaX = clientX - previousMousePosition.x;
      const deltaY = clientY - previousMousePosition.y;

      controls.rotationY += deltaX * 0.01;
      controls.rotationX += deltaY * 0.01;

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
      controls.zoom += event.deltaY * -0.001;
      controls.zoom = Math.max(0.5, Math.min(3, controls.zoom));
    };

    container.addEventListener('mousedown', onPointerDown);
    container.addEventListener('mousemove', onPointerMove);
    window.addEventListener('mouseup', onPointerUp);
    container.addEventListener('touchstart', onPointerDown);
    container.addEventListener('touchmove', onPointerMove);
    window.addEventListener('touchend', onPointerUp);
    container.addEventListener('wheel', onWheel, { passive: false });

    // Store refs
    sceneRef.current = {
      scene,
      camera,
      renderer,
      model: null,
      controls,
    };

    // Animation loop
    const animate = () => {
      animationId = requestAnimationFrame(animate);

      if (model && sceneRef.current) {
        // Apply rotation - starting from user's preferred angles
        model.rotation.y = controls.rotationY;
        model.rotation.x = controls.rotationX;
        
        // Apply zoom - camera at Z: 3.33
        camera.position.z = 3.33 / controls.zoom;
        camera.lookAt(0, 0, 0);

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
      } else if (sceneRef.current) {
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

      renderer.render(scene, camera);
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

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        backgroundImage: 'linear-gradient(to bottom right, #9448B0, #332277, #001C3D)',
      }}
    >
      {/* Header */}
      <div className="bg-white/10 backdrop-blur-sm border-b border-white/20 p-4">
        <div className="container mx-auto flex items-center justify-between">
          <Link
            href="/"
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

      {/* 3D Viewer */}
      <div className="flex-1 relative">
        <div
          ref={containerRef}
          className="w-full h-full"
          style={{ cursor: 'grab', minHeight: '500px' }}
        />
        
        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-20">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#9448B0] mb-4"></div>
              <p className="text-[#001C3D] font-semibold">Loading 3D Model...</p>
            </div>
          </div>
        )}

        {/* Error Overlay */}
        {error && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-20">
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
        
        {/* Instructions Overlay */}
        {!isLoading && !error && (
          <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-4 shadow-lg max-w-xs z-10">
            <h3 className="font-bold text-[#001C3D] mb-2">Controls</h3>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>🖱️ Drag to rotate</li>
              <li>🔍 Scroll to zoom</li>
              <li>📱 Touch and drag on mobile</li>
            </ul>
          </div>
        )}

        {/* Debug Info Panel */}
        {!isLoading && !error && (
          <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg p-4 shadow-lg max-w-sm z-10 text-xs">
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
    </div>
  );
}

