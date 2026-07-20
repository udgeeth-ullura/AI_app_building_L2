import React, { useRef, useState, useEffect } from 'react';
import { Camera, Upload, RefreshCw, Sparkles, AlertCircle, Image as ImageIcon, Check } from 'lucide-react';
import { motion } from 'motion/react';

interface CameraBoothProps {
  onPhotoSelected: (imageBase64: string) => void;
  savedPhoto: string | null;
  onClear: () => void;
}

export default function CameraBooth({ onPhotoSelected, savedPhoto, onClear }: CameraBoothProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  // Stop camera stream on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  // Activate Web Cam
  const startCamera = async () => {
    setCameraError(null);
    try {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 640, facingMode: 'user' },
        audio: false
      });

      setStream(mediaStream);
      setCameraActive(true);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play();
      }
    } catch (err: any) {
      console.error("Camera activation failed:", err);
      setCameraError(
        "Could not access camera. Make sure you allow camera permissions in your browser, or upload an image instead!"
      );
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setCameraActive(false);
  };

  // Capture Photo
  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      if (context) {
        // Capture square crop to match face aspect ratios
        const size = Math.min(video.videoWidth, video.videoHeight);
        const startX = (video.videoWidth - size) / 2;
        const startY = (video.videoHeight - size) / 2;

        canvas.width = 512;
        canvas.height = 512;

        // Draw cropped video frame
        context.drawImage(video, startX, startY, size, size, 0, 0, 512, 512);

        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        onPhotoSelected(dataUrl);
        stopCamera();
      }
    }
  };

  // Handle uploaded files
  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file (PNG, JPG, or WEBP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        // We can draw to canvas to make sure it's scaled or squared,
        // but for now, standard image loading works great
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const size = Math.min(img.width, img.height);
          canvas.width = 512;
          canvas.height = 512;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(
              img,
              (img.width - size) / 2,
              (img.height - size) / 2,
              size,
              size,
              0,
              0,
              512,
              512
            );
            onPhotoSelected(canvas.toDataURL('image/jpeg', 0.9));
          }
        };
        img.src = result;
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div id="camera-booth-root" className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 md:p-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h2 id="booth-title" className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <Camera className="w-6 h-6 text-indigo-600" />
            Step 1: Your Photo Booth Portrait
          </h2>
          <p id="booth-desc" className="text-sm text-gray-500 mt-1">
            Provide a clear portrait of your face so the Time Machine can blend you into history.
          </p>
        </div>
        {savedPhoto && (
          <button
            id="retake-btn"
            onClick={() => {
              onClear();
              startCamera();
            }}
            className="text-sm text-indigo-600 font-medium hover:text-indigo-800 transition flex items-center gap-1.5 bg-indigo-50 px-3.5 py-2 rounded-lg cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            Retake / Change Photo
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Photo Display / Capturing Box */}
        <div className="lg:col-span-7 flex flex-col items-center">
          <div className="w-full max-w-[400px] aspect-square relative rounded-2xl overflow-hidden bg-gray-50 border-2 border-dashed border-gray-200 shadow-inner flex items-center justify-center">
            
            {savedPhoto ? (
              // Saved preview of portrait
              <div className="relative w-full h-full group">
                <img
                  id="user-portrait-img"
                  src={savedPhoto}
                  alt="Your Portrait"
                  className="w-full h-full object-cover rounded-xl"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                  <span className="bg-white text-gray-900 px-4 py-2 rounded-full font-semibold text-sm flex items-center gap-1.5 shadow">
                    <Check className="w-4 h-4 text-emerald-500" /> Portrait Locked
                  </span>
                </div>
              </div>
            ) : cameraActive ? (
              // Live camera feed
              <div className="relative w-full h-full">
                <video
                  id="booth-webcam-feed"
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover scale-x-[-1]" // mirror view
                />
                
                {/* Face Grid Target Guideline Overlay */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="w-56 h-72 border-2 border-dashed border-white/60 rounded-[120px] relative">
                    <div className="absolute top-1/3 left-0 right-0 border-t border-white/20" />
                    <div className="absolute top-1/2 left-0 right-0 border-t border-white/20" />
                    <div className="absolute top-0 bottom-0 left-1/2 border-l border-white/20" />
                    <span className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/65 text-white text-[10px] uppercase tracking-wider font-semibold px-2.5 py-1 rounded-full">
                      Align Face Here
                    </span>
                  </div>
                </div>

                {/* Live Controls */}
                <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-3">
                  <button
                    id="capture-shutter-btn"
                    onClick={capturePhoto}
                    className="bg-red-600 hover:bg-red-700 active:scale-95 text-white font-bold p-4 rounded-full flex items-center justify-center shadow-lg transition"
                    title="Take Photo"
                  >
                    <div className="w-5 h-5 rounded-full bg-white border-2 border-red-600" />
                  </button>
                  <button
                    id="cancel-camera-btn"
                    onClick={stopCamera}
                    className="bg-black/75 hover:bg-black text-white text-xs px-4 py-2 rounded-full font-medium shadow-md transition"
                  >
                    Use Upload Mode
                  </button>
                </div>
              </div>
            ) : (
              // Static Upload Drag & Drop Area
              <div
                id="drag-drop-zone"
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                className={`w-full h-full flex flex-col items-center justify-center p-6 text-center transition-all ${
                  dragActive ? 'bg-indigo-50 border-indigo-500 scale-98' : 'hover:bg-gray-100/50'
                }`}
              >
                <div className="p-4 bg-indigo-50 rounded-full text-indigo-600 mb-4">
                  <Upload className="w-8 h-8" />
                </div>
                <p className="font-semibold text-gray-800 text-sm md:text-base">
                  Drag & drop your portrait here
                </p>
                <p className="text-xs text-gray-400 mt-1 mb-4">
                  Supports JPEG, PNG, WEBP (Square cropped preferred)
                </p>
                <div className="flex flex-col sm:flex-row gap-2.5">
                  <button
                    id="browse-btn"
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-white border border-gray-300 hover:border-indigo-500 text-gray-700 hover:text-indigo-600 text-xs px-4 py-2.5 rounded-lg font-medium shadow-sm transition cursor-pointer"
                  >
                    Browse Files
                  </button>
                  <button
                    id="start-camera-btn"
                    onClick={startCamera}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-4 py-2.5 rounded-lg font-medium shadow-md transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    Open Web Camera
                  </button>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
            )}
            
            {/* hidden processing canvas */}
            <canvas ref={canvasRef} className="hidden" />
          </div>

          {cameraError && (
            <div id="camera-err-msg" className="mt-4 flex items-start gap-2 text-red-600 text-xs max-w-[400px] bg-red-50 p-3 rounded-lg border border-red-100">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{cameraError}</span>
            </div>
          )}
        </div>

        {/* Tips / Instructions */}
        <div className="lg:col-span-5 flex flex-col justify-center space-y-5">
          <div className="border border-indigo-100 bg-gradient-to-br from-indigo-50/50 to-purple-50/30 rounded-xl p-5">
            <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wider flex items-center gap-1.5 mb-3">
              <Sparkles className="w-4 h-4 text-purple-600" />
              Portrait Guidelines
            </h3>
            <ul className="space-y-3.5 text-xs text-gray-600">
              <li className="flex items-start gap-2">
                <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">✓</div>
                <span><strong>Bright Front-Lighting:</strong> Ensure your face is evenly lit. Avoid strong shadows or heavy backlighting (like sitting with your back to a window).</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">✓</div>
                <span><strong>Look Straight Ahead:</strong> Keep your head centered, looking directly into the lens for optimal AI face alignment.</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">✓</div>
                <span><strong>Expressive or Neutral:</strong> Smiling, winking, or showing surprise translates perfectly into historical oil paintings and vintage photographs!</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">✓</div>
                <span><strong>No Accessories covering face:</strong> Keeping hair back and avoiding massive sunglasses gives the AI the best reference for blending.</span>
              </li>
            </ul>
          </div>

          <div className="text-center p-4 bg-gray-50 border border-gray-100 rounded-xl">
            <p className="text-xs text-gray-500 font-medium">
              Ready to travel through time? Proceed to Step 2 once your portrait is ready.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
