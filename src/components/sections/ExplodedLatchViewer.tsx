'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

import { CUSTOM_EVENTS, track } from '@/lib/analytics';
import {
  applyExplodeState,
  buildExplodedScene,
  easeInOutCubic,
  loadLatchGeometries,
  readPartMetadata,
} from '@/lib/three/exploded-scene';

import type { ExplodedSceneHandle, LatchGeometries } from '@/lib/three/exploded-scene';
import type { ReactElement } from 'react';

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
  key.className = 'text-signal mr-2';
  key.textContent = data.key;

  const label = document.createElement('span');
  label.textContent = ` · ${data.label}`;

  const leader = document.createElement('span');
  leader.className = 'block w-8 h-px bg-[rgba(242,239,232,0.18)] my-1.5';

  const material = document.createElement('span');
  material.className = 'text-[#9CAA98] text-[9px]';
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

  // `explodedRef` mirrors `exploded` so the rAF loop reads without forcing
  // a re-render every frame.
  const [exploded, setExploded] = useState<boolean>(false);
  const [geometries, setGeometries] = useState<LatchGeometries | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const explodedRef = useRef<boolean>(false);
  const toggleRef = useRef<() => void>(() => {});

  useEffect(() => {
    let cancelled = false;
    loadLatchGeometries()
      .then((geos) => {
        if (!cancelled) setGeometries(geos);
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setLoadError(error instanceof Error ? error.message : 'Failed to load geometry');
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!geometries) return;

    // Strict-mode double-mount guard.
    if (initialisedRef.current) return;
    initialisedRef.current = true;

    const canvas = canvasRef.current;
    const uiHost = uiRef.current;
    const wrapperNode = wrapperRef.current;
    if (!canvas || !uiHost || !wrapperNode) {
      initialisedRef.current = false;
      return;
    }
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
    const sceneHandle: ExplodedSceneHandle = buildExplodedScene(aspect, geometries);
    const { scene, camera, rootGroup, labelledParts } = sceneHandle;

    const labels: LabelHandle[] = [];
    for (const part of labelledParts) {
      const handle = createLabel(part, uiHost);
      if (handle) labels.push(handle);
    }

    let visible = false;
    const visibilityObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) visible = entry.isIntersecting;
      },
      { threshold: 0 },
    );
    visibilityObserver.observe(wrapper);

    let isDragging = false;
    let lastPointerX = 0;
    let lastPointerY = 0;
    let targetRotY = INITIAL_ROT_Y;
    let targetRotX = INITIAL_ROT_X;
    let currentRotY = targetRotY;
    let currentRotX = targetRotX;

    // One viewer_3d_rotate event per drag (fires on pointer-up), not per
    // mousemove — would otherwise flood GA4.
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

    const onResize = (): void => {
      const width = wrapper.clientWidth;
      const height = wrapper.clientHeight;
      renderer.setSize(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    window.addEventListener('resize', onResize);

    const projection = new THREE.Vector3();
    function refreshLabels(currentExploded: boolean): void {
      const width = wrapper.clientWidth;
      const height = wrapper.clientHeight;
      for (const label of labels) {
        label.element.style.opacity = currentExploded ? '1' : '0';

        label.part.getWorldPosition(projection);
        projection.project(camera);
        const x = (projection.x * 0.5 + 0.5) * width;
        const y = (1 - (projection.y * 0.5 + 0.5)) * height;
        label.element.style.left = `${x}px`;
        label.element.style.top = `${y}px`;
      }
    }

    let explodeT = 0;
    let explodeTarget = 0;

    const toggle = (source: 'auto' | 'user'): void => {
      const next = !explodedRef.current;
      explodedRef.current = next;
      explodeTarget = next ? 1 : 0;
      setExploded(next);
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

      initialisedRef.current = false;
    };
  }, [geometries]);

  const buttonLabel = exploded ? '↘ ASSEMBLE' : '↗ EXPLODE';

  return (
    <section
      data-surface="ink"
      className="bg-[#0B0F0E] text-[#F2EFE8] px-5 md:px-10 py-24 border-t border-[rgba(242,239,232,0.18)]"
    >
      <span className="font-mono text-[11px] tracking-[0.08em] uppercase text-signal block mb-3">
        REFERENCE GEOMETRY · INTERACTIVE
      </span>
      <h2 className="font-display font-bold text-[clamp(48px,7vw,72px)] leading-[0.95] tracking-[-0.02em] max-w-[16ch] mb-4">
        Drag. Rotate.
        <br />
        Pull it apart.
      </h2>
      <div className="font-mono text-[12px] tracking-[0.06em] uppercase text-[#9CAA98] mb-14">
        Open-hardware lockable latch · four parts · loaded from STL into Three.js, exploded on an
        eased tween. Click and drag to rotate. Toggle to pull it apart.
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
          aria-label="Lockable latch interactive exploded viewer"
          role="img"
        />
        <div ref={uiRef} className="absolute inset-0 pointer-events-none" />

        {geometries === null ? (
          <div className="absolute inset-0 flex items-center justify-center font-mono text-[11px] tracking-[0.08em] uppercase text-[#9CAA98]">
            {loadError ? `× ${loadError}` : 'Loading geometry…'}
          </div>
        ) : null}

        <div className="absolute bottom-6 left-6 right-6 flex justify-between items-center font-mono text-[11px] tracking-[0.08em] uppercase text-[#9CAA98] pointer-events-none">
          <span className="flex items-center gap-2">
            <span className="text-signal">↻</span>
            DRAG TO ROTATE
          </span>
          <button
            type="button"
            onClick={() => toggleRef.current()}
            data-cursor
            disabled={geometries === null}
            className="pointer-events-auto bg-transparent border border-[rgba(242,239,232,0.18)] text-[#F2EFE8] px-5 py-3.5 font-mono text-[11px] tracking-[0.12em] uppercase cursor-pointer transition-[background,color,border-color,letter-spacing] duration-300 hover:bg-[#D24A1F] hover:border-[#D24A1F] hover:tracking-[0.16em] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:border-[rgba(242,239,232,0.18)] disabled:hover:tracking-[0.12em]"
          >
            {buttonLabel}
          </button>
        </div>
      </div>

      {/* CC-BY attribution — required wherever the model appears. */}
      <p className="mt-6 font-mono text-[10px] tracking-[0.06em] uppercase text-[#9CAA98]">
        Model{' '}
        <a
          href="https://www.thingiverse.com/thing:3283176"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#F2EFE8] underline decoration-[rgba(242,239,232,0.32)] underline-offset-[3px] transition-colors hover:text-signal hover:decoration-[#D24A1F]"
        >
          Lockable Latch
        </a>{' '}
        by Mattsmith3065 · CC-BY · Thingiverse #3283176. Geometry rendered as-published; no
        modifications.
      </p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-12 pt-8 border-t border-[rgba(242,239,232,0.18)] font-mono text-[11px] tracking-[0.06em] uppercase">
        <div>
          <span className="block text-[#9CAA98] mb-1.5">Parts</span>
          <span className="text-[#F2EFE8]">04 STL components</span>
        </div>
        <div>
          <span className="block text-[#9CAA98] mb-1.5">Format</span>
          <span className="text-[#F2EFE8]">Binary STL</span>
        </div>
        <div>
          <span className="block text-[#9CAA98] mb-1.5">Loader</span>
          <span className="text-[#F2EFE8]">Three.js · STLLoader</span>
        </div>
        <div>
          <span className="block text-[#9CAA98] mb-1.5">License</span>
          <span className="text-[#F2EFE8]">CC-BY · attributed</span>
        </div>
      </div>
    </section>
  );
}
