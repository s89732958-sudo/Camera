import React, { useState } from 'react';
import { FlashMode, AutoLightMode } from '../../types';
import {
  Zap,
  ZapOff,
  Sun,
  SunMedium,
  Flame,
  Award,
  Sliders,
  ChevronDown,
} from 'lucide-react';

interface FlashAndLightingControlsProps {
  flashMode: FlashMode;
  onFlashChange: (mode: FlashMode) => void;
  autoLightMode: AutoLightMode;
  onAutoLightChange: (mode: AutoLightMode) => void;
  isAutoLightActive: boolean;
  is50MpMode: boolean;
  onToggle50Mp: () => void;
  is100MpMode: boolean;
  onToggle100Mp: () => void;
  brightnessBoost: number; // 0 to 100
  onBrightnessBoostChange: (val: number) => void;
}

export const FlashAndLightingControls: React.FC<FlashAndLightingControlsProps> = ({
  flashMode,
  onFlashChange,
  autoLightMode,
  onAutoLightChange,
  isAutoLightActive,
  is50MpMode,
  onToggle50Mp,
  is100MpMode,
  onToggle100Mp,
  brightnessBoost,
  onBrightnessBoostChange,
}) => {
  const [showFlashMenu, setShowFlashMenu] = useState(false);
  const [showBrightnessSlider, setShowBrightnessSlider] = useState(false);

  // Flash Modes config
  const flashOptions: { id: FlashMode; label: string; icon: React.ReactNode; desc: string }[] = [
    {
      id: 'off',
      label: 'Flash Off',
      icon: <ZapOff className="w-4 h-4 text-white/60" />,
      desc: 'Flash is disabled',
    },
    {
      id: 'normal',
      label: 'Normal LED Flash',
      icon: <Zap className="w-4 h-4 text-amber-300" />,
      desc: 'Standard camera burst',
    },
    {
      id: 'xenon',
      label: 'Xenon Strobe Flash',
      icon: <Flame className="w-4 h-4 text-cyan-300 animate-pulse" />,
      desc: 'High-voltage blinding studio burst',
    },
    {
      id: 'auto',
      label: 'Auto Flash',
      icon: <Zap className="w-4 h-4 text-emerald-400" />,
      desc: 'Fires automatically in low light',
    },
    {
      id: 'torch',
      label: 'Screen Fill Torch',
      icon: <Sun className="w-4 h-4 text-amber-400" />,
      desc: 'Continuous bright fill light',
    },
  ];

  const currentFlashOption = flashOptions.find((o) => o.id === flashMode) || flashOptions[0];

  return (
    <div className="relative z-30 flex items-center justify-between px-3 py-1 bg-black/60 backdrop-blur-md border-y border-white/10 text-xs font-mono select-none overflow-x-auto gap-2">
      {/* 1. Flash Mode Selector Button */}
      <div className="relative">
        <button
          id="btn-flash-mode-selector"
          onClick={() => setShowFlashMenu(!showFlashMenu)}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border transition-all whitespace-nowrap ${
            flashMode === 'xenon'
              ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400 font-bold shadow-[0_0_12px_rgba(34,211,238,0.3)] ring-1 ring-cyan-400/40'
              : flashMode === 'normal'
              ? 'bg-amber-500/20 text-amber-300 border-amber-400 font-bold shadow-sm'
              : flashMode === 'auto'
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400 font-semibold'
              : flashMode === 'torch'
              ? 'bg-yellow-500/30 text-yellow-200 border-yellow-300 font-bold animate-pulse'
              : 'bg-white/10 text-white/70 border-white/10 hover:bg-white/15'
          }`}
          title="Change Flash Mode (Xenon Strobe, Normal LED, Auto, Torch)"
        >
          {flashMode === 'xenon' ? (
            <Flame className="w-3.5 h-3.5 text-cyan-300" />
          ) : flashMode === 'normal' ? (
            <Zap className="w-3.5 h-3.5 text-amber-300" />
          ) : flashMode === 'torch' ? (
            <Sun className="w-3.5 h-3.5 text-yellow-300" />
          ) : flashMode === 'auto' ? (
            <Zap className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <ZapOff className="w-3.5 h-3.5 text-white/50" />
          )}
          <span className="capitalize">
            {flashMode === 'xenon'
              ? 'Xenon Strobe'
              : flashMode === 'normal'
              ? 'LED Flash'
              : flashMode === 'auto'
              ? 'Auto Flash'
              : flashMode === 'torch'
              ? 'Torch On'
              : 'Flash Off'}
          </span>
          <ChevronDown className="w-3 h-3 opacity-60" />
        </button>

        {/* Flash Dropdown Popover */}
        {showFlashMenu && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowFlashMenu(false)}
            />
            <div className="absolute top-8 left-0 z-50 w-64 bg-neutral-950/95 backdrop-blur-xl border border-white/20 rounded-xl p-2 shadow-2xl space-y-1">
              <div className="px-2 py-1 text-[10px] text-white/50 uppercase tracking-wider font-semibold border-b border-white/10">
                Flash System
              </div>
              {flashOptions.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => {
                    onFlashChange(opt.id);
                    setShowFlashMenu(false);
                  }}
                  className={`w-full flex items-start gap-2.5 px-2.5 py-1.5 rounded-lg text-left transition-all ${
                    flashMode === opt.id
                      ? 'bg-amber-400 text-black font-semibold shadow'
                      : 'hover:bg-white/10 text-white/80'
                  }`}
                >
                  <div className="mt-0.5">{opt.icon}</div>
                  <div>
                    <div className="font-semibold text-xs leading-none mb-0.5">{opt.label}</div>
                    <div
                      className={`text-[10px] leading-tight ${
                        flashMode === opt.id ? 'text-black/70' : 'text-white/50'
                      }`}
                    >
                      {opt.desc}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* 2. Auto Light System Button */}
      <button
        id="btn-auto-light"
        onClick={() => {
          const nextMode: AutoLightMode =
            autoLightMode === 'auto' ? 'on' : autoLightMode === 'on' ? 'off' : 'auto';
          onAutoLightChange(nextMode);
        }}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border transition-all whitespace-nowrap ${
          isAutoLightActive
            ? 'bg-amber-500/25 text-amber-300 border-amber-400 font-bold shadow-[0_0_12px_rgba(251,191,36,0.35)] ring-1 ring-amber-400/40 animate-pulse'
            : autoLightMode === 'auto'
            ? 'bg-white/15 text-amber-200 border-white/20'
            : autoLightMode === 'on'
            ? 'bg-amber-400 text-black border-amber-400 font-bold'
            : 'bg-white/10 text-white/50 border-white/10'
        }`}
        title="Auto Light: Adapts ambient scene lighting and boosts camera exposure in low light"
      >
        <SunMedium className="w-3.5 h-3.5" />
        <span>
          Auto Light: {autoLightMode.toUpperCase()}
          {isAutoLightActive && ' (Active)'}
        </span>
      </button>

      {/* 3. 50 MP Real Sensor Ultra High Definition Toggle Button */}
      <button
        id="btn-50mp-toggle"
        onClick={onToggle50Mp}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border transition-all whitespace-nowrap ${
          is50MpMode
            ? 'bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 text-black border-amber-300 font-bold shadow-[0_0_14px_rgba(245,158,11,0.5)] ring-1 ring-amber-300'
            : 'bg-white/10 text-white/70 border-white/10 hover:bg-white/15'
        }`}
        title="Toggle 50 Megapixel Real Camera Sensor Capture"
      >
        <Award className={`w-3.5 h-3.5 ${is50MpMode ? 'text-black' : 'text-amber-400'}`} />
        <span className="tracking-wide">
          {is50MpMode ? '50 MP REAL' : '50 MP OFF'}
        </span>
      </button>

      {/* 4. 100 MP Ultra High Definition Toggle Button */}
      <button
        id="btn-100mp-toggle"
        onClick={onToggle100Mp}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border transition-all whitespace-nowrap ${
          is100MpMode
            ? 'bg-gradient-to-r from-amber-500/30 via-yellow-400/30 to-amber-500/30 text-amber-300 border-amber-400 font-bold shadow-[0_0_14px_rgba(245,158,11,0.4)] ring-1 ring-amber-400/50'
            : 'bg-white/10 text-white/60 border-white/10 hover:bg-white/15'
        }`}
        title="Toggle 100 Megapixel Ultra High Definition Processing"
      >
        <Award className="w-3.5 h-3.5 text-amber-400" />
        <span className="tracking-wide">
          {is100MpMode ? '100 MP' : '12 MP'}
        </span>
      </button>

      {/* 4. Bright Boost Quick Toggle */}
      <div className="relative">
        <button
          id="btn-quick-bright-boost"
          onClick={() => setShowBrightnessSlider(!showBrightnessSlider)}
          className={`flex items-center gap-1.5 px-2 py-1 rounded-full border transition-all whitespace-nowrap ${
            brightnessBoost > 0
              ? 'bg-amber-400/20 text-amber-300 border-amber-400/50'
              : 'bg-white/10 text-white/70 border-white/10'
          }`}
          title="Photo Brightness & Shadow Lift"
        >
          <Sun className="w-3.5 h-3.5" />
          <span>Bright: +{brightnessBoost}%</span>
        </button>

        {showBrightnessSlider && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowBrightnessSlider(false)}
            />
            <div className="absolute top-8 right-0 z-50 w-52 bg-neutral-950/95 backdrop-blur-xl border border-white/20 rounded-xl p-3 shadow-2xl space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-white/70 font-semibold">Photo Brightness</span>
                <span className="text-amber-400 font-mono font-bold">+{brightnessBoost}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="80"
                step="5"
                value={brightnessBoost}
                onChange={(e) => onBrightnessBoostChange(parseInt(e.target.value, 10))}
                className="w-full accent-amber-400 h-1.5 bg-white/20 rounded cursor-pointer"
              />
              <div className="flex justify-between gap-1">
                {[0, 25, 40, 60].map((preset) => (
                  <button
                    key={preset}
                    onClick={() => onBrightnessBoostChange(preset)}
                    className={`px-2 py-0.5 text-[10px] rounded font-mono ${
                      brightnessBoost === preset
                        ? 'bg-amber-400 text-black font-bold'
                        : 'bg-white/10 text-white/70 hover:bg-white/20'
                    }`}
                  >
                    +{preset}%
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
