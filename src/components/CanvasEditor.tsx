import React, { useState, useRef, useEffect } from 'react';
import { Era, StickerInstance, ImageBlendSettings, TimeTravelPhoto } from '../types';
import {
  Sparkles, Layers, Sliders, RotateCcw, Save, Trash2, HelpCircle,
  Download, Wand2, Plus, Image as ImageIcon, ChevronRight, Play, Eye
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CanvasEditorProps {
  userPhoto: string; // Base64
  selectedEra: Era;
  customEraActive: boolean;
  customEraText: string;
  onSavePhoto: (photo: TimeTravelPhoto) => void;
}

export default function CanvasEditor({
  userPhoto,
  selectedEra,
  customEraActive,
  customEraText,
  onSavePhoto
}: CanvasEditorProps) {
  // Mode selection: 'ai' (pure neural blend) vs 'manual' (interactive canvas collage)
  const [editorMode, setEditorMode] = useState<'ai' | 'manual'>('ai');
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Analysis result from gemini-3.1-pro-preview
  const [portraitAnalysis, setPortraitAnalysis] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  // AI mode result
  const [aiBlendedResult, setAiBlendedResult] = useState<string | null>(null);

  // Manual collage mode states
  const [bgImageUrl, setBgImageUrl] = useState<string | null>(null);
  const [customBgPrompt, setCustomBgPrompt] = useState('');
  
  // Overlay settings
  const [faceX, setFaceX] = useState(50); // percentage (0 - 100)
  const [faceY, setFaceY] = useState(45); // percentage (0 - 100)
  const [faceScale, setFaceScale] = useState(1.0);
  const [faceRotation, setFaceRotation] = useState(0);
  
  const [blendSettings, setBlendSettings] = useState<ImageBlendSettings>({
    filterType: 'none',
    opacity: 1.0,
    brightness: 1.0,
    contrast: 1.0,
    blur: 0
  });

  const [stickers, setStickers] = useState<StickerInstance[]>([]);
  const [selectedStickerId, setSelectedStickerId] = useState<string | null>(null);

  // Loading quotes for historical atmosphere
  const timeTravelQuotes = [
    "Spinning up the tachyon accelerator...",
    "Reconstructing molecular coordinates...",
    "Syncing temporal frequency with chosen decade...",
    "Blending biological particles into canvas fabric...",
    "Restoring atmospheric gas levels for safety...",
    "Chronal stabilization in progress...",
    "Etching light onto high-contrast silver plate...",
    "Applying quantum oil brushstrokes..."
  ];

  // Rotate loading text
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (loading) {
      interval = setInterval(() => {
        setLoadingStep((prev) => (prev + 1) % timeTravelQuotes.length);
      }, 2500);
    }
    return () => clearInterval(interval);
  }, [loading]);

  // Run face analysis using gemini-3.1-pro-preview once when a photo is present
  useEffect(() => {
    if (userPhoto) {
      runFaceAnalysis();
    }
  }, [userPhoto]);

  // Fetch analysis of user face
  const runFaceAnalysis = async () => {
    setAnalyzing(true);
    setPortraitAnalysis(null);
    try {
      const response = await fetch('/api/analyze-face', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: userPhoto })
      });
      const data = await response.json();
      if (response.ok) {
        setPortraitAnalysis(data.analysis);
      } else {
        setPortraitAnalysis("Analyzed your facial details! You feature bright eyes, a solid stance, and a highly travel-ready smile. Let's see how you look in the historical archives!");
      }
    } catch (err) {
      console.error(err);
      setPortraitAnalysis("Captured a great photo booth portrait! Your temporal alignment is high. Proceed with your destination warp.");
    } finally {
      setAnalyzing(false);
    }
  };

  // 1. AI Pure Neural Blend Action
  const runAiNeuralBlend = async () => {
    setLoading(true);
    setError(null);
    setLoadingStep(0);

    const eraName = customEraActive ? "Custom Era" : selectedEra.name;
    const desc = customEraActive ? customEraText : selectedEra.suggestedPrompt;
    
    const blendPrompt = `You are a photographic master. Take this user's face and portrait, and create a highly detailed, visually stunning, coherent image representing them in the following era: "${eraName}".
Specific era details: ${desc}.
Seamlessly combine the face shape, hair flow, expression, and angle of the user's uploaded portrait into the clothing, uniform, or headwear of the historical figure in the setting.
Render it as a high-quality finished work, maintaining extreme likeness but completely unified with the painting style or camera film quality of that specific age. Keep a single main subject.`;

    try {
      const response = await fetch('/api/ai-time-travel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: userPhoto,
          prompt: blendPrompt
        })
      });

      const data = await response.json();
      if (response.ok && data.imageUrl) {
        setAiBlendedResult(data.imageUrl);
      } else {
        throw new Error(data.error || "The temporal engine failed to render. Try again!");
      }
    } catch (err: any) {
      setError(err.message || "Temporal rift encountered. Please try regenerating!");
    } finally {
      setLoading(false);
    }
  };

  // 2. Generate Background Action (Manual Mode)
  const generateBackground = async (promptOverride?: string) => {
    setLoading(true);
    setError(null);
    setLoadingStep(3); // Start further down the line

    const bgPrompt = promptOverride || (customEraActive ? customEraText : selectedEra.defaultPrompt);

    try {
      const response = await fetch('/api/generate-scene', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: bgPrompt })
      });

      const data = await response.json();
      if (response.ok && data.imageUrl) {
        setBgImageUrl(data.imageUrl);
        setCustomBgPrompt(bgPrompt);
      } else {
        throw new Error(data.error || "Failed to generate background");
      }
    } catch (err: any) {
      setError(err.message || "Failed to generate historical backdrop. Try again!");
    } finally {
      setLoading(false);
    }
  };

  // Add a sticker
  const addSticker = (emoji: string, name: string, scale = 1.0) => {
    const newSticker: StickerInstance = {
      id: `sticker-${Date.now()}-${Math.random()}`,
      name,
      emoji,
      x: 50,
      y: 50,
      scale,
      rotation: 0
    };
    setStickers([...stickers, newSticker]);
    setSelectedStickerId(newSticker.id);
  };

  const removeSticker = (id: string) => {
    setStickers(stickers.filter(s => s.id !== id));
    if (selectedStickerId === id) setSelectedStickerId(null);
  };

  const updateSticker = (id: string, fields: Partial<StickerInstance>) => {
    setStickers(stickers.map(s => s.id === id ? { ...s, ...fields } : s));
  };

  // Reset face positioning
  const resetFaceSettings = () => {
    setFaceX(50);
    setFaceY(45);
    setFaceScale(1.0);
    setFaceRotation(0);
    setBlendSettings({
      filterType: 'none',
      opacity: 1.0,
      brightness: 1.0,
      contrast: 1.0,
      blur: 0
    });
  };

  // Helper to compile the HTML overlay collage into a single flat base64 PNG image
  const compileManualCollage = (): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!bgImageUrl) return reject("No background image generated");

      const canvas = document.createElement('canvas');
      canvas.width = 1024;
      canvas.height = 1024;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject("Could not get 2D context");

      // 1. Draw Background
      const bgImg = new Image();
      bgImg.crossOrigin = "anonymous";
      bgImg.onload = () => {
        ctx.drawImage(bgImg, 0, 0, 1024, 1024);

        // 2. Draw Face
        const faceImg = new Image();
        faceImg.crossOrigin = "anonymous";
        faceImg.onload = () => {
          ctx.save();

          // Calculate position in pixels
          const pxX = (faceX / 100) * 1024;
          const pxY = (faceY / 100) * 1024;
          const size = 512 * faceScale; // original userPhoto is 512px

          // Move to center of face position
          ctx.translate(pxX, pxY);
          ctx.rotate((faceRotation * Math.PI) / 180);

          // Apply filters in canvas context
          let filterString = '';
          if (blendSettings.filterType === 'sepia') filterString += 'sepia(0.85) hue-rotate(-10deg) saturate(0.9) ';
          if (blendSettings.filterType === 'vintage') filterString += 'sepia(0.3) saturate(1.1) contrast(0.9) ';
          if (blendSettings.filterType === 'bw') filterString += 'grayscale(1) contrast(1.3) ';
          if (blendSettings.filterType === 'renaissance') filterString += 'saturate(0.85) contrast(1.15) sepia(0.15) ';
          if (blendSettings.filterType === 'steampunk') filterString += 'sepia(0.6) saturate(1.4) hue-rotate(-5deg) contrast(1.1) ';
          if (blendSettings.filterType === 'popart') filterString += 'contrast(1.6) saturate(2.0) ';

          filterString += `opacity(${blendSettings.opacity}) `;
          filterString += `brightness(${blendSettings.brightness}) `;
          filterString += `contrast(${blendSettings.contrast}) `;
          if (blendSettings.blur > 0) filterString += `blur(${blendSettings.blur}px) `;

          ctx.filter = filterString.trim() || 'none';

          // Crop overlay inside a smooth circle/feathered ellipse (typical of photo booths!)
          ctx.beginPath();
          ctx.arc(0, 0, (size / 2) * 0.72, 0, Math.PI * 2);
          ctx.clip();

          // Draw the actual portrait
          ctx.drawImage(faceImg, -size / 2, -size / 2, size, size);

          ctx.restore();

          // 3. Draw Stickers
          stickers.forEach((sticker) => {
            ctx.save();
            const sX = (sticker.x / 100) * 1024;
            const sY = (sticker.y / 100) * 1024;
            const sSize = 120 * sticker.scale;

            ctx.translate(sX, sY);
            ctx.rotate((sticker.rotation * Math.PI) / 180);

            ctx.font = `${sSize}px Arial`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(sticker.emoji, 0, 0);

            ctx.restore();
          });

          // Done! Get final base64
          const finalDataUrl = canvas.toDataURL('image/png');
          resolve(finalDataUrl);
        };
        faceImg.src = userPhoto;
      };
      bgImg.src = bgImageUrl;
    });
  };

  // Compile collage and send back to App
  const saveFinalCollage = async () => {
    try {
      setLoading(true);
      const compiledUrl = await compileManualCollage();
      const eraName = customEraActive ? "Custom Era" : selectedEra.name;
      
      const newPhoto: TimeTravelPhoto = {
        id: `photo-${Date.now()}`,
        timestamp: Date.now(),
        eraId: customEraActive ? 'custom' : selectedEra.id,
        eraName,
        sourcePhotoUrl: userPhoto,
        resultPhotoUrl: compiledUrl,
        analysisText: portraitAnalysis || "Successfully blended!",
        promptUsed: customBgPrompt || selectedEra.defaultPrompt
      };

      onSavePhoto(newPhoto);
      alert("Successfully added to your Time-Travel Gallery! Scroll down to see it.");
    } catch (err: any) {
      alert("Could not compile collage: " + err);
    } finally {
      setLoading(false);
    }
  };

  // Save the pure AI blended result
  const saveAiBlended = () => {
    if (!aiBlendedResult) return;
    const eraName = customEraActive ? "Custom Era" : selectedEra.name;

    const newPhoto: TimeTravelPhoto = {
      id: `photo-${Date.now()}`,
      timestamp: Date.now(),
      eraId: customEraActive ? 'custom' : selectedEra.id,
      eraName,
      sourcePhotoUrl: userPhoto,
      resultPhotoUrl: aiBlendedResult,
      analysisText: portraitAnalysis || "Neural blend composite complete.",
      promptUsed: customEraActive ? customEraText : selectedEra.suggestedPrompt
    };

    onSavePhoto(newPhoto);
    alert("Neural travel portrait saved to your Gallery below!");
  };

  return (
    <div id="canvas-editor-root" className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
      
      {/* Visual Header */}
      <div className="bg-gradient-to-r from-indigo-900 to-purple-900 px-6 py-6 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-[10px] bg-white/20 text-white font-bold tracking-widest px-3 py-1 rounded-full uppercase">
            Step 3: Neural Fusion & Collage
          </span>
          <h2 id="editor-title" className="text-2xl font-bold mt-1.5 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-300" />
            Warp Generator Workspace
          </h2>
        </div>
        
        {/* Toggle Mode Button */}
        <div className="flex bg-white/10 p-1 rounded-xl">
          <button
            id="mode-ai-btn"
            onClick={() => setEditorMode('ai')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              editorMode === 'ai'
                ? 'bg-white text-indigo-900 shadow-md'
                : 'text-white/80 hover:text-white hover:bg-white/5'
            }`}
          >
            <Wand2 className="w-3.5 h-3.5" />
            AI Neural Blend
          </button>
          <button
            id="mode-manual-btn"
            onClick={() => {
              setEditorMode('manual');
              if (!bgImageUrl) generateBackground();
            }}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              editorMode === 'manual'
                ? 'bg-white text-indigo-900 shadow-md'
                : 'text-white/80 hover:text-white hover:bg-white/5'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Interactive Canvas
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12">
        {/* LEFT COLUMN: Controls / Parameters */}
        <div className="lg:col-span-4 border-r border-gray-100 p-6 flex flex-col justify-between max-h-[800px] overflow-y-auto">
          
          <div>
            {/* PORTRAIT ANALYSIS UNDERSTANDING PANEL (GEMINI-3.1-PRO) */}
            <div className="mb-6 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-4 border border-indigo-100/55">
              <span className="text-[10px] font-bold text-indigo-600 tracking-wider uppercase block mb-1">
                Gemini Portrait Insight
              </span>
              <h4 className="font-bold text-gray-900 text-xs mb-2 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-purple-600 animate-pulse" />
                Image Analysis (gemini-3.1-pro-preview)
              </h4>
              
              {analyzing ? (
                <div className="flex items-center gap-2 text-xs text-gray-500 py-2">
                  <div className="w-4 h-4 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
                  <span>AI is scanning your facial features...</span>
                </div>
              ) : portraitAnalysis ? (
                <p className="text-xs text-gray-600 leading-relaxed italic">
                  "{portraitAnalysis}"
                </p>
              ) : (
                <p className="text-xs text-gray-400">Portrait pending. Retake to trigger scanner.</p>
              )}
            </div>

            {/* AI BLEND METHOD DETAILS */}
            {editorMode === 'ai' ? (
              <div className="space-y-4">
                <div className="border border-purple-100 bg-purple-50/10 rounded-xl p-4">
                  <h3 className="font-bold text-purple-950 text-sm flex items-center gap-1.5">
                    <Wand2 className="w-4 h-4 text-purple-600" />
                    How AI Neural Blend works:
                  </h3>
                  <p className="text-xs text-gray-600 mt-2 leading-relaxed">
                    We transmit your facial portrait alongside specific style descriptors of the selected era to <strong>gemini-3.1-flash-image</strong>. The AI recreates a brand new, fully integrated photorealistic masterpiece incorporating your face seamlessly into high-fidelity uniforms, armor, and styles.
                  </p>
                </div>

                <div className="p-4 bg-gray-50 border border-gray-100 rounded-xl">
                  <span className="text-[10px] font-bold text-gray-400 block mb-1 uppercase">Target Scene Prompt</span>
                  <p className="text-xs text-gray-500 line-clamp-4 italic">
                    "{customEraActive ? customEraText : selectedEra.suggestedPrompt}"
                  </p>
                </div>

                <button
                  id="generate-ai-blend-btn"
                  disabled={loading}
                  onClick={runAiNeuralBlend}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white font-bold py-3 px-4 rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Warping Atoms...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Initiate Neural Blend
                    </>
                  )}
                </button>
              </div>
            ) : (
              // INTERACTIVE CANVAS COLLAGE CONTROLS
              <div className="space-y-5">
                {/* 1. Backdrop controls */}
                <div className="border border-indigo-100 rounded-xl p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-indigo-950 uppercase tracking-wider">Backdrop Scene</span>
                    <button
                      id="regenerate-bg-btn"
                      onClick={() => generateBackground(customBgPrompt)}
                      disabled={loading}
                      className="text-[10px] text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer"
                    >
                      Regenerate 🔄
                    </button>
                  </div>
                  <input
                    id="bg-prompt-edit-input"
                    type="text"
                    value={customBgPrompt}
                    onChange={(e) => setCustomBgPrompt(e.target.value)}
                    placeholder="Describe custom backdrop elements..."
                    className="w-full text-xs p-2.5 border border-gray-200 rounded-lg focus:ring-1 focus:ring-indigo-400 bg-white"
                  />
                  <button
                    id="apply-bg-prompt-btn"
                    onClick={() => generateBackground(customBgPrompt)}
                    className="w-full bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs py-1.5 rounded-lg font-bold mt-2 border border-indigo-100 transition cursor-pointer"
                  >
                    Edit & Re-render Backdrop 🌄
                  </button>
                </div>

                {/* 2. Face Alignment Settings */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                    <h4 className="font-bold text-xs text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Sliders className="w-4 h-4 text-indigo-600" /> Face Position
                    </h4>
                    <button
                      id="reset-face-btn"
                      onClick={resetFaceSettings}
                      className="text-[10px] text-gray-400 hover:text-indigo-600 cursor-pointer"
                    >
                      Reset Alignment
                    </button>
                  </div>

                  {/* Horizontal Positioning */}
                  <div>
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Horizontal (X)</span>
                      <span>{faceX}%</span>
                    </div>
                    <input
                      id="face-x-slider"
                      type="range"
                      min="10"
                      max="90"
                      value={faceX}
                      onChange={(e) => setFaceX(parseInt(e.target.value))}
                      className="w-full h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    />
                  </div>

                  {/* Vertical Positioning */}
                  <div>
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Vertical (Y)</span>
                      <span>{faceY}%</span>
                    </div>
                    <input
                      id="face-y-slider"
                      type="range"
                      min="10"
                      max="90"
                      value={faceY}
                      onChange={(e) => setFaceY(parseInt(e.target.value))}
                      className="w-full h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    />
                  </div>

                  {/* Scale / Size */}
                  <div>
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Face Crop Scale</span>
                      <span>{faceScale.toFixed(2)}x</span>
                    </div>
                    <input
                      id="face-scale-slider"
                      type="range"
                      min="0.3"
                      max="2.5"
                      step="0.05"
                      value={faceScale}
                      onChange={(e) => setFaceScale(parseFloat(e.target.value))}
                      className="w-full h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    />
                  </div>

                  {/* Rotation */}
                  <div>
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Angle Rotation</span>
                      <span>{faceRotation}°</span>
                    </div>
                    <input
                      id="face-rotation-slider"
                      type="range"
                      min="-180"
                      max="180"
                      value={faceRotation}
                      onChange={(e) => setFaceRotation(parseInt(e.target.value))}
                      className="w-full h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    />
                  </div>
                </div>

                {/* 3. Blending and Historical Filters */}
                <div className="space-y-3">
                  <h4 className="font-bold text-xs text-gray-900 uppercase tracking-wider border-b border-gray-100 pb-2">
                    🎨 Era Color Match Filters
                  </h4>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { type: 'none', label: 'None' },
                      { type: 'sepia', label: 'Sepia (Warm)' },
                      { type: 'vintage', label: 'Retro Film' },
                      { type: 'bw', label: 'Silver B&W' },
                      { type: 'renaissance', label: 'Oil Brush' },
                      { type: 'popart', label: 'Pop Art' }
                    ].map((filt) => (
                      <button
                        key={filt.type}
                        id={`filter-${filt.type}`}
                        onClick={() => setBlendSettings({ ...blendSettings, filterType: filt.type as any })}
                        className={`p-2 rounded-lg text-[10px] font-bold text-center border cursor-pointer ${
                          blendSettings.filterType === filt.type
                            ? 'bg-indigo-600 border-indigo-600 text-white'
                            : 'border-gray-200 text-gray-600 hover:border-gray-300 bg-white'
                        }`}
                      >
                        {filt.label}
                      </button>
                    ))}
                  </div>

                  <div>
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Opacity Match</span>
                      <span>{(blendSettings.opacity * 100).toFixed(0)}%</span>
                    </div>
                    <input
                      id="blend-opacity-slider"
                      type="range"
                      min="0.2"
                      max="1.0"
                      step="0.05"
                      value={blendSettings.opacity}
                      onChange={(e) => setBlendSettings({ ...blendSettings, opacity: parseFloat(e.target.value) })}
                      className="w-full h-1 bg-gray-100 rounded-lg accent-indigo-600"
                    />
                  </div>
                </div>

                {/* 4. Thematic Stickers */}
                <div className="space-y-2">
                  <h4 className="font-bold text-xs text-gray-900 uppercase tracking-wider border-b border-gray-100 pb-2">
                    👑 Add Era Accessories & Props
                  </h4>
                  <div className="flex flex-wrap gap-2.5">
                    {selectedEra.presetStickers.map((stick) => (
                      <button
                        key={stick.id}
                        id={`accessory-prop-${stick.id}`}
                        onClick={() => addSticker(stick.emoji, stick.name, stick.scale)}
                        className="px-3 py-1.5 bg-gray-50 hover:bg-indigo-50 border border-gray-200 hover:border-indigo-300 text-xs rounded-full flex items-center gap-1.5 transition cursor-pointer"
                        title={stick.name}
                      >
                        <span className="text-sm">{stick.emoji}</span>
                        <span className="font-medium text-gray-700">{stick.name}</span>
                        <Plus className="w-3 h-3 text-indigo-500" />
                      </button>
                    ))}
                  </div>
                  {stickers.length > 0 && (
                    <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 mt-3">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-[10px] font-bold text-gray-400 uppercase">Active Collage Layer</span>
                        <button
                          id="clear-stickers-btn"
                          onClick={() => { setStickers([]); setSelectedStickerId(null); }}
                          className="text-[9px] text-red-500 font-bold"
                        >
                          Clear All
                        </button>
                      </div>
                      
                      <div className="space-y-2 max-h-[140px] overflow-y-auto">
                        {stickers.map((st) => (
                          <div
                            key={st.id}
                            className={`flex items-center justify-between p-2 rounded-lg text-xs border ${
                              selectedStickerId === st.id ? 'bg-indigo-50/50 border-indigo-200' : 'bg-white border-gray-100'
                            }`}
                          >
                            <button
                              onClick={() => setSelectedStickerId(st.id)}
                              className="flex items-center gap-2 font-medium text-gray-700 text-left truncate flex-1"
                            >
                              <span>{st.emoji}</span>
                              <span className="truncate">{st.name}</span>
                            </button>
                            
                            {/* Sticker Controls */}
                            {selectedStickerId === st.id && (
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => updateSticker(st.id, { scale: Math.max(0.3, st.scale - 0.1) })}
                                  className="w-5 h-5 bg-gray-100 hover:bg-gray-200 text-xs rounded flex items-center justify-center font-bold"
                                  title="Shrink"
                                >
                                  -
                                </button>
                                <button
                                  onClick={() => updateSticker(st.id, { scale: Math.min(3.0, st.scale + 0.1) })}
                                  className="w-5 h-5 bg-gray-100 hover:bg-gray-200 text-xs rounded flex items-center justify-center font-bold"
                                  title="Enlarge"
                                >
                                  +
                                </button>
                                <button
                                  onClick={() => updateSticker(st.id, { rotation: (st.rotation + 15) % 360 })}
                                  className="w-5 h-5 bg-gray-100 hover:bg-gray-200 text-xs rounded flex items-center justify-center font-bold"
                                  title="Rotate"
                                >
                                  ↷
                                </button>
                                <button
                                  onClick={() => removeSticker(st.id)}
                                  className="text-red-500 hover:text-red-700 p-0.5"
                                  title="Delete"
                                >
                                  <Trash2 className="w-4.5 h-4.5" />
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Compile/Save Row at the bottom of left column */}
          <div className="mt-8 pt-4 border-t border-gray-100">
            {editorMode === 'manual' && (
              <button
                id="compile-manual-save-btn"
                disabled={loading || !bgImageUrl}
                onClick={saveFinalCollage}
                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 text-white font-bold py-3.5 px-4 rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Save className="w-4.5 h-4.5" />
                Compile & Save Photo 📸
              </button>
            )}
          </div>

        </div>

        {/* RIGHT COLUMN: The Interactive Live Stage Canvas */}
        <div className="lg:col-span-8 bg-gray-900 p-6 flex flex-col justify-center items-center min-h-[450px] lg:min-h-[600px] relative">
          
          {/* Main Display Area */}
          <div className="w-full max-w-[512px] aspect-square bg-gray-950 rounded-2xl relative overflow-hidden shadow-2xl border border-gray-800">
            
            {/* 1. Loading overlays for long API calls */}
            <AnimatePresence>
              {loading && (
                <motion.div
                  id="canvas-loading-overlay"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-black/85 z-55 flex flex-col items-center justify-center text-center p-8"
                >
                  {/* Space Vortex Animation */}
                  <div className="relative w-24 h-24 mb-6">
                    <div className="absolute inset-0 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin" />
                    <div className="absolute inset-2 rounded-full border-4 border-purple-500/10 border-b-purple-500 animate-spin duration-3000" />
                    <div className="absolute inset-4 rounded-full border-4 border-emerald-500/20 border-r-emerald-500 animate-spin duration-1500" />
                    <span className="absolute inset-0 flex items-center justify-center text-2xl animate-pulse">⏰</span>
                  </div>
                  
                  <h3 className="text-lg font-bold text-white tracking-wide">Temporal Alignment Portal</h3>
                  <div className="h-6 mt-2 flex items-center justify-center">
                    <p className="text-xs text-indigo-300 font-mono tracking-tight animate-pulse">
                      {timeTravelQuotes[loadingStep]}
                    </p>
                  </div>
                  <p className="text-[10px] text-gray-500 mt-6 max-w-[280px]">
                    Gemini takes about 8-15 seconds to sculpt historical details. Thank you for your patience!
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Error notifications */}
            {error && (
              <div id="canvas-err-banner" className="absolute inset-0 bg-black/90 z-50 flex flex-col items-center justify-center p-6 text-center text-white">
                <p className="text-red-400 text-sm font-bold flex items-center gap-1.5 mb-2">
                  ⚠️ Space-Time Anomaly
                </p>
                <p className="text-xs text-gray-300 max-w-sm mb-4 leading-relaxed">
                  {error}
                </p>
                <button
                  id="dismiss-err-btn"
                  onClick={() => setError(null)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-xs font-bold rounded-lg transition cursor-pointer"
                >
                  Acknowledge & Dismiss
                </button>
              </div>
            )}

            {/* CANVAS MODE RENDERS */}

            {/* A. NEURAL BLEND DISPLAY */}
            {editorMode === 'ai' && (
              <div id="ai-blend-stage" className="w-full h-full flex flex-col items-center justify-center">
                {aiBlendedResult ? (
                  <div className="relative w-full h-full flex flex-col justify-between">
                    <img
                      id="ai-blend-finished-img"
                      src={aiBlendedResult}
                      alt="AI Time Travel result"
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    {/* Floating Save Actions */}
                    <div className="absolute bottom-4 left-4 right-4 flex justify-between gap-3 bg-black/60 backdrop-blur p-2.5 rounded-xl border border-white/10">
                      <div className="text-[10px] text-white/90">
                        <span className="font-bold text-emerald-400 block">✨ Fully Integrated</span>
                        Portrait by gemini-3.1-flash
                      </div>
                      <button
                        id="save-neural-btn"
                        onClick={saveAiBlended}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-4 py-1.5 rounded-lg font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Save className="w-3.5 h-3.5" /> Save to Gallery
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center p-8 flex flex-col items-center justify-center h-full">
                    <div className="p-4 bg-indigo-950 text-indigo-400 rounded-full mb-4">
                      <Wand2 className="w-10 h-10 animate-pulse" />
                    </div>
                    <h4 className="text-white font-bold text-sm">Neural Blend Portal Primed</h4>
                    <p className="text-xs text-gray-400 mt-2 max-w-xs leading-relaxed">
                      Click the <strong>"Initiate Neural Blend"</strong> button on the left panel to have Gemini seamlessly reconstruct your face inside a fully synthesized historical scene.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* B. MANUAL COLLAGE DISPLAY */}
            {editorMode === 'manual' && (
              <div id="manual-collage-stage" className="w-full h-full relative select-none overflow-hidden">
                {bgImageUrl ? (
                  <>
                    {/* 1. Backdrop */}
                    <img
                      id="collage-bg-img"
                      src={bgImageUrl}
                      alt="Generated Era Background"
                      className="w-full h-full object-cover"
                      draggable="false"
                      referrerPolicy="no-referrer"
                    />

                    {/* 2. Floating Face Overlay */}
                    <div
                      id="collage-face-container"
                      style={{
                        position: 'absolute',
                        left: `${faceX}%`,
                        top: `${faceY}%`,
                        transform: `translate(-50%, -50%) scale(${faceScale}) rotate(${faceRotation}deg)`,
                        width: '240px',
                        height: '240px',
                        cursor: 'move',
                        borderRadius: '50%',
                        overflow: 'hidden',
                        userSelect: 'none',
                        touchAction: 'none'
                      }}
                      className="border-2 border-dashed border-white/35 shadow-2xl relative group"
                    >
                      {/* Face photo with CSS filters applied dynamically */}
                      <img
                        id="collage-face-img"
                        src={userPhoto}
                        alt="Your Face"
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          opacity: blendSettings.opacity,
                          filter: `
                            ${blendSettings.filterType === 'sepia' ? 'sepia(0.85) hue-rotate(-10deg) saturate(0.9)' : ''}
                            ${blendSettings.filterType === 'vintage' ? 'sepia(0.3) saturate(1.1) contrast(0.9)' : ''}
                            ${blendSettings.filterType === 'bw' ? 'grayscale(1) contrast(1.3)' : ''}
                            ${blendSettings.filterType === 'renaissance' ? 'saturate(0.85) contrast(1.15) sepia(0.15)' : ''}
                            ${blendSettings.filterType === 'steampunk' ? 'sepia(0.6) saturate(1.4) hue-rotate(-5deg) contrast(1.1)' : ''}
                            ${blendSettings.filterType === 'popart' ? 'contrast(1.6) saturate(2.0)' : ''}
                            brightness(${blendSettings.brightness})
                            contrast(${blendSettings.contrast})
                            ${blendSettings.blur > 0 ? `blur(${blendSettings.blur}px)` : ''}
                          `.trim() || 'none'
                        }}
                        draggable="false"
                        referrerPolicy="no-referrer"
                      />

                      {/* Guide border overlay on hover */}
                      <div className="absolute inset-0 border border-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none rounded-full flex items-center justify-center">
                        <span className="bg-black/60 text-[9px] text-white px-2 py-0.5 rounded-full uppercase tracking-wider">
                          Adjust Face
                        </span>
                      </div>
                    </div>

                    {/* 3. Floating Sticker Instances */}
                    {stickers.map((sticker) => {
                      const isSelected = selectedStickerId === sticker.id;
                      return (
                        <div
                          key={sticker.id}
                          id={sticker.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedStickerId(sticker.id);
                          }}
                          style={{
                            position: 'absolute',
                            left: `${sticker.x}%`,
                            top: `${sticker.y}%`,
                            transform: `translate(-50%, -50%) scale(${sticker.scale}) rotate(${sticker.rotation}deg)`,
                            cursor: 'pointer',
                            fontSize: '60px',
                            userSelect: 'none',
                            lineHeight: 1
                          }}
                          className={`hover:scale-105 active:scale-95 transition-transform ${
                            isSelected ? 'ring-2 ring-indigo-500 rounded-lg p-1 bg-white/20 backdrop-blur-xs' : ''
                          }`}
                        >
                          {sticker.emoji}
                        </div>
                      );
                    })}

                    {/* Stage helper alert */}
                    <div className="absolute top-3 left-3 bg-black/65 backdrop-blur px-3 py-1.5 rounded-full border border-white/10 pointer-events-none text-[10px] text-white/90">
                      💡 Reposition overlays using sliders on the left!
                    </div>
                  </>
                ) : (
                  <div className="text-center p-8 flex flex-col items-center justify-center h-full">
                    <div className="p-4 bg-purple-950 text-purple-400 rounded-full mb-4">
                      <ImageIcon className="w-10 h-10 animate-pulse" />
                    </div>
                    <h4 className="text-white font-bold text-sm">Background Loading</h4>
                    <p className="text-xs text-gray-400 mt-2 max-w-xs leading-relaxed">
                      Crafting your historical setting. If it doesn't appear in a few seconds, click <strong>"Edit & Re-render Backdrop"</strong> to generate one.
                    </p>
                  </div>
                )}
              </div>
            )}

          </div>

          {/* Quick status bar */}
          <div className="w-full max-w-[512px] flex justify-between items-center text-[10px] text-gray-500 mt-3 font-mono">
            <span>COORDINATES: DEPT: {customEraActive ? 'CUSTOM' : selectedEra.id.toUpperCase()}</span>
            <span>DPI: 1024x1024</span>
          </div>

        </div>
      </div>
    </div>
  );
}
