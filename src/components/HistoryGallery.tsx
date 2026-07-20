import React, { useState } from 'react';
import { TimeTravelPhoto } from '../types';
import { Calendar, Trash2, Download, Share2, Eye, X, ArrowLeftRight, Clock, Award } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface HistoryGalleryProps {
  photos: TimeTravelPhoto[];
  onDeletePhoto: (id: string) => void;
}

export default function HistoryGallery({ photos, onDeletePhoto }: HistoryGalleryProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<TimeTravelPhoto | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  const downloadImage = (photo: TimeTravelPhoto) => {
    const link = document.createElement('a');
    link.href = photo.resultPhotoUrl;
    link.download = `time_travel_${photo.eraId}_${photo.id}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const sharePhotoText = (photo: TimeTravelPhoto) => {
    const text = `Check out my photo from ${photo.eraName} (${new Date(photo.timestamp).toLocaleDateString()}) using the Time-Travel Photo Booth! 🚀⌛ Here is how the AI described me: "${photo.analysisText}"`;
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  if (photos.length === 0) {
    return (
      <div id="gallery-empty-root" className="bg-gray-50 border border-gray-100 rounded-2xl p-8 text-center max-w-lg mx-auto mt-6">
        <div className="text-4xl mb-3">⏳</div>
        <h3 className="font-bold text-gray-800 text-base">Your Temporal Archive is Empty</h3>
        <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto leading-relaxed">
          Snap a portrait, select a target era, and start your quantum warp to build your historical photo album!
        </p>
      </div>
    );
  }

  return (
    <div id="gallery-root" className="space-y-6">
      <div>
        <h2 id="gallery-title" className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
          <Clock className="w-6 h-6 text-indigo-600" />
          My Temporal Photo Archive
        </h2>
        <p id="gallery-desc" className="text-sm text-gray-500 mt-1">
          Your saved travels are stored securely inside your local chronometer (browser cache).
        </p>
      </div>

      {/* Grid of photos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {photos.map((photo) => (
          <motion.div
            key={photo.id}
            id={`gallery-item-${photo.id}`}
            whileHover={{ y: -4 }}
            className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col justify-between"
          >
            {/* Image display */}
            <div className="aspect-square relative group overflow-hidden bg-gray-950">
              <img
                id={`gallery-item-img-${photo.id}`}
                src={photo.resultPhotoUrl}
                alt={photo.eraName}
                className="w-full h-full object-cover transition duration-500 group-hover:scale-103"
                referrerPolicy="no-referrer"
              />
              
              {/* Overlay with buttons on hover */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                <button
                  id={`view-btn-${photo.id}`}
                  onClick={() => setSelectedPhoto(photo)}
                  className="p-2.5 bg-white text-gray-900 rounded-lg hover:bg-gray-100 transition shadow cursor-pointer"
                  title="View Detail"
                >
                  <Eye className="w-5 h-5" />
                </button>
                <button
                  id={`download-btn-${photo.id}`}
                  onClick={() => downloadImage(photo)}
                  className="p-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition shadow cursor-pointer"
                  title="Download File"
                >
                  <Download className="w-5 h-5" />
                </button>
                <button
                  id={`delete-btn-${photo.id}`}
                  onClick={() => onDeletePhoto(photo.id)}
                  className="p-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition shadow cursor-pointer"
                  title="Delete Travel"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Card Content */}
            <div className="p-4 bg-white border-t border-gray-50">
              <div className="flex justify-between items-start gap-1">
                <div>
                  <h4 className="font-bold text-gray-900 text-sm md:text-base">
                    {photo.eraName}
                  </h4>
                  <p className="text-[10px] text-gray-400 font-medium flex items-center gap-1 mt-0.5">
                    <Calendar className="w-3 h-3 text-indigo-500" />
                    {new Date(photo.timestamp).toLocaleDateString()}
                  </p>
                </div>
                <button
                  id={`card-del-btn-${photo.id}`}
                  onClick={() => onDeletePhoto(photo.id)}
                  className="text-gray-400 hover:text-red-500 transition p-1 cursor-pointer"
                  title="Delete Entry"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* DETAIL MODAL OVERLAY */}
      <AnimatePresence>
        {selectedPhoto && (
          <motion.div
            id="detail-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedPhoto(null)}
            className="fixed inset-0 bg-black/75 z-100 flex items-center justify-center p-4 backdrop-blur-xs overflow-y-auto"
          >
            <motion.div
              id="detail-modal-card"
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-100 flex flex-col md:flex-row"
            >
              {/* Modal Left Column: Big Result Image */}
              <div className="md:w-1/2 relative bg-gray-950 aspect-square md:aspect-auto md:min-h-[450px]">
                <img
                  id="modal-result-img"
                  src={selectedPhoto.resultPhotoUrl}
                  alt={selectedPhoto.eraName}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                
                {/* Floating Badge */}
                <div className="absolute top-4 left-4 bg-black/60 backdrop-blur px-3 py-1 rounded-full border border-white/10 text-xs font-semibold text-white flex items-center gap-1">
                  <Award className="w-4 h-4 text-indigo-400" />
                  Temporal Composite
                </div>
              </div>

              {/* Modal Right Column: Full Details */}
              <div className="md:w-1/2 p-6 md:p-8 flex flex-col justify-between space-y-6 bg-white">
                <div>
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] text-indigo-600 bg-indigo-50 font-bold px-2.5 py-0.5 rounded-full uppercase">
                        Quantum Travel Entry
                      </span>
                      <h3 id="modal-era-title" className="text-2xl font-bold text-gray-900 mt-1.5 leading-none">
                        {selectedPhoto.eraName}
                      </h3>
                      <p className="text-[11px] text-gray-400 mt-1">
                        Saves Logged: {new Date(selectedPhoto.timestamp).toLocaleString()}
                      </p>
                    </div>
                    <button
                      id="close-modal-btn"
                      onClick={() => setSelectedPhoto(null)}
                      className="p-2 text-gray-400 hover:text-gray-900 rounded-full hover:bg-gray-100 transition cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Comparisons */}
                  <div className="mt-6 space-y-4">
                    {/* Face Comparison Mini Layout */}
                    <div className="border border-gray-100 rounded-xl p-3 bg-gray-50 flex items-center gap-4">
                      <img
                        id="modal-source-mini-img"
                        src={selectedPhoto.sourcePhotoUrl}
                        alt="Original Face"
                        className="w-14 h-14 object-cover rounded-full border border-gray-300 shadow-inner shrink-0"
                        referrerPolicy="no-referrer"
                      />
                      <div>
                        <span className="text-[10px] font-bold text-gray-400 block uppercase">Original Subject Portrait</span>
                        <p className="text-xs text-gray-600 leading-tight">
                          Face shape and alignment points successfully synchronized.
                        </p>
                      </div>
                    </div>

                    {/* Gemini Face Analysis Text Box */}
                    <div className="border border-indigo-50 bg-indigo-50/15 p-4 rounded-xl">
                      <span className="text-[10px] font-bold text-indigo-600 block mb-1 uppercase tracking-wider">
                        Gemini Facial Character Profile
                      </span>
                      <p className="text-xs text-gray-700 leading-relaxed italic">
                        "{selectedPhoto.analysisText}"
                      </p>
                    </div>

                    {/* Background generation parameters */}
                    <div className="border border-gray-100 p-3 rounded-lg">
                      <span className="text-[9px] font-bold text-gray-400 uppercase block">Generation Backdrop Prompt</span>
                      <p className="text-xs text-gray-500 font-mono mt-0.5 line-clamp-2">
                        {selectedPhoto.promptUsed}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Footer buttons */}
                <div className="pt-4 border-t border-gray-100 flex flex-wrap gap-3">
                  <button
                    id="modal-download-btn"
                    onClick={() => downloadImage(selectedPhoto)}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md transition cursor-pointer"
                  >
                    <Download className="w-4 h-4" /> Download PNG
                  </button>
                  <button
                    id="modal-share-btn"
                    onClick={() => sharePhotoText(selectedPhoto)}
                    className="bg-gray-50 border border-gray-200 hover:bg-gray-100 text-gray-700 font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <Share2 className="w-4 h-4 text-indigo-600" /> 
                    {isCopied ? "Copied Link!" : "Copy Share Card"}
                  </button>
                  <button
                    id="modal-delete-btn"
                    onClick={() => {
                      onDeletePhoto(selectedPhoto.id);
                      setSelectedPhoto(null);
                    }}
                    className="bg-red-50 hover:bg-red-100 text-red-600 font-bold p-2.5 rounded-xl text-xs transition cursor-pointer"
                    title="Delete Entry"
                  >
                    <Trash2 className="w-4.5 h-4.5" />
                  </button>
                </div>

              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
