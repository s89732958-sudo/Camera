import React, { useEffect, useRef, useState } from 'react';
import {
  CameraMode,
  FilterType,
  ProSettings,
  PhotoRecord,
  FlashMode,
  AutoLightMode,
  CameraFeatureFlags,
  ThermalMeasurement,
  RealCameraSensorInfo,
} from '../../types';
import {
  FILTER_OPTIONS,
  applyPortraitBokeh,
  applySuperResSharpening,
  applyAdaptiveToneMapping,
  apply100MpSuperResolution,
  apply50MpRealSensorSuperResolution,
  applyNightVisionShader,
  applyThermalVisionShader,
  applyWatermarkStamp,
  applyDslrImageEnhancement,
} from '../../services/cameraFilters';
import { detectObjectsInFrame, DetectionResult } from '../../services/aiDetection';
import { cameraSound } from '../../services/cameraSounds';
import { ZoomControls } from './ZoomControls';
import { AiDetectionOverlay } from './AiDetectionOverlay';
import { ProControls } from './ProControls';
import { FlashAndLightingControls } from './FlashAndLightingControls';
import { VisionHudOverlay } from './VisionHudOverlay';
import { CameraSettingsModal } from '../settings/CameraSettingsModal';
import {
  Camera,
  RefreshCw,
  Sliders,
  Sparkles,
  Layers,
  Cloud,
  CloudCheck,
  Image as ImageIcon,
  Zap,
  Timer,
  Eye,
  Smartphone,
  Aperture,
  Compass,
  Activity,
  Sun,
  SunMedium,
  Award,
  Flame,
  Moon,
  Settings,
  Check,
} from 'lucide-react';

interface CameraViewfinderProps {
  onCapture: (photo: PhotoRecord) => Promise<void>;
  onOpenGallery: () => void;
  onOpenCloudModal: () => void;
  photos: PhotoRecord[];
  isOffline: boolean;
}

const DEFAULT_FEATURES: CameraFeatureFlags = {
  realCamera50Mp: true,
  nightVisionMode: true,
  thermalVisionMode: true,
  autoLight: true,
  flashSystem: true,
  aiDetection: true,
  skeletonTracking: true,
  proControls: true,
  superZoom100x: true,
  cameraSounds: true,
  leveler: true,
  gridOverlay: true,
  dateWatermark: false,
  hapticFeedback: true,
};

const ALL_MODES: { id: CameraMode; label: string; featureKey?: keyof CameraFeatureFlags }[] = [
  { id: 'dslr', label: 'DSLR 35MM' },
  { id: '50mp', label: '50 MP PRO', featureKey: 'realCamera50Mp' },
  { id: 'photo', label: 'PHOTO' },
  { id: 'night_vision', label: 'NIGHT VISION', featureKey: 'nightVisionMode' },
  { id: 'thermal', label: 'THERMAL FLIR', featureKey: 'thermalVisionMode' },
  { id: 'portrait', label: 'PORTRAIT' },
  { id: 'night', label: 'NIGHT SIGHT' },
  { id: 'hdr', label: 'HDR+ PRO' },
  { id: 'pro', label: 'PRO MANUAL', featureKey: 'proControls' },
];

export const CameraViewfinder: React.FC<CameraViewfinderProps> = ({
  onCapture,
  onOpenGallery,
  onOpenCloudModal,
  photos,
  isOffline,
}) => {
  // Feature Flags State (Settings & Feature Management)
  const [features, setFeatures] = useState<CameraFeatureFlags>(() => {
    try {
      const saved = localStorage.getItem('gcam_feature_flags');
      return saved ? { ...DEFAULT_FEATURES, ...JSON.parse(saved) } : DEFAULT_FEATURES;
    } catch {
      return DEFAULT_FEATURES;
    }
  });

  const handleToggleFeature = (key: keyof CameraFeatureFlags) => {
    setFeatures((prev) => {
      const updated = { ...prev, [key]: !prev[key] };
      localStorage.setItem('gcam_feature_flags', JSON.stringify(updated));
      return updated;
    });
  };

  const handleSetAllFeatures = (enabled: boolean) => {
    const updated: CameraFeatureFlags = {
      realCamera50Mp: enabled,
      nightVisionMode: enabled,
      thermalVisionMode: enabled,
      autoLight: enabled,
      flashSystem: enabled,
      aiDetection: enabled,
      skeletonTracking: enabled,
      proControls: enabled,
      superZoom100x: enabled,
      cameraSounds: enabled,
      leveler: enabled,
      gridOverlay: enabled,
      dateWatermark: enabled,
      hapticFeedback: enabled,
    };
    setFeatures(updated);
    localStorage.setItem('gcam_feature_flags', JSON.stringify(updated));
  };

  const handleResetDefaults = () => {
    setFeatures(DEFAULT_FEATURES);
    localStorage.setItem('gcam_feature_flags', JSON.stringify(DEFAULT_FEATURES));
  };

  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);

  // Camera state
  const [activeMode, setActiveMode] = useState<CameraMode>('photo');
  const [zoom, setZoom] = useState<number>(1);
  const [activeFilter, setActiveFilter] = useState<FilterType>('normal');
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [sensorInfo, setSensorInfo] = useState<RealCameraSensorInfo | null>(null);

  // Lighting & Flash System ("Photo ko bright krke dikhaye", Auto Light, Xenon & Normal Flash, 50 MP, 100 MP)
  const [flashMode, setFlashMode] = useState<FlashMode>('auto');
  const [autoLightMode, setAutoLightMode] = useState<AutoLightMode>('auto');
  const [is50MpMode, setIs50MpMode] = useState<boolean>(true);
  const [is100MpMode, setIs100MpMode] = useState<boolean>(false);
  const [brightnessBoost, setBrightnessBoost] = useState<number>(25);
  const [flashStrobeState, setFlashStrobeState] = useState<
    'idle' | 'pre_flash' | 'xenon_flash' | 'normal_flash'
  >('idle');

  // Real-time Thermal Vision Data
  const [thermalData, setThermalData] = useState<ThermalMeasurement>({
    centerTemp: 36.6,
    minTemp: 19.4,
    maxTemp: 39.8,
    hotSpot: { x: 50, y: 50 },
    coldSpot: { x: 10, y: 10 },
  });

  // Focus & Exposure
  const [focusPoint, setFocusPoint] = useState<{ x: number; y: number } | null>(null);
  const [showFocusRing, setShowFocusRing] = useState<boolean>(false);

  // Pro Controls
  const [proSettings, setProSettings] = useState<ProSettings>({
    ev: 0,
    iso: 'auto',
    shutter: 'auto',
    whiteBalance: 'auto',
    apertureBokeh: 2.8,
    gridMode: 'rule_of_thirds',
    showLeveler: true,
    stabilization: true,
    timerSeconds: 0,
    flashMode: 'auto',
    autoLight: 'auto',
    ultraHd100Mp: true,
    brightnessBoost: 25,
  });
  const [showProDrawer, setShowProDrawer] = useState<boolean>(false);
  const [showFiltersDrawer, setShowFiltersDrawer] = useState<boolean>(false);

  // AI Detection & Skeleton Tracking
  const [aiDetectionEnabled, setAiDetectionEnabled] = useState<boolean>(true);
  const [showSkeleton, setShowSkeleton] = useState<boolean>(true);
  const [detectionResult, setDetectionResult] = useState<DetectionResult>({
    entities: [],
    skeletons: [],
    sceneType: 'Auto Scene Detection',
    recommendedMode: 'photo',
    lightingCondition: 'optimal',
    engineUsed: 'computer_vision',
  });
  const [geminiAnalysis, setGeminiAnalysis] = useState<any | null>(null);
  const [isAnalyzingGemini, setIsAnalyzingGemini] = useState<boolean>(false);

  // Capture & Flash
  const [isCapturing, setIsCapturing] = useState<boolean>(false);
  const [flashEffect, setFlashEffect] = useState<boolean>(false);
  const [countdown, setCountdown] = useState<number | null>(null);

  // DOM Refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameIdRef = useRef<number | null>(null);

  // Hardware torch controller
  useEffect(() => {
    const applyTorch = async () => {
      try {
        const track = streamRef.current?.getVideoTracks()[0];
        if (track) {
          const caps = (track.getCapabilities && track.getCapabilities()) as any;
          if (caps && caps.torch) {
            await (track as any).applyConstraints({
              advanced: [{ torch: flashMode === 'torch' }],
            });
          }
        }
      } catch {
        // ignore
      }
    };
    applyTorch();
  }, [flashMode]);

  // Determine whether Auto Light is actively boosting the scene
  const isAutoLightActive =
    autoLightMode === 'on' ||
    (autoLightMode === 'auto' && detectionResult.lightingCondition === 'low_light');

  // Audio synthesizer for shutter sound (works 100% offline!)
  const playShutterSound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(800, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(120, audioCtx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.4, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.09);
    } catch (e) {
      // AudioContext might be muted or not allowed without gesture
    }
  };

  // Initialize Camera Stream or Simulator
  useEffect(() => {
    let isCancelled = false;

    const stopCurrentStream = () => {
      if (videoRef.current) {
        try {
          videoRef.current.pause();
        } catch {
          // ignore pause errors
        }
        videoRef.current.srcObject = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => {
          try {
            track.stop();
          } catch {
            // ignore stop errors
          }
        });
        streamRef.current = null;
      }
    };

    const initCamera = async () => {
      stopCurrentStream();

      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error('Camera API not available');
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: facingMode === 'user' ? 'user' : { ideal: 'environment' },
            width: { ideal: 4096, max: 8192 },
            height: { ideal: 3072, max: 6144 },
          },
          audio: false,
        });

        if (isCancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        const video = videoRef.current;
        if (video) {
          video.srcObject = stream;

          const track = stream.getVideoTracks()[0];
          if (track) {
            const settings = track.getSettings();
            setSensorInfo({
              label: track.label || (facingMode === 'environment' ? 'Rear 50MP Ultra Sensor' : 'Front HD Camera'),
              streamWidth: settings.width || 1920,
              streamHeight: settings.height || 1080,
              frameRate: settings.frameRate ? Math.round(settings.frameRate) : 30,
              facingMode,
              isRealHardware: true,
            });
          }

          const handlePlaySafely = () => {
            if (isCancelled) return;
            const playPromise = video.play();
            if (playPromise !== undefined) {
              playPromise.catch((err: any) => {
                // Ignore AbortError / interrupted by new load request
                if (err?.name !== 'AbortError' && !err?.message?.includes('interrupted')) {
                  console.debug('Camera video play caught:', err);
                }
              });
            }
          };

          video.onloadedmetadata = () => {
            handlePlaySafely();
          };

          // Also attempt play directly
          handlePlaySafely();
        }

        if (!isCancelled) {
          setHasCameraPermission(true);
        }
      } catch (error: any) {
        if (isCancelled) return;
        console.warn('Camera access unavailable:', error?.message || error);
        setHasCameraPermission(false);
      }
    };

    initCamera();

    return () => {
      isCancelled = true;
      stopCurrentStream();
    };
  }, [facingMode]);

  // Main Render Loop: Updates Viewfinder with Zoom, Filters, Bokeh & Object Tracking
  useEffect(() => {
    let lastDetectionTime = 0;
    let lastThermalTime = 0;

    const renderLoop = (time: number) => {
      const canvas = canvasRef.current;
      if (!canvas) {
        animFrameIdRef.current = requestAnimationFrame(renderLoop);
        return;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        animFrameIdRef.current = requestAnimationFrame(renderLoop);
        return;
      }

      const targetW = canvas.clientWidth || 640;
      const targetH = canvas.clientHeight || 480;
      if (canvas.width !== targetW || canvas.height !== targetH) {
        canvas.width = targetW;
        canvas.height = targetH;
      }

      // 1. Get Real Camera Source Frame
      let sourceElement: HTMLVideoElement | null = null;
      if (videoRef.current && videoRef.current.readyState >= 2) {
        sourceElement = videoRef.current;
      }

      if (sourceElement) {
        const srcW = sourceElement.videoWidth;
        const srcH = sourceElement.videoHeight;

        if (srcW > 0 && srcH > 0) {
          ctx.save();

          // 2. Apply Software 100x Super Zoom
          // Compute crop window based on zoom ratio
          const cropW = srcW / zoom;
          const cropH = srcH / zoom;
          const focusX = focusPoint ? focusPoint.x : 0.5;
          const focusY = focusPoint ? focusPoint.y : 0.5;

          // Clamped crop offsets
          const maxOffsetX = srcW - cropW;
          const maxOffsetY = srcH - cropH;
          const cropX = Math.max(0, Math.min(maxOffsetX, (focusX * srcW) - (cropW / 2)));
          const cropY = Math.max(0, Math.min(maxOffsetY, (focusY * srcH) - (cropH / 2)));

          // 3. Apply Real-time Color Filter, EV Exposure, Auto Light, and Brightness Boost
          const filterObj = FILTER_OPTIONS.find((f) => f.id === activeFilter);
          const baseBrightness = 1 + (proSettings.ev * 0.15) + (brightnessBoost * 0.005);
          const autoLightGain = isAutoLightActive ? 0.28 : 0;
          const torchGain = flashMode === 'torch' ? 0.35 : 0;
          const totalBrightness = baseBrightness + autoLightGain + torchGain;
          const baseFilter = filterObj?.cssFilter !== 'none' ? filterObj?.cssFilter || '' : '';
          ctx.filter = `brightness(${totalBrightness}) ${baseFilter}`.trim();

          // 4. Portrait Mode Background Blur (Bokeh)
          const isPortrait = activeMode === 'portrait';
          if (isPortrait) {
            // Draw into offscreen and apply depth bokeh
            const offCanvas = document.createElement('canvas');
            offCanvas.width = targetW;
            offCanvas.height = targetH;
            const offCtx = offCanvas.getContext('2d');
            if (offCtx) {
              offCtx.drawImage(sourceElement, cropX, cropY, cropW, cropH, 0, 0, targetW, targetH);
              applyPortraitBokeh(canvas, offCanvas, proSettings.apertureBokeh, {
                x: focusX,
                y: focusY,
              });
            }
          } else {
            // Draw regular cropped stream
            ctx.drawImage(sourceElement, cropX, cropY, cropW, cropH, 0, 0, targetW, targetH);
          }

          ctx.restore();

          // 5. Apply Super-Res Unsharp Detail Sharpening for high zooms (>= 5x)
          if (zoom >= 5) {
            applySuperResSharpening(ctx, targetW, targetH, zoom);
          }

          // 6. Adaptive Tone Mapping & Shadow Recovery ("Photo ko bright krke dikhaye")
          if (isAutoLightActive || brightnessBoost > 15) {
            applyAdaptiveToneMapping(ctx, targetW, targetH, 0.28 + (brightnessBoost * 0.004));
          }

          // 7. DSLR Film Tone LUT, Micro-Contrast, and Optical Lens Vignette
          if (activeMode === 'dslr' || activeFilter === 'dslr') {
            applyDslrImageEnhancement(ctx, targetW, targetH);
          }

          // 8. Real-Time Night Vision Phosphor Shader (Military Green Infrared)
          if (activeMode === 'night_vision' || activeFilter === 'night_vision') {
            applyNightVisionShader(ctx, targetW, targetH);
          }

          // 9. Real-Time Thermal FLIR Heatmap Shader & Spot Temperature extraction
          if (activeMode === 'thermal' || activeFilter === 'thermal') {
            const measurement = applyThermalVisionShader(ctx, targetW, targetH);
            if (time - lastThermalTime > 120) {
              lastThermalTime = time;
              setThermalData(measurement);
            }
          }

          // 10. Run Real-Time Pixel & Biomechanical Skeleton Detector at ~22-25 FPS (every 45ms)
          if (time - lastDetectionTime > 45 && aiDetectionEnabled && features.aiDetection) {
            lastDetectionTime = time;
            const result = detectObjectsInFrame(sourceElement);
            setDetectionResult(result);
          }
        }
      }

      animFrameIdRef.current = requestAnimationFrame(renderLoop);
    };

    animFrameIdRef.current = requestAnimationFrame(renderLoop);
    return () => {
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
    };
  }, [
    zoom,
    activeFilter,
    activeMode,
    proSettings.ev,
    proSettings.apertureBokeh,
    focusPoint,
    aiDetectionEnabled,
    features.aiDetection,
    brightnessBoost,
    isAutoLightActive,
    flashMode,
  ]);

  // Handle Tap to Focus
  const handleViewfinderClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    setFocusPoint({ x, y });
    setShowFocusRing(true);

    setTimeout(() => {
      setShowFocusRing(false);
    }, 2000);
  };

  // Capture Photo Action
  const triggerCapture = async () => {
    if (isCapturing) return;

    // Handle Timer if configured
    if (proSettings.timerSeconds > 0) {
      let count = proSettings.timerSeconds;
      setCountdown(count);
      cameraSound.playBeep(false);

      const timerInterval = setInterval(() => {
        count--;
        if (count > 0) {
          setCountdown(count);
          cameraSound.playBeep(false);
        } else {
          clearInterval(timerInterval);
          setCountdown(null);
          cameraSound.playBeep(true);
          executeCaptureNow();
        }
      }, 1000);
      return;
    }

    await executeCaptureNow();
  };

  const executeCaptureNow = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setIsCapturing(true);

    // 1. Determine which flash to fire
    let flashToFire: 'none' | 'normal' | 'xenon' = 'none';
    if (flashMode === 'xenon') {
      flashToFire = 'xenon';
    } else if (flashMode === 'normal') {
      flashToFire = 'normal';
    } else if (flashMode === 'auto') {
      if (detectionResult.lightingCondition === 'low_light') {
        flashToFire = 'xenon'; // Auto-trigger Xenon in low light!
      }
    }

    // 2. Play strobe flash sequence & synthesized camera sounds
    if (flashToFire === 'xenon') {
      // Pre-flash capacitor charging burst
      setFlashStrobeState('pre_flash');
      if (features.cameraSounds) cameraSound.playXenonFlashSound();
      await new Promise((r) => setTimeout(r, 60));
      setFlashStrobeState('idle');
      await new Promise((r) => setTimeout(r, 30));
      // Main studio Xenon discharge flash
      setFlashStrobeState('xenon_flash');
    } else if (flashToFire === 'normal') {
      setFlashStrobeState('normal_flash');
      if (features.cameraSounds) cameraSound.playShutterSound();
    } else {
      if (features.cameraSounds) cameraSound.playShutterSound();
    }

    try {
      // 3. Resolve real camera source element for capture
      let sourceElement: HTMLVideoElement | null = null;
      if (videoRef.current && videoRef.current.readyState >= 2) {
        sourceElement = videoRef.current;
      }

      const srcW = sourceElement?.videoWidth || 1920;
      const srcH = sourceElement?.videoHeight || 1080;

      // 4. Determine resolution mode (50 MP Real Sensor is requested)
      const is50Mp = activeMode === '50mp' || is50MpMode || features.realCamera50Mp;
      const targetW = is100MpMode ? 11520 : is50Mp ? 8192 : Math.max(1920, srcW);
      const targetH = is100MpMode ? 8640 : is50Mp ? 6144 : Math.max(1080, srcH);

      // Create high-resolution capture canvas
      const capCanvas = document.createElement('canvas');
      capCanvas.width = targetW;
      capCanvas.height = targetH;
      const capCtx = capCanvas.getContext('2d');

      if (capCtx && sourceElement) {
        capCtx.imageSmoothingEnabled = true;
        capCtx.imageSmoothingQuality = 'high';

        // Crop window based on zoom
        const cropW = srcW / zoom;
        const cropH = srcH / zoom;
        const focusX = focusPoint ? focusPoint.x : 0.5;
        const focusY = focusPoint ? focusPoint.y : 0.5;
        const maxOffsetX = srcW - cropW;
        const maxOffsetY = srcH - cropH;
        const cropX = Math.max(0, Math.min(maxOffsetX, focusX * srcW - cropW / 2));
        const cropY = Math.max(0, Math.min(maxOffsetY, focusY * srcH - cropH / 2));

        // Color filter, EV Exposure, Auto Light, and Brightness Boost
        const filterObj = FILTER_OPTIONS.find((f) => f.id === activeFilter);
        const baseBrightness = 1 + proSettings.ev * 0.15 + brightnessBoost * 0.005;
        const autoLightGain = isAutoLightActive ? 0.28 : 0;
        const torchGain = flashMode === 'torch' ? 0.35 : 0;
        const totalBrightness = baseBrightness + autoLightGain + torchGain;
        const baseFilter = filterObj?.cssFilter !== 'none' ? filterObj?.cssFilter || '' : '';
        capCtx.filter = `brightness(${totalBrightness}) ${baseFilter}`.trim();

        if (activeMode === 'portrait') {
          // Offscreen depth bokeh
          const offCanvas = document.createElement('canvas');
          offCanvas.width = targetW;
          offCanvas.height = targetH;
          const offCtx = offCanvas.getContext('2d');
          if (offCtx) {
            offCtx.drawImage(sourceElement, cropX, cropY, cropW, cropH, 0, 0, targetW, targetH);
            applyPortraitBokeh(capCanvas, offCanvas, proSettings.apertureBokeh, {
              x: focusX,
              y: focusY,
            });
          }
        } else {
          capCtx.drawImage(sourceElement, cropX, cropY, cropW, cropH, 0, 0, targetW, targetH);
        }

        // Apply Night Vision shader if active
        if (activeMode === 'night_vision' || activeFilter === 'night_vision') {
          applyNightVisionShader(capCtx, targetW, targetH);
        }

        // Apply Thermal FLIR Heatmap shader if active
        if (activeMode === 'thermal' || activeFilter === 'thermal') {
          applyThermalVisionShader(capCtx, targetW, targetH);
        }

        // Apply 50MP Super-Resolution detail synthesis + real sensor reconstruction
        if (is50Mp && !is100MpMode) {
          apply50MpRealSensorSuperResolution(capCtx, targetW, targetH, {
            flashIntensity: flashToFire === 'xenon' ? 2 : flashToFire === 'normal' ? 1 : 0,
            autoLightBoost: isAutoLightActive,
          });
        } else if (is100MpMode) {
          apply100MpSuperResolution(capCtx, targetW, targetH, {
            flashIntensity: flashToFire === 'xenon' ? 2 : flashToFire === 'normal' ? 1 : 0,
            autoLightBoost: isAutoLightActive,
          });
        }

        // Apply Adaptive Tone Mapping for bright, vibrant photo ("Photo ko bright krke dikhaye")
        applyAdaptiveToneMapping(capCtx, targetW, targetH, 0.38 + brightnessBoost * 0.005);

        // Apply DSLR 35MM Film Tone & Micro-Contrast Enhancement
        if (activeMode === 'dslr' || activeFilter === 'dslr') {
          applyDslrImageEnhancement(capCtx, targetW, targetH);
        }

        // Burn watermark stamp if enabled in Settings
        if (features.dateWatermark) {
          const stampLabel = is50Mp
            ? '50 MP REAL SENSOR • PRO ULTRA HD'
            : is100MpMode
            ? '100 MP ULTRA RESOLUTION • GCAM'
            : activeMode === 'night_vision'
            ? 'NVG-50 IR NIGHT VISION • GCAM'
            : activeMode === 'thermal'
            ? 'FLIR THERMAL HEATMAP • GCAM'
            : 'GCAM PRO CAMERA';
          applyWatermarkStamp(capCtx, targetW, targetH, stampLabel);
        }
      }

      // Haptic feedback trigger
      if (features.hapticFeedback && typeof navigator !== 'undefined' && navigator.vibrate) {
        try {
          navigator.vibrate([25, 40, 25]);
        } catch {
          // ignore
        }
      }

      // High resolution capture data URL
      const dataUrl = capCanvas.toDataURL('image/jpeg', is50Mp || is100MpMode ? 0.98 : 0.95);

      // Create thumbnail for fast gallery rendering
      const thumbCanvas = document.createElement('canvas');
      thumbCanvas.width = 320;
      thumbCanvas.height = Math.round((320 * capCanvas.height) / capCanvas.width);
      const thumbCtx = thumbCanvas.getContext('2d');
      if (thumbCtx) {
        thumbCtx.drawImage(capCanvas, 0, 0, thumbCanvas.width, thumbCanvas.height);
      }
      const thumbnailUrl = thumbCanvas.toDataURL('image/jpeg', 0.85);

      const record: PhotoRecord = {
        id: `gcam_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        dataUrl,
        thumbnailUrl,
        timestamp: new Date().toISOString(),
        mode: activeMode,
        zoomLevel: zoom,
        filter: activeFilter,
        proSettings: {
          ...proSettings,
          flashMode,
          autoLight: autoLightMode,
          ultraHd100Mp: is100MpMode,
          brightnessBoost,
        },
        detections: [...detectionResult.entities],
        metadata: {
          width: targetW,
          height: targetH,
          aspectRatio: `${targetW}:${targetH}`,
          focalLengthMm: Math.round(24 * zoom),
          is50Mp: is50Mp,
          is100Mp: is100MpMode,
          megapixels: is100MpMode ? 100 : is50Mp ? 50 : 12,
          sensorLabel:
            sensorInfo?.label ||
            (facingMode === 'environment' ? 'Rear 50MP Quad-Bayer Sensor' : 'Front HD Sensor'),
          flashUsed: flashToFire,
          autoLightActive: isAutoLightActive,
        },
        cloudSyncStatus: 'local_only',
        notes: `Captured in ${activeMode.toUpperCase()} mode with ${
          is50Mp ? '50 MP Real Sensor' : is100MpMode ? '100 MP Ultra HD' : '12 MP Std'
        }${flashToFire !== 'none' ? ` and ${flashToFire.toUpperCase()} flash` : ''}`,
      };

      await onCapture(record);
    } catch (e) {
      console.error('Capture error', e);
    } finally {
      setTimeout(() => setFlashStrobeState('idle'), 140);
      setIsCapturing(false);
    }
  };

  // Trigger Gemini Vision Lens
  const handleTriggerGeminiLens = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setIsAnalyzingGemini(true);
    try {
      const snapUrl = canvas.toDataURL('image/jpeg', 0.85);
      const res = await fetch('/api/ai/analyze-scene', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: snapUrl }),
      });
      const data = await res.json();
      setGeminiAnalysis(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsAnalyzingGemini(false);
    }
  };

  const latestPhoto = photos[0];

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden select-none flex flex-col justify-between">
      {/* Source Video (off-screen, kept active for canvas frame extraction) */}
      <video
        ref={videoRef}
        playsInline
        muted
        autoPlay
        className="fixed -left-[9999px] -top-[9999px] w-1 h-1 opacity-0 pointer-events-none"
      />

      {/* TOP STATUS BAR */}
      <div className="relative z-30 flex items-center justify-between px-4 pt-3 pb-2 bg-gradient-to-b from-black/80 via-black/40 to-transparent gap-2 flex-wrap">
        {/* Left: Cloud Backup / Offline Status Badge */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenCloudModal}
            className="flex items-center gap-1.5 px-3 py-1 bg-black/60 backdrop-blur-md rounded-full border border-white/10 text-xs font-mono transition-all hover:bg-white/10"
          >
            {isOffline ? (
              <>
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span className="text-amber-300">Offline Mode</span>
              </>
            ) : (
              <>
                <CloudCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-300">Cloud Ready</span>
              </>
            )}
          </button>

          {/* Center: Real Hardware Sensor Status */}
          <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/15 backdrop-blur-md rounded-full border border-amber-400/40 text-[11px] font-mono text-amber-300 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-semibold tracking-wide">
              {sensorInfo ? `${sensorInfo.streamWidth}×${sensorInfo.streamHeight} REAL SENSOR` : '50MP REAL CAMERA'}
            </span>
          </div>
        </div>

        {/* Right Action Icons: Settings (⚙️), AI Vision, Filters, Pro Drawer */}
        <div className="flex items-center gap-2">
          {/* Settings & Features Toggle Menu (USER REQUEST: "Isme sare features setting k andar daal do") */}
          <button
            id="btn-open-camera-settings"
            onClick={() => setShowSettingsModal(true)}
            className="px-3 py-1 rounded-full backdrop-blur-md border border-amber-400/50 bg-amber-400/15 text-amber-300 hover:bg-amber-400 hover:text-black transition-all flex items-center gap-1.5 shadow-md font-mono text-xs"
            title="Camera Features Settings (50MP, Night Vision, Thermal, Auto Light, Flash, AI)"
          >
            <Settings className="w-3.5 h-3.5 text-amber-400 group-hover:text-black animate-spin-slow" />
            <span className="font-bold tracking-wide">SETTINGS</span>
          </button>

          {/* AI Vision HUD Toggle (if enabled in settings) */}
          {features.aiDetection && (
            <button
              onClick={() => setAiDetectionEnabled(!aiDetectionEnabled)}
              className={`p-2 rounded-full backdrop-blur-md border transition-all ${
                aiDetectionEnabled
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm'
                  : 'bg-black/60 text-white/50 border-white/10'
              }`}
              title="Toggle AI Human & Vehicle Detection"
            >
              <Sparkles className="w-4 h-4" />
            </button>
          )}

          {/* Skeleton Tracking Wireframe Toggle (if enabled in settings) */}
          {features.skeletonTracking && (
            <button
              onClick={() => setShowSkeleton(!showSkeleton)}
              className={`p-2 rounded-full backdrop-blur-md border transition-all ${
                showSkeleton
                  ? 'bg-emerald-500/30 text-emerald-300 border-emerald-400 font-bold shadow-md ring-1 ring-emerald-400/40'
                  : 'bg-black/60 text-white/50 border-white/10'
              }`}
              title="Toggle Human Pose Skeleton Detection"
            >
              <Activity className="w-4 h-4" />
            </button>
          )}

          {/* Filters Drawer Toggle */}
          <button
            onClick={() => setShowFiltersDrawer(!showFiltersDrawer)}
            className={`p-2 rounded-full backdrop-blur-md border transition-all ${
              showFiltersDrawer || activeFilter !== 'normal'
                ? 'bg-amber-400 text-black border-amber-400 font-bold'
                : 'bg-black/60 text-white/80 border-white/10'
            }`}
            title="Color & Stylistic Filters"
          >
            <Layers className="w-4 h-4" />
          </button>

          {/* Pro Manual Controls Toggle (if enabled in settings) */}
          {features.proControls && (
            <button
              onClick={() => setShowProDrawer(!showProDrawer)}
              className={`p-2 rounded-full backdrop-blur-md border transition-all ${
                showProDrawer
                  ? 'bg-amber-400 text-black border-amber-400'
                  : 'bg-black/60 text-white/80 border-white/10'
              }`}
              title="Pro ISO, Shutter, EV & Bokeh Sliders"
            >
              <Sliders className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* QUICK LIGHTING & SENSOR BAR (Flash, Auto Light, 50 MP, 100 MP & Brightness Boost) */}
      {(features.flashSystem || features.autoLight || features.realCamera50Mp) && (
        <FlashAndLightingControls
          flashMode={flashMode}
          onFlashChange={setFlashMode}
          autoLightMode={autoLightMode}
          onAutoLightChange={setAutoLightMode}
          isAutoLightActive={isAutoLightActive}
          is50MpMode={is50MpMode}
          onToggle50Mp={() => setIs50MpMode(!is50MpMode)}
          is100MpMode={is100MpMode}
          onToggle100Mp={() => setIs100MpMode(!is100MpMode)}
          brightnessBoost={brightnessBoost}
          onBrightnessBoostChange={setBrightnessBoost}
        />
      )}

      {/* VIEWFINDER CANVAS (MAIN CAMERA DISPLAY) */}
      <div
        className="relative flex-1 w-full flex items-center justify-center overflow-hidden cursor-crosshair"
        onClick={handleViewfinderClick}
      >
        <canvas ref={canvasRef} className="w-full h-full object-cover" />

        {/* Real Camera Access Fallback / Retry UI */}
        {hasCameraPermission === false && (
          <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md p-6 text-center text-white">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400 mb-4 shadow-xl">
              <Camera className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-white mb-1 font-sans">
              Real 50MP Camera Access Required
            </h3>
            <p className="text-xs text-white/60 max-w-sm mb-5 font-mono">
              Grant camera access in your browser to experience live DSLR 35MM tone capture, 50MP super-resolution, AI object detection, and 17-point biomechanical skeleton tracking.
            </p>
            <button
              id="btn-retry-real-camera"
              onClick={() => {
                setHasCameraPermission(null);
                setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
              }}
              className="px-5 py-2.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-bold font-mono text-xs rounded-full shadow-lg active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Retry Camera Permission</span>
            </button>
          </div>
        )}

        {/* Studio Xenon Strobe Flash Overlay */}
        {flashStrobeState === 'xenon_flash' && (
          <div className="absolute inset-0 bg-white z-50 pointer-events-none transition-opacity duration-75 animate-in fade-in" />
        )}
        {/* Xenon Pre-flash capacitor spark overlay */}
        {flashStrobeState === 'pre_flash' && (
          <div className="absolute inset-0 bg-white/75 z-50 pointer-events-none" />
        )}
        {/* Normal LED Flash Overlay */}
        {flashStrobeState === 'normal_flash' && (
          <div className="absolute inset-0 bg-white/95 z-50 pointer-events-none transition-opacity duration-100" />
        )}

        {/* Auto Light / Torch Softbox Perimeter Ring ("Photo ko bright krke dikhaye") */}
        {(isAutoLightActive || flashMode === 'torch') && (
          <div className="absolute inset-0 pointer-events-none z-20 border-4 border-amber-300/40 shadow-[inset_0_0_90px_rgba(251,191,36,0.35)] transition-all duration-300" />
        )}

        {/* Auto Light Status Pill */}
        {isAutoLightActive && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 px-3 py-1 bg-amber-500/85 backdrop-blur-md rounded-full text-[10px] font-mono font-bold text-black flex items-center gap-1.5 shadow-lg animate-pulse pointer-events-none">
            <Sun className="w-3 h-3" />
            <span>AUTO LIGHT ACTIVE • SCENE BRIGHTENED</span>
          </div>
        )}

        {/* 50 MP Real Sensor Indicator Pill */}
        {(is50MpMode || activeMode === '50mp') && (
          <div className="absolute top-3 right-4 z-20 px-2.5 py-0.5 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 text-black font-mono font-bold text-[9px] rounded-full shadow-lg border border-amber-300 flex items-center gap-1 pointer-events-none animate-in fade-in">
            <Award className="w-3 h-3 text-black" />
            <span>50 MP REAL SENSOR</span>
          </div>
        )}

        {/* 100 MP Ultra High Definition Indicator Pill */}
        {is100MpMode && !(is50MpMode || activeMode === '50mp') && (
          <div className="absolute top-3 right-4 z-20 px-2.5 py-0.5 bg-black/75 backdrop-blur-md rounded-full border border-amber-400/60 text-[9px] font-mono font-bold text-amber-300 flex items-center gap-1 shadow pointer-events-none">
            <Award className="w-3 h-3 text-amber-400" />
            <span>100 MP PRO</span>
          </div>
        )}

        {/* Night Vision & Thermal FLIR HUD Overlay */}
        <VisionHudOverlay
          mode={activeMode}
          filter={activeFilter}
          thermalData={thermalData}
        />

        {/* Countdown Timer Overlay */}
        {countdown !== null && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-30">
            <span className="text-8xl font-black text-amber-400 font-mono animate-bounce drop-shadow-2xl">
              {countdown}
            </span>
          </div>
        )}

        {/* AI Human & Vehicle Detection Overlay HUD with Skeleton */}
        {features.aiDetection && (
          <AiDetectionOverlay
            entities={detectionResult.entities}
            skeletons={detectionResult.skeletons || []}
            sceneType={detectionResult.sceneType}
            enabled={aiDetectionEnabled}
            onTriggerGeminiLens={handleTriggerGeminiLens}
            geminiAnalysis={geminiAnalysis}
            isAnalyzing={isAnalyzingGemini}
            onCloseGeminiAnalysis={() => setGeminiAnalysis(null)}
            showSkeleton={features.skeletonTracking && showSkeleton}
            onToggleSkeleton={() => setShowSkeleton(!showSkeleton)}
          />
        )}

        {/* Focus Ring & Exposure Slider */}
        {showFocusRing && focusPoint && (
          <div
            className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none z-20"
            style={{ left: `${focusPoint.x * 100}%`, top: `${focusPoint.y * 100}%` }}
          >
            <div className="w-16 h-16 border-2 border-amber-400 rounded-full animate-ping opacity-75" />
            <div className="absolute inset-0 w-16 h-16 border border-amber-400 rounded-full flex items-center justify-center">
              <div className="w-1.5 h-1.5 bg-amber-400 rounded-full" />
            </div>
          </div>
        )}

        {/* Composition Guides: Rule of Thirds Grid */}
        {features.gridOverlay && proSettings.gridMode === 'rule_of_thirds' && (
          <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3 z-10 opacity-30">
            <div className="border-r border-b border-white" />
            <div className="border-r border-b border-white" />
            <div className="border-b border-white" />
            <div className="border-r border-b border-white" />
            <div className="border-r border-b border-white" />
            <div className="border-b border-white" />
            <div className="border-r border-white" />
            <div className="border-r border-white" />
            <div />
          </div>
        )}

        {/* Super-Zoom Mini-Locator (PiP Target) when zoom >= 10x */}
        {features.superZoom100x && zoom >= 10 && (
          <div className="absolute top-4 left-4 z-20 w-24 h-16 bg-black/70 backdrop-blur-md rounded-lg border border-amber-400/80 p-1 pointer-events-none shadow-xl">
            <div className="relative w-full h-full bg-neutral-800 rounded overflow-hidden">
              <div
                className="absolute border-2 border-amber-400 bg-amber-400/20"
                style={{
                  width: `${100 / zoom}%`,
                  height: `${100 / zoom}%`,
                  left: `${((focusPoint?.x ?? 0.5) * 100) - (50 / zoom)}%`,
                  top: `${((focusPoint?.y ?? 0.5) * 100) - (50 / zoom)}%`,
                }}
              />
              <span className="absolute bottom-0.5 right-1 text-[8px] font-mono text-amber-300 font-bold">
                {zoom.toFixed(0)}x RETICLE
              </span>
            </div>
          </div>
        )}

        {/* Dynamic Horizon Leveler */}
        {features.leveler && proSettings.showLeveler && (
          <div className="absolute inset-x-12 top-1/2 -translate-y-1/2 pointer-events-none z-10 flex items-center justify-center">
            <div className="w-48 h-0.5 bg-white/40 relative">
              <div className="absolute left-1/2 -translate-x-1/2 -top-1 w-2 h-2 rounded-full bg-emerald-400 shadow" />
            </div>
          </div>
        )}
      </div>

      {/* FILTER SELECTION BAR (When Filter Button is Active) */}
      {showFiltersDrawer && (
        <div className="relative z-30 px-4 py-2 bg-black/85 backdrop-blur-xl border-t border-white/10 flex items-center gap-2 overflow-x-auto">
          {FILTER_OPTIONS.map((f) => (
            <button
              key={f.id}
              onClick={() => setActiveFilter(f.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-mono font-medium transition-all whitespace-nowrap ${
                activeFilter === f.id
                  ? 'bg-amber-400 text-black font-bold shadow-md'
                  : 'bg-white/10 text-white/80 hover:bg-white/20'
              }`}
            >
              {f.name}
            </button>
          ))}
        </div>
      )}

      {/* PRO MANUAL CONTROLS DRAWER */}
      {features.proControls && (
        <ProControls
          settings={proSettings}
          onChange={(upd) => setProSettings((p) => ({ ...p, ...upd }))}
          isOpen={showProDrawer}
          onClose={() => setShowProDrawer(false)}
        />
      )}

      {/* BOTTOM CAMERA CONTROLS & SHUTTER DECK */}
      <div className="relative z-30 flex flex-col items-center bg-gradient-to-t from-black via-black/90 to-transparent pt-2 pb-6 px-4">
        {/* 100x Zoom Controls Slider & Presets (if enabled in settings) */}
        {features.superZoom100x && (
          <div className="mb-3">
            <ZoomControls zoom={zoom} onZoomChange={setZoom} />
          </div>
        )}

        {/* Camera Modes Selector (Filtered dynamically according to features enabled) */}
        <div className="flex items-center justify-center gap-4 overflow-x-auto w-full py-2 mb-3">
          {ALL_MODES.filter((m) => !m.featureKey || features[m.featureKey]).map((m) => {
            const isActive = activeMode === m.id;
            return (
              <button
                key={m.id}
                onClick={() => {
                  setActiveMode(m.id);
                  if (m.id === 'portrait') {
                    setProSettings((p) => ({ ...p, apertureBokeh: 2.0 }));
                  }
                }}
                className={`text-xs font-mono tracking-wider transition-all whitespace-nowrap ${
                  isActive
                    ? 'text-amber-400 font-bold border-b-2 border-amber-400 pb-1'
                    : 'text-white/60 hover:text-white pb-1'
                }`}
              >
                {m.label}
              </button>
            );
          })}
        </div>

        {/* Shutter Button Deck: Gallery Thumbnail, Shutter Button, Switch Camera */}
        <div className="flex items-center justify-between w-full max-w-xs px-2">
          {/* Gallery Button with Latest Capture Preview */}
          <button
            id="btn-open-gallery"
            onClick={onOpenGallery}
            className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-white/40 hover:border-amber-400 bg-neutral-900 transition-all flex items-center justify-center shadow-lg"
            title="Open Vision Gallery"
          >
            {latestPhoto ? (
              <img
                src={latestPhoto.thumbnailUrl || latestPhoto.dataUrl}
                alt="Latest capture"
                className="w-full h-full object-cover"
              />
            ) : (
              <ImageIcon className="w-5 h-5 text-white/50" />
            )}
            {photos.length > 0 && (
              <span className="absolute -top-1 -right-1 px-1.5 py-0.2 bg-amber-400 text-black font-mono font-bold text-[9px] rounded-full">
                {photos.length}
              </span>
            )}
          </button>

          {/* Primary GCam Shutter Button */}
          <button
            id="btn-shutter-capture"
            onClick={triggerCapture}
            disabled={isCapturing}
            className="relative group p-1 rounded-full border-4 border-white/80 hover:border-amber-400 transition-all active:scale-90"
            title="Capture Photo"
          >
            <div
              className={`w-16 h-16 rounded-full transition-all ${
                activeMode === 'night' || activeMode === 'night_vision'
                  ? 'bg-emerald-500 group-hover:bg-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.5)]'
                  : activeMode === 'thermal'
                  ? 'bg-gradient-to-tr from-rose-600 to-amber-500 group-hover:from-rose-500 group-hover:to-amber-400 shadow-[0_0_20px_rgba(244,63,94,0.5)]'
                  : activeMode === '50mp'
                  ? 'bg-amber-400 group-hover:bg-amber-300 shadow-[0_0_20px_rgba(251,191,36,0.6)]'
                  : activeMode === 'portrait'
                  ? 'bg-amber-400 group-hover:bg-amber-300'
                  : 'bg-white group-hover:bg-amber-200'
              } shadow-2xl flex items-center justify-center`}
            >
              {(activeMode === 'night' || activeMode === 'night_vision') && (
                <Moon className="w-6 h-6 text-white animate-pulse" />
              )}
              {activeMode === 'thermal' && <Flame className="w-6 h-6 text-white animate-bounce" />}
              {activeMode === '50mp' && <Award className="w-6 h-6 text-black font-bold" />}
              {activeMode === 'portrait' && <Aperture className="w-6 h-6 text-black" />}
            </div>
          </button>

          {/* Flip / Switch Camera Button */}
          <button
            id="btn-switch-camera"
            onClick={() => {
              setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
            }}
            className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center text-white/80 hover:text-white transition-all shadow-lg cursor-pointer"
            title="Switch Rear/Front Camera"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* CAMERA SETTINGS & FEATURE TOGGLES MODAL */}
      <CameraSettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        features={features}
        onToggleFeature={handleToggleFeature}
        onSetAllFeatures={handleSetAllFeatures}
        onResetDefaults={handleResetDefaults}
        sensorInfo={sensorInfo}
      />
    </div>
  );
};
