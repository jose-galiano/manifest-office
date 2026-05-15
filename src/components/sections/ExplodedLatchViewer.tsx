'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

import { CUSTOM_EVENTS, track } from '@/lib/analytics';
import {
  applyExplodeState,
  buildExplodedScene,
  easeInOutCubic,
  readPartMetadata,
} from '@/lib/three/exploded-scene';

import type { ExplodedSceneHandle } from '@/lib/three/exploded-scene';
import type { ReactElement } from 'react';

// ExplodedLatchViewer — the PDP section that lets a visitor drag-rotate the
// MO-A1 Anchor Latch (6 components) and the seven kit items it ties
// together, then explode or assemble the whole system on demand.
//
// Provenance: ported from `deploy/pdp.html` lines 2084-2351. Behavioural
// invariants preserved:
//   - hand-rolled spherical-coordinate drag-orbit (no OrbitControls).
//   - cubic-bezier ease over ~600ms between assembled and exploded.
//   - HTML label overlays positioned via `Vector3.project()` every frame.
//   - render loop pauses when the canvas is off-screen.
//   - prefers-reduced-motion: jump-cut to exploded, no animation tween.
//   - React strict-mode safe: a `useRef` init guard survives the dev
//     double-mount; full cleanup on unmount disposes geometries, materials,
//     and DOM labels, and removes window listeners.
//
// Performance budget (Maelify §11): < 50 kB on top of three-core (already
// loaded by HomeHero). Bundle delta is ~9 kB minified after tree-shake.

// --- Constants -----------------------------------------------------------
const ROTATION_LERP = 0.08;
const EXPLODE_LERP = 0.05;
const DRAG_SENSITIVITY_X = 0.008;
const DRAG_SENSITIVITY_Y = 0.006;
const ROTATION_X_CLAMP = 0.9;
const INITIAL_ROT_Y = -0.35;
const INITIAL_ROT_X = 0.25;
const AUTO_EXPLODE_DELAY_MS = 600;

interface LabelHandle {
  readonly element: HTMLDivElement;
  readonly part: THREE.Object3D;
  /** Latch parts hide their labels in assembled mode to keep readable density. */
  readonly group: 'latch' | 'kit';
}

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function createLabel(part: THREE.Object3D, uiHost: HTMLDivElement): LabelHandle | null {
  const data = readPartMetadata(part);
  if (!data) return null;

  const element = document.createElement('div');
  element.className =
    'absolute pointer-events-none font-mono text-[10px] tracking-[0.08em] uppercase text-[#F2EFE8] whitespace-nowrap opacity-0 transition-opacity duration-500';
  element.style.transform = 'translate(-50%, -50%)';

  const key = document.createElement('span');
  key.className = 'text-[#D24A1F] mr-2';
  key.textContent = data.key;

  const label = document.createElement('span');
  label.textContent = ` · ${data.label}`;

  const leader = document.createElement('span');
  leader.className = 'block w-8 h-px bg-[rgba(242,239,232,0.18)] my-1.5';

  const material = document.createElement('span');
  material.className = 'text-[#5C6B5A] text-[9px]';
  material.textContent = data.material;

  element.appendChild(key);
  element.appendChild(label);
  element.appendChild(leader);
  element.appendChild(material);
  uiHost.appendChild(element);

  return { element, part, group: data.group };
}

export function ExplodedLatchViewer(): ReactElement {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const uiRef = useRef<HTMLDivElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const initialisedRef = useRef<boolean>(false);

  // Toggle text + active state lives in React; the actual tween target is
  // mirrored into a ref so the rAF loop reads without triggering re-renders.
  const [exploded, setExploded] = useState<boolean>(false);
  const explodedRef = useRef<boolean>(false);

  // Hold the underlying toggle function so the button onClick stays a
  // stable callback rather than a re-bound closure.
  const toggleRef = useRef<() => void>(() => {});

  useEffect(() => {
    // Strict-mode double-mount guard. The effect runs twice in dev; the
    // second pass bails immediately and the first cleanup tears everything
    // down before the second init can run.
    if (initialisedRef.current) return;
    initialisedRef.current = true;

    const canvas = canvasRef.current;
    const uiHost = uiRef.current;
    const wrapperNode = wrapperRef.current;
    if (!canvas || !uiHost || !wrapperNode) {
      initialisedRef.current = false;
      return;
    }
    // Local const aliases lock the narrowed non-null type for nested closures.
    const wrapper: HTMLDivElement = wrapperNode;

    const reducedMotion = prefersReducedMotion();

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    const coarse = window.matchMedia('(max-width: 820px)').matches;
    renderer.setPixelRatio(coarse ? 1 : Math.min(window.devicePixelRatio, 1.5));
    renderer.setSize(wrapper.clientWidth, wrapper.clientHeight);

    const aspect = wrapper.clientWidth / wrapper.clientHeight;
    const sceneHandle: ExplodedSceneHandle = buildExplodedScene(aspect);
    const { scene, camera, rootGroup, labelledParts } = sceneHandle;

    // --- Label DOM ------------------------------------------------------
    const labels: LabelHandle[] = [];
    for (const part of labelledParts) {
      const handle = createLabel(part, uiHost);
      if (handle) labels.push(handle);
    }

    // --- Visibility (pause rAF when off-screen) -------------------------
    let visible = false;
    const visibilityObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) visible = entry.isIntersecting;
      },
      { threshold: 0 },
    );
    visibilityObserver.observe(wrapper);

    // --- Drag-orbit (hand-rolled spherical) -----------------------------
    let isDragging = false;
    let lastPointerX = 0;
    let lastPointerY = 0;
    let targetRotY = INITIAL_ROT_Y;
    let targetRotX = INITIAL_ROT_X;
    let currentRotY = targetRotY;
    let currentRotX = targetRotX;

    // Single `viewer_3d_rotate` event per drag session, fired on pointer-up
    // with total dragged distance + duration. We deliberately don't fire on
    // every mousemove (would flood GA4).
    let dragStartAt = 0;
    let dragStartX = 0;
    let dragStartY = 0;
    let dragDistance = 0;
    const ROTATE_MIN_DISTANCE_PX = 12;

    const onPointerDown = (clientX: number, clientY: number): void => {
      isDragging = true;
      lastPointerX = clientX;
      lastPointerY = clientY;
      dragStartAt = performance.now();
      dragStartX = clientX;
      dragStartY = clientY;
      dragDistance = 0;
    };
    const onPointerMove = (clientX: number, clientY: number): void => {
      if (!isDragging) return;
      const dx = clientX - lastPointerX;
      const dy = clientY - lastPointerY;
      dragDistance += Math.hypot(dx, dy);
      targetRotY += dx * DRAG_SENSITIVITY_X;
      targetRotX += dy * DRAG_SENSITIVITY_Y;
      targetRotX = Math.max(-ROTATION_X_CLAMP, Math.min(ROTATION_X_CLAMP, targetRotX));
      lastPointerX = clientX;
      lastPointerY = clientY;
    };
    const onPointerUp = (): void => {
      if (isDragging && dragDistance >= ROTATE_MIN_DISTANCE_PX) {
        track(CUSTOM_EVENTS.viewer3dRotate, {
          params: {
            duration_ms: Math.round(performance.now() - dragStartAt),
            distance_px: Math.round(dragDistance),
            net_dx: Math.round(lastPointerX - dragStartX),
            net_dy: Math.round(lastPointerY - dragStartY),
            in_exploded_view: explodedRef.current,
          },
        });
      }
      isDragging = false;
    };

    const onMouseDown = (event: MouseEvent): void => {
      onPointerDown(event.clientX, event.clientY);
    };
    const onMouseMove = (event: MouseEvent): void => {
      onPointerMove(event.clientX, event.clientY);
    };
    const onTouchStart = (event: TouchEvent): void => {
      const touch = event.touches[0];
      if (touch) onPointerDown(touch.clientX, touch.clientY);
    };
    const onTouchMove = (event: TouchEvent): void => {
      const touch = event.touches[0];
      if (touch) onPointerMove(touch.clientX, touch.clientY);
    };

    canvas.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onPointerUp);
    canvas.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onPointerUp);

    // --- Resize ---------------------------------------------------------
    const onResize = (): void => {
      const width = wrapper.clientWidth;
      const height = wrapper.clientHeight;
      renderer.setSize(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    window.addEventListener('resize', onResize);

    // --- Label refresh --------------------------------------------------
    const projection = new THREE.Vector3();
    function refreshLabels(currentExploded: boolean): void {
      const width = wrapper.clientWidth;
      const height = wrapper.clientHeight;
      for (const label of labels) {
        // All labels hide in assembled mode to keep the silhouette clean —
        // the user only needs them when actively inspecting the exploded view.
        label.element.style.opacity = currentExploded ? '1' : '0';

        label.part.getWorldPosition(projection);
        projection.project(camera);
        const x = (projection.x * 0.5 + 0.5) * width;
        const y = (1 - (projection.y * 0.5 + 0.5)) * height;
        label.element.style.left = `${x}px`;
        label.element.style.top = `${y}px`;
      }
    }

    // --- Explode tween --------------------------------------------------
    let explodeT = 0;
    let explodeTarget = 0;

    const toggle = (source: 'auto' | 'user'): void => {
      const next = !explodedRef.current;
      explodedRef.current = next;
      explodeTarget = next ? 1 : 0;
      setExploded(next);
      // Reduced motion: snap immediately and refresh labels so they swap
      // visibility without an interpolated tween.
      if (reducedMotion) {
        explodeT = explodeTarget;
        applyExplodeState(labelledParts, explodeT);
        refreshLabels(next);
      }
      track(next ? CUSTOM_EVENTS.viewer3dExplode : CUSTOM_EVENTS.viewer3dAssemble, {
        params: { source, reduced_motion: reducedMotion },
      });
    };
    toggleRef.current = () => toggle('user');

    // Auto-explode once the section first enters the viewport.
    let autoTriggered = false;
    const autoObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && !autoTriggered) {
            autoTriggered = true;
            autoObserver.unobserve(entry.target);
            window.setTimeout(() => toggle('auto'), reducedMotion ? 0 : AUTO_EXPLODE_DELAY_MS);
          }
        }
      },
      { threshold: 0.4 },
    );
    autoObserver.observe(wrapper);

    // --- Render loop ----------------------------------------------------
    let frameId = 0;
    const animate = (): void => {
      frameId = requestAnimationFrame(animate);
      if (!visible) return;

      currentRotY += (targetRotY - currentRotY) * ROTATION_LERP;
      currentRotX += (targetRotX - currentRotX) * ROTATION_LERP;
      rootGroup.rotation.y = currentRotY;
      rootGroup.rotation.x = currentRotX;

      if (!reducedMotion) {
        explodeT += (explodeTarget - explodeT) * EXPLODE_LERP;
        applyExplodeState(labelledParts, easeInOutCubic(explodeT));
      }

      refreshLabels(explodedRef.current);
      renderer.render(scene, camera);
    };
    animate();

    // --- Cleanup --------------------------------------------------------
    return (): void => {
      cancelAnimationFrame(frameId);
      visibilityObserver.disconnect();
      autoObserver.disconnect();

      canvas.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onPointerUp);
      canvas.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onPointerUp);
      window.removeEventListener('resize', onResize);

      for (const label of labels) {
        label.element.remove();
      }

      sceneHandle.dispose();
      renderer.dispose();

      // Allow the second strict-mode pass to re-initialise cleanly.
      initialisedRef.current = false;
    };
  }, []);

  const buttonLabel = exploded ? '↘ ASSEMBLE' : '↗ EXPLODE';

  return (
    <section className="bg-[#0B0F0E] text-[#F2EFE8] px-5 md:px-10 py-24 border-t border-[rgba(242,239,232,0.18)]">
      <span className="font-mono text-[11px] tracking-[0.08em] uppercase text-[#D24A1F] block mb-3">
        THE SYSTEM · EXPLODED · INTERACTIVE
      </span>
      <h2 className="font-display font-bold text-[clamp(48px,7vw,72px)] leading-[0.95] tracking-[-0.02em] max-w-[16ch] mb-4">
        Drag. Rotate.
        <br />
        Pull it apart.
      </h2>
      <div className="font-mono text-[12px] tracking-[0.06em] uppercase text-[#5C6B5A] mb-14">
        06 latch parts. 07 kit components. One closure connects every piece. Click and drag to
        rotate. Toggle to explode the system.
      </div>

      <div
        ref={wrapperRef}
        className="relative w-full h-[640px] overflow-hidden"
        style={{
          background:
            'radial-gradient(ellipse at center, rgba(210, 74, 31, 0.08) 0%, transparent 70%)',
        }}
      >
        <canvas
          ref={canvasRef}
          className="block w-full h-full cursor-grab active:cursor-grabbing"
          aria-label="Anchor Latch and kit-system exploded viewer"
          role="img"
        />
        <div ref={uiRef} className="absolute inset-0 pointer-events-none" />
        <div className="absolute bottom-6 left-6 right-6 flex justify-between items-center font-mono text-[11px] tracking-[0.08em] uppercase text-[#5C6B5A] pointer-events-none">
          <span className="flex items-center gap-2">
            <span className="text-[#D24A1F]">↻</span>
            DRAG TO ROTATE
          </span>
          <button
            type="button"
            onClick={() => toggleRef.current()}
            data-cursor
            className="pointer-events-auto bg-transparent border border-[rgba(242,239,232,0.18)] text-[#F2EFE8] px-5 py-3.5 font-mono text-[11px] tracking-[0.12em] uppercase cursor-pointer transition-[background,color,border-color,letter-spacing] duration-300 hover:bg-[#D24A1F] hover:border-[#D24A1F] hover:tracking-[0.16em]"
          >
            {buttonLabel}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-14 pt-8 border-t border-[rgba(242,239,232,0.18)] font-mono text-[11px] tracking-[0.06em] uppercase">
        <div>
          <span className="block text-[#5C6B5A] mb-1.5">Latch parts</span>
          <span className="text-[#F2EFE8]">06 components</span>
        </div>
        <div>
          <span className="block text-[#5C6B5A] mb-1.5">Kit items</span>
          <span className="text-[#F2EFE8]">07 components</span>
        </div>
        <div>
          <span className="block text-[#5C6B5A] mb-1.5">Cycle test</span>
          <span className="text-[#F2EFE8]">25,000 engagements</span>
        </div>
        <div>
          <span className="block text-[#5C6B5A] mb-1.5">Patent</span>
          <span className="text-[#F2EFE8]">EU 2026-04 · pending</span>
        </div>
      </div>
    </section>
  );
}
