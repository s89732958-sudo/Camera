import React from 'react';
import { ThermalMeasurement } from '../../types';
import { Moon, Flame, Thermometer, Radio, Eye } from 'lucide-react';

interface VisionHudOverlayProps {
  mode: string;
  filter: string;
  thermalData: ThermalMeasurement;
}

export const VisionHudOverlay: React.FC<VisionHudOverlayProps> = ({
  mode,
  filter,
  thermalData,
}) => {
  const isNightVision = mode === 'night_vision' || filter === 'night_vision';
  const isThermal = mode === 'thermal' || filter === 'thermal';

  if (!isNightVision && !isThermal) return null;

  return (
    <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden">
      {/* 1. NIGHT VISION HUD */}
      {isNightVision && (
        <div className="w-full h-full relative flex flex-col justify-between p-4">
          {/* Top NVG Bar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-400/60 text-emerald-400 font-mono text-[10px] tracking-wider shadow-lg">
              <Moon className="w-3.5 h-3.5 animate-pulse" />
              <span className="font-bold">NVG-50 INFRARED ACTIVE</span>
              <span className="text-emerald-300/60">•</span>
              <span>GAIN: +18dB</span>
            </div>

            <div className="px-2.5 py-1 rounded-full bg-black/60 border border-emerald-500/40 text-emerald-400 font-mono text-[10px]">
              LUX: 0.08 LOW LIGHT
            </div>
          </div>

          {/* Military Corner Brackets */}
          <div className="absolute top-10 left-10 w-10 h-10 border-t-2 border-l-2 border-emerald-400/70" />
          <div className="absolute top-10 right-10 w-10 h-10 border-t-2 border-r-2 border-emerald-400/70" />
          <div className="absolute bottom-16 left-10 w-10 h-10 border-b-2 border-l-2 border-emerald-400/70" />
          <div className="absolute bottom-16 right-10 w-10 h-10 border-b-2 border-r-2 border-emerald-400/70" />

          {/* Center Aiming Reticle */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 border border-emerald-400/50 rounded-full flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            <div className="absolute w-6 h-0.5 bg-emerald-400/70 -left-3" />
            <div className="absolute w-6 h-0.5 bg-emerald-400/70 -right-3" />
            <div className="absolute h-6 w-0.5 bg-emerald-400/70 -top-3" />
            <div className="absolute h-6 w-0.5 bg-emerald-400/70 -bottom-3" />
          </div>

          {/* Bottom NVG Status */}
          <div className="flex items-center justify-between text-emerald-400/80 font-mono text-[10px]">
            <div>STARLIGHT PHOSPHOR AMPLIFIED</div>
            <div>GEN-3 IR SENSOR 50MP</div>
          </div>
        </div>
      )}

      {/* 2. THERMAL VISION FLIR HUD */}
      {isThermal && (
        <div className="w-full h-full relative flex flex-col justify-between p-4">
          {/* Top Thermal Bar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-black/80 border border-rose-500/60 text-rose-300 font-mono text-[10px] tracking-wider shadow-lg">
              <Flame className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
              <span className="font-bold">FLIR THERMAL HEATMAP</span>
              <span className="text-white/40">•</span>
              <span>IRONBOW CALIBRATED</span>
            </div>

            <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-black/70 border border-white/20 text-white font-mono text-[10px]">
              <Thermometer className="w-3 h-3 text-amber-400" />
              <span>CENTER: {thermalData.centerTemp.toFixed(1)}°C</span>
            </div>
          </div>

          {/* Thermal Color Scale Bar (Right Edge) */}
          <div className="absolute right-4 top-20 bottom-24 flex flex-col items-center justify-between py-1 z-30">
            <span className="text-[9px] font-mono font-bold text-white bg-black/70 px-1 rounded">
              {thermalData.maxTemp.toFixed(0)}°C
            </span>

            {/* Gradient Bar representing Ironbow palette */}
            <div className="w-3.5 flex-1 mx-1 my-1 rounded-full border border-white/30 overflow-hidden bg-gradient-to-t from-[#1e0a78] via-[#e61e64] via-[#ff9600] to-[#ffffff] shadow-md" />

            <span className="text-[9px] font-mono font-bold text-cyan-300 bg-black/70 px-1 rounded">
              {thermalData.minTemp.toFixed(0)}°C
            </span>
          </div>

          {/* Hot Spot Crosshair Tracking */}
          <div
            className="absolute -translate-x-1/2 -translate-y-1/2 flex items-center gap-1 transition-all duration-150"
            style={{ left: `${thermalData.hotSpot.x}%`, top: `${thermalData.hotSpot.y}%` }}
          >
            <div className="relative w-5 h-5 flex items-center justify-center">
              <div className="w-full h-full border border-rose-500 rounded-full animate-ping" />
              <div className="absolute w-2 h-2 rounded-full bg-rose-500" />
            </div>
            <span className="px-1.5 py-0.5 rounded bg-black/80 border border-rose-500 text-[9px] font-mono font-bold text-rose-400 whitespace-nowrap shadow">
              🔥 MAX {thermalData.maxTemp.toFixed(1)}°C
            </span>
          </div>

          {/* Cold Spot Crosshair Tracking */}
          <div
            className="absolute -translate-x-1/2 -translate-y-1/2 flex items-center gap-1 transition-all duration-150"
            style={{ left: `${thermalData.coldSpot.x}%`, top: `${thermalData.coldSpot.y}%` }}
          >
            <div className="relative w-5 h-5 flex items-center justify-center">
              <div className="w-full h-full border border-cyan-400 rounded-full" />
              <div className="absolute w-2 h-2 rounded-full bg-cyan-400" />
            </div>
            <span className="px-1.5 py-0.5 rounded bg-black/80 border border-cyan-400 text-[9px] font-mono font-bold text-cyan-300 whitespace-nowrap shadow">
              ❄️ MIN {thermalData.minTemp.toFixed(1)}°C
            </span>
          </div>

          {/* Center Aiming Reticle with Crosshairs */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
            <div className="w-10 h-10 border border-white/50 rounded-full flex items-center justify-center">
              <div className="w-1 h-1 bg-amber-400 rounded-full" />
            </div>
            <span className="mt-1 px-1.5 py-0.5 rounded bg-black/85 border border-amber-400/60 text-[10px] font-mono font-bold text-amber-300 shadow">
              {thermalData.centerTemp.toFixed(1)}°C
            </span>
          </div>

          {/* Bottom Thermal Status */}
          <div className="flex items-center justify-between text-white/60 font-mono text-[9px]">
            <div>EMISSIVITY: 0.95 (SKIN/OBJ)</div>
            <div>SPECTRAL: 8-14 µm LWIR</div>
          </div>
        </div>
      )}
    </div>
  );
};
