'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '../components/DashboardLayout';
import PipetteSimulator from '../components/PipetteSimulator';

declare global {
  interface Window {
    Hands: any;
    Camera: any;
  }
}

export default function MLPage() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const calibrationCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isModelLoading, setIsModelLoading] = useState(true);
  const [selectedHand, setSelectedHand] = useState<'left' | 'right' | null>(null);
  const [isHandDetected, setIsHandDetected] = useState(false);
  const [handLandmarks, setHandLandmarks] = useState<any[]>([]);
  const [allHands, setAllHands] = useState<any[]>([]); // Store all detected hands
  const [error, setError] = useState<string>('');
  const [showSetup, setShowSetup] = useState(true);
  const [showCalibration, setShowCalibration] = useState(false);
  const [showSimulator, setShowSimulator] = useState(false);
  const [handTrackingReady, setHandTrackingReady] = useState(false);
  const [calibrationComplete, setCalibrationComplete] = useState(false);
  const [calibrationOffset, setCalibrationOffset] = useState<{ angle: number; position: { x: number; y: number; z: number } } | null>(null);
  const [isHoldingPipette, setIsHoldingPipette] = useState(false);
  const [pipetteTiltAngle, setPipetteTiltAngle] = useState(0); // For calibration preview
  const [showCalibrationConfirmed, setShowCalibrationConfirmed] = useState(false);
  const isMountedRef = useRef(true);
  const handsInstanceRef = useRef<any>(null);
  const cameraInstanceRef = useRef<any>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const handsActiveRef = useRef(false); // Track if hands instance is active

  // Load MediaPipe Hands scripts
  useEffect(() => {
    const loadScript = (src: string) =>
      new Promise<void>((resolve, reject) => {
        const existing = document.querySelector(`script[data-src="${src}"]`);
        if (existing) {
          existing.addEventListener('load', () => resolve(), { once: true });
          existing.addEventListener('error', () => reject(new Error(`Failed to load ${src}`)), { once: true });
          return;
        }

        const script = document.createElement('script');
        script.src = src;
        script.async = true;
        script.dataset.src = src;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error(`Failed to load ${src}`));
        document.head.appendChild(script);
      });

    const loadMediaPipe = async () => {
      try {
        await Promise.all([
          loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js'),
          loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/control_utils/control_utils.js'),
          loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js'),
          loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js'),
        ]);

        setIsModelLoading(false);
        setHandTrackingReady(true);
      } catch (err: any) {
        setError(`Failed to load hand tracking: ${err.message}. Please refresh the page.`);
        setIsModelLoading(false);
      }
    };

    loadMediaPipe();
  }, []);

  // Track component mount state
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Start webcam and hand detection (for simulator)
  useEffect(() => {
    if (!handTrackingReady || !selectedHand) return;
    if (!isMountedRef.current) return;
    if (!showSimulator) return; // Only run during simulator

    const startWebcam = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480, facingMode: 'user' }
        });
        
        if (!videoRef.current) return;
        
        mediaStreamRef.current = stream;
        videoRef.current.srcObject = stream;
        await videoRef.current.play();

        await new Promise((resolve) => {
          if (videoRef.current) {
            if (videoRef.current.readyState >= 2) {
              resolve(true);
            } else {
              videoRef.current.onloadedmetadata = () => resolve(true);
            }
          }
        });

        // Initialize MediaPipe Hands
        const hands = new window.Hands({
          locateFile: (file: string) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
          }
        });

        hands.setOptions({
          maxNumHands: 2,
          modelComplexity: 1,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5
        });

        hands.onResults((results: any) => {
          try {
            if (!videoRef.current || !results || !results.image) return;
            
            // Process hand data once
            let detectedHand: any = null;
          if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
            const handsData = results.multiHandLandmarks.map((landmarks: any[], index: number) => {
              const handedness = results.multiHandedness[index];
              return {
                landmarks: landmarks.map((lm: any) => [lm.x * 640, lm.y * 480, lm.z]),
                handedness: handedness?.categoryName || 'Unknown',
                keypoints: landmarks
              };
            });

            setAllHands(handsData);
            
            // Find the selected hand
            detectedHand = handsData.find((h: any) => 
              (selectedHand === 'right' && h.handedness === 'Right') ||
              (selectedHand === 'left' && h.handedness === 'Left')
            ) || handsData[0];

            if (detectedHand) {
              setIsHandDetected(true);
              setHandLandmarks(detectedHand.landmarks);
              
              // Check for closed fist (holding pipette)
              const isFist = checkIfFist(detectedHand.keypoints);
              setIsHoldingPipette(isFist);
            } else {
              setIsHandDetected(false);
              setHandLandmarks([]);
            }
          } else {
            setIsHandDetected(false);
            setHandLandmarks([]);
            setAllHands([]);
          }

          // Draw on main canvas
          if (canvasRef.current) {
            const ctx = canvasRef.current.getContext('2d');
            if (ctx) {
              ctx.save();
              ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
              ctx.drawImage(results.image, 0, 0, canvasRef.current.width, canvasRef.current.height);
              
              if (detectedHand) {
                ctx.strokeStyle = '#00ff00';
                ctx.fillStyle = '#00ff00';
                ctx.lineWidth = 2;
                detectedHand.landmarks.forEach((landmark: number[]) => {
                  ctx.beginPath();
                  ctx.arc(landmark[0], landmark[1], 5, 0, 2 * Math.PI);
                  ctx.fill();
                });
              }
              ctx.restore();
            }
          }

          // Draw on calibration canvas
          if (calibrationCanvasRef.current) {
            const ctx = calibrationCanvasRef.current.getContext('2d');
            if (ctx) {
              ctx.save();
              ctx.clearRect(0, 0, calibrationCanvasRef.current.width, calibrationCanvasRef.current.height);
              ctx.drawImage(results.image, 0, 0, calibrationCanvasRef.current.width, calibrationCanvasRef.current.height);
              
              if (detectedHand) {
                ctx.strokeStyle = '#00ff00';
                ctx.fillStyle = '#00ff00';
                ctx.lineWidth = 2;
                detectedHand.landmarks.forEach((landmark: number[]) => {
                  ctx.beginPath();
                  ctx.arc(landmark[0], landmark[1], 5, 0, 2 * Math.PI);
                  ctx.fill();
                });
              }
              ctx.restore();
            }
          }
          } catch (err) {
            console.warn('Error in hands.onResults:', err);
          }
        });

        // Wait a bit more to ensure video is fully ready
        await new Promise(resolve => setTimeout(resolve, 200));

        // Verify video is ready before starting camera
        if (!videoRef.current) {
          throw new Error('Video element not found');
        }
        
        if (videoRef.current.readyState < 2) {
          // Wait for video metadata
          await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error('Video timeout')), 5000);
            videoRef.current!.onloadedmetadata = () => {
              clearTimeout(timeout);
              resolve(true);
            };
            if (videoRef.current!.readyState >= 2) {
              clearTimeout(timeout);
              resolve(true);
            }
          });
        }

        // Ensure video is playing
        if (videoRef.current.paused) {
          await videoRef.current.play();
        }

        const videoWidth = videoRef.current.videoWidth || 640;
        const videoHeight = videoRef.current.videoHeight || 480;
        
        if (videoWidth === 0 || videoHeight === 0) {
          throw new Error('Invalid video dimensions');
        }

        // Mark hands as active before starting camera
        handsActiveRef.current = true;

        const camera = new window.Camera(videoRef.current, {
          onFrame: async () => {
            try {
              // Check if hands instance is still active (must be first check)
              if (!handsActiveRef.current || !handsInstanceRef.current) {
                return;
              }
              // Check if component is still mounted and in simulator mode
              if (!isMountedRef.current || !showSimulator) {
                return; // Only process frames when in simulator mode
              }
              if (!videoRef.current || videoRef.current.readyState < 2) {
                return; // Skip if video not ready
              }
              // Check if video has valid dimensions
              if (videoRef.current.videoWidth === 0 || videoRef.current.videoHeight === 0) {
                return; // Skip if invalid dimensions
              }
              await handsInstanceRef.current.send({ image: videoRef.current });
            } catch (err: any) {
              // Check if error is due to deleted object (cleanup race condition)
              if (err?.message?.includes('deleted object') || err?.name === 'BindingError') {
                // Hands instance was closed, mark as inactive and stop processing
                handsActiveRef.current = false;
                return;
              }
              // Silently handle other errors during frame processing
              // Don't log if component is unmounting
              if (isMountedRef.current && handsActiveRef.current) {
                console.warn('Error processing frame:', err);
              }
            }
          },
          width: videoWidth,
          height: videoHeight
        });

        handsInstanceRef.current = hands;
        cameraInstanceRef.current = camera;
        camera.start();
      } catch (err: any) {
        setError(`Failed to access webcam: ${err.message}`);
      }
    };

    startWebcam();

    return () => {
      // Only cleanup if we're leaving simulator (going back to setup)
      // Keep everything alive during transitions
      if (!showSimulator) {
        isMountedRef.current = false;
        
        // Mark hands as inactive FIRST to prevent any new frames from being sent
        handsActiveRef.current = false;
        
        // Stop camera FIRST (this stops sending frames)
        if (cameraInstanceRef.current) {
          try {
            cameraInstanceRef.current.stop();
          } catch (err) {
            // Ignore errors during cleanup
          }
          cameraInstanceRef.current = null;
        }
        
        // Wait a bit to ensure camera has stopped sending frames
        setTimeout(() => {
          // Close hands instance AFTER camera has stopped
          if (handsInstanceRef.current) {
            try {
              handsInstanceRef.current.close();
            } catch (err) {
              // Ignore errors during cleanup
            }
            handsInstanceRef.current = null;
          }
        }, 100);
        
        // Stop media stream tracks only when going back to setup
        if (showSetup && mediaStreamRef.current) {
          mediaStreamRef.current.getTracks().forEach((track: MediaStreamTrack) => {
            try {
              track.stop();
            } catch (err) {
              // Ignore errors during cleanup
            }
          });
          mediaStreamRef.current = null;
          
          // Clear video source only when going back to setup
          if (videoRef.current) {
            videoRef.current.srcObject = null;
          }
        }
      }
    };
  }, [handTrackingReady, selectedHand, showSimulator, showSetup]);

  // Check if hand is in fist position (closed)
  const checkIfFist = (keypoints: any[]): boolean => {
    if (!keypoints || keypoints.length < 21) return false;
    
    // Check if fingers are curled (tips are closer to base than extended)
    const fingerTips = [8, 12, 16, 20]; // Index, Middle, Ring, Pinky tips
    const fingerMCPs = [5, 9, 13, 17]; // Finger bases
    
    let curledCount = 0;
    for (let i = 0; i < fingerTips.length; i++) {
      const tip = keypoints[fingerTips[i]];
      const mcp = keypoints[fingerMCPs[i]];
      const distance = Math.sqrt(
        Math.pow(tip.x - mcp.x, 2) + 
        Math.pow(tip.y - mcp.y, 2)
      );
      // If tip is close to base, finger is curled
      if (distance < 0.1) {
        curledCount++;
      }
    }
    
    // If 3 or more fingers are curled, consider it a fist
    return curledCount >= 3;
  };

  // Calculate hand orientation angle
  const calculateHandAngle = (landmarks: any[]): number => {
    if (!landmarks || landmarks.length < 9) return 0;
    
    const wrist = landmarks[0];
    const middleFinger = landmarks[9]; // Middle finger MCP
    
    const dx = middleFinger[0] - wrist[0];
    const dy = middleFinger[1] - wrist[1];
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);
    
    return angle;
  };

  const handleHandSelection = (hand: 'left' | 'right') => {
    setSelectedHand(hand);
    setShowSetup(false);
    // Skip calibration, go directly to simulator
    setShowSimulator(true);
    // Set default calibration (no offset, start vertical)
    setCalibrationOffset({
      angle: 0,
      position: { x: 0, y: 0, z: 0 }
    });
  };

  const handleCalibrationConfirm = () => {
    if (!isHandDetected || handLandmarks.length === 0) {
      setError('Please show your hand to the camera first');
      return;
    }

    if (!isHoldingPipette) {
      setError('Please make a closed fist to indicate you\'re holding the pipette');
      return;
    }

    // Calculate calibration offset
    const handAngle = calculateHandAngle(handLandmarks);
    // Pipette tilt angle is what the user set, hand angle is current hand orientation
    // Offset = pipetteTiltAngle - handAngle (so when hand matches pipette tilt, offset compensates)
    const offset = pipetteTiltAngle - handAngle;
    
    setCalibrationOffset({
      angle: offset,
      position: { x: 0, y: 0, z: 0 }
    });
    
    setCalibrationComplete(true);
    setShowCalibrationConfirmed(true);
    
    // Show confirmation message for 2 seconds, then transition
    setTimeout(() => {
      setShowCalibrationConfirmed(false);
      setShowCalibration(false);
      setShowSimulator(true);
    }, 2000);
  };

  if (showSetup) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white p-8">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-slate-200">
              <h1 className="text-3xl font-bold text-black mb-4">
                (Beta Version) Pipette with your hands!
              </h1>
              
              {isModelLoading && (
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-black">Loading hand tracking model...</p>
                  <div className="mt-2 w-full bg-blue-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
                  </div>
                </div>
              )}

              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-800 mb-3">{error}</p>
                  <button
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Retry Loading
                  </button>
                </div>
              )}

              {!isModelLoading && !error && (
                <>
                  <div className="mb-6">
                    <h2 className="text-xl font-semibold text-black mb-4">Select Hand</h2>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        onClick={() => handleHandSelection('left')}
                        className="p-6 border-2 border-slate-300 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all"
                      >
                        <div className="text-4xl mb-2">👈</div>
                        <h3 className="text-lg font-semibold text-black mb-2">Left Hand</h3>
                        <p className="text-sm text-black">Use your left hand to control the pipette</p>
                      </button>
                      <button
                        onClick={() => handleHandSelection('right')}
                        className="p-6 border-2 border-slate-300 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all"
                      >
                        <div className="text-4xl mb-2">👉</div>
                        <h3 className="text-lg font-semibold text-black mb-2">Right Hand</h3>
                        <p className="text-sm text-black">Use your right hand to control the pipette</p>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (showCalibration) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white p-8">
          <div className="max-w-6xl mx-auto">
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-slate-200">
              <h1 className="text-3xl font-bold text-black mb-4">Calibration</h1>
              <p className="text-black mb-6">
                Position your {selectedHand} hand to match the pipette orientation. 
                Make a closed fist to indicate you&apos;re holding the pipette.
                Use your other hand to click &quot;Confirm&quot; when ready.
              </p>

              <div className="grid grid-cols-2 gap-6 mb-6">
                {/* Camera View */}
                <div className="bg-black rounded-lg overflow-hidden relative">
                  <video
                    ref={videoRef}
                    className="w-full h-full object-cover"
                    playsInline
                    muted
                    autoPlay
                  />
                  <canvas
                    ref={calibrationCanvasRef}
                    className="absolute top-0 left-0 w-full h-full pointer-events-none"
                    width={640}
                    height={480}
                  />
                  <div className="absolute bottom-2 left-2 right-2 bg-black/80 text-white text-xs p-2 rounded">
                    {isHandDetected ? (
                      <div>
                        <span className="text-green-400 font-semibold">✓ Hand Detected</span>
                        {isHoldingPipette && (
                          <span className="text-blue-400 ml-2">👊 Fist Detected</span>
                        )}
                      </div>
                    ) : (
                      <span className="text-red-400">✗ No Hand Detected</span>
                    )}
                  </div>
                </div>

                {/* Pipette Preview */}
                <div className="bg-slate-100 rounded-lg flex flex-col items-center justify-center min-h-[360px] p-6">
                  <div className="text-center mb-4">
                    <div 
                      className="text-6xl mb-4 transition-transform duration-300"
                      style={{ transform: `rotate(${pipetteTiltAngle + 90}deg)` }}
                    >
                      🧪
                    </div>
                    <p className="text-black font-semibold">Pipette Preview</p>
                    <p className="text-sm text-black mt-2">
                      Match your hand orientation to this pipette
                    </p>
                    <p className="text-xs text-slate-600 mt-2">
                      Current tilt: {pipetteTiltAngle}°
                    </p>
                    {calibrationOffset && (
                      <p className="text-xs text-green-600 mt-2">
                        Calibration offset: {calibrationOffset.angle.toFixed(1)}°
                      </p>
                    )}
                  </div>
                  
                  {/* Tilt Controls */}
                  <div className="mt-4 flex flex-col gap-2 w-full max-w-xs">
                    <label className="text-sm text-black font-medium">Adjust Pipette Tilt:</label>
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => setPipetteTiltAngle(Math.max(-90, pipetteTiltAngle - 5))}
                        className="px-4 py-2 bg-slate-300 text-black rounded-lg hover:bg-slate-400 transition-colors"
                      >
                        ← Less Tilt
                      </button>
                      <input
                        type="range"
                        min="-90"
                        max="90"
                        value={pipetteTiltAngle}
                        onChange={(e) => setPipetteTiltAngle(Number(e.target.value))}
                        className="flex-1"
                      />
                      <button
                        onClick={() => setPipetteTiltAngle(Math.min(90, pipetteTiltAngle + 5))}
                        className="px-4 py-2 bg-slate-300 text-black rounded-lg hover:bg-slate-400 transition-colors"
                      >
                        More Tilt →
                      </button>
                    </div>
                    <button
                      onClick={() => setPipetteTiltAngle(0)}
                      className="px-4 py-2 bg-blue-200 text-black rounded-lg hover:bg-blue-300 transition-colors text-sm"
                    >
                      Reset to Vertical (0°)
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex justify-center gap-4">
                <button
                  onClick={() => {
                    setShowCalibration(false);
                    setShowSetup(true);
                  }}
                  className="px-6 py-3 bg-slate-300 text-black rounded-lg hover:bg-slate-400 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleCalibrationConfirm}
                  disabled={!isHandDetected}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Confirm Calibration
                </button>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="relative w-full h-screen">
        {/* Video overlay for hand tracking */}
        <div className="absolute top-4 right-4 z-50 w-64 h-48 bg-black rounded-lg overflow-hidden border-2 border-white shadow-xl">
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            playsInline
            muted
            autoPlay
          />
          <canvas
            ref={canvasRef}
            className="absolute top-0 left-0 w-full h-full pointer-events-none"
            width={640}
            height={480}
          />
          <div className="absolute bottom-2 left-2 right-2 bg-black/80 text-white text-xs p-2 rounded z-10">
            {isHandDetected ? (
              <div>
                <span className="text-green-400 font-semibold">✓ Hand Detected</span>
                {isHoldingPipette && (
                  <span className="text-blue-400 ml-2">👊 Holding</span>
                )}
              </div>
            ) : (
              <span className="text-red-400">✗ No Hand Detected</span>
            )}
          </div>
        </div>

        {/* Simulator Component */}
        <PipetteSimulator 
          handTrackingEnabled={handLandmarks.length > 0 && isHoldingPipette}
          handLandmarks={handLandmarks}
          selectedHand={selectedHand}
          calibrationOffset={calibrationOffset}
        />
      </div>
    </DashboardLayout>
  );
}
