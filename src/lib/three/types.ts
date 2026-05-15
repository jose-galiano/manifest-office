// Shared types for the exploded latch + kit-system Three.js scene.
// Each scene object carries metadata used by the HTML label overlay and by
// the assemble/explode tween. Stored on `Object3D.userData` (untyped on the
// Three.js side) and re-typed at the boundary via `readPartMetadata()`.

/** Tuple representing an XYZ position in scene-space. */
export type Vec3Tuple = readonly [number, number, number];

/**
 * Metadata attached to each labelled object in the exploded viewer scene.
 * The Three.js `userData` field is `Record<string, unknown>` so this is
 * the contract the component reads at the boundary.
 */
export interface PartMetadata {
  /** Two-digit ordinal shown in the label leader (e.g. "07"). */
  readonly key: string;
  /** Uppercase display label (e.g. "TECH POUCH M"). */
  readonly label: string;
  /** Mono-caption material descriptor (e.g. "1.4L · 420D CORDURA"). */
  readonly material: string;
  /** XYZ when the system is assembled (`t = 0`). */
  readonly assembled: Vec3Tuple;
  /** XYZ when the system is fully exploded (`t = 1`). */
  readonly exploded: Vec3Tuple;
  /** Group an object belongs to. Latch parts hide labels when assembled. */
  readonly group: 'latch' | 'kit';
}

/** Spec for a kit item, fed to `makeKitItem()`. */
export interface KitItemSpec {
  readonly key: string;
  readonly label: string;
  readonly material: string;
  readonly width: number;
  readonly height: number;
  readonly depth: number;
  readonly assembled: Vec3Tuple;
  readonly exploded: Vec3Tuple;
}
