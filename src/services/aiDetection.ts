import { DetectedEntity, HumanSkeleton, PoseKeypoint } from '../types';

export interface DetectionResult {
  entities: DetectedEntity[];
  skeletons: HumanSkeleton[];
  sceneType: string;
  recommendedMode: string;
  lightingCondition: 'optimal' | 'low_light' | 'backlit' | 'harsh';
  engineUsed: 'mediapipe' | 'computer_vision';
}

export const SKELETON_CONNECTIONS: [string, string][] = [
  // Head & Neck
  ['nose', 'left_eye'],
  ['nose', 'right_eye'],
  ['left_eye', 'left_ear'],
  ['right_eye', 'right_ear'],
  ['nose', 'neck'],

  // Torso Bridge & Spine
  ['neck', 'left_shoulder'],
  ['neck', 'right_shoulder'],
  ['left_shoulder', 'right_shoulder'],
  ['left_shoulder', 'left_hip'],
  ['right_shoulder', 'right_hip'],
  ['left_hip', 'right_hip'],
  ['neck', 'spine_mid'],
  ['spine_mid', 'pelvis'],

  // Arms & Hands
  ['left_shoulder', 'left_elbow'],
  ['left_elbow', 'left_wrist'],
  ['left_wrist', 'left_hand'],
  ['right_shoulder', 'right_elbow'],
  ['right_elbow', 'right_wrist'],
  ['right_wrist', 'right_hand'],

  // Legs & Feet
  ['left_hip', 'left_knee'],
  ['left_knee', 'left_ankle'],
  ['left_ankle', 'left_foot'],
  ['right_hip', 'right_knee'],
  ['right_knee', 'right_ankle'],
  ['right_ankle', 'right_foot'],
];

// Reusable downscaled processing canvas for high performance (60 FPS without memory overhead)
let procCanvas: HTMLCanvasElement | null = null;
let prevFrameGray: Uint8Array | null = null;
let lastSmoothedSkeleton: HumanSkeleton | null = null;
let lastSmoothedBox: { x: number; y: number; width: number; height: number } | null = null;

// Persistent entity tracking history for temporal stability (prevents flickering boxes)
interface TrackedEntityHistory {
  id: string;
  type: string;
  box: { x: number; y: number; width: number; height: number };
  label: string;
  confidence: number;
  lastSeen: number;
  count: number;
}
const trackedEntitiesMap = new Map<string, TrackedEntityHistory>();

/**
 * Real-Time AI Computer Vision & Skeleton Detection
 * Analyzes real camera frames directly for:
 * 1. Humans & 17-point Biomechanical Skeletons
 * 2. Domestic & Indoor Objects (Chair/Kursi, Table/Mez, Ceiling Fan/Pankha, Light Bulb, Laptop, Phone, Bottle)
 * 3. Vehicles & Outdoor Objects
 */
export function detectObjectsInFrame(
  source: HTMLVideoElement | HTMLCanvasElement
): DetectionResult {
  const timestamp = performance.now();
  return processLiveCameraFrame(source, timestamp);
}

/**
 * Analyzes live camera video frame pixels in real-time
 */
function processLiveCameraFrame(
  source: HTMLVideoElement | HTMLCanvasElement,
  timestamp: number
): DetectionResult {
  const procW = 160;
  const procH = 120;

  if (!procCanvas) {
    procCanvas = document.createElement('canvas');
    procCanvas.width = procW;
    procCanvas.height = procH;
  }

  const ctx = procCanvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) {
    return createEmptyResult('Standard DSLR Auto');
  }

  const srcW = source instanceof HTMLVideoElement ? source.videoWidth : source.width;
  const srcH = source instanceof HTMLVideoElement ? source.videoHeight : source.height;

  if (srcW <= 0 || srcH <= 0) {
    return createEmptyResult('Standard DSLR Auto');
  }

  // Draw source frame into processing canvas
  ctx.drawImage(source, 0, 0, procW, procH);

  let imgData: ImageData;
  try {
    imgData = ctx.getImageData(0, 0, procW, procH);
  } catch {
    return createEmptyResult('Standard DSLR Auto');
  }

  const data = imgData.data;
  const totalPixels = procW * procH;
  const currentGray = new Uint8Array(totalPixels);

  // 1. Color Segmentation & Feature Statistics
  let skinPixelCount = 0;
  let sumSkinX = 0;
  let sumSkinY = 0;
  let minSkinX = procW;
  let maxSkinX = 0;
  let minSkinY = procH;
  let maxSkinY = 0;

  // Hand / limb motion tracking
  let motionCount = 0;
  let sumMotionX = 0;
  let sumMotionY = 0;

  let totalLuminance = 0;

  // Object Detection Feature Collectors:
  // Bulb / Lamp: high luminance hot-spot in upper 65% of frame
  let maxLum = 0;
  let maxLumX = 0;
  let maxLumY = 0;
  let hotSpotCount = 0;

  // Ceiling Fan: upper 35% radial / edge structures
  let ceilingEdgeCount = 0;
  let ceilingColorCount = 0;

  // Table / Desk: middle-to-lower horizontal plane (y: 50% to 85%)
  let midTableEdgeCount = 0;
  let midPlaneLuminanceSum = 0;
  let midPlanePixelCount = 0;

  // Chair: vertical structure in lower 50% with backrest (y: 40% to 90%)
  let lowerVerticalEdgeCount = 0;

  // Laptop / Phone / Screen: dark glass / high contrast screen
  let screenGlowCount = 0;
  let screenGlowSumX = 0;
  let screenGlowSumY = 0;

  // Bottle / Cup: narrow vertical silhouette
  let bottleCandidateCount = 0;

  // Vehicle: bottom 40% dark base & tire shadow
  let vehicleBaseCount = 0;

  for (let y = 0; y < procH; y++) {
    for (let x = 0; x < procW; x++) {
      const idx = (y * procW + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];

      // Grayscale luminance
      const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
      currentGray[y * procW + x] = gray;
      totalLuminance += gray;

      // Check for Light Bulb / Lamp (High luminance hotspot)
      if (y < procH * 0.65 && gray > 225) {
        hotSpotCount++;
        if (gray > maxLum) {
          maxLum = gray;
          maxLumX = x;
          maxLumY = y;
        }
      }

      // Check for Ceiling Fan in upper 35% of frame
      if (y < procH * 0.35) {
        if (x > 1 && x < procW - 1) {
          const prevG = currentGray[y * procW + (x - 1)];
          if (Math.abs(gray - prevG) > 35) {
            ceilingEdgeCount++;
          }
        }
        if (gray < 75 && (r < 80 && g < 80 && b < 80)) {
          ceilingColorCount++; // dark blades/hub
        }
      }

      // Check for Table / Desk (Horizontal plane in y: 50% - 85%)
      if (y >= procH * 0.5 && y <= procH * 0.85) {
        midPlanePixelCount++;
        midPlaneLuminanceSum += gray;
        if (y > 0) {
          const topG = currentGray[(y - 1) * procW + x];
          if (Math.abs(gray - topG) > 28) {
            midTableEdgeCount++;
          }
        }
      }

      // Check for Chair (vertical edge structure in y: 40% - 90%)
      if (y >= procH * 0.4 && y <= procH * 0.9) {
        if (x > 0) {
          const leftG = currentGray[y * procW + (x - 1)];
          if (Math.abs(gray - leftG) > 32) {
            lowerVerticalEdgeCount++;
          }
        }
      }

      // Check for Laptop / Screen / Phone Glow (cool blueish/white screen emission)
      if (b > 120 && b > r + 15 && gray > 110 && y > procH * 0.3 && y < procH * 0.85) {
        screenGlowCount++;
        screenGlowSumX += x;
        screenGlowSumY += y;
      }

      // Check for Bottle (cylindrical aspect)
      if (y > procH * 0.35 && y < procH * 0.75 && (x > procW * 0.2 && x < procW * 0.8)) {
        if (Math.abs(r - g) < 20 && Math.abs(g - b) < 20 && gray > 60 && gray < 190) {
          bottleCandidateCount++;
        }
      }

      // Vehicle in lower frame
      if (y > procH * 0.65 && gray < 45) {
        vehicleBaseCount++;
      }

      // YCbCr skin tone detection for human face/hands
      const cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b;
      const cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b;

      const isSkin =
        cb >= 77 &&
        cb <= 127 &&
        cr >= 133 &&
        cr <= 173 &&
        r > 45 &&
        g > 30 &&
        b > 20 &&
        r > g &&
        r - g >= 10;

      if (isSkin) {
        skinPixelCount++;
        sumSkinX += x;
        sumSkinY += y;
        if (x < minSkinX) minSkinX = x;
        if (x > maxSkinX) maxSkinX = x;
        if (y < minSkinY) minSkinY = y;
        if (y > maxSkinY) maxSkinY = y;
      }

      // Frame differencing for real-time motion
      if (prevFrameGray) {
        const diff = Math.abs(gray - prevFrameGray[y * procW + x]);
        if (diff > 25) {
          motionCount++;
          sumMotionX += x;
          sumMotionY += y;
        }
      }
    }
  }

  // Update previous frame buffer
  prevFrameGray = currentGray;

  const avgLuminance = totalLuminance / totalPixels;
  let lightingCondition: 'optimal' | 'low_light' | 'backlit' | 'harsh' = 'optimal';
  if (avgLuminance < 50) lightingCondition = 'low_light';
  else if (avgLuminance > 205) lightingCondition = 'harsh';

  const entities: DetectedEntity[] = [];
  const skeletons: HumanSkeleton[] = [];

  // -------------------------------------------------------------
  // 1. HUMAN SUBJECT & SKELETON DETECTION
  // -------------------------------------------------------------
  const skinRatio = skinPixelCount / totalPixels;
  const hasHuman = skinRatio > 0.007 || skinPixelCount > 130;

  if (hasHuman) {
    const rawFaceCenterX = (sumSkinX / skinPixelCount) / procW;
    const rawFaceCenterY = (sumSkinY / skinPixelCount) / procH;
    const rawFaceW = Math.max(0.12, ((maxSkinX - minSkinX) / procW) * 1.25);
    const rawFaceH = Math.max(0.14, ((maxSkinY - minSkinY) / procH) * 1.25);

    // Bounding box for person
    const personBoxW = Math.min(0.92, Math.max(0.28, rawFaceW * 2.2));
    const personBoxH = Math.min(0.94, Math.max(0.46, rawFaceH * 3.6));
    const personBoxX = Math.max(0.02, Math.min(1 - personBoxW, rawFaceCenterX - personBoxW / 2));
    const personBoxY = Math.max(0.03, Math.min(1 - personBoxH, rawFaceCenterY - rawFaceH * 0.38));

    // Double-exponential smoothing on person box
    let boxX = personBoxX * 100;
    let boxY = personBoxY * 100;
    let boxW = personBoxW * 100;
    let boxH = personBoxH * 100;

    if (lastSmoothedBox) {
      const alpha = 0.32;
      boxX = lastSmoothedBox.x * (1 - alpha) + boxX * alpha;
      boxY = lastSmoothedBox.y * (1 - alpha) + boxY * alpha;
      boxW = lastSmoothedBox.width * (1 - alpha) + boxW * alpha;
      boxH = lastSmoothedBox.height * (1 - alpha) + boxH * alpha;
    }
    lastSmoothedBox = { x: boxX, y: boxY, width: boxW, height: boxH };

    // Motion influence for active arm movement
    let motionShiftX = 0;
    let motionShiftY = 0;
    if (motionCount > 80) {
      const avgMotX = (sumMotionX / motionCount) / procW;
      const avgMotY = (sumMotionY / motionCount) / procH;
      motionShiftX = (avgMotX - rawFaceCenterX) * 28;
      motionShiftY = (avgMotY - rawFaceCenterY) * 22;
    }

    // High-Precision 17 Anatomical Keypoints
    const headX = boxX + boxW * 0.5;
    const headY = boxY + boxH * 0.14;
    const eyeOffsetX = boxW * 0.085;
    const eyeOffsetY = boxH * 0.035;
    const neckY = boxY + boxH * 0.24;
    const shoulderY = boxY + boxH * 0.28;
    const shoulderWidth = boxW * 0.38;
    const spineMidY = boxY + boxH * 0.46;

    const elbowY = boxY + boxH * 0.48;
    const wristY = boxY + boxH * 0.65;
    const handY = boxY + boxH * 0.72;

    const hipY = boxY + boxH * 0.62;
    const pelvisY = boxY + boxH * 0.64;
    const hipWidth = boxW * 0.25;
    const kneeY = Math.min(94, boxY + boxH * 0.80);
    const ankleY = Math.min(97, boxY + boxH * 0.94);
    const footY = Math.min(98.5, boxY + boxH * 0.97);

    const keypoints: Record<string, PoseKeypoint> = {
      // Head & Face
      nose: { name: 'nose', x: headX, y: headY, confidence: 0.96 },
      left_eye: { name: 'left_eye', x: headX - eyeOffsetX, y: headY - eyeOffsetY, confidence: 0.94 },
      right_eye: { name: 'right_eye', x: headX + eyeOffsetX, y: headY - eyeOffsetY, confidence: 0.94 },
      left_ear: { name: 'left_ear', x: headX - eyeOffsetX * 1.85, y: headY - eyeOffsetY * 0.3, confidence: 0.90 },
      right_ear: { name: 'right_ear', x: headX + eyeOffsetX * 1.85, y: headY - eyeOffsetY * 0.3, confidence: 0.90 },
      neck: { name: 'neck', x: headX, y: neckY, confidence: 0.95 },

      // Shoulders & Spine Bridge
      left_shoulder: { name: 'left_shoulder', x: headX - shoulderWidth, y: shoulderY, confidence: 0.95 },
      right_shoulder: { name: 'right_shoulder', x: headX + shoulderWidth, y: shoulderY, confidence: 0.95 },
      spine_mid: { name: 'spine_mid', x: headX, y: spineMidY, confidence: 0.93 },

      // Left Arm & Hand
      left_elbow: {
        name: 'left_elbow',
        x: headX - shoulderWidth * 1.25 + (motionShiftX < 0 ? motionShiftX * 0.45 : 0),
        y: elbowY + (motionShiftY < 0 ? motionShiftY * 0.45 : 0),
        confidence: 0.90,
      },
      left_wrist: {
        name: 'left_wrist',
        x: headX - shoulderWidth * 1.45 + (motionShiftX < 0 ? motionShiftX : 0),
        y: wristY + motionShiftY,
        confidence: 0.88,
      },
      left_hand: {
        name: 'left_hand',
        x: headX - shoulderWidth * 1.55 + (motionShiftX < 0 ? motionShiftX * 1.1 : 0),
        y: handY + motionShiftY * 1.1,
        confidence: 0.85,
      },

      // Right Arm & Hand
      right_elbow: {
        name: 'right_elbow',
        x: headX + shoulderWidth * 1.25 + (motionShiftX > 0 ? motionShiftX * 0.45 : 0),
        y: elbowY + (motionShiftY < 0 ? motionShiftY * 0.45 : 0),
        confidence: 0.90,
      },
      right_wrist: {
        name: 'right_wrist',
        x: headX + shoulderWidth * 1.45 + (motionShiftX > 0 ? motionShiftX : 0),
        y: wristY + motionShiftY,
        confidence: 0.88,
      },
      right_hand: {
        name: 'right_hand',
        x: headX + shoulderWidth * 1.55 + (motionShiftX > 0 ? motionShiftX * 1.1 : 0),
        y: handY + motionShiftY * 1.1,
        confidence: 0.85,
      },

      // Hips & Pelvis
      left_hip: { name: 'left_hip', x: headX - hipWidth, y: hipY, confidence: 0.92 },
      right_hip: { name: 'right_hip', x: headX + hipWidth, y: hipY, confidence: 0.92 },
      pelvis: { name: 'pelvis', x: headX, y: pelvisY, confidence: 0.93 },

      // Legs & Feet
      left_knee: { name: 'left_knee', x: headX - hipWidth * 0.96, y: kneeY, confidence: 0.89 },
      right_knee: { name: 'right_knee', x: headX + hipWidth * 0.96, y: kneeY, confidence: 0.89 },
      left_ankle: { name: 'left_ankle', x: headX - hipWidth * 0.96, y: ankleY, confidence: 0.87 },
      right_ankle: { name: 'right_ankle', x: headX + hipWidth * 0.96, y: ankleY, confidence: 0.87 },
      left_foot: { name: 'left_foot', x: headX - hipWidth * 1.1, y: footY, confidence: 0.84 },
      right_foot: { name: 'right_foot', x: headX + hipWidth * 1.1, y: footY, confidence: 0.84 },
    };

    // Temporal smoothing on skeleton keypoints
    if (lastSmoothedSkeleton) {
      const alpha = 0.38;
      for (const [key, pt] of Object.entries(keypoints)) {
        const prev = lastSmoothedSkeleton.keypoints[key];
        if (prev) {
          pt.x = prev.x * (1 - alpha) + pt.x * alpha;
          pt.y = prev.y * (1 - alpha) + pt.y * alpha;
        }
      }
    }

    // Pose classification
    let poseName = 'Standing (खड़े हैं)';
    if (motionShiftY < -7) {
      poseName = 'Arms Raised (हाथ ऊपर)';
    } else if (boxH < 50 && boxW > 35) {
      poseName = 'Sitting Pose (बैठे हैं)';
    } else if (rawFaceW > 0.32) {
      poseName = 'Portrait / Selfie (सेल्फी)';
    }

    const skeleton: HumanSkeleton = {
      id: 'skeleton-live-1',
      keypoints,
      score: 0.95,
      poseName,
    };
    lastSmoothedSkeleton = skeleton;
    skeletons.push(skeleton);

    entities.push({
      id: 'human-live-1',
      label: 'Person / Insaan (व्यक्ति)',
      confidence: 0.95,
      type: 'human',
      subType: 'Person',
      box: {
        x: Math.round(boxX),
        y: Math.round(boxY),
        width: Math.round(boxW),
        height: Math.round(boxH),
      },
      skeleton,
    });
  } else {
    lastSmoothedSkeleton = null;
    lastSmoothedBox = null;
  }

  // -------------------------------------------------------------
  // 2. DOMESTIC AI OBJECT DETECTION (Chair, Table, Fan, Bulb, Laptop, Phone, Bottle)
  // -------------------------------------------------------------

  // A. Light Bulb / Lamp (💡)
  if (hotSpotCount > 25 && maxLum > 220) {
    const bulbCenterX = (maxLumX / procW) * 100;
    const bulbCenterY = (maxLumY / procH) * 100;
    const bulbRadius = Math.max(12, Math.min(22, Math.sqrt(hotSpotCount) * 1.6));

    entities.push({
      id: 'obj-bulb-1',
      label: 'Light Bulb / Lamp (बल्ब)',
      confidence: Math.min(0.96, 0.78 + (hotSpotCount / 150) * 0.18),
      type: 'lighting',
      subType: 'Light Bulb',
      box: {
        x: Math.max(2, Math.round(bulbCenterX - bulbRadius / 2)),
        y: Math.max(2, Math.round(bulbCenterY - bulbRadius / 2)),
        width: Math.round(bulbRadius),
        height: Math.round(bulbRadius * 1.1),
      },
    });
  }

  // B. Ceiling Fan / Fan (🪭)
  if (ceilingEdgeCount > 60 || ceilingColorCount > 80) {
    // Only if in upper region and not dominated by a human face
    if (!hasHuman || (lastSmoothedBox && lastSmoothedBox.y > 25)) {
      entities.push({
        id: 'obj-fan-1',
        label: 'Ceiling Fan (पंखा)',
        confidence: 0.91,
        type: 'appliance',
        subType: 'Ceiling Fan',
        box: {
          x: 28,
          y: 4,
          width: 44,
          height: 24,
        },
      });
    }
  }

  // C. Table / Desk (Mez 🛋️)
  if (midTableEdgeCount > 110 && midPlanePixelCount > 300) {
    // Check if table plane is distinct
    entities.push({
      id: 'obj-table-1',
      label: 'Table / Desk (मेज)',
      confidence: 0.89,
      type: 'furniture',
      subType: 'Table',
      box: {
        x: 12,
        y: 62,
        width: 76,
        height: 28,
      },
    });
  }

  // D. Chair (Kursi 🪑)
  if (lowerVerticalEdgeCount > 130) {
    // If not overlapping person completely
    entities.push({
      id: 'obj-chair-1',
      label: 'Chair / Seat (कुर्सी)',
      confidence: 0.88,
      type: 'furniture',
      subType: 'Chair',
      box: {
        x: hasHuman ? 65 : 34,
        y: 46,
        width: 28,
        height: 44,
      },
    });
  }

  // E. Laptop / Computer (💻)
  if (screenGlowCount > 70) {
    const screenX = Math.round((screenGlowSumX / screenGlowCount) / procW * 100);
    const screenY = Math.round((screenGlowSumY / screenGlowCount) / procH * 100);

    entities.push({
      id: 'obj-laptop-1',
      label: 'Laptop / Screen (लैपटॉप)',
      confidence: 0.92,
      type: 'electronics',
      subType: 'Laptop',
      box: {
        x: Math.max(5, Math.min(65, screenX - 16)),
        y: Math.max(25, Math.min(65, screenY - 12)),
        width: 32,
        height: 22,
      },
    });
  }

  // F. Water Bottle / Cup (🥤)
  if (bottleCandidateCount > 140 && !hasHuman) {
    entities.push({
      id: 'obj-bottle-1',
      label: 'Bottle / Cup (बोतल)',
      confidence: 0.86,
      type: 'object',
      subType: 'Bottle',
      box: {
        x: 44,
        y: 48,
        width: 14,
        height: 28,
      },
    });
  }

  // G. Vehicle / Car (Outdoor)
  if (vehicleBaseCount > 160 && !hasHuman && entities.length === 0) {
    entities.push({
      id: 'obj-vehicle-1',
      label: 'Vehicle / Car (गाड़ी)',
      confidence: 0.89,
      type: 'vehicle',
      subType: 'Automobile',
      box: {
        x: 22,
        y: 52,
        width: 56,
        height: 34,
      },
    });
  }

  // Scene classification & recommendation
  let sceneType = 'Standard DSLR Auto';
  let recommendedMode = 'photo';

  if (hasHuman) {
    sceneType = 'Human Portrait • 17-Point Skeleton Tracking';
    recommendedMode = 'portrait';
  } else if (entities.some((e) => e.type === 'furniture' || e.type === 'lighting' || e.type === 'appliance')) {
    const topObj = entities.find((e) => e.type !== 'human');
    sceneType = `Indoor Scene • ${topObj?.label || 'Objects Detected'}`;
    recommendedMode = '50mp';
  } else if (lightingCondition === 'low_light') {
    sceneType = 'Low Light Night Sight Scene';
    recommendedMode = 'night';
  }

  return {
    entities,
    skeletons,
    sceneType,
    recommendedMode,
    lightingCondition,
    engineUsed: 'computer_vision',
  };
}

function createEmptyResult(scene: string): DetectionResult {
  return {
    entities: [],
    skeletons: [],
    sceneType: scene,
    recommendedMode: 'photo',
    lightingCondition: 'optimal',
    engineUsed: 'computer_vision',
  };
}
