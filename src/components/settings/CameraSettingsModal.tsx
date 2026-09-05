import React from 'react';
import { CameraFeatureFlags, RealCameraSensorInfo } from '../../types';
import {
  X,
  Camera,
  Moon,
  Flame,
  Sun,
  Zap,
  Sparkles,
  Sliders,
  Eye,
  Volume2,
  VolumeX,
  Maximize2,
  Stamp,
  Smartphone,
  Check,
  RotateCcw,
  SlidersHorizontal,
  Grid,
  Thermometer,
  Vibrate,
  Award,
  Radio,
  CheckCircle2,
} from 'lucide-react';

interface CameraSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  features: CameraFeatureFlags;
  onToggleFeature: (key: keyof CameraFeatureFlags) => void;
  onSetAllFeatures: (enabled: boolean) => void;
  onResetDefaults: () => void;
  sensorInfo: RealCameraSensorInfo | null;
  facingMode: 'user' | 'environment';
  onSwitchFacingMode: () => void;
}

export const CameraSettingsModal: React.FC<CameraSettingsModalProps> = ({
  isOpen,
  onClose,
  features,
  onToggleFeature,
  onSetAllFeatures,
  onResetDefaults,
  sensorInfo,
  facingMode,
  onSwitchFacingMode,
}) => {
  if (!isOpen) return null;

  const totalEnabled = Object.values(features).filter(Boolean).length;
  const totalCount = Object.keys(features).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-neutral-900/95 border border-white/15 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-neutral-950/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-400">
              <SlidersHorizontal className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white font-sans tracking-wide">
                Camera Features & Settings
              </h2>
              <p className="text-[11px] text-white/50 font-mono">
                {totalEnabled} of {totalCount} features active • On / Off Customization
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Real Camera Hardware Sensor Status Banner */}
        <div className="px-5 py-3 bg-gradient-to-r from-amber-500/15 via-amber-600/10 to-transparent border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/20 rounded-lg text-amber-400">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-amber-300 font-mono">
                  Real DSLR Camera Hardware Sensor
                </span>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  REAL SENSOR
                </span>
              </div>
              <p className="text-[10px] text-white/60 font-mono mt-0.5">
                {sensorInfo
                  ? `${sensorInfo.streamWidth}x${sensorInfo.streamHeight} Hardware Stream • ${facingMode === 'environment' ? 'Rear Sensor' : 'Front Selfie'}`
                  : '8192 x 6144 Ultra HD 50 MP Synthesis'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={onSwitchFacingMode}
              className="px-3 py-1.5 rounded-lg text-[10px] font-mono font-medium bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 transition-all"
              title="Switch between Rear and Front camera"
            >
              {facingMode === 'environment' ? 'Rear Cam 🔄' : 'Front Cam 🔄'}
            </button>
          </div>
        </div>

        {/* Scrollable Feature Toggles List */}
        <div className="flex-1 overflow-y-auto px-5 py-3 space-y-4 divide-y divide-white/5">
          {/* SECTION 1: SENSOR & RESOLUTION */}
          <div className="pt-2">
            <div className="text-[10px] font-mono font-semibold tracking-wider text-amber-400/90 uppercase mb-2">
              Sensor Resolution & Real Clarity
            </div>
            <div className="space-y-2">
              {/* 50 MP Real Sensor Mode */}
              <div
                onClick={() => onToggleFeature('realCamera50Mp')}
                className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                  features.realCamera50Mp
                    ? 'bg-amber-500/10 border-amber-500/30'
                    : 'bg-white/5 border-white/10 opacity-75'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-400/20 text-amber-400">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-semibold text-white">50 MP Real Sensor Mode</span>
                      <span className="px-1.5 py-0.2 bg-amber-400 text-black text-[9px] font-mono font-bold rounded">
                        PRO SENSOR
                      </span>
                    </div>
                    <p className="text-[11px] text-white/60">
                      Real 50-megapixel capture (8192×6144) with demosaicing detail synthesis
                    </p>
                  </div>
                </div>
                <div
                  className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                    features.realCamera50Mp ? 'bg-amber-400' : 'bg-white/20'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-black transition-transform shadow-md ${
                      features.realCamera50Mp ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: SPECIALIZED VISION MODES */}
          <div className="pt-3">
            <div className="text-[10px] font-mono font-semibold tracking-wider text-amber-400/90 uppercase mb-2">
              Specialized Vision Engines
            </div>
            <div className="space-y-2">
              {/* Night Vision Mode */}
              <div
                onClick={() => onToggleFeature('nightVisionMode')}
                className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                  features.nightVisionMode
                    ? 'bg-emerald-500/10 border-emerald-500/30'
                    : 'bg-white/5 border-white/10 opacity-75'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-400/20 text-emerald-400">
                    <Moon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-semibold text-white">Night Vision (IR / Starlight)</span>
                      <span className="px-1.5 py-0.2 bg-emerald-400/30 text-emerald-300 text-[9px] font-mono font-bold rounded">
                        INFRARED
                      </span>
                    </div>
                    <p className="text-[11px] text-white/60">
                      Military green phosphor vision with starlight photon amplification & scanline HUD
                    </p>
                  </div>
                </div>
                <div
                  className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                    features.nightVisionMode ? 'bg-emerald-400' : 'bg-white/20'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-black transition-transform shadow-md ${
                      features.nightVisionMode ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </div>
              </div>

              {/* Thermal Vision Mode */}
              <div
                onClick={() => onToggleFeature('thermalVisionMode')}
                className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                  features.thermalVisionMode
                    ? 'bg-rose-500/10 border-rose-500/30'
                    : 'bg-white/5 border-white/10 opacity-75'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-rose-400/20 text-rose-400">
                    <Flame className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-semibold text-white">Thermal Vision (FLIR Heatmap)</span>
                      <span className="px-1.5 py-0.2 bg-rose-400/30 text-rose-300 text-[9px] font-mono font-bold rounded">
                        HEATMAP °C
                      </span>
                    </div>
                    <p className="text-[11px] text-white/60">
                      Real-time temperature heat-gradient with hot & cold spot crosshair tracking
                    </p>
                  </div>
                </div>
                <div
                  className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                    features.thermalVisionMode ? 'bg-rose-500' : 'bg-white/20'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-black transition-transform shadow-md ${
                      features.thermalVisionMode ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 3: LIGHTING & FLASH */}
          <div className="pt-3">
            <div className="text-[10px] font-mono font-semibold tracking-wider text-amber-400/90 uppercase mb-2">
              Lighting & Illumination
            </div>
            <div className="space-y-2">
              {/* Auto Light */}
              <div
                onClick={() => onToggleFeature('autoLight')}
                className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                  features.autoLight
                    ? 'bg-amber-500/10 border-amber-500/30'
                    : 'bg-white/5 border-white/10 opacity-75'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-400/20 text-amber-400">
                    <Sun className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-white">Auto Light & Shadow Lift</span>
                    <p className="text-[11px] text-white/60">
                      Auto-brightens dark scenes and lifts shadows with adaptive tone mapping
                    </p>
                  </div>
                </div>
                <div
                  className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                    features.autoLight ? 'bg-amber-400' : 'bg-white/20'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-black transition-transform shadow-md ${
                      features.autoLight ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </div>
              </div>

              {/* Dual Flash System */}
              <div
                onClick={() => onToggleFeature('flashSystem')}
                className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                  features.flashSystem
                    ? 'bg-amber-500/10 border-amber-500/30'
                    : 'bg-white/5 border-white/10 opacity-75'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-400/20 text-amber-400">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-white">Dual Flash System</span>
                    <p className="text-[11px] text-white/60">
                      Studio Xenon strobe flash with pre-flash spark + Standard LED fill & torch
                    </p>
                  </div>
                </div>
                <div
                  className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                    features.flashSystem ? 'bg-amber-400' : 'bg-white/20'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-black transition-transform shadow-md ${
                      features.flashSystem ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 4: AI COMPUTER VISION */}
          <div className="pt-3">
            <div className="text-[10px] font-mono font-semibold tracking-wider text-amber-400/90 uppercase mb-2">
              Artificial Intelligence Tracking
            </div>
            <div className="space-y-2">
              {/* AI Object & Vehicle Detection */}
              <div
                onClick={() => onToggleFeature('aiDetection')}
                className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                  features.aiDetection
                    ? 'bg-cyan-500/10 border-cyan-500/30'
                    : 'bg-white/5 border-white/10 opacity-75'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-cyan-400/20 text-cyan-400">
                    <Eye className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-white">AI Object & Vehicle Detection</span>
                    <p className="text-[11px] text-white/60">
                      Real-time 25 FPS tracking of vehicles, humans, animals, and objects
                    </p>
                  </div>
                </div>
                <div
                  className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                    features.aiDetection ? 'bg-cyan-400' : 'bg-white/20'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-black transition-transform shadow-md ${
                      features.aiDetection ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </div>
              </div>

              {/* Skeleton Tracking */}
              <div
                onClick={() => onToggleFeature('skeletonTracking')}
                className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                  features.skeletonTracking
                    ? 'bg-purple-500/10 border-purple-500/30'
                    : 'bg-white/5 border-white/10 opacity-75'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-400/20 text-purple-400">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-white">AI Human Skeleton Tracking</span>
                    <p className="text-[11px] text-white/60">
                      17-point biomechanical joint wireframes and pose estimation overlay
                    </p>
                  </div>
                </div>
                <div
                  className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                    features.skeletonTracking ? 'bg-purple-400' : 'bg-white/20'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-black transition-transform shadow-md ${
                      features.skeletonTracking ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 5: CAMERA OPTICS & CONTROLS */}
          <div className="pt-3">
            <div className="text-[10px] font-mono font-semibold tracking-wider text-amber-400/90 uppercase mb-2">
              Optics, Controls & Composition
            </div>
            <div className="space-y-2">
              {/* 100x Super Zoom */}
              <div
                onClick={() => onToggleFeature('superZoom100x')}
                className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                  features.superZoom100x
                    ? 'bg-amber-500/10 border-amber-500/30'
                    : 'bg-white/5 border-white/10 opacity-75'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-400/20 text-amber-400">
                    <Maximize2 className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-white">100x Super Zoom Controls</span>
                    <p className="text-[11px] text-white/60">
                      Optical and computational super-resolution sharpening from 0.5x to 100x
                    </p>
                  </div>
                </div>
                <div
                  className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                    features.superZoom100x ? 'bg-amber-400' : 'bg-white/20'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-black transition-transform shadow-md ${
                      features.superZoom100x ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </div>
              </div>

              {/* Pro Manual Controls */}
              <div
                onClick={() => onToggleFeature('proControls')}
                className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                  features.proControls
                    ? 'bg-amber-500/10 border-amber-500/30'
                    : 'bg-white/5 border-white/10 opacity-75'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-400/20 text-amber-400">
                    <Sliders className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-white">Pro Manual Settings</span>
                    <p className="text-[11px] text-white/60">
                      Manual EV compensation, ISO, Shutter speed, White Balance & Aperture
                    </p>
                  </div>
                </div>
                <div
                  className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                    features.proControls ? 'bg-amber-400' : 'bg-white/20'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-black transition-transform shadow-md ${
                      features.proControls ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </div>
              </div>

              {/* Leveler */}
              <div
                onClick={() => onToggleFeature('leveler')}
                className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                  features.leveler
                    ? 'bg-amber-500/10 border-amber-500/30'
                    : 'bg-white/5 border-white/10 opacity-75'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-400/20 text-amber-400">
                    <Radio className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-white">Horizon Leveler Indicator</span>
                    <p className="text-[11px] text-white/60">
                      Real-time roll and pitch horizon level balance indicator
                    </p>
                  </div>
                </div>
                <div
                  className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                    features.leveler ? 'bg-amber-400' : 'bg-white/20'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-black transition-transform shadow-md ${
                      features.leveler ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </div>
              </div>

              {/* Grid */}
              <div
                onClick={() => onToggleFeature('gridOverlay')}
                className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                  features.gridOverlay
                    ? 'bg-amber-500/10 border-amber-500/30'
                    : 'bg-white/5 border-white/10 opacity-75'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-400/20 text-amber-400">
                    <Grid className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-white">Composition Grid Overlay</span>
                    <p className="text-[11px] text-white/60">
                      Rule of Thirds 3x3 grid lines for balanced framing
                    </p>
                  </div>
                </div>
                <div
                  className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                    features.gridOverlay ? 'bg-amber-400' : 'bg-white/20'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-black transition-transform shadow-md ${
                      features.gridOverlay ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 6: AUDIO, STAMP & FEEDBACK */}
          <div className="pt-3">
            <div className="text-[10px] font-mono font-semibold tracking-wider text-amber-400/90 uppercase mb-2">
              Audio, Watermark & Haptics
            </div>
            <div className="space-y-2">
              {/* Shutter Sounds */}
              <div
                onClick={() => onToggleFeature('cameraSounds')}
                className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                  features.cameraSounds
                    ? 'bg-amber-500/10 border-amber-500/30'
                    : 'bg-white/5 border-white/10 opacity-75'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-400/20 text-amber-400">
                    {features.cameraSounds ? (
                      <Volume2 className="w-5 h-5" />
                    ) : (
                      <VolumeX className="w-5 h-5 text-white/40" />
                    )}
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-white">Mechanical Camera Sounds</span>
                    <p className="text-[11px] text-white/60">
                      Synthesized SLR shutter snap, capacitor charge, and Xenon strobe acoustics
                    </p>
                  </div>
                </div>
                <div
                  className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                    features.cameraSounds ? 'bg-amber-400' : 'bg-white/20'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-black transition-transform shadow-md ${
                      features.cameraSounds ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </div>
              </div>

              {/* 50 MP Watermark Stamp */}
              <div
                onClick={() => onToggleFeature('dateWatermark')}
                className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                  features.dateWatermark
                    ? 'bg-amber-500/10 border-amber-500/30'
                    : 'bg-white/5 border-white/10 opacity-75'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-400/20 text-amber-400">
                    <Stamp className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-white">50 MP Camera Watermark Stamp</span>
                    <p className="text-[11px] text-white/60">
                      Burns "50 MP REAL SENSOR • NIGHT SIGHT PRO" watermark timestamp into captures
                    </p>
                  </div>
                </div>
                <div
                  className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                    features.dateWatermark ? 'bg-amber-400' : 'bg-white/20'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-black transition-transform shadow-md ${
                      features.dateWatermark ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </div>
              </div>

              {/* Haptic Feedback */}
              <div
                onClick={() => onToggleFeature('hapticFeedback')}
                className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                  features.hapticFeedback
                    ? 'bg-amber-500/10 border-amber-500/30'
                    : 'bg-white/5 border-white/10 opacity-75'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-400/20 text-amber-400">
                    <Vibrate className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-white">Vibration Haptic Feedback</span>
                    <p className="text-[11px] text-white/60">
                      Tactile micro-vibrations when tapping shutter, focus ring, or zoom dial
                    </p>
                  </div>
                </div>
                <div
                  className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                    features.hapticFeedback ? 'bg-amber-400' : 'bg-white/20'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-black transition-transform shadow-md ${
                      features.hapticFeedback ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Quick Actions */}
        <div className="px-5 py-3 border-t border-white/10 bg-neutral-950/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onSetAllFeatures(true)}
              className="px-3 py-1.5 rounded-lg text-xs font-mono bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              Turn All ON
            </button>
            <button
              onClick={onResetDefaults}
              className="px-3 py-1.5 rounded-lg text-xs font-mono bg-white/5 hover:bg-white/10 text-white/70 transition-colors flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Default</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-1.5 rounded-lg text-xs font-mono font-bold bg-amber-400 hover:bg-amber-300 text-black shadow-lg transition-colors flex items-center gap-1.5"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Apply & Done</span>
          </button>
        </div>
      </div>
    </div>
  );
};
