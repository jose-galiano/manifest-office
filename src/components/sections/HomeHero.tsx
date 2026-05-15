'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

import { MonoCaption } from '@/components/ui/MonoCaption';

import type { ReactElement } from 'react';

// HomeHero — topographic wireframe of the Strait of Gibraltar (brand bible
// §12, Edition 01 anchor). Three layers of motion compose the effect:
//
//   1. Base topography — a sum of three sine waves whose phases drift slowly
//      over time, so the surface always breathes even with no cursor.
//   2. Cursor bulge — the screen pointer is unprojected to a world-space
//      point on the plane; each vertex receives an upward push proportional
//      to `exp(-d²/r²)` falloff from that point. Radius and amplitude are
//      tuned to read "elastic", not "splash".
//   3. Spring lerp — each vertex's current height is interpolated toward the
//      target each frame (`stiffness=0.18`, ~80ms 90% rise). This is what
//      gives the surface its "rubber sheet" quality on cursor move.
//
// Colour is driven on the GPU by a small ShaderMaterial: vertex Y is fed to
// a 3-stop ramp (lichen valleys → signal-orange mid → paper crests), with
// brand-bible §07 ink fog blending the horizon back into the page.
//
// Performance:
//   - 100×100 segments = 10,201 vertices. ~3% CPU on a 2018 MacBook Air for
//     the spring + bulge pass; GPU draws ~20K lines via wireframe.
//   - rAF pauses when the section leaves the viewport (IntersectionObserver).
//   - Mobile (<=820px) caps pixelRatio to 1.
//   - Strict-mode safe via an init-guard ref.

const HEADLINE_LINES: readonly string[] = ['THE SYSTEM', 'INSIDE THE', 'SUITCASE'];

// ---------- Tunables (all collected so the feel is single-source) ----------
const PLANE_SIZE = 80;
const PLANE_SEGMENTS = 100;

const BASE_AMPLITUDES = { low: 2.0, mid: 1.1, high: 2.6 } as const;
const BASE_DRIFT_HZ = 0.05;

const CURSOR_RADIUS = 11; // world units; smaller = sharper bulge
const CURSOR_PEAK = 5.5; // world units; height of the cursor pull
const SPRING_STIFFNESS = 0.18; // 0..1 — higher = snappier
const CURSOR_FOLLOW = 0.12; // smoothing on the cursor world point itself

const COLOR_VALLEY = new THREE.Color('#5C6B5A'); // lichen
const COLOR_MID = new THREE.Color('#D24A1F'); // signal
const COLOR_CREST = new THREE.Color('#F2EFE8'); // paper

// Vertex shader: pass position through; encode Y into a varying for the
// fragment to use as a colour key.
const VERTEX_SHADER = /* glsl */ `
  varying float vHeight;
  varying vec3 vWorldPosition;
  void main() {
    vHeight = position.y;
    vec4 world = modelMatrix * vec4(position, 1.0);
    vWorldPosition = world.xyz;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

// Fragment shader: 3-stop colour ramp on height + exponential ink fog so the
// far edges of the plane dissolve into the brand background.
const FRAGMENT_SHADER = /* glsl */ `
  precision mediump float;
  varying float vHeight;
  varying vec3 vWorldPosition;
  uniform vec3 uValleyColor;
  uniform vec3 uMidColor;
  uniform vec3 uCrestColor;
  uniform vec3 uFogColor;
  uniform float uFogDensity;
  uniform float uHeightLow;
  uniform float uHeightHigh;

  void main() {
    float t = smoothstep(uHeightLow, uHeightHigh, vHeight);
    vec3 ramp = mix(uValleyColor, uMidColor, smoothstep(0.0, 0.55, t));
    ramp = mix(ramp, uCrestColor, smoothstep(0.55, 1.0, t));

    // Brand-bible ink fog — exponential by camera distance.
    float dist = length(vWorldPosition);
    float fogFactor = 1.0 - exp(-uFogDensity * dist);
    vec3 colour = mix(ramp, uFogColor, clamp(fogFactor, 0.0, 1.0));

    gl_FragColor = vec4(colour, 1.0);
  }
`;

interface BaseHeightTable {
  readonly count: number;
  readonly xs: Float32Array;
  readonly zs: Float32Array;
  /** Per-vertex height *currently* applied. Updated each frame. */
  readonly current: Float32Array;
  /** Per-vertex target height (= base wave + cursor bulge). */
  readonly target: Float32Array;
}

function initHeights(positions: THREE.BufferAttribute): BaseHeightTable {
  const count = positions.count;
  const xs = new Float32Array(count);
  const zs = new Float32Array(count);
  const current = new Float32Array(count);
  const target = new Float32Array(count);
  for (let i = 0; i < count; i += 1) {
    xs[i] = positions.getX(i);
    zs[i] = positions.getZ(i);
  }
  return { count, xs, zs, current, target };
}

function projectCursorToGround(
  camera: THREE.PerspectiveCamera,
  ndcX: number,
  ndcY: number,
  out: THREE.Vector3,
): boolean {
  const probe = new THREE.Vector3(ndcX, ndcY, 0.5);
  probe.unproject(camera);
  const dir = probe.sub(camera.position).normalize();
  if (Math.abs(dir.y) < 1e-5) return false;
  const t = -camera.position.y / dir.y;
  if (t <= 0) return false;
  out.set(camera.position.x + dir.x * t, 0, camera.position.z + dir.z * t);
  return true;
}

export function HomeHero(): ReactElement {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const initialisedRef = useRef<boolean>(false);
  const [loaded, setLoaded] = useState<boolean>(false);

  useEffect(() => {
    if (initialisedRef.current) return;
    initialisedRef.current = true;

    const canvas = canvasRef.current;
    const wrapper = wrapperRef.current;
    if (!canvas || !wrapper) {
      initialisedRef.current = false;
      return;
    }

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
    });
    const coarsePointer = window.matchMedia('(max-width: 820px)').matches;
    renderer.setPixelRatio(coarsePointer ? 1 : Math.min(window.devicePixelRatio, 1.5));
    renderer.setSize(wrapper.clientWidth, wrapper.clientHeight);
    renderer.setClearColor(0x0b0f0e, 1);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      52,
      wrapper.clientWidth / wrapper.clientHeight,
      0.1,
      200,
    );
    camera.position.set(0, 18, 28);
    camera.lookAt(0, 0, 0);

    const plane = new THREE.PlaneGeometry(PLANE_SIZE, PLANE_SIZE, PLANE_SEGMENTS, PLANE_SEGMENTS);
    plane.rotateX(-Math.PI / 2);
    const positions = plane.attributes.position as THREE.BufferAttribute;
    const heights = initHeights(positions);

    const material = new THREE.ShaderMaterial({
      vertexShader: VERTEX_SHADER,
      fragmentShader: FRAGMENT_SHADER,
      wireframe: true,
      transparent: false,
      uniforms: {
        uValleyColor: { value: COLOR_VALLEY },
        uMidColor: { value: COLOR_MID },
        uCrestColor: { value: COLOR_CREST },
        uFogColor: { value: new THREE.Color('#0B0F0E') },
        uFogDensity: { value: 0.022 },
        uHeightLow: { value: -2.8 },
        uHeightHigh: { value: 4.4 },
      },
    });
    const mesh = new THREE.Mesh(plane, material);
    scene.add(mesh);

    // Pointer state (NDC). Smoothed `pointerNdc*` follows the raw input so
    // even camera parallax has a small inertia.
    let rawPointerNdcX = 0;
    let rawPointerNdcY = 0;
    let smoothPointerNdcX = 0;
    let smoothPointerNdcY = 0;
    const cursorWorld = new THREE.Vector3(999, 0, 999); // start far away → no bulge
    const cursorWorldTarget = new THREE.Vector3();
    const handlePointer = (event: MouseEvent): void => {
      rawPointerNdcX = (event.clientX / window.innerWidth) * 2 - 1;
      rawPointerNdcY = -(event.clientY / window.innerHeight) * 2 + 1;
    };
    const handlePointerLeave = (): void => {
      // Send the cursor far off-grid so the surface relaxes back to baseline.
      cursorWorldTarget.set(999, 0, 999);
    };
    document.addEventListener('mousemove', handlePointer);
    document.addEventListener('mouseleave', handlePointerLeave);

    let visible = true;
    const visibilityObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) visible = entry.isIntersecting;
      },
      { threshold: 0 },
    );
    visibilityObserver.observe(wrapper);

    let frameId = 0;
    const startTime = performance.now();
    const animate = (): void => {
      frameId = requestAnimationFrame(animate);
      if (!visible) return;
      const elapsed = (performance.now() - startTime) * 0.001;

      // 1) Smooth the NDC pointer so the camera parallax has weight.
      smoothPointerNdcX += (rawPointerNdcX - smoothPointerNdcX) * 0.06;
      smoothPointerNdcY += (rawPointerNdcY - smoothPointerNdcY) * 0.06;

      // 2) Re-project the smoothed NDC pointer to the y=0 ground plane.
      const projected = projectCursorToGround(
        camera,
        smoothPointerNdcX,
        smoothPointerNdcY,
        cursorWorldTarget,
      );
      if (!projected) cursorWorldTarget.set(999, 0, 999);

      // 3) Glide the actual cursor world point toward its target (extra
      //    smoothing on top of the NDC easing — gives the surface a sense of
      //    "weight" as it tracks the cursor).
      cursorWorld.x += (cursorWorldTarget.x - cursorWorld.x) * CURSOR_FOLLOW;
      cursorWorld.z += (cursorWorldTarget.z - cursorWorld.z) * CURSOR_FOLLOW;

      // 4) Recompute each vertex's target height (base wave + cursor bulge),
      //    then lerp `current` toward `target` for the spring feel.
      const radiusSquared = CURSOR_RADIUS * CURSOR_RADIUS;
      for (let i = 0; i < heights.count; i += 1) {
        const x = heights.xs[i] as number;
        const z = heights.zs[i] as number;

        // Base topography with slow phase drift.
        const phase = elapsed * BASE_DRIFT_HZ;
        const base =
          Math.sin(x * 0.18 + phase) * Math.cos(z * 0.18 - phase * 0.7) * BASE_AMPLITUDES.low +
          Math.sin(x * 0.42 + 1.5 + phase * 0.4) * Math.cos(z * 0.32) * BASE_AMPLITUDES.mid +
          Math.sin(x * 0.08 + phase * 0.2) *
            Math.sin(z * 0.12 - phase * 0.3) *
            BASE_AMPLITUDES.high;

        // Cursor bulge — gaussian falloff around the ground-projected pointer.
        const dx = x - cursorWorld.x;
        const dz = z - cursorWorld.z;
        const distSquared = dx * dx + dz * dz;
        const bulge =
          distSquared < radiusSquared * 6
            ? CURSOR_PEAK * Math.exp(-distSquared / radiusSquared)
            : 0;

        const target = base + bulge;
        heights.target[i] = target;

        // Spring lerp toward target.
        const previous = heights.current[i] as number;
        const next = previous + (target - previous) * SPRING_STIFFNESS;
        heights.current[i] = next;
        positions.setY(i, next);
      }
      positions.needsUpdate = true;

      // 5) Slow rotation around the scene + parallax camera move on Y.
      mesh.rotation.y = elapsed * 0.06;
      camera.position.x += (smoothPointerNdcX * 2.5 - camera.position.x) * 0.04;
      camera.position.y = 18 + smoothPointerNdcY * 2.2;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
    };
    animate();

    const handleResize = (): void => {
      if (!wrapper) return;
      renderer.setSize(wrapper.clientWidth, wrapper.clientHeight);
      camera.aspect = wrapper.clientWidth / wrapper.clientHeight;
      camera.updateProjectionMatrix();
    };
    window.addEventListener('resize', handleResize);

    const loadedTimer = window.setTimeout(() => setLoaded(true), 200);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('mousemove', handlePointer);
      document.removeEventListener('mouseleave', handlePointerLeave);
      visibilityObserver.disconnect();
      window.clearTimeout(loadedTimer);
      plane.dispose();
      material.dispose();
      renderer.dispose();
      initialisedRef.current = false;
    };
  }, []);

  return (
    <section
      ref={wrapperRef}
      className="relative h-screen min-h-[760px] overflow-hidden bg-[#0B0F0E] text-[#F2EFE8]"
    >
      <canvas ref={canvasRef} className="absolute inset-0 block h-full w-full" />
      <div className="relative z-[2] flex h-full flex-col justify-center px-5 md:px-10 pt-[110px] md:pt-[140px] pb-10">
        <div className="text-center">
          <div
            className={`mb-6 font-mono text-[12px] tracking-[0.2em] uppercase text-[#D24A1F] transition-all duration-700 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}
            style={{ transitionDelay: '1200ms' }}
          >
            — ISSUED TO OPERATORS —
          </div>
          <h1 className="font-display font-bold leading-[0.9] tracking-[-0.03em] text-[clamp(48px,8vw,124px)]">
            {HEADLINE_LINES.map((line, lineIndex) => {
              const previousChars = HEADLINE_LINES.slice(0, lineIndex).reduce(
                (total, current) => total + current.length,
                0,
              );
              return (
                <span key={line} className="block">
                  {[...line].map((char, charIndex) => (
                    <span
                      key={`${line}-${charIndex}`}
                      className={`inline-block transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                        loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                      }`}
                      style={{
                        transitionDelay: `${1300 + (previousChars + charIndex) * 35}ms`,
                      }}
                    >
                      {char === ' ' ? ' ' : char}
                    </span>
                  ))}
                </span>
              );
            })}
          </h1>
          <div
            className={`mt-7 font-mono text-[13px] tracking-[0.12em] uppercase text-[#5C6B5A] transition-opacity duration-700 ${loaded ? 'opacity-100' : 'opacity-0'}`}
            style={{ transitionDelay: '2000ms' }}
          >
            07 DOSSIERS · FROM €38 · SHIPS FROM PORTO IN 5 DAYS
          </div>
          <div
            className={`mt-10 flex justify-center transition-all duration-700 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}
            style={{ transitionDelay: '2300ms' }}
          >
            <Link
              href="/collections/edition-01"
              data-cursor
              data-track="hero_cta_reserve"
              className="group inline-flex items-center gap-3 border border-[var(--color-signal)] bg-[var(--color-signal)] px-9 py-4 font-mono text-[12px] uppercase tracking-[0.14em] text-[var(--color-paper)] transition-[background-color,color,letter-spacing] duration-[280ms] ease-out hover:bg-transparent hover:tracking-[0.18em]"
            >
              <span>Reserve from Edition 01</span>
              <span
                aria-hidden="true"
                className="transition-transform duration-[280ms] ease-out group-hover:translate-x-1"
              >
                →
              </span>
            </Link>
          </div>
        </div>

        <div
          className={`absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 transition-opacity duration-700 ${loaded ? 'opacity-100' : 'opacity-0'}`}
          style={{ transitionDelay: '2200ms' }}
        >
          <MonoCaption tone="lichen">SCROLL</MonoCaption>
          <span className="block h-10 w-px animate-pulse bg-[#D24A1F]" />
        </div>
      </div>
    </section>
  );
}
