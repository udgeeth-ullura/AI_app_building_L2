import React, { useState, useEffect } from 'react';
import { Era, HISTORICAL_ERAS, TimeTravelPhoto } from './types';
import CameraBooth from './components/CameraBooth';
import SceneSelector from './components/SceneSelector';
import CanvasEditor from './components/CanvasEditor';
import HistoryGallery from './components/HistoryGallery';
import UserAuthHeader from './components/UserAuthHeader';
import { auth, savePhotoToCloud, fetchPhotosFromCloud, deletePhotoFromCloud, onAuthChange } from './lib/firebase';
import { Hourglass, Sparkles, RefreshCw, Compass, ArrowDown, HelpCircle, History, AlertTriangle, X } from 'lucide-react';
import { motion } from 'motion/react';

export default function App() {
  const [userPhoto, setUserPhoto] = useState<string | null>(null);
  const [selectedEra, setSelectedEra] = useState<Era>(HISTORICAL_ERAS[0]);
  const [customEraActive, setCustomEraActive] = useState<boolean>(false);
  const [customEraText, setCustomEraText] = useState<string>('');
  const [savedPhotos, setSavedPhotos] = useState<TimeTravelPhoto[]>([]);
  
  // Firebase Auth & Cloud Sync States
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Load photos from localStorage on mount & subscribe to Auth updates
  useEffect(() => {
    // Initial load from local storage
    try {
      const cached = localStorage.getItem('time_travel_photos');
      if (cached) {
        setSavedPhotos(JSON.parse(cached));
      }
    } catch (err) {
      console.error("Failed to load saved photos:", err);
    }

    const unsubscribe = onAuthChange(async (firebaseUser) => {
      setCurrentUser(firebaseUser);
      if (firebaseUser) {
        setIsSyncing(true);
        try {
          // Fetch synced photos from Firestore cloud
          const cloudPhotos = await fetchPhotosFromCloud(firebaseUser.uid);
          
          // Merge strategy: sync local photos created before signing in to their account
          const cachedLocal = localStorage.getItem('time_travel_photos');
          let localPhotos: TimeTravelPhoto[] = [];
          if (cachedLocal) {
            try {
              localPhotos = JSON.parse(cachedLocal);
            } catch (e) {
              console.error(e);
            }
          }

          if (localPhotos.length > 0) {
            const cloudIds = new Set(cloudPhotos.map(p => p.id));
            const unsyncedPhotos = localPhotos.filter(p => !cloudIds.has(p.id));

            if (unsyncedPhotos.length > 0) {
              console.log(`Syncing ${unsyncedPhotos.length} unsynced photos to Firebase Cloud...`);
              for (const photo of unsyncedPhotos) {
                await savePhotoToCloud(firebaseUser.uid, photo);
              }
              const refreshedCloudPhotos = await fetchPhotosFromCloud(firebaseUser.uid);
              setSavedPhotos(refreshedCloudPhotos);
              localStorage.setItem('time_travel_photos', JSON.stringify(refreshedCloudPhotos));
            } else {
              setSavedPhotos(cloudPhotos);
              localStorage.setItem('time_travel_photos', JSON.stringify(cloudPhotos));
            }
          } else {
            setSavedPhotos(cloudPhotos);
            localStorage.setItem('time_travel_photos', JSON.stringify(cloudPhotos));
          }
        } catch (err) {
          console.error("Cloud synchronizer loading error: ", err);
        } finally {
          setIsSyncing(false);
        }
      } else {
        // Logged out: fallback to local storage
        try {
          const cached = localStorage.getItem('time_travel_photos');
          if (cached) {
            setSavedPhotos(JSON.parse(cached));
          } else {
            setSavedPhotos([]);
          }
        } catch (err) {
          console.error("Local recovery error on logout:", err);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Persist photos on change (Cloud + Local storage integration)
  const handleSavePhoto = async (newPhoto: TimeTravelPhoto) => {
    const updated = [newPhoto, ...savedPhotos];
    setSavedPhotos(updated);
    
    try {
      localStorage.setItem('time_travel_photos', JSON.stringify(updated));
    } catch (err) {
      console.error("Failed to persist photos locally:", err);
    }

    if (currentUser) {
      setIsSyncing(true);
      const success = await savePhotoToCloud(currentUser.uid, newPhoto);
      if (!success) {
        console.warn("Failed to synchronize save event with Google Cloud.");
      }
      setIsSyncing(false);
    }
  };

  const handleDeletePhoto = async (id: string) => {
    if (confirm("Are you sure you want to permanently erase this record from the historical archives?")) {
      const updated = savedPhotos.filter(p => p.id !== id);
      setSavedPhotos(updated);
      
      try {
        localStorage.setItem('time_travel_photos', JSON.stringify(updated));
      } catch (err) {
        console.error("Failed to persist deleted photo list locally:", err);
      }

      if (currentUser) {
        setIsSyncing(true);
        const success = await deletePhotoFromCloud(currentUser.uid, id);
        if (!success) {
          console.warn("Failed to synchronize delete event with Google Cloud.");
        }
        setIsSyncing(false);
      }
    }
  };

  const handleClearPhoto = () => {
    setUserPhoto(null);
  };

  return (
    <div id="app-root" className="min-h-screen bg-slate-50 font-sans text-gray-800 antialiased selection:bg-indigo-500 selection:text-white">
      
      {/* Decorative cosmic neon top strip */}
      <div className="h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        
        {/* Application Header Banner */}
        <header id="app-header" className="relative bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950 rounded-3xl p-8 md:p-12 text-white shadow-xl overflow-hidden border border-indigo-900/30">
          
          {/* Absolute Background Effects */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(99,102,241,0.15),transparent_50%)]" />
          <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-1.5 bg-white/10 backdrop-blur px-3 py-1 rounded-full border border-white/10 text-xs font-semibold text-indigo-300">
              <Hourglass className="w-3.5 h-3.5 text-indigo-400 animate-spin duration-5000" />
              Chronal Warp Device v3.2
            </div>
            
            <h1 id="app-title" className="text-4xl md:text-5xl font-extrabold tracking-tight font-display bg-gradient-to-r from-white via-indigo-100 to-purple-200 bg-clip-text text-transparent">
              Time-Travel Photo Booth
            </h1>
            
            <p id="app-description" className="text-sm md:text-base text-gray-300 leading-relaxed max-w-2xl">
              Transport your face into different eras of history with beautiful, high-quality results. 
              Our portal leverages <strong>gemini-3.1-pro-preview</strong> to scan your portrait, and 
              <strong>gemini-3.1-flash-image</strong> to seamlessly synthesize your features into knights, 
              pharaohs, retro flappers, or astronauts!
            </p>

            <div className="pt-2 flex flex-wrap gap-4 text-xs text-indigo-200/80">
              <span className="flex items-center gap-1">
                <Sparkles className="w-4 h-4 text-purple-400" />
                Dual-Mode (Neural Blend & Canvas Overlay)
              </span>
              <span className="hidden sm:inline">•</span>
              <span className="flex items-center gap-1">
                <Compass className="w-4 h-4 text-indigo-400" />
                Custom Era Prompts Enabled
              </span>
            </div>
          </div>
        </header>

        {/* Firebase Authentication Synchronizer */}
        <UserAuthHeader 
          user={currentUser} 
          isSyncing={isSyncing} 
          onAuthError={setAuthError} 
        />

        {/* Display Auth Errors gracefully */}
        {authError && (
          <div className="bg-red-50 border border-red-100 p-4 rounded-2xl flex items-start gap-3 justify-between">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-red-950 text-sm">Authentication Notice</h4>
                <p className="text-xs text-red-700 mt-0.5 leading-relaxed">{authError}</p>
              </div>
            </div>
            <button 
              onClick={() => setAuthError(null)}
              className="text-red-400 hover:text-red-900 transition p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Display Sandbox Fallback/API Restriction notice */}
        {currentUser?.authNotice && (
          <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-start gap-3 justify-between">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5 animate-pulse" />
              <div>
                <h4 className="font-bold text-amber-950 text-sm">Sandbox Mode Activated (API Key Restricted)</h4>
                <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                  {currentUser.authNotice}
                </p>
                <div className="mt-2 text-xs text-amber-900 bg-amber-100/50 p-2.5 rounded-lg border border-amber-200/40">
                  <span className="font-bold">How to fix real Firebase login:</span>
                  <ol className="list-decimal pl-4 mt-1 space-y-1">
                    <li>Go to the <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noreferrer" className="underline font-semibold hover:text-indigo-800">Google Cloud Console API Credentials page</a>.</li>
                    <li>Select your project and edit the restricted API key you created for Firebase.</li>
                    <li>Under <strong>API restrictions</strong>, either set to "Don't restrict key" or ensure the <strong>Identity Toolkit API</strong> and <strong>Token Service API</strong> are checked in the permitted list.</li>
                  </ol>
                </div>
              </div>
            </div>
            <button 
              onClick={() => {
                // Clear the notice locally for this session
                setCurrentUser({ ...currentUser, authNotice: null });
              }}
              className="text-amber-400 hover:text-amber-900 transition p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* STEP 1 & STEP 2 ROW (Side-by-side on desktop) */}
        <section id="setup-section" className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Step 1: Face Portrait Capture */}
          <div className="h-full">
            <CameraBooth
              onPhotoSelected={setUserPhoto}
              savedPhoto={userPhoto}
              onClear={handleClearPhoto}
            />
          </div>

          {/* Step 2: Historical Destination */}
          <div className="h-full">
            <SceneSelector
              selectedEra={selectedEra}
              onSelectEra={setSelectedEra}
              customEraText={customEraText}
              onCustomEraTextChange={setCustomEraText}
              isCustomActive={customEraActive}
              onToggleCustom={setCustomEraActive}
            />
          </div>
        </section>

        {/* STEP 3: Active Workspace */}
        <section id="workspace-section">
          {userPhoto ? (
            <CanvasEditor
              userPhoto={userPhoto}
              selectedEra={selectedEra}
              customEraActive={customEraActive}
              customEraText={customEraText}
              onSavePhoto={handleSavePhoto}
            />
          ) : (
            // Awaiting Portrait Invitation Layout
            <div id="awaiting-portrait-card" className="bg-white rounded-2xl shadow-md border border-gray-100 p-8 text-center flex flex-col items-center justify-center min-h-[300px]">
              <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mb-4 border border-indigo-100 animate-bounce">
                <ArrowDown className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-gray-900 text-lg">Quantum Workspace Sealed</h3>
              <p className="text-sm text-gray-500 mt-1 max-w-md mx-auto leading-relaxed">
                Please complete <strong>Step 1</strong> by snapping or uploading your face portrait above. Once your portrait is locked, the Warp Workspace will open instantly!
              </p>
              
              <div className="mt-6 flex flex-wrap justify-center gap-3 text-xs text-gray-400">
                <span className="bg-gray-100 px-3 py-1 rounded-full">1. Scan Portrait</span>
                <span>→</span>
                <span className="bg-gray-100 px-3 py-1 rounded-full">2. Choose Epoch</span>
                <span>→</span>
                <span className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full font-semibold">3. Neural Warp! 🚀</span>
              </div>
            </div>
          )}
        </section>

        {/* STEP 4: History Album Gallery */}
        <section id="gallery-section" className="pt-4 border-t border-gray-200">
          <HistoryGallery
            photos={savedPhotos}
            onDeletePhoto={handleDeletePhoto}
          />
        </section>

        {/* App Footer */}
        <footer id="app-footer" className="text-center pt-10 pb-4 text-xs text-gray-400 border-t border-gray-100">
          <p>© 2026 Quantum Temporal Industries. Powered by Google Gemini. All rights reserved.</p>
          <p className="mt-1">
            Always play safely inside your local timeline. Discrepancies in retro-fitted hair styles are expected.
          </p>
        </footer>

      </div>
    </div>
  );
}

