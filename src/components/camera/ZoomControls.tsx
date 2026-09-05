import React, { useState } from 'react';
import { ZoomIn, ZoomOut, Search, X, Sliders, ChevronDown, ChevronUp } from 'lucide-react';

interface ZoomControlsProps {
  zoom: number;
  onZoomChange: (newZoom: number) => void;
  isOpen?: boolean;
  onToggleOpen?: () => void;
}

interface ZoomPreset {
  val: number;
  label: string;
  focalMm: string;
  tag: string;
}

const PRESET_ZOOMS: ZoomPreset[] = [
  { val: 0.5, label: '.5x', focalMm: '14mm', tag: 'Ultra-Wide' },
  { val: 1.0, label: '1x', focalMm: '24mm', tag: 'Wide Prime' },
  { val: 2.0, label: '2x', focalMm: '50mm', tag: 'Nifty Fifty' },
  { val: 3.5, label: '3.5x', focalMm: '85mm', tag: 'Portrait' },
  { val: 5.0, label: '5x', focalMm: '120mm', tag: 'Telephoto' },
  { val: 10.0, label: '10x', focalMm: '240mm', tag: 'Super-Tele' },
  { val: 30.0, label: '30x', focalMm: '720mm', tag: 'Hybrid' },
  { val: 50.0, label: '50x', focalMm: '1200mm', tag: 'Ultra Zoom' },
  { val: 100.0, label: '100x', focalMm: '2400mm', tag: 'Space Zoom' },
];

export const ZoomControls: React.FC<ZoomControlsProps> = ({
  zoom,
  onZoomChange,
  isOpen: controlledIsOpen,
  onToggleOpen,
}) => {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;

  const toggleTab = () => {
    if (onToggleOpen) {
      onToggleOpen();
    } else {
      setInternalIsOpen((prev) => !prev);
    }
  };

  const getFocalLengthInfo = (z: number) => {
    const mm = Math.round(24 * z);
    if (z < 1) return { mm: '14mm', label: 'Ultra-Wide 14mm f/2.2' };
    if (z === 1) return { mm: '24mm', label: 'DSLR Prime 24mm f/1.8' };
    if (z <= 2.2) return { mm: `${mm}mm`, label: 'DSLR Standard 50mm f/1.4' };
    if (z <= 4) return { mm: `${mm}mm`, label: 'Portrait Prime 85mm f/1.8' };
    if (z <= 8) return { mm: `${mm}mm`, label: 'Telephoto 120mm f/2.8' };
    if (z <= 20) return { mm: `${mm}mm`, label: 'Super-Telephoto 240mm f/4.0' };
    return { mm: `${mm}mm`, label: `Super-Resolution ${z.toFixed(0)}x Optical/Digital` };
  };

  const focal = getFocalLengthInfo(zoom);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onZoomChange(parseFloat(e.target.value));
  };

  const stepZoom = (delta: number) => {
    const next = Math.min(100, Math.max(0.5, Math.round((zoom + delta) * 10) / 10));
    onZoomChange(next);
  };

  return (
    <div id="zoom-controls-wrapper" className="relative flex flex-col items-center select-none z-30">
      {/* 1. DEDICATED ZOOM BUTTON (USER REQUEST: "zoom wala ek button add kro jab butoon oar click kre tab zoom tab open ho") */}
      <button
        id="btn-open-zoom-tab"
        onClick={toggleTab}
        className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full backdrop-blur-xl border transition-all duration-200 shadow-xl ${
          isOpen
            ? 'bg-amber-400 text-black border-amber-300 font-bold scale-105 ring-2 ring-amber-400/40'
            : 'bg-black/75 hover:bg-black/90 text-white/95 border-white/20 hover:border-amber-400/60'
        }`}
        title="Open DSLR Zoom & Focal Length Tab"
      >
        <Search className={`w-3.5 h-3.5 ${isOpen ? 'text-black' : 'text-amber-400 animate-pulse'}`} />
        <span className="font-mono text-xs tracking-wider">
          <strong className={isOpen ? 'text-black' : 'text-amber-300'}>{zoom.toFixed(1)}x</strong>
          <span className="opacity-70 ml-1 text-[11px]">({focal.mm})</span>
        </span>
        <span className="text-[10px] font-sans font-semibold uppercase tracking-wider px-1.5 py-0.2 rounded bg-white/15">
          ZOOM
        </span>
        {isOpen ? (
          <ChevronDown className="w-3 h-3 text-current ml-0.5" />
        ) : (
          <ChevronUp className="w-3 h-3 text-current ml-0.5" />
        )}
      </button>

      {/* 2. EXPANDABLE ZOOM TAB / DRAWER (Opens when button is clicked) */}
      {isOpen && (
        <div
          id="zoom-tab-deck"
          className="absolute bottom-11 w-[92vw] max-w-md bg-neutral-950/95 backdrop-blur-2xl border border-amber-400/40 rounded-2xl p-3 text-white shadow-2xl animate-in fade-in slide-in-from-bottom-2 duration-200"
        >
          {/* Header & Simulated Lens Tag */}
          <div className="flex items-center justify-between pb-2 border-b border-white/10 mb-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-amber-400/15 rounded-lg border border-amber-400/30">
                <Sliders className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-white tracking-wide flex items-center gap-1.5">
                  <span>DSLR Focal Length & 100x Zoom</span>
                  <span className="text-[9px] px-1.5 py-0.2 bg-amber-400/20 text-amber-300 rounded font-mono">
                    {zoom.toFixed(1)}x
                  </span>
                </h4>
                <p className="text-[10px] text-amber-300/80 font-mono">{focal.label}</p>
              </div>
            </div>
            <button
              onClick={toggleTab}
              className="p-1 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-colors"
              title="Close Zoom Tab"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Preset Buttons */}
          <div className="grid grid-cols-5 gap-1.5 mb-3">
            {PRESET_ZOOMS.map((preset) => {
              const isActive = Math.abs(zoom - preset.val) < 0.1;
              return (
                <button
                  key={preset.val}
                  id={`zoom-preset-${preset.val}`}
                  onClick={() => onZoomChange(preset.val)}
                  className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl text-center border transition-all ${
                    isActive
                      ? 'bg-amber-400 text-black border-amber-300 font-bold shadow-md scale-105'
                      : 'bg-white/5 hover:bg-white/10 text-white/80 border-white/10'
                  }`}
                >
                  <span className="font-mono text-xs leading-none">{preset.label}</span>
                  <span className={`text-[9px] mt-0.5 leading-none ${isActive ? 'text-black/80' : 'text-white/50'}`}>
                    {preset.focalMm}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Precision Fine-Tuning Slider Deck */}
          <div className="bg-black/60 rounded-xl p-2 border border-white/10 flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-[10px] text-white/50 font-mono px-1">
              <span>0.5x (14mm)</span>
              <span className="text-amber-400 font-bold font-mono text-xs">{zoom.toFixed(1)}x ZOOM</span>
              <span>100x (2400mm)</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => stepZoom(-0.5)}
                className="p-1.5 bg-white/10 hover:bg-white/20 active:scale-95 rounded-lg text-white/80 transition-colors"
                title="Step zoom out (-0.5x)"
              >
                <ZoomOut className="w-4 h-4" />
              </button>

              <input
                id="zoom-range-slider"
                type="range"
                min="0.5"
                max="100"
                step="0.1"
                value={zoom}
                onChange={handleSliderChange}
                className="w-full accent-amber-400 h-1.5 bg-white/20 rounded-lg cursor-pointer appearance-none"
              />

              <button
                onClick={() => stepZoom(0.5)}
                className="p-1.5 bg-white/10 hover:bg-white/20 active:scale-95 rounded-lg text-white/80 transition-colors"
                title="Step zoom in (+0.5x)"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
