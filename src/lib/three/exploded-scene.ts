// Exploded-latch scene used by `ExplodedLatchViewer`. Loads four STL parts
// from `/public/models/latch/` and arranges them into an assembled/exploded
// pair the React component tweens between.
//
// Geometry credit: Lockable Latch by Mattsmith3065 on Thingiverse
// (thing #3283176), licensed CC-BY. Attribution is rendered in the viewer's
// chrome — keep both that DOM line and the LICENSE.txt under
// /public/models/latch/ in place if you touch this file.
//
// The component owns scene lifecycle (rAF, IO, DOM labels, disposal). This
// module only knows about geometry, materials, lights, and the
// assembled/exploded XYZ tuples used by the tween.

import * as THREE from 'three';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';

import type { PartMetadata, Vec3Tuple } from './types';

// --- Palette (mirrors design tokens in `globals.css`) ---------------------
const COLOR_BODY = 0x4a4540;
const COLOR_LEVER = 0xd24a1f; // signal orange
const COLOR_HOOK = 0xc0c0c0; // silver machined hardware
const COLOR_PLATE = 0x46494a;
const COLOR_RIM_LIGHT = 0xd24a1f;
const COLOR_FILL_LIGHT = 0xf2efe8;

/** Scale applied to each STL mesh. STLs are in millimetres; the scene
 * camera frames roughly ±10 world units, so 0.10 puts a ~50mm part at
 * 5 units — large enough to read every face at the section's 640px height. */
const STL_SCALE = 0.1;

/** Honest material descriptor — the source STLs are FDM print-ready, so
 * "PRINTED · PLA / ABS" describes the upstream artifact, not a Manifest
 * Office fabrication claim. Shared across the four parts. */
const PRINTED_MATERIAL = 'PRINTED · PLA / ABS';

/** Aggregate handle returned by `buildExplodedScene()`. The component owns
 * disposal via `dispose()`; everything else is read-only state used inside
 * the render loop. */
export interface ExplodedSceneHandle {
  readonly scene: THREE.Scene;
  readonly camera: THREE.PerspectiveCamera;
  readonly rootGroup: THREE.Group;
  readonly labelledParts: readonly THREE.Object3D[];
  readonly dispose: () => void;
}

/** Pre-loaded STL geometries. Centered, oriented Y-up, vertex-normals computed. */
export interface LatchGeometries {
  readonly p1: THREE.BufferGeometry;
  readonly p2: THREE.BufferGeometry;
  readonly p3: THREE.BufferGeometry;
  readonly clip: THREE.BufferGeometry;
}

function readPartMetadata(object: THREE.Object3D): PartMetadata | null {
  const data = object.userData as Partial<PartMetadata>;
  if (typeof data.key !== 'string') return null;
  if (typeof data.label !== 'string') return null;
  if (!Array.isArray(data.assembled) || !Array.isArray(data.exploded)) return null;
  return data as PartMetadata;
}

/** Lerps every labelled part between assembled (t=0) and exploded (t=1).
 * The caller passes pre-eased `t`. */
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

/** Loads the four STL parts, centers each at origin, rotates Z-up → Y-up,
 * and pre-computes vertex normals so MeshStandardMaterial lights them. */
export async function loadLatchGeometries(): Promise<LatchGeometries> {
  const loader = new STLLoader();
  const loadOne = (url: string): Promise<THREE.BufferGeometry> =>
    new Promise((resolve, reject) => {
      loader.load(
        url,
        (geometry) => {
          geometry.center();
          geometry.rotateX(-Math.PI / 2);
          geometry.computeVertexNormals();
          resolve(geometry);
        },
        undefined,
        (error: unknown) => reject(error instanceof Error ? error : new Error(String(error))),
      );
    });

  const [p1, p2, p3, clip] = await Promise.all([
    loadOne('/models/latch/Latch_P1.stl'),
    loadOne('/models/latch/Latch_P2.stl'),
    loadOne('/models/latch/Latch_P3.stl'),
    loadOne('/models/latch/Clip.stl'),
  ]);
  return { p1, p2, p3, clip };
}

// --- Lighting --------------------------------------------------------------
function addLights(scene: THREE.Scene): void {
  scene.add(new THREE.AmbientLight(0xffffff, 0.65));

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

interface PartSpec {
  readonly geometry: THREE.BufferGeometry;
  readonly material: THREE.Material;
  readonly metadata: PartMetadata;
}

/** Assembled state stacks the four parts vertically along Y. Exploded state
 * fans them out so each label has clear airspace. Tuples in scene-units
 * (post-scale). */
function partSpecs(
  geos: LatchGeometries,
  materials: {
    body: THREE.Material;
    lever: THREE.Material;
    arm: THREE.Material;
    clip: THREE.Material;
  },
): PartSpec[] {
  return [
    {
      geometry: geos.clip,
      material: materials.clip,
      metadata: {
        key: '01',
        label: 'CLIP',
        material: PRINTED_MATERIAL,
        assembled: [0, -2.4, 0],
        exploded: [0, -5.0, 0],
        group: 'latch',
      },
    },
    {
      geometry: geos.p1,
      material: materials.body,
      metadata: {
        key: '02',
        label: 'LATCH BODY',
        material: PRINTED_MATERIAL,
        assembled: [0, -0.4, 0],
        exploded: [0, -1.8, 0],
        group: 'latch',
      },
    },
    {
      geometry: geos.p3,
      material: materials.arm,
      metadata: {
        key: '03',
        label: 'LOCKING ARM',
        material: PRINTED_MATERIAL,
        assembled: [0, 1.0, 0.35],
        exploded: [-3.4, 1.6, 0.6],
        group: 'latch',
      },
    },
    {
      geometry: geos.p2,
      material: materials.lever,
      metadata: {
        key: '04',
        label: 'LEVER',
        material: PRINTED_MATERIAL,
        assembled: [0, 1.4, -0.35],
        exploded: [3.4, 2.6, -0.6],
        group: 'latch',
      },
    },
  ];
}

// --- Public builder -------------------------------------------------------
export function buildExplodedScene(aspect: number, geos: LatchGeometries): ExplodedSceneHandle {
  const scene = new THREE.Scene();
  addLights(scene);

  const camera = new THREE.PerspectiveCamera(35, aspect, 0.1, 200);
  camera.position.set(0, 0, 22);
  camera.lookAt(0, 0, 0);

  const rootGroup = new THREE.Group();

  const matBody = new THREE.MeshStandardMaterial({
    color: COLOR_BODY,
    roughness: 0.42,
    metalness: 0.7,
  });
  const matLever = new THREE.MeshStandardMaterial({
    color: COLOR_LEVER,
    roughness: 0.5,
    metalness: 0.45,
  });
  const matArm = new THREE.MeshStandardMaterial({
    color: COLOR_HOOK,
    roughness: 0.36,
    metalness: 0.85,
  });
  const matClip = new THREE.MeshStandardMaterial({
    color: COLOR_PLATE,
    roughness: 0.55,
    metalness: 0.65,
  });

  const specs = partSpecs(geos, {
    body: matBody,
    lever: matLever,
    arm: matArm,
    clip: matClip,
  });

  const labelledParts: THREE.Object3D[] = [];
  for (const spec of specs) {
    const mesh = new THREE.Mesh(spec.geometry, spec.material);
    mesh.scale.set(STL_SCALE, STL_SCALE, STL_SCALE);
    mesh.userData = { ...spec.metadata };
    rootGroup.add(mesh);
    labelledParts.push(mesh);
  }
  scene.add(rootGroup);

  applyExplodeState(labelledParts, 0);

  const materials: THREE.Material[] = [matBody, matLever, matArm, matClip];
  // Geometries are loaded once and shared with this scene; the scene owns
  // their disposal. The component disposes the renderer separately.
  const geometries: THREE.BufferGeometry[] = [geos.p1, geos.p2, geos.p3, geos.clip];

  const dispose = (): void => {
    for (const geometry of geometries) geometry.dispose();
    for (const material of materials) material.dispose();
  };

  // Silence unused Vec3Tuple import for downstream tooling that wants the
  // satisfies-style boundary check.
  void ({} as Vec3Tuple);

  return { scene, camera, rootGroup, labelledParts, dispose };
}

/** Cubic-bezier ease used by the explode tween. */
export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export { readPartMetadata };
