import React, { useState } from 'react';
import { PhotoRecord } from '../../types';
import {
  X,
  Cloud,
  CloudCheck,
  Smartphone,
  Trash2,
  Edit3,
  Download,
  Info,
  Layers,
  ZoomIn,
  Sparkles,
  Share2,
  HardDrive,
  CheckCircle2,
  AlertCircle,
  Sun,
  Zap,
  Award,
} from 'lucide-react';

interface GalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  photos: PhotoRecord[];
  onDeletePhoto: (id: string) => Promise<void>;
  onBackupPhoto: (photo: PhotoRecord) => Promise<void>;
  onBackupAll: () => Promise<void>;
  onFreeUpSpace: () => Promise<void>;
  onOpenEditor: (photo: PhotoRecord) => void;
  isSyncing: boolean;
  isOffline: boolean;
}

export const GalleryModal: React.FC<GalleryModalProps> = ({
  isOpen,
  onClose,
  photos,
  onDeletePhoto,
  onBackupPhoto,
  onBackupAll,
  onFreeUpSpace,
  onOpenEditor,
  isSyncing,
  isOffline,
}) => {
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoRecord | null>(null);
  const [showExif, setShowExif] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | '50mp' | '100mp' | 'night_vision' | 'thermal' | 'portrait' | 'zoom' | 'night' | 'hdr'>('all');
  const [brightenView, setBrightenView] = useState<boolean>(true); // "Photo ko bright krke dikhaye" enabled by default!

  if (!isOpen) return null;

  const filteredPhotos = photos.filter((p) => {
    if (activeFilter === 'all') return true;
    if (activeFilter === '50mp') return p.metadata?.is50Mp || p.mode === '50mp';
    if (activeFilter === '100mp') return p.metadata?.is100Mp;
    if (activeFilter === 'night_vision') return p.mode === 'night_vision' || p.filter === 'night_vision';
    if (activeFilter === 'thermal') return p.mode === 'thermal' || p.filter === 'thermal';
    if (activeFilter === 'portrait') return p.mode === 'portrait';
    if (activeFilter === 'zoom') return p.zoomLevel >= 5;
    if (activeFilter === 'night') return p.mode === 'night';
    if (activeFilter === 'hdr') return p.mode === 'hdr';
    return true;
  });

  const unSyncedCount = photos.filter((p) => p.cloudSyncStatus !== 'synced').length;

  const handleDownload = (photo: PhotoRecord) => {
    const link = document.createElement('a');
    link.href = photo.dataUrl;
    link.download = `GCam_Photo_${photo.id}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-2xl flex flex-col text-white select-none">
      {/* Top Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-black/60">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-white/70 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
          <div>
            <h2 className="font-semibold text-sm">GCam Vision Gallery</h2>
            <p className="text-[11px] text-white/50 font-mono">
              {photos.length} photos • {photos.length - unSyncedCount} in Cloud Backup
            </p>
          </div>
        </div>

        {/* Cloud Actions */}
        <div className="flex items-center gap-2">
          {unSyncedCount > 0 && !isOffline && (
            <button
              onClick={onBackupAll}
              disabled={isSyncing}
              className="flex items-center gap-1.5 px-3 py-1 bg-amber-400 hover:bg-amber-300 text-black font-semibold text-xs rounded-full shadow transition-all"
            >
              <Cloud className="w-3.5 h-3.5" />
              <span>{isSyncing ? 'Backing up...' : `Backup (${unSyncedCount})`}</span>
            </button>
          )}

          <button
            onClick={onFreeUpSpace}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-white/10 hover:bg-white/20 text-white/90 text-xs rounded-full border border-white/10 transition-all"
            title="Free up device storage by clearing local copy of synced photos"
          >
            <HardDrive className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Free Space</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 px-4 py-2 bg-neutral-950 border-b border-white/10 overflow-x-auto">
        {(['all', '50mp', '100mp', 'night_vision', 'thermal', 'portrait', 'zoom', 'night', 'hdr'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveFilter(tab)}
            className={`px-3 py-1 rounded-full text-xs font-mono transition-all uppercase whitespace-nowrap ${
              activeFilter === tab
                ? 'bg-amber-400 text-black font-bold'
                : 'text-white/60 hover:text-white hover:bg-white/10'
            }`}
          >
            {tab === 'all'
              ? 'All Shots'
              : tab === '50mp'
              ? '📷 50 MP Real'
              : tab === '100mp'
              ? '⭐ 100 MP Ultra'
              : tab === 'night_vision'
              ? '🟢 Night Vision'
              : tab === 'thermal'
              ? '🔥 Thermal'
              : tab === 'zoom'
              ? '100x Zoom'
              : tab === 'portrait'
              ? 'Portrait Bokeh'
              : tab === 'night'
              ? 'Night Sight'
              : 'HDR+ Pro'}
          </button>
        ))}
      </div>

      {/* Grid or Empty State */}
      <div className="flex-1 overflow-y-auto p-4">
        {filteredPhotos.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center text-white/50">
            <Layers className="w-12 h-12 mb-3 text-white/20" />
            <p className="text-sm font-medium">No photos captured yet</p>
            <p className="text-xs text-white/40 mt-1 max-w-xs">
              Tap the shutter button in the camera to capture ultra-clear photos with 50 MP real sensor, Night Vision, Thermal, and Xenon flash!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
            {filteredPhotos.map((photo) => {
              const isCloud = photo.cloudSyncStatus === 'synced';
              return (
                <div
                  key={photo.id}
                  onClick={() => setSelectedPhoto(photo)}
                  className="group relative aspect-square bg-neutral-900 rounded-xl overflow-hidden cursor-pointer border border-white/10 hover:border-amber-400/60 transition-all shadow-md"
                >
                  <img
                    src={photo.thumbnailUrl || photo.dataUrl}
                    alt="Capture"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />

                  {/* Mode badge & 50MP/100MP indicator */}
                  <div className="absolute top-1 left-1 flex flex-col gap-0.5">
                    <div className="px-1.5 py-0.5 bg-black/60 backdrop-blur-sm rounded text-[9px] font-mono text-white/90">
                      {photo.zoomLevel > 1 && `${photo.zoomLevel.toFixed(1)}x `}
                      {photo.mode.toUpperCase()}
                    </div>
                    {photo.metadata?.is50Mp && (
                      <div className="px-1.5 py-0.2 bg-gradient-to-r from-amber-400 to-amber-500 text-black font-mono font-bold text-[8px] rounded shadow">
                        50 MP REAL
                      </div>
                    )}
                    {photo.metadata?.is100Mp && !photo.metadata?.is50Mp && (
                      <div className="px-1.5 py-0.2 bg-amber-400/90 text-black font-mono font-bold text-[8px] rounded shadow">
                        100 MP
                      </div>
                    )}
                    {(photo.mode === 'night_vision' || photo.filter === 'night_vision') && (
                      <div className="px-1.5 py-0.2 bg-emerald-500 text-black font-mono font-bold text-[8px] rounded shadow">
                        NVG-50
                      </div>
                    )}
                    {(photo.mode === 'thermal' || photo.filter === 'thermal') && (
                      <div className="px-1.5 py-0.2 bg-rose-500 text-white font-mono font-bold text-[8px] rounded shadow">
                        THERMAL
                      </div>
                    )}
                  </div>

                  {/* Flash icon if flash fired */}
                  {photo.metadata?.flashUsed && photo.metadata.flashUsed !== 'off' && (
                    <div className="absolute top-1 right-1 p-0.5 bg-black/60 backdrop-blur-sm rounded-full text-amber-300">
                      <Zap className="w-2.5 h-2.5" />
                    </div>
                  )}

                  {/* Cloud sync status indicator */}
                  <div className="absolute bottom-1 right-1 p-1 bg-black/60 backdrop-blur-sm rounded-full">
                    {isCloud ? (
                      <CloudCheck className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <Smartphone className="w-3 h-3 text-white/60" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Single Photo Viewer Modal */}
      {selectedPhoto && (
        <div className="fixed inset-0 z-60 bg-black/98 flex flex-col">
          {/* Viewer Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-black/80 border-b border-white/10">
            <button
              onClick={() => {
                setSelectedPhoto(null);
                setShowExif(false);
              }}
              className="p-1.5 rounded-full hover:bg-white/10 text-white/70 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2">
              <div className="text-center">
                <span className="text-xs font-mono text-white/70">
                  {new Date(selectedPhoto.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  })}
                </span>
                <span className="text-xs text-amber-400 font-mono ml-2">
                  {selectedPhoto.zoomLevel.toFixed(1)}x • {selectedPhoto.mode.toUpperCase()}
                </span>
              </div>
              {selectedPhoto.metadata?.is50Mp && (
                <span className="px-2 py-0.5 bg-gradient-to-r from-amber-400 to-amber-500 text-black font-mono font-bold text-[10px] rounded-full shadow">
                  50 MP REAL SENSOR
                </span>
              )}
              {selectedPhoto.metadata?.is100Mp && !selectedPhoto.metadata?.is50Mp && (
                <span className="px-2 py-0.5 bg-amber-400 text-black font-mono font-bold text-[10px] rounded-full shadow">
                  100 MP ULTRA HD
                </span>
              )}
              {(selectedPhoto.mode === 'night_vision' || selectedPhoto.filter === 'night_vision') && (
                <span className="px-2 py-0.5 bg-emerald-500 text-black font-mono font-bold text-[10px] rounded-full shadow">
                  NVG-50 IR
                </span>
              )}
              {(selectedPhoto.mode === 'thermal' || selectedPhoto.filter === 'thermal') && (
                <span className="px-2 py-0.5 bg-rose-600 text-white font-mono font-bold text-[10px] rounded-full shadow">
                  FLIR THERMAL
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* Photo Brightness Boost Toggle ("Photo ko bright krke dikhaye") */}
              <button
                onClick={() => setBrightenView(!brightenView)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-mono transition-all ${
                  brightenView
                    ? 'bg-amber-400 text-black font-bold shadow-md'
                    : 'bg-white/10 text-white/70 hover:bg-white/20'
                }`}
                title="Toggle Photo Brightness Boost (Enhanced Dynamic Range)"
              >
                <Sun className="w-3.5 h-3.5" />
                <span>{brightenView ? 'Brightened' : 'Original'}</span>
              </button>

              <button
                onClick={() => setShowExif(!showExif)}
                className={`p-1.5 rounded-full transition-all ${
                  showExif ? 'bg-amber-400 text-black' : 'hover:bg-white/10 text-white/70'
                }`}
                title="View EXIF & AI Details"
              >
                <Info className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Viewer Image Container */}
          <div className="flex-1 relative flex items-center justify-center p-4 overflow-hidden">
            <img
              src={selectedPhoto.dataUrl}
              alt="Full preview"
              className={`max-h-full max-w-full object-contain rounded-lg shadow-2xl transition-all duration-300 ${
                brightenView ? 'brightness-110 contrast-105 saturate-105' : ''
              }`}
            />

            {/* EXIF / AI Info Drawer */}
            {showExif && (
              <div className="absolute top-4 right-4 max-w-xs w-full bg-neutral-900/90 backdrop-blur-xl border border-white/15 rounded-xl p-4 text-xs text-white space-y-2 shadow-2xl animate-in fade-in duration-200">
                <h4 className="font-semibold text-amber-400 border-b border-white/10 pb-1 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Camera & AI Metadata</span>
                </h4>
                <div className="space-y-1 font-mono text-[11px] text-white/80">
                  <div className="flex justify-between">
                    <span className="text-white/50">Resolution:</span>
                    <span className="text-amber-300">
                      {selectedPhoto.metadata?.is100Mp
                        ? '11520 × 8640 (100 MP)'
                        : selectedPhoto.metadata?.is50Mp
                        ? '8192 × 6144 (50 MP Real Sensor)'
                        : `${selectedPhoto.metadata?.width || 1920} × ${selectedPhoto.metadata?.height || 1080}`}
                    </span>
                  </div>
                  {selectedPhoto.metadata?.sensorLabel && (
                    <div className="flex justify-between">
                      <span className="text-white/50">Hardware:</span>
                      <span className="text-amber-300 truncate max-w-[150px]">
                        {selectedPhoto.metadata.sensorLabel}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-white/50">Flash Mode:</span>
                    <span className="capitalize text-cyan-300">
                      {selectedPhoto.metadata?.flashUsed === 'xenon'
                        ? '⚡ Xenon Strobe Flash'
                        : selectedPhoto.metadata?.flashUsed === 'normal'
                        ? '💡 LED Flash'
                        : 'Off'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/50">Auto Light:</span>
                    <span className="text-amber-300">
                      {selectedPhoto.metadata?.autoLightActive ? 'Active (Auto Boosted)' : 'Standard'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/50">Capture Time:</span>
                    <span>{new Date(selectedPhoto.timestamp).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/50">Zoom Level:</span>
                    <span className="text-amber-300">{selectedPhoto.zoomLevel.toFixed(1)}x</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/50">Camera Mode:</span>
                    <span className="capitalize">{selectedPhoto.mode}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/50">Aperture Bokeh:</span>
                    <span>f/{selectedPhoto.proSettings.apertureBokeh?.toFixed(1) || '2.8'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/50">Color Filter:</span>
                    <span className="capitalize">{selectedPhoto.filter}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/50">Cloud Sync:</span>
                    <span
                      className={
                        selectedPhoto.cloudSyncStatus === 'synced'
                          ? 'text-emerald-400'
                          : 'text-amber-400'
                      }
                    >
                      {selectedPhoto.cloudSyncStatus === 'synced' ? 'Backed Up' : 'Local Storage Only'}
                    </span>
                  </div>
                </div>

                {selectedPhoto.detections && selectedPhoto.detections.length > 0 && (
                  <div className="pt-2 border-t border-white/10">
                    <span className="text-white/50 text-[10px] uppercase block mb-1">
                      AI Detected Entities:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {selectedPhoto.detections.map((d, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 bg-white/10 rounded text-[10px] text-emerald-300 font-mono"
                        >
                          {d.label} ({Math.round(d.confidence * 100)}%)
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Viewer Bottom Bar */}
          <div className="flex items-center justify-around px-4 py-3 bg-neutral-900 border-t border-white/10">
            {/* Edit in Studio */}
            <button
              onClick={() => {
                onOpenEditor(selectedPhoto);
                setSelectedPhoto(null);
              }}
              className="flex flex-col items-center gap-1 text-white/80 hover:text-white"
            >
              <Edit3 className="w-5 h-5 text-amber-400" />
              <span className="text-[11px]">Edit Photo</span>
            </button>

            {/* Direct Download */}
            <button
              onClick={() => handleDownload(selectedPhoto)}
              className="flex flex-col items-center gap-1 text-white/80 hover:text-white"
            >
              <Download className="w-5 h-5 text-emerald-400" />
              <span className="text-[11px]">Save to Device</span>
            </button>

            {/* Cloud Backup Single */}
            {selectedPhoto.cloudSyncStatus !== 'synced' && (
              <button
                onClick={async () => {
                  await onBackupPhoto(selectedPhoto);
                  setSelectedPhoto((p) => (p ? { ...p, cloudSyncStatus: 'synced' } : null));
                }}
                className="flex flex-col items-center gap-1 text-white/80 hover:text-white"
              >
                <Cloud className="w-5 h-5 text-cyan-400" />
                <span className="text-[11px]">Backup</span>
              </button>
            )}

            {/* Delete */}
            <button
              onClick={async () => {
                if (confirm('Delete this photo from gallery?')) {
                  await onDeletePhoto(selectedPhoto.id);
                  setSelectedPhoto(null);
                }
              }}
              className="flex flex-col items-center gap-1 text-white/80 hover:text-rose-400"
            >
              <Trash2 className="w-5 h-5 text-rose-400" />
              <span className="text-[11px]">Delete</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
