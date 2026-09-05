export type CameraMode = 'photo' | 'portrait' | 'dslr' | '50mp' | 'night' | 'night_vision' | 'thermal' | 'hdr' | 'pro';

export type FilterType =
  | 'normal'
  | 'vivid'
  | 'bw_contrast'
  | 'film_nostalgia'
  | 'golden_hour'
  | 'cyberpunk'
  | 'teal_orange'
  | 'clean_hdr'
  | 'night_vision'
  | 'thermal';

export interface FilterOption {
  id: FilterType;
  name: string;
  category: string;
  cssFilter: string;
  canvasFilterFn?: (ctx: CanvasRenderingContext2D, width: number, height: number) => void;
}

export type GridMode = 'none' | 'rule_of_thirds' | 'golden_ratio' | 'crosshair';

export type FlashMode = 'off' | 'normal' | 'xenon' | 'auto' | 'torch';
export type AutoLightMode = 'off' | 'auto' | 'on';

export interface CameraFeatureFlags {
  realCamera50Mp: boolean;          // 50 MP Real Sensor mode
  nightVisionMode: boolean;         // Night Vision starlight / infrared
  thermalVisionMode: boolean;       // Thermal Vision FLIR heatmap
  autoLight: boolean;               // Adaptive Low-Light brightness boost
  flashSystem: boolean;             // Dual Xenon / LED Flash
  aiDetection: boolean;             // AI Object & Vehicle detection
  skeletonTracking: boolean;        // AI Human Skeleton / Pose tracking
  proControls: boolean;             // Manual Pro controls (EV, ISO, WB)
  superZoom100x: boolean;           // 100x Super Zoom controls
  cameraSounds: boolean;            // Mechanical shutter & flash sounds
  leveler: boolean;                 // Horizon Leveler indicator
  gridOverlay: boolean;             // Composition Grid
  dateWatermark: boolean;           // 50 MP AI Camera Watermark Stamp
  hapticFeedback: boolean;          // Vibration feedback
}

export interface ThermalMeasurement {
  centerTemp: number; // e.g. 36.5 °C
  minTemp: number;    // e.g. 19.2 °C
  maxTemp: number;    // e.g. 39.8 °C
  hotSpot: { x: number; y: number }; // 0 to 100 percentage
  coldSpot: { x: number; y: number };
}

export interface RealCameraSensorInfo {
  label: string;
  streamWidth: number;
  streamHeight: number;
  frameRate: number;
  facingMode: 'user' | 'environment';
  isRealHardware: boolean;
}

export interface ProSettings {
  ev: number; // -2.0 to +2.0
  iso: number | 'auto'; // auto, 100, 200, 400, 800, 1600, 3200
  shutter: string; // 'auto', '1/1000s', '1/500s', '1/125s', '1/30s', '1s'
  whiteBalance: 'auto' | 'daylight' | 'cloudy' | 'tungsten' | 'fluorescent';
  apertureBokeh: number; // 1.4 to 16.0 (for portrait mode blur)
  gridMode: GridMode;
  showLeveler: boolean;
  stabilization: boolean;
  timerSeconds: 0 | 3 | 10;
  brightnessBoost?: number; // 0 to 100%
  autoLight?: AutoLightMode;
  flashMode?: FlashMode;
  ultraHd100Mp?: boolean;
  realCamera50Mp?: boolean;
}

export interface PoseKeypoint {
  name: string;
  x: number; // 0 to 100 percentage
  y: number; // 0 to 100 percentage
  confidence: number; // 0 to 1
  visibility?: number;
}

export interface SkeletonBone {
  from: string;
  to: string;
}

export interface HumanSkeleton {
  id: string;
  keypoints: Record<string, PoseKeypoint>;
  score: number;
  poseName?: string;
}

export interface DetectedEntity {
  id: string;
  label: string;
  confidence: number;
  type: 'human' | 'vehicle' | 'animal' | 'object' | 'furniture' | 'lighting' | 'appliance' | 'electronics';
  box: {
    x: number; // percentage 0-100
    y: number; // percentage 0-100
    width: number;
    height: number;
  };
  subType?: string; // e.g. "Chair", "Table", "Bulb", "Fan", "Laptop", "Person"
  skeleton?: HumanSkeleton;
}

export interface PhotoRecord {
  id: string;
  dataUrl: string; // Base64 full image
  thumbnailUrl: string;
  timestamp: string;
  mode: CameraMode;
  zoomLevel: number;
  filter: FilterType;
  proSettings: ProSettings;
  detections: DetectedEntity[];
  metadata: {
    width: number;
    height: number;
    aspectRatio: string;
    focalLengthMm?: number;
    sensorFormat?: string;
    fileSizeBytes?: number;
    is50Mp?: boolean;
    is100Mp?: boolean;
    megapixels?: number;
    sensorLabel?: string;
    flashUsed?: FlashMode | 'none';
    autoLightActive?: boolean;
  };
  cloudSyncStatus: 'local_only' | 'synced' | 'syncing' | 'failed';
  cloudUrl?: string;
  notes?: string;
  aiSceneAnalysis?: {
    sceneType: string;
    lightingAnalysis: string;
    gcamAdvice: string;
    aestheticScore: number;
  };
}

export interface PhotoEditorAdjustments {
  brightness: number; // -50 to +50
  contrast: number; // -50 to +50
  saturation: number; // -50 to +50
  sharpness: number; // 0 to 50
  warmth: number; // -50 to +50
  vignette: number; // 0 to 50
  highlights: number; // -50 to +50
  shadows: number; // -50 to +50
  portraitBlur: number; // 0 to 20 px
  rotation: number; // 0, 90, 180, 270
  flipH: boolean;
  flipV: boolean;
  watermark: boolean;
}

export interface CloudStorageStats {
  photoCount: number;
  usedBytes: number;
  usedMB: string;
  quotaMB: string;
  usedPercentage: string;
}
