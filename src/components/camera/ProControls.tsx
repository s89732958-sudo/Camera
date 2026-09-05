import React from 'react';
import { ProSettings, GridMode, FlashMode, AutoLightMode } from '../../types';
import { Sliders, Sun, Gauge, Eye, Aperture, Grid, Compass, Timer, Zap, Flame, SunMedium, Award } from 'lucide-react';

interface ProControlsProps {
  settings: ProSettings;
  onChange: (updated: Partial<ProSettings>) => void;
  isOpen: boolean;
  onClose: () => void;
}

const ISO_OPTIONS: (number | 'auto')[] = ['auto', 100, 200, 400, 800, 1600, 3200];
const SHUTTER_OPTIONS = ['auto', '1/1000s', '1/500s', '1/125s', '1/30s', '1/4s', '1s'];
const WB_OPTIONS: ProSettings['whiteBalance'][] = [
  'auto',
  'daylight',
  'cloudy',
  'tungsten',
  'fluorescent',
];
const APERTURE_OPTIONS = [1.4, 2.0, 2.8, 4.0, 8.0, 16.0];
const FLASH_OPTIONS: { id: FlashMode; label: string }[] = [
  { id: 'off', label: 'Off' },
  { id: 'normal', label: 'LED Flash' },
  { id: 'xenon', label: 'Xenon Strobe' },
  { id: 'auto', label: 'Auto' },
  { id: 'torch', label: 'Torch' },
];
const AUTO_LIGHT_OPTIONS: { id: AutoLightMode; label: string }[] = [
  { id: 'auto', label: 'Adaptive Auto' },
  { id: 'on', label: 'Always On' },
  { id: 'off', label: 'Disabled' },
];
const GRID_OPTIONS: { id: GridMode; label: string }[] = [
  { id: 'none', label: 'Off' },
  { id: 'rule_of_thirds', label: '3x3' },
  { id: 'golden_ratio', label: 'Golden' },
  { id: 'crosshair', label: 'Cross' },
];

export const ProControls: React.FC<ProControlsProps> = ({
  settings,
  onChange,
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div
      id="pro-controls-drawer"
      className="absolute bottom-24 left-0 right-0 max-w-xl mx-auto px-4 z-30 pointer-events-auto"
    >
      <div className="bg-black/85 backdrop-blur-xl border border-white/15 rounded-2xl p-4 text-white shadow-2xl space-y-4 max-h-[70vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-white/10 pb-2">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-amber-400" />
            <h3 className="font-semibold text-sm tracking-wide">Manual Pro Camera Controls</h3>
          </div>
          <button
            onClick={onClose}
            className="text-xs text-amber-400 font-mono hover:underline px-2 py-0.5 rounded bg-amber-400/10"
          >
            Done
          </button>
        </div>

        {/* 1. Photo Brightness Boost ("Photo ko bright krke dikhaye") */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="flex items-center gap-1.5 text-white/70">
              <SunMedium className="w-3.5 h-3.5 text-amber-400" />
              Photo Brightness & Shadow Lift
            </span>
            <span className="font-mono font-bold text-amber-400">
              +{settings.brightnessBoost ?? 25}%
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="80"
            step="5"
            value={settings.brightnessBoost ?? 25}
            onChange={(e) => onChange({ brightnessBoost: parseInt(e.target.value, 10) })}
            className="w-full accent-amber-400 h-1.5 bg-white/20 rounded-lg cursor-pointer appearance-none"
          />
        </div>

        {/* 2. 100 MP Ultra High Definition Sensor Mode */}
        <div className="flex items-center justify-between p-2.5 bg-white/5 border border-white/10 rounded-xl">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-400" />
            <div>
              <div className="text-xs font-semibold text-white">100 MP Ultra HD Processing</div>
              <div className="text-[10px] text-white/50">Multi-pass super-resolution detail synthesis</div>
            </div>
          </div>
          <button
            onClick={() => onChange({ ultraHd100Mp: !(settings.ultraHd100Mp ?? true) })}
            className={`px-3 py-1 rounded-full text-xs font-mono font-bold transition-all ${
              (settings.ultraHd100Mp ?? true)
                ? 'bg-amber-400 text-black shadow-md'
                : 'bg-white/10 text-white/60 hover:bg-white/20'
            }`}
          >
            {(settings.ultraHd100Mp ?? true) ? '100 MP ACTIVE' : '12 MP STD'}
          </button>
        </div>

        {/* 3. Flash System (Xenon Strobe vs Normal LED) */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="flex items-center gap-1.5 text-white/70">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              Flash System
            </span>
            <span className="font-mono font-bold text-amber-400 uppercase">
              {settings.flashMode || 'auto'}
            </span>
          </div>
          <div className="grid grid-cols-5 gap-1 text-[11px]">
            {FLASH_OPTIONS.map((f) => (
              <button
                key={f.id}
                onClick={() => onChange({ flashMode: f.id })}
                className={`py-1 rounded-md font-mono text-center transition-all ${
                  (settings.flashMode || 'auto') === f.id
                    ? f.id === 'xenon'
                      ? 'bg-cyan-400 text-black font-bold shadow'
                      : 'bg-amber-400 text-black font-bold shadow'
                    : 'bg-white/10 text-white/70 hover:bg-white/20'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* 4. Auto Light / Night Sight Adaptive Exposure */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="flex items-center gap-1.5 text-white/70">
              <Sun className="w-3.5 h-3.5 text-amber-400" />
              Auto Light (Adaptive Low-Light Boost)
            </span>
            <span className="font-mono font-bold text-amber-400 uppercase">
              {settings.autoLight || 'auto'}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-1 text-[11px]">
            {AUTO_LIGHT_OPTIONS.map((al) => (
              <button
                key={al.id}
                onClick={() => onChange({ autoLight: al.id })}
                className={`py-1 rounded-md font-mono text-center transition-all ${
                  (settings.autoLight || 'auto') === al.id
                    ? 'bg-amber-400 text-black font-bold shadow'
                    : 'bg-white/10 text-white/70 hover:bg-white/20'
                }`}
              >
                {al.label}
              </button>
            ))}
          </div>
        </div>

        {/* 5. Exposure Value (EV) */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="flex items-center gap-1.5 text-white/70">
              <Sun className="w-3.5 h-3.5 text-amber-400" />
              Exposure Compensation (EV)
            </span>
            <span className="font-mono font-bold text-amber-400">
              {settings.ev > 0 ? `+${settings.ev.toFixed(1)}` : settings.ev.toFixed(1)} EV
            </span>
          </div>
          <input
            type="range"
            min="-2.0"
            max="2.0"
            step="0.1"
            value={settings.ev}
            onChange={(e) => onChange({ ev: parseFloat(e.target.value) })}
            className="w-full accent-amber-400 h-1.5 bg-white/20 rounded-lg cursor-pointer appearance-none"
          />
        </div>

        {/* 2. Portrait Mode Bokeh Aperture */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="flex items-center gap-1.5 text-white/70">
              <Aperture className="w-3.5 h-3.5 text-amber-400" />
              Portrait Bokeh (f-stop blur)
            </span>
            <span className="font-mono font-bold text-amber-400">
              f/{settings.apertureBokeh.toFixed(1)}
            </span>
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {APERTURE_OPTIONS.map((f) => (
              <button
                key={f}
                onClick={() => onChange({ apertureBokeh: f })}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all ${
                  settings.apertureBokeh === f
                    ? 'bg-amber-400 text-black font-bold'
                    : 'bg-white/10 text-white/80 hover:bg-white/20'
                }`}
              >
                f/{f.toFixed(1)}
              </button>
            ))}
          </div>
        </div>

        {/* 3. ISO Sensitivity */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="flex items-center gap-1.5 text-white/70">
              <Gauge className="w-3.5 h-3.5 text-amber-400" />
              ISO Sensitivity
            </span>
            <span className="font-mono font-bold text-amber-400">
              {typeof settings.iso === 'number' ? `ISO ${settings.iso}` : 'AUTO'}
            </span>
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {ISO_OPTIONS.map((opt) => (
              <button
                key={opt}
                onClick={() => onChange({ iso: opt })}
                className={`px-2 py-1 rounded-lg text-xs font-mono transition-all ${
                  settings.iso === opt
                    ? 'bg-amber-400 text-black font-bold'
                    : 'bg-white/10 text-white/80 hover:bg-white/20'
                }`}
              >
                {typeof opt === 'number' ? opt : 'Auto'}
              </button>
            ))}
          </div>
        </div>

        {/* 4. Shutter Speed */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="flex items-center gap-1.5 text-white/70">
              <Eye className="w-3.5 h-3.5 text-amber-400" />
              Shutter Speed
            </span>
            <span className="font-mono font-bold text-amber-400 uppercase">
              {settings.shutter}
            </span>
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {SHUTTER_OPTIONS.map((opt) => (
              <button
                key={opt}
                onClick={() => onChange({ shutter: opt })}
                className={`px-2 py-1 rounded-lg text-xs font-mono transition-all ${
                  settings.shutter === opt
                    ? 'bg-amber-400 text-black font-bold'
                    : 'bg-white/10 text-white/80 hover:bg-white/20'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

        {/* 5. White Balance */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-white/70">White Balance</span>
            <span className="font-mono font-bold text-amber-400 capitalize">
              {settings.whiteBalance}
            </span>
          </div>
          <div className="grid grid-cols-5 gap-1 text-[11px]">
            {WB_OPTIONS.map((wb) => (
              <button
                key={wb}
                onClick={() => onChange({ whiteBalance: wb })}
                className={`py-1 rounded-md capitalize font-mono transition-all ${
                  settings.whiteBalance === wb
                    ? 'bg-amber-400 text-black font-semibold'
                    : 'bg-white/10 text-white/80 hover:bg-white/20'
                }`}
              >
                {wb}
              </button>
            ))}
          </div>
        </div>

        {/* 6. Composition Helpers: Grid, Leveler, Timer */}
        <div className="pt-2 border-t border-white/10 flex items-center justify-between gap-2">
          {/* Grid */}
          <div className="flex items-center gap-1">
            <Grid className="w-3.5 h-3.5 text-white/60" />
            <div className="flex gap-1">
              {GRID_OPTIONS.map((g) => (
                <button
                  key={g.id}
                  onClick={() => onChange({ gridMode: g.id })}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                    settings.gridMode === g.id
                      ? 'bg-amber-400 text-black font-bold'
                      : 'bg-white/10 text-white/70'
                  }`}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </div>

          {/* Leveler */}
          <button
            onClick={() => onChange({ showLeveler: !settings.showLeveler })}
            className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-mono transition-all ${
              settings.showLeveler
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'bg-white/10 text-white/70'
            }`}
          >
            <Compass className="w-3 h-3" />
            <span>Leveler</span>
          </button>

          {/* Timer */}
          <button
            onClick={() => {
              const nextTimer = settings.timerSeconds === 0 ? 3 : settings.timerSeconds === 3 ? 10 : 0;
              onChange({ timerSeconds: nextTimer });
            }}
            className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-mono transition-all ${
              settings.timerSeconds > 0
                ? 'bg-amber-400 text-black font-bold'
                : 'bg-white/10 text-white/70'
            }`}
          >
            <Timer className="w-3 h-3" />
            <span>{settings.timerSeconds === 0 ? 'Off' : `${settings.timerSeconds}s`}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
