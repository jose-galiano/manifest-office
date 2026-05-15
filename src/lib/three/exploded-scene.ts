// Builds the exploded-latch + kit-system scene used by
// `ExplodedLatchViewer`. Kept as a plain factory so the React component
// stays focused on lifecycle, rAF, IO, and DOM-label DOM work.
//
// Provenance: ported from `deploy/pdp.html` lines 2084-2351 (the legacy
// IIFE). Constants, materials, geometry sizes, and assembled/exploded XYZ
// tuples preserved verbatim — visual changes here will drift from the
// design reference.

import * as THREE from 'three';

import type { KitItemSpec, PartMetadata, Vec3Tuple } from './types';

// --- Palette (mirrors design tokens in `globals.css`) ---------------------
const COLOR_BODY = 0x2c2a28; // graphite anodized housing
const COLOR_LEVER = 0xd24a1f; // signal orange
const COLOR_HOOK = 0xa6a6a6; // silver machined hardware
const COLOR_MAGNET = 0x1a1a1a; // sealed magnet face
const COLOR_PLATE = 0x2a2e2d; // anodized pass-through plate
const COLOR_PAPER = 0xf2efe8; // paper-on-ink rim light
const COLOR_RIM_LIGHT = 0xd24a1f;
const COLOR_FILL_LIGHT = 0xf2efe8;

/**
 * Aggregate handle returned by `buildExplodedScene()`. The component owns
 * disposal via `dispose()`; everything else is read-only state used inside
 * the render loop.
 */
export interface ExplodedSceneHandle {
  readonly scene: THREE.Scene;
  readonly camera: THREE.PerspectiveCamera;
  readonly rootGroup: THREE.Group;
  /** All objects whose userData has `PartMetadata`. Used for tween + labels. */
  readonly labelledParts: readonly THREE.Object3D[];
  /** Disposes every geometry and material this builder created. */
  readonly dispose: () => void;
}

function readPartMetadata(object: THREE.Object3D): PartMetadata | null {
  const data = object.userData as Partial<PartMetadata>;
  if (typeof data.key !== 'string') return null;
  if (typeof data.label !== 'string') return null;
  if (!Array.isArray(data.assembled) || !Array.isArray(data.exploded)) return null;
  return data as PartMetadata;
}

/**
 * Lerps every labelled part between its assembled (t=0) and exploded (t=1)
 * state. The caller passes pre-eased `t`.
 */
export function applyExplodeState(parts: readonly THREE.Object3D[], explodedT: number): void {
  for (const part of parts) {
    const data = readPartMetadata(part);
    if (!data) continue;
    const [ax, ay, az] = data.assembled;
    const [ex, ey, ez] = data.exploded;
    part.position.set(
      ax + (ex - ax) * explodedT,
      ay + (ey - ay) * explodedT,
      az + (ez - az) * explodedT,
    );
  }
}

// --- Lighting --------------------------------------------------------------
function addLights(scene: THREE.Scene): void {
  const ambient = new THREE.AmbientLight(0xffffff, 0.35);
  scene.add(ambient);

  const key = new THREE.DirectionalLight(0xffffff, 1.1);
  key.position.set(6, 8, 6);
  scene.add(key);

  const fill = new THREE.DirectionalLight(COLOR_FILL_LIGHT, 0.4);
  fill.position.set(-4, 2, 4);
  scene.add(fill);

  const rim = new THREE.DirectionalLight(COLOR_RIM_LIGHT, 0.9);
  rim.position.set(-3, -2, -6);
  scene.add(rim);
}

// --- Latch parts (MO-A1) --------------------------------------------------
interface BuiltLatch {
  readonly group: THREE.Group;
  readonly parts: readonly THREE.Object3D[];
  readonly geometries: readonly THREE.BufferGeometry[];
  readonly materials: readonly THREE.Material[];
}

function buildLatch(): BuiltLatch {
  const matBody = new THREE.MeshStandardMaterial({
    color: COLOR_BODY,
    roughness: 0.38,
    metalness: 0.85,
  });
  const matLever = new THREE.MeshStandardMaterial({
    color: COLOR_LEVER,
    roughness: 0.5,
    metalness: 0.65,
  });
  const matHook = new THREE.MeshStandardMaterial({
    color: COLOR_HOOK,
    roughness: 0.32,
    metalness: 0.9,
  });
  const matMagnet = new THREE.MeshStandardMaterial({
    color: COLOR_MAGNET,
    roughness: 0.25,
    metalness: 0.95,
  });
  const matPlate = new THREE.MeshStandardMaterial({
    color: COLOR_PLATE,
    roughness: 0.55,
    metalness: 0.7,
  });
  const matPaper = new THREE.MeshStandardMaterial({
    color: COLOR_PAPER,
    roughness: 0.9,
    metalness: 0,
  });

  const geometries: THREE.BufferGeometry[] = [];
  const materials: THREE.Material[] = [matBody, matLever, matHook, matMagnet, matPlate, matPaper];

  function tagMeta(object: THREE.Object3D, metadata: PartMetadata): void {
    // Three.js types userData as `Record<string, unknown>`; we widen carefully.
    object.userData = { ...metadata };
  }

  // 01 BODY — main housing
  const bodyGeometry = new THREE.BoxGeometry(3.6, 1.4, 1.0);
  geometries.push(bodyGeometry);
  const body = new THREE.Mesh(bodyGeometry, matBody);
  tagMeta(body, {
    key: '01',
    label: 'BODY',
    material: '6061-T6 ALUMINUM',
    assembled: [0, 0, 0],
    exploded: [0, -1.8, 0],
    group: 'latch',
  });

  // 02 LEVER — signal-orange anodized accent
  const leverGeometry = new THREE.BoxGeometry(1.2, 0.4, 0.6);
  geometries.push(leverGeometry);
  const lever = new THREE.Mesh(leverGeometry, matLever);
  tagMeta(lever, {
    key: '02',
    label: 'LEVER',
    material: 'SIGNAL ORANGE ANODIZED',
    assembled: [0.7, 0.85, 0],
    exploded: [1.2, 3.4, 0.6],
    group: 'latch',
  });

  // 03 HOOK — silver machined, L-shape from two boxes
  const hookGroup = new THREE.Group();
  const hookArmGeometry = new THREE.BoxGeometry(0.4, 0.9, 0.6);
  const hookCapGeometry = new THREE.BoxGeometry(0.7, 0.3, 0.6);
  geometries.push(hookArmGeometry, hookCapGeometry);
  const hookArm = new THREE.Mesh(hookArmGeometry, matHook);
  hookArm.position.set(0.2, 0, 0);
  hookGroup.add(hookArm);
  const hookCap = new THREE.Mesh(hookCapGeometry, matHook);
  hookCap.position.set(-0.05, 0.45, 0);
  hookGroup.add(hookCap);
  tagMeta(hookGroup, {
    key: '03',
    label: 'HOOK',
    material: 'SILVER MACHINED · CNC',
    assembled: [1.5, 0, 0],
    exploded: [4.2, 0, 0.4],
    group: 'latch',
  });

  // 04 MAGNET DISC — sealed, brass-rimmed face
  const magnetGeometry = new THREE.CylinderGeometry(0.45, 0.45, 0.22, 32);
  geometries.push(magnetGeometry);
  const magnet = new THREE.Mesh(magnetGeometry, matMagnet);
  magnet.rotation.x = Math.PI / 2;
  tagMeta(magnet, {
    key: '04',
    label: 'MAGNET DISC',
    material: 'N52 NEODYMIUM · SEALED',
    assembled: [-0.9, 0, 0.51],
    exploded: [-3.2, 0.6, 2.2],
    group: 'latch',
  });

  // 05 PASS-THROUGH PLATE — webbing capture
  const plateGeometry = new THREE.BoxGeometry(1.2, 1.4, 0.18);
  geometries.push(plateGeometry);
  const plate = new THREE.Mesh(plateGeometry, matPlate);
  tagMeta(plate, {
    key: '05',
    label: 'WEBBING PLATE',
    material: '6061-T6 ALUMINUM',
    assembled: [-0.9, 0, 0.68],
    exploded: [-3.2, -0.4, 4.2],
    group: 'latch',
  });

  // 06 PIN — stainless pivot
  const pinGeometry = new THREE.CylinderGeometry(0.1, 0.1, 1.0, 16);
  geometries.push(pinGeometry);
  const pin = new THREE.Mesh(pinGeometry, matMagnet);
  pin.rotation.z = Math.PI / 2;
  tagMeta(pin, {
    key: '06',
    label: 'PIN',
    material: 'STAINLESS · PRESSED FIT',
    assembled: [0.7, 0.4, 0],
    exploded: [0.7, 0.4, 3.2],
    group: 'latch',
  });

  // Latches sit inside an inner group so the system reads at a sensible scale.
  const latchGroup = new THREE.Group();
  const parts: THREE.Object3D[] = [body, lever, hookGroup, magnet, plate, pin];
  for (const part of parts) latchGroup.add(part);
  latchGroup.scale.set(0.45, 0.45, 0.45);
  latchGroup.position.set(0, 0, 2);

  // Silence the unused matPaper warning — kept in the material palette so
  // future colourways (e.g., a paper-faced tag detail) can reuse it without
  // a re-export. Stash on the group's userData for disposal tracking.
  void matPaper;

  return {
    group: latchGroup,
    parts,
    geometries,
    materials,
  };
}

// --- Kit items ------------------------------------------------------------
const KIT_ITEM_SPECS: readonly KitItemSpec[] = [
  {
    key: '07',
    label: 'FIELD TOTE',
    material: '420D CORDURA · 14L',
    width: 5.6,
    height: 4.0,
    depth: 1.4,
    assembled: [0, -4.2, -2.8],
    exploded: [0, -8.5, -8.5],
  },
  {
    key: '08',
    label: 'CUBE L',
    material: '2.2L · COMPRESSION',
    width: 4.2,
    height: 1.4,
    depth: 2.6,
    assembled: [-2.5, -1.2, -0.6],
    exploded: [-8.5, -3.2, 3.5],
  },
  {
    key: '09',
    label: 'CUBE M',
    material: '1.4L · COMPRESSION',
    width: 3.4,
    height: 1.2,
    depth: 2.2,
    assembled: [2.5, -1.4, -0.6],
    exploded: [8.5, -3.2, 3.5],
  },
  {
    key: '10',
    label: 'CUBE S',
    material: '0.8L · COMPRESSION',
    width: 2.4,
    height: 1.0,
    depth: 1.6,
    assembled: [0, -2.6, 1.2],
    exploded: [0, -7.0, 6.5],
  },
  {
    key: '11',
    label: 'TECH POUCH M',
    material: '1.4L · 420D CORDURA',
    width: 2.9,
    height: 0.7,
    depth: 2.0,
    assembled: [-1.6, 2.0, 1.5],
    exploded: [-6.5, 5.5, 5.5],
  },
  {
    key: '12',
    label: 'TOILETRY KIT',
    material: 'SEALED · TSA-LEGAL',
    width: 3.0,
    height: 1.0,
    depth: 1.9,
    assembled: [1.6, 2.0, 1.5],
    exploded: [6.5, 5.5, 5.5],
  },
] as const;

interface BuiltKit {
  readonly parts: readonly THREE.Object3D[];
  readonly geometries: readonly THREE.BufferGeometry[];
  readonly materials: readonly THREE.Material[];
}

function buildKit(): BuiltKit {
  const matBag = new THREE.MeshStandardMaterial({
    color: COLOR_BODY,
    roughness: 0.78,
    metalness: 0.05,
  });
  const matAccent = new THREE.MeshStandardMaterial({
    color: COLOR_LEVER,
    roughness: 0.5,
    metalness: 0.3,
  });
  const matMetal = new THREE.MeshStandardMaterial({
    color: COLOR_HOOK,
    roughness: 0.32,
    metalness: 0.9,
  });

  const geometries: THREE.BufferGeometry[] = [];
  const materials: THREE.Material[] = [matBag, matAccent, matMetal];
  const parts: THREE.Object3D[] = [];

  for (const spec of KIT_ITEM_SPECS) {
    const item = new THREE.Group();
    const bodyGeometry = new THREE.BoxGeometry(spec.width, spec.height, spec.depth);
    geometries.push(bodyGeometry);
    const body = new THREE.Mesh(bodyGeometry, matBag);
    item.add(body);

    // Signal-orange tab on the front face — the brand cue that ties every
    // kit item back to the latch system.
    const tabGeometry = new THREE.BoxGeometry(spec.width * 0.18, spec.height * 0.32, 0.08);
    geometries.push(tabGeometry);
    const tab = new THREE.Mesh(tabGeometry, matAccent);
    tab.position.set(spec.width * 0.35, 0, spec.depth / 2 + 0.04);
    item.add(tab);

    const metadata: PartMetadata = {
      key: spec.key,
      label: spec.label,
      material: spec.material,
      assembled: spec.assembled,
      exploded: spec.exploded,
      group: 'kit',
    };
    item.userData = { ...metadata };
    parts.push(item);
  }

  // 13 LUGGAGE TAG — separate group because it has the paracord loop.
  const tag = new THREE.Group();
  const tagBodyGeometry = new THREE.BoxGeometry(0.9, 1.4, 0.08);
  const tagLoopGeometry = new THREE.TorusGeometry(0.18, 0.04, 8, 16);
  geometries.push(tagBodyGeometry, tagLoopGeometry);
  const tagBody = new THREE.Mesh(tagBodyGeometry, matMetal);
  tag.add(tagBody);
  const tagLoop = new THREE.Mesh(tagLoopGeometry, matAccent);
  tagLoop.position.set(0, 0.85, 0);
  tagLoop.rotation.x = Math.PI / 2;
  tag.add(tagLoop);
  const tagMetadata: PartMetadata = {
    key: '13',
    label: 'LUGGAGE TAG',
    material: 'ANODIZED AL · ETCHED',
    assembled: [3.6, -2.8, 1.6],
    exploded: [9.0, -6.0, 6.5],
    group: 'kit',
  };
  tag.userData = { ...tagMetadata };
  parts.push(tag);

  return { parts, geometries, materials };
}

// --- Public builder -------------------------------------------------------
export function buildExplodedScene(aspect: number): ExplodedSceneHandle {
  const scene = new THREE.Scene();
  addLights(scene);

  const camera = new THREE.PerspectiveCamera(35, aspect, 0.1, 200);
  camera.position.set(0, 0, 32);
  camera.lookAt(0, 0, 0);

  const rootGroup = new THREE.Group();
  const latch = buildLatch();
  const kit = buildKit();

  rootGroup.add(latch.group);
  for (const kitPart of kit.parts) rootGroup.add(kitPart);
  scene.add(rootGroup);

  // All labelled objects, in render order.
  const labelledParts: THREE.Object3D[] = [...latch.parts, ...kit.parts];

  // Initial assembled position.
  applyExplodeState(labelledParts, 0);

  const allGeometries = [...latch.geometries, ...kit.geometries];
  const allMaterials = [...latch.materials, ...kit.materials];

  const dispose = (): void => {
    for (const geometry of allGeometries) geometry.dispose();
    for (const material of allMaterials) material.dispose();
  };

  // Stash a no-op reference to keep the satisfies happy without exposing
  // the empty assembled tuple type at the boundary.
  void ({} as Vec3Tuple);

  return { scene, camera, rootGroup, labelledParts, dispose };
}

/** Cubic-bezier ease used by the explode tween. Same curve as the legacy IIFE. */
export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export { readPartMetadata };
