'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

import type { ReactElement } from 'react';

const PLANE_SIZE = 80;
// 60×60 = 3,721 vertices (vs 100×100 = 10,201). Cuts per-frame CPU ~64%
// without a perceptible difference in wireframe density.
const PLANE_SEGMENTS = 60;
const BASE_AMPLITUDES = { low: 2.0, mid: 1.1, high: 2.6 } as const;
const BASE_DRIFT_HZ = 0.05;
const CURSOR_RADIUS = 11;
const CURSOR_PEAK = 5.5;
const SPRING_STIFFNESS = 0.18;
const CURSOR_FOLLOW = 0.12;

const COLOR_VALLEY = new THREE.Color('#5C6B5A');
const COLOR_MID = new THREE.Color('#D24A1F');
const COLOR_CREST = new THREE.Color('#F2EFE8');

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
  readonly current: Float32Array;
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

interface HeroCanvasProps {
  readonly wrapperRef: React.RefObject<HTMLDivElement | null>;
}

export default function HeroCanvas({ wrapperRef }: HeroCanvasProps): ReactElement {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const initialisedRef = useRef<boolean>(false);

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

    let rawPointerNdcX = 0;
    let rawPointerNdcY = 0;
    let smoothPointerNdcX = 0;
    let smoothPointerNdcY = 0;
    const cursorWorld = new THREE.Vector3(999, 0, 999);
    const cursorWorldTarget = new THREE.Vector3();
    const handlePointer = (event: MouseEvent): void => {
      rawPointerNdcX = (event.clientX / window.innerWidth) * 2 - 1;
      rawPointerNdcY = -(event.clientY / window.innerHeight) * 2 + 1;
    };
    const handlePointerLeave = (): void => {
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

      smoothPointerNdcX += (rawPointerNdcX - smoothPointerNdcX) * 0.06;
      smoothPointerNdcY += (rawPointerNdcY - smoothPointerNdcY) * 0.06;

      const projected = projectCursorToGround(
        camera,
        smoothPointerNdcX,
        smoothPointerNdcY,
        cursorWorldTarget,
      );
      if (!projected) cursorWorldTarget.set(999, 0, 999);

      cursorWorld.x += (cursorWorldTarget.x - cursorWorld.x) * CURSOR_FOLLOW;
      cursorWorld.z += (cursorWorldTarget.z - cursorWorld.z) * CURSOR_FOLLOW;

      const radiusSquared = CURSOR_RADIUS * CURSOR_RADIUS;
      for (let i = 0; i < heights.count; i += 1) {
        const x = heights.xs[i] as number;
        const z = heights.zs[i] as number;
        const phase = elapsed * BASE_DRIFT_HZ;
        const base =
          Math.sin(x * 0.18 + phase) * Math.cos(z * 0.18 - phase * 0.7) * BASE_AMPLITUDES.low +
          Math.sin(x * 0.42 + 1.5 + phase * 0.4) * Math.cos(z * 0.32) * BASE_AMPLITUDES.mid +
          Math.sin(x * 0.08 + phase * 0.2) *
            Math.sin(z * 0.12 - phase * 0.3) *
            BASE_AMPLITUDES.high;
        const dx = x - cursorWorld.x;
        const dz = z - cursorWorld.z;
        const distSquared = dx * dx + dz * dz;
        const bulge =
          distSquared < radiusSquared * 6
            ? CURSOR_PEAK * Math.exp(-distSquared / radiusSquared)
            : 0;
        const target = base + bulge;
        heights.target[i] = target;
        const previous = heights.current[i] as number;
        const next = previous + (target - previous) * SPRING_STIFFNESS;
        heights.current[i] = next;
        positions.setY(i, next);
      }
      positions.needsUpdate = true;

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

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('mousemove', handlePointer);
      document.removeEventListener('mouseleave', handlePointerLeave);
      visibilityObserver.disconnect();
      plane.dispose();
      material.dispose();
      renderer.dispose();
      initialisedRef.current = false;
    };
  }, [wrapperRef]);

  return (
    <canvas ref={canvasRef} className="absolute inset-0 block h-full w-full" aria-hidden="true" />
  );
}
