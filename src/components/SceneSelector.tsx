import React, { useState } from 'react';
import { Era, HISTORICAL_ERAS } from '../types';
import { Sparkles, ArrowRight, Hourglass, Globe, History, Check } from 'lucide-react';
import { motion } from 'motion/react';

interface SceneSelectorProps {
  selectedEra: Era;
  onSelectEra: (era: Era) => void;
  customEraText: string;
  onCustomEraTextChange: (text: string) => void;
  isCustomActive: boolean;
  onToggleCustom: (active: boolean) => void;
}

export default function SceneSelector({
  selectedEra,
  onSelectEra,
  customEraText,
  onCustomEraTextChange,
  isCustomActive,
  onToggleCustom,
}: SceneSelectorProps) {
  const [customPromptOpen, setCustomPromptOpen] = useState(isCustomActive);

  const handleEraClick = (era: Era) => {
    onSelectEra(era);
    onToggleCustom(false);
  };

  const handleCustomMode = () => {
    onToggleCustom(true);
  };

  return (
    <div id="scene-selector-root" className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 md:p-8">
      <div className="mb-6">
        <h2 id="scene-title" className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
          <History className="w-6 h-6 text-indigo-600" />
          Step 2: Destination Era Selection
        </h2>
        <p id="scene-desc" className="text-sm text-gray-500 mt-1">
          Pick a predefined time-period, or design a completely custom epoch using Gemini.
        </p>
      </div>

      {/* Grid of predefined Eras */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
        {HISTORICAL_ERAS.map((era) => {
          const isSelected = !isCustomActive && selectedEra.id === era.id;
          return (
            <motion.button
              key={era.id}
              id={`era-card-${era.id}`}
              onClick={() => handleEraClick(era)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`p-4 rounded-xl border text-left flex flex-col justify-between h-36 transition-all relative overflow-hidden cursor-pointer ${
                isSelected
                  ? 'border-indigo-600 bg-indigo-50/50 shadow-md ring-2 ring-indigo-600/20'
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
              }`}
            >
              <div>
                <span className="text-2xl mb-2 block">{era.avatarEmoji}</span>
                <h4 className="font-bold text-gray-900 text-sm md:text-base leading-tight">
                  {era.name}
                </h4>
                <p className="text-xs text-indigo-600 font-medium mt-1">
                  {era.timePeriod}
                </p>
              </div>
              <p className="text-[10px] text-gray-400 truncate w-full">
                {era.description}
              </p>
              
              {isSelected && (
                <div className="absolute top-2 right-2 bg-indigo-600 text-white p-1 rounded-full text-[9px]">
                  <Check className="w-3 h-3" />
                </div>
              )}
            </motion.button>
          );
        })}

        {/* Custom Era Option Card */}
        <motion.button
          id="custom-era-card"
          onClick={handleCustomMode}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={`p-4 rounded-xl border text-left flex flex-col justify-between h-36 transition-all relative overflow-hidden cursor-pointer ${
            isCustomActive
              ? 'border-purple-600 bg-purple-50/50 shadow-md ring-2 ring-purple-600/20'
              : 'border-dashed border-purple-300 bg-purple-50/10 hover:border-purple-400 hover:bg-purple-50/20'
          }`}
        >
          <div>
            <span className="text-2xl mb-2 block">🌌</span>
            <h4 className="font-bold text-purple-900 text-sm md:text-base leading-tight">
              Custom Era...
            </h4>
            <p className="text-xs text-purple-600 font-medium mt-1">
              Any Time or Place
            </p>
          </div>
          <p className="text-[10px] text-purple-500 font-semibold flex items-center gap-1">
            <Sparkles className="w-3 h-3 shrink-0" /> Let your mind travel
          </p>
          
          {isCustomActive && (
            <div className="absolute top-2 right-2 bg-purple-600 text-white p-1 rounded-full text-[9px]">
              <Check className="w-3 h-3" />
            </div>
          )}
        </motion.button>
      </div>

      {/* Selected Era Detail Panel / Custom Text Form */}
      {isCustomActive ? (
        <motion.div
          id="custom-input-panel"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-5 border border-purple-100 bg-purple-50/25 rounded-2xl"
        >
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-5 h-5 text-purple-600" />
            <h3 className="font-bold text-purple-950 text-sm uppercase tracking-wider">
              Quantum Destination Settings
            </h3>
          </div>
          <p className="text-xs text-gray-500 mb-4">
            Type anything. A historical year, a fictional cyberworld, a dinosaur jungle, or a traditional royalty setting. Gemini will craft a high-quality historical backdrop based on your instruction!
          </p>
          <div className="space-y-3">
            <label className="block text-xs font-semibold text-gray-700">
              Where & When are you traveling?
            </label>
            <textarea
              id="custom-era-textarea"
              rows={3}
              value={customEraText}
              onChange={(e) => onCustomEraTextChange(e.target.value)}
              placeholder="e.g., A high-society royal ballroom in the Maurya Empire c. 250 BCE, royal court with gold carvings and silk banners..."
              className="w-full text-sm p-3 border border-purple-200 rounded-xl focus:ring-2 focus:ring-purple-400 focus:border-purple-500 bg-white shadow-sm resize-none"
            />
            <div className="flex items-center justify-between text-[11px] text-purple-600">
              <span>🧠 Driven by gemini-3.1-flash-image</span>
              <span>Pro Tip: Be descriptive! Describe styles, outfits, and backgrounds.</span>
            </div>
          </div>
        </motion.div>
      ) : (
        <motion.div
          id="predefined-detail-panel"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-5 border border-indigo-100 bg-indigo-50/25 rounded-2xl flex flex-col md:flex-row justify-between gap-5"
        >
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Hourglass className="w-4 h-4 text-indigo-600" />
              <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider bg-indigo-100 px-2.5 py-0.5 rounded-full">
                Selected Destination
              </span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 leading-tight">
              {selectedEra.name} <span className="text-sm font-normal text-gray-500">({selectedEra.timePeriod})</span>
            </h3>
            <p className="text-sm text-gray-600 mt-2">
              {selectedEra.description}
            </p>
            <div className="mt-4 bg-white/70 border border-gray-100 p-3 rounded-lg">
              <span className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Backdrop Generation Prompt</span>
              <p className="text-xs text-gray-600 font-serif italic">
                "{selectedEra.suggestedPrompt}"
              </p>
            </div>
          </div>

          <div className="flex md:flex-col justify-end gap-3 shrink-0">
            <div className="text-center md:text-right">
              <span className="text-[10px] text-gray-400 block font-semibold uppercase">Est. Travel Cost</span>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full inline-block mt-1 border border-emerald-100">
                0 Quantum Joules (Free)
              </span>
            </div>
            <div className="text-center md:text-right hidden md:block">
              <span className="text-[10px] text-gray-400 block font-semibold uppercase">Temporal Safety</span>
              <span className="text-xs font-bold text-indigo-600 bg-indigo-100/50 px-2.5 py-1 rounded-full inline-block mt-1">
                Fully Synchronized
              </span>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
