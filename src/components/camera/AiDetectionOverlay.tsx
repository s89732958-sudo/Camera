import React from 'react';
import { DetectedEntity, HumanSkeleton, PoseKeypoint } from '../../types';
import { SKELETON_CONNECTIONS } from '../../services/aiDetection';
import {
  Sparkles,
  Car,
  User,
  Activity,
  X,
  Camera,
  SunMedium,
  Lightbulb,
  Fan,
  Armchair,
  Laptop,
  Smartphone,
  Box,
} from 'lucide-react';

interface AiDetectionOverlayProps {
  entities: DetectedEntity[];
  skeletons: HumanSkeleton[];
  sceneType: string;
  enabled: boolean;
  onTriggerGeminiLens: () => Promise<void>;
  geminiAnalysis: any | null;
  isAnalyzing: boolean;
  onCloseGeminiAnalysis: () => void;
  showSkeleton?: boolean;
  onToggleSkeleton?: () => void;
}

export const AiDetectionOverlay: React.FC<AiDetectionOverlayProps> = ({
  entities,
  skeletons,
  sceneType,
  enabled,
  onTriggerGeminiLens,
  geminiAnalysis,
  isAnalyzing,
  onCloseGeminiAnalysis,
  showSkeleton = true,
  onToggleSkeleton,
}) => {
  if (!enabled) return null;

  // Helper to pick appropriate icon & color palette for each detected domestic object
  const getEntityVisuals = (entity: DetectedEntity) => {
    const sub = (entity.subType || entity.label).toLowerCase();

    if (sub.includes('chair') || sub.includes('kursi') || entity.type === 'furniture') {
      if (sub.includes('table') || sub.includes('mez')) {
        return {
          Icon: Box,
          borderColor: 'border-orange-400',
          bgColor: 'bg-orange-500/25 text-orange-200 border-orange-400/40',
          glowColor: '#fb923c',
        };
      }
      return {
        Icon: Armchair,
        borderColor: 'border-amber-400',
        bgColor: 'bg-amber-500/25 text-amber-200 border-amber-400/40',
        glowColor: '#f59e0b',
      };
    }

    if (sub.includes('bulb') || sub.includes('lamp') || entity.type === 'lighting') {
      return {
        Icon: Lightbulb,
        borderColor: 'border-yellow-300',
        bgColor: 'bg-yellow-400/30 text-yellow-100 border-yellow-300/50',
        glowColor: '#fef08a',
      };
    }

    if (sub.includes('fan') || sub.includes('pankha') || entity.type === 'appliance') {
      return {
        Icon: Fan,
        borderColor: 'border-sky-400',
        bgColor: 'bg-sky-500/25 text-sky-200 border-sky-400/40',
        glowColor: '#38bdf8',
      };
    }

    if (sub.includes('laptop') || sub.includes('computer')) {
      return {
        Icon: Laptop,
        borderColor: 'border-blue-400',
        bgColor: 'bg-blue-500/25 text-blue-200 border-blue-400/40',
        glowColor: '#60a5fa',
      };
    }

    if (sub.includes('phone') || sub.includes('mobile')) {
      return {
        Icon: Smartphone,
        borderColor: 'border-indigo-400',
        bgColor: 'bg-indigo-500/25 text-indigo-200 border-indigo-400/40',
        glowColor: '#818cf8',
      };
    }

    if (entity.type === 'vehicle' || sub.includes('car')) {
      return {
        Icon: Car,
        borderColor: 'border-cyan-400',
        bgColor: 'bg-cyan-500/25 text-cyan-200 border-cyan-400/40',
        glowColor: '#22d3ee',
      };
    }

    // Default Human / Person
    return {
      Icon: User,
      borderColor: 'border-emerald-400',
      bgColor: 'bg-emerald-500/25 text-emerald-200 border-emerald-400/40',
      glowColor: '#34d399',
    };
  };

  return (
    <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden select-none">
      {/* Top AI Vision & Object Detection HUD Bar */}
      <div className="absolute top-14 left-1/2 -translate-x-1/2 flex items-center gap-2 px-3.5 py-1.5 bg-black/80 backdrop-blur-xl rounded-full border border-emerald-400/50 text-xs text-white shadow-2xl pointer-events-auto max-w-[95%]">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
        <span className="font-semibold text-emerald-300 font-mono text-[11px] whitespace-nowrap">
          Live AI Vision
        </span>
        <span className="text-white/30 hidden sm:inline">•</span>
        <span className="text-white/90 text-[11px] font-medium truncate max-w-[140px] sm:max-w-xs">
          {sceneType}
        </span>

        {/* Skeleton Toggle Button */}
        {onToggleSkeleton && (
          <button
            onClick={onToggleSkeleton}
            className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium border transition-all ${
              showSkeleton
                ? 'bg-emerald-500/25 text-emerald-300 border-emerald-400/60 shadow-sm'
                : 'bg-white/10 text-white/50 border-white/10'
            }`}
            title="Toggle Biomechanical Skeleton Tracking"
          >
            <Activity className="w-3 h-3 text-emerald-400" />
            <span>Skeleton: {showSkeleton ? 'ON' : 'OFF'}</span>
          </button>
        )}

        {/* Gemini Vision Lens button */}
        <button
          id="btn-gemini-lens"
          onClick={onTriggerGeminiLens}
          disabled={isAnalyzing}
          className="flex items-center gap-1 px-2.5 py-0.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold text-[10px] rounded-full uppercase tracking-wider transition-all shadow-md active:scale-95 shrink-0"
          title="Analyze frame with Gemini Vision"
        >
          <Sparkles className="w-3 h-3" />
          <span>{isAnalyzing ? 'Analyzing...' : 'GCam Lens'}</span>
        </button>
      </div>

      {/* SVG SKELETON WIREFRAME LAYER (17-Point Biomechanical Human Pose) */}
      {showSkeleton && skeletons.length > 0 && (
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-20">
          <defs>
            <filter id="skel-glow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {skeletons.map((skel) => {
            const kp = skel.keypoints;

            return (
              <g key={skel.id} className="animate-in fade-in duration-150">
                {/* 1. Connecting Biomechanical Bones */}
                {SKELETON_CONNECTIONS.map(([p1Name, p2Name], idx) => {
                  const p1 = kp[p1Name];
                  const p2 = kp[p2Name];
                  if (!p1 || !p2 || p1.confidence < 0.25 || p2.confidence < 0.25) return null;

                  // Distinguish limb colors (Torso/Spine/Arms/Legs)
                  let strokeColor = '#10b981'; // Default emerald
                  let strokeWidth = '2.5';

                  if (p1Name.includes('wrist') || p2Name.includes('wrist') || p1Name.includes('hand') || p2Name.includes('hand')) {
                    strokeColor = '#38bdf8'; // Electric cyan for hands/wrists
                    strokeWidth = '2.2';
                  } else if (p1Name.includes('knee') || p2Name.includes('ankle') || p1Name.includes('foot') || p2Name.includes('foot')) {
                    strokeColor = '#c084fc'; // Purple/Violet for legs & feet
                    strokeWidth = '2.5';
                  } else if (p1Name.includes('shoulder') || p2Name.includes('shoulder')) {
                    strokeColor = '#fbbf24'; // Amber gold for shoulder bridge
                    strokeWidth = '3.0';
                  } else if (p1Name.includes('spine') || p2Name.includes('spine') || p1Name.includes('pelvis')) {
                    strokeColor = '#34d399'; // Bright green for spine core
                    strokeWidth = '3.2';
                  }

                  return (
                    <line
                      key={`${skel.id}-bone-${idx}`}
                      x1={`${p1.x}%`}
                      y1={`${p1.y}%`}
                      x2={`${p2.x}%`}
                      y2={`${p2.y}%`}
                      stroke={strokeColor}
                      strokeWidth={strokeWidth}
                      strokeLinecap="round"
                      filter="url(#skel-glow)"
                      className="opacity-95"
                    />
                  );
                })}

                {/* 2. Biomechanical Head Target Halo Circle */}
                {kp.nose && (
                  <circle
                    cx={`${kp.nose.x}%`}
                    cy={`${kp.nose.y}%`}
                    r="12"
                    fill="none"
                    stroke="#fbbf24"
                    strokeWidth="1.2"
                    strokeDasharray="4 2"
                    className="animate-spin opacity-80"
                    style={{ animationDuration: '8s', transformOrigin: `${kp.nose.x}% ${kp.nose.y}%` }}
                  />
                )}

                {/* 3. Keypoint Joints (Dots) */}
                {(Object.values(kp) as PoseKeypoint[]).map((pt, i) => {
                  if (!pt || pt.confidence < 0.25) return null;
                  const isHead = pt.name === 'nose' || pt.name.includes('eye') || pt.name.includes('ear');
                  const isHand = pt.name.includes('wrist') || pt.name.includes('hand');
                  const isFoot = pt.name.includes('ankle') || pt.name.includes('foot');

                  return (
                    <g key={`${skel.id}-pt-${i}`}>
                      {/* Outer pulse ring for hands and feet */}
                      {(isHand || isFoot) && (
                        <circle
                          cx={`${pt.x}%`}
                          cy={`${pt.y}%`}
                          r="6"
                          fill="none"
                          stroke={isHand ? '#38bdf8' : '#c084fc'}
                          strokeWidth="1"
                          className="animate-ping opacity-60"
                        />
                      )}

                      {/* Main Joint Node */}
                      <circle
                        cx={`${pt.x}%`}
                        cy={`${pt.y}%`}
                        r={isHead ? '3.5' : isHand || isFoot ? '4.5' : '3.8'}
                        fill={isHand ? '#38bdf8' : isHead ? '#fbbf24' : isFoot ? '#c084fc' : '#34d399'}
                        stroke="#ffffff"
                        strokeWidth="1.2"
                        className="filter drop-shadow(0 0 3px rgba(0,0,0,0.8))"
                      />
                    </g>
                  );
                })}

                {/* Pose Name Badge floating above head */}
                {kp.nose && (
                  <foreignObject
                    x={`${Math.max(2, kp.nose.x - 18)}%`}
                    y={`${Math.max(2, kp.nose.y - 8)}%`}
                    width="180"
                    height="36"
                    className="overflow-visible"
                  >
                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-black/85 backdrop-blur-md rounded-full border border-emerald-400/60 text-[10px] font-mono text-emerald-300 shadow-xl whitespace-nowrap">
                      <Activity className="w-3 h-3 text-emerald-400 animate-pulse" />
                      <span className="font-semibold">{skel.poseName || 'Pose Tracked'}</span>
                    </div>
                  </foreignObject>
                )}
              </g>
            );
          })}
        </svg>
      )}

      {/* Bounding Boxes for AI Detected Objects (Chair, Table, Fan, Bulb, Laptop, Phone, Person, Vehicle) */}
      {entities.map((entity) => {
        const { Icon, borderColor, bgColor, glowColor } = getEntityVisuals(entity);

        return (
          <div
            key={entity.id}
            className="absolute transition-all duration-200 ease-out"
            style={{
              left: `${entity.box.x}%`,
              top: `${entity.box.y}%`,
              width: `${entity.box.width}%`,
              height: `${entity.box.height}%`,
            }}
          >
            {/* Target Reticle Brackets */}
            <div
              className={`absolute -inset-0.5 border-2 ${borderColor} rounded-md opacity-90`}
              style={{ filter: `drop-shadow(0 0 4px ${glowColor})` }}
            >
              {/* Corner Brackets */}
              <div className="absolute -top-1.5 -left-1.5 w-3 h-3 border-t-2 border-l-2 border-white" />
              <div className="absolute -top-1.5 -right-1.5 w-3 h-3 border-t-2 border-r-2 border-white" />
              <div className="absolute -bottom-1.5 -left-1.5 w-3 h-3 border-b-2 border-l-2 border-white" />
              <div className="absolute -bottom-1.5 -right-1.5 w-3 h-3 border-b-2 border-r-2 border-white" />
            </div>

            {/* Entity Label Pill */}
            <div
              className={`absolute -top-7 left-0 flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold backdrop-blur-xl shadow-lg border ${bgColor} whitespace-nowrap`}
            >
              <Icon className="w-3 h-3 shrink-0" />
              <span>{entity.label}</span>
              <span className="opacity-80 text-[9px] bg-black/40 px-1 rounded">
                {Math.round(entity.confidence * 100)}%
              </span>
            </div>
          </div>
        );
      })}

      {/* Gemini AI Scene Insights Bottom Sheet Modal */}
      {geminiAnalysis && (
        <div className="absolute bottom-28 left-4 right-4 max-w-lg mx-auto bg-neutral-900/95 backdrop-blur-xl border border-amber-500/40 rounded-2xl p-4 text-white shadow-2xl pointer-events-auto animate-in fade-in slide-in-from-bottom duration-200">
          <div className="flex items-start justify-between pb-2 border-b border-white/10">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-amber-500/20 rounded-lg border border-amber-500/30">
                <Sparkles className="w-4 h-4 text-amber-400" />
              </div>
              <div>
                <h4 className="font-medium text-sm text-white">Google Camera AI Scene Tuning</h4>
                <p className="text-[11px] text-amber-300/90 font-mono">
                  {geminiAnalysis.sceneType || 'Smart Scene Analysis'} • Aesthetic Score:{' '}
                  {geminiAnalysis.aestheticScore || '8.8'}/10
                </p>
              </div>
            </div>
            <button
              onClick={onCloseGeminiAnalysis}
              className="text-white/60 hover:text-white p-1 rounded-full hover:bg-white/10"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 my-3 text-xs">
            <div className="bg-black/40 p-2.5 rounded-lg border border-white/5">
              <div className="flex items-center gap-1 text-white/50 text-[10px] mb-1">
                <Camera className="w-3 h-3" />
                <span>RECOMMENDED MODE</span>
              </div>
              <p className="font-semibold text-amber-300">
                {geminiAnalysis.recommendedMode || 'DSLR Pro'}
              </p>
            </div>

            <div className="bg-black/40 p-2.5 rounded-lg border border-white/5">
              <div className="flex items-center gap-1 text-white/50 text-[10px] mb-1">
                <SunMedium className="w-3 h-3" />
                <span>EXPOSURE TUNING</span>
              </div>
              <p className="font-semibold text-emerald-300">
                {geminiAnalysis.exposureCompensation || '+0.2 EV'}
              </p>
            </div>
          </div>

          <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-2.5 text-xs text-amber-100 mb-2">
            <span className="font-semibold text-amber-300">Photographer Tip: </span>
            {geminiAnalysis.gcamAdvice ||
              'DSLR Color Science active. Use 2x or 3.5x Zoom with natural shallow depth of field for portrait realism.'}
          </div>
        </div>
      )}
    </div>
  );
};
