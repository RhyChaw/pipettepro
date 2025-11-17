'use client';

import { useState, useRef, useEffect } from 'react';

interface ImageCropperProps {
  imageSrc: string;
  onCrop: (croppedImageBlob: Blob) => void;
  onCancel: () => void;
  aspectRatio?: number; // For circular, use 1
}

export default function ImageCropper({ imageSrc, onCrop, onCancel, aspectRatio = 1 }: ImageCropperProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [useCors, setUseCors] = useState(true);

  const cropSize = 300; // Size of the circular crop area

  useEffect(() => {
    // Check if it's a data URL (no CORS needed) or external URL (CORS needed)
    const isDataUrl = imageSrc.startsWith('data:');
    setUseCors(!isDataUrl);
    
    if (imageRef.current && imageRef.current.complete) {
      handleImageLoad();
    }
  }, [imageSrc]);

  const handleImageLoad = () => {
    if (imageRef.current) {
      const img = imageRef.current;
      // Store natural dimensions for proper aspect ratio
      const naturalWidth = img.naturalWidth;
      const naturalHeight = img.naturalHeight;
      setImageSize({ width: naturalWidth, height: naturalHeight });
      
      // Calculate initial scale to fit image in crop area while maintaining aspect ratio
      const scaleToFit = Math.max(
        cropSize / naturalWidth,
        cropSize / naturalHeight
      );
      const initialScale = scaleToFit * 1.5; // Start slightly zoomed
      setScale(initialScale);
      
      // Calculate display dimensions maintaining aspect ratio
      const displayWidth = naturalWidth * initialScale;
      const displayHeight = naturalHeight * initialScale;
      
      // Center the image
      setPosition({
        x: (cropSize - displayWidth) / 2,
        y: (cropSize - displayHeight) / 2,
      });
      
      setImageLoaded(true);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    setIsDragging(true);
    const rect = containerRef.current.getBoundingClientRect();
    setDragStart({
      x: e.clientX - rect.left - position.x,
      y: e.clientY - rect.top - position.y,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setPosition({
        x: e.clientX - rect.left - dragStart.x,
        y: e.clientY - rect.top - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.max(0.5, Math.min(3, scale * delta));
    setScale(newScale);
  };

  const getCroppedImage = async (): Promise<Blob | null> => {
    if (!imageRef.current) {
      console.error('Image ref is null');
      return null;
    }

    const img = imageRef.current;
    if (!img.complete || img.naturalWidth === 0 || img.naturalHeight === 0) {
      console.error('Image not loaded yet', { complete: img.complete, naturalWidth: img.naturalWidth, naturalHeight: img.naturalHeight });
      return null;
    }

    if (!canvasRef.current) {
      console.error('Canvas ref is null');
      return null;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.error('Could not get 2d context');
      return null;
    }

    // Set canvas size
    canvas.width = cropSize;
    canvas.height = cropSize;

    // Clear canvas
    ctx.clearRect(0, 0, cropSize, cropSize);

    // Create circular clipping path
    ctx.save();
    ctx.beginPath();
    ctx.arc(cropSize / 2, cropSize / 2, cropSize / 2, 0, Math.PI * 2);
    ctx.clip();

    // Draw the cropped image
    // The image is scaled and positioned, so we draw it at the same position as displayed
    const scaledWidth = img.naturalWidth * scale;
    const scaledHeight = img.naturalHeight * scale;
    
    // Draw the full image at its scaled size and position
    // The clipping path will automatically crop it to the circle
    ctx.drawImage(
      img,
      0, 0, img.naturalWidth, img.naturalHeight, // Source: full image
      position.x, position.y, scaledWidth, scaledHeight // Destination: scaled and positioned
    );

    ctx.restore();

    return new Promise<Blob | null>((resolve) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            console.error('Canvas toBlob returned null');
            resolve(null);
          } else {
            resolve(blob);
          }
        },
        'image/png',
        0.95
      );
    });
  };

  const handleSave = async () => {
    const blob = await getCroppedImage();
    if (blob) {
      onCrop(blob);
    } else {
      console.error('Failed to crop image');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full">
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Crop Profile Picture</h2>
          <p className="text-sm text-slate-600">Adjust the image position and zoom, then click Save</p>
        </div>

        {/* Crop Area */}
        <div
          ref={containerRef}
          className="relative mx-auto border-2 border-slate-300 rounded-full overflow-hidden bg-slate-100"
          style={{ width: cropSize, height: cropSize }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
        >
          <img
            ref={imageRef}
            src={imageSrc}
            alt="Crop preview"
            crossOrigin={useCors ? 'anonymous' : undefined}
            className="absolute select-none"
            style={{
              width: imageSize.width > 0 ? `${imageSize.width * scale}px` : 'auto',
              height: imageSize.height > 0 ? `${imageSize.height * scale}px` : 'auto',
              left: `${position.x}px`,
              top: `${position.y}px`,
              cursor: isDragging ? 'grabbing' : 'grab',
              maxWidth: 'none',
              maxHeight: 'none',
              opacity: imageSize.width > 0 && imageSize.height > 0 ? 1 : 0,
            }}
            onLoad={handleImageLoad}
            onError={async (e) => {
              console.error('Image load error with CORS, trying alternative method');
              // If CORS fails, try to fetch the image as a blob and convert to data URL
              if (useCors && !imageSrc.startsWith('data:')) {
                try {
                  const response = await fetch(imageSrc);
                  const blob = await response.blob();
                  const reader = new FileReader();
                  reader.onload = () => {
                    if (imageRef.current && typeof reader.result === 'string') {
                      imageRef.current.crossOrigin = '';
                      imageRef.current.src = reader.result;
                      setUseCors(false);
                    }
                  };
                  reader.readAsDataURL(blob);
                } catch (fetchError) {
                  console.error('Failed to fetch image as blob:', fetchError);
                }
              }
            }}
          />
          
          {/* Crop overlay guide */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-0 rounded-full border-4 border-white shadow-lg"></div>
          </div>
        </div>
        
        {/* Hidden canvas for cropping */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Controls */}
        <div className="mt-6 space-y-4">
          {/* Zoom Control */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Zoom: {Math.round(scale * 100)}%
            </label>
            <input
              type="range"
              min="50"
              max="300"
              value={scale * 100}
              onChange={(e) => setScale(parseFloat(e.target.value) / 100)}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          {/* Instructions */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
            <p className="text-xs text-slate-600">
              • Drag the image to reposition it<br />
              • Use the slider or mouse wheel to zoom<br />
              • The circular area will be your profile picture
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 bg-white border-2 border-slate-300 text-slate-900 font-medium py-3 px-6 rounded-lg hover:border-slate-400 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex-1 bg-slate-900 text-white font-medium py-3 px-6 rounded-lg hover:bg-slate-800 transition-colors"
            >
              Save Cropped Image
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

