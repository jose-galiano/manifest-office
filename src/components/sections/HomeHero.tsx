'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

import { MonoCaption } from '@/components/ui/MonoCaption';

import type { ReactElement } from 'react';

// HomeHero — the topographic-wireframe / Strait-of-Gibraltar hero from
// deploy/index.html. Ported verbatim into TypeScript using `three`.
//
// Behaviour:
//   - Renders a 100×100 segmented plane, displaced by overlapping sine waves.
//   - Wires it as a wireframe in signal-orange against ink-black.
//   - Slow auto-rotation + parallax response to mouse position.
//   - Pauses rendering when the section leaves the viewport (IntersectionObserver).
//
// Brand bible §13: hero must stay under 400 KB gzipped. `three` core imports
// add ≈ 150 KB; we use only WebGLRenderer, Scene, PerspectiveCamera,
// PlaneGeometry, WireframeGeometry, LineSegments, LineBasicMaterial, FogExp2.
// No loaders, no controls, no PMREM — safely inside budget.

const HEADLINE_LINES: readonly string[] = ['THE SYSTEM', 'INSIDE THE', 'SUITCASE'];

function buildTopography(plane: THREE.PlaneGeometry): void {
  const positions = plane.attributes.position;
  if (!positions) return;
  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i);
    const z = positions.getZ(i);
    const y =
      Math.sin(x * 0.18) * Math.cos(z * 0.18) * 2.2 +
      Math.sin(x * 0.42 + 1.5) * Math.cos(z * 0.32) * 1.0 +
      Math.sin(x * 0.08) * Math.sin(z * 0.12) * 3.0;
    positions.setY(i, y);
  }
  plane.computeVertexNormals();
}

export function HomeHero(): ReactElement {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [loaded, setLoaded] = useState<boolean>(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrapper = wrapperRef.current;
    if (!canvas || !wrapper) return;

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
    scene.fog = new THREE.FogExp2(0x0b0f0e, 0.04);
    const camera = new THREE.PerspectiveCamera(
      50,
      wrapper.clientWidth / wrapper.clientHeight,
      0.1,
      200,
    );
    camera.position.set(0, 18, 28);
    camera.lookAt(0, 0, 0);

    const plane = new THREE.PlaneGeometry(80, 80, 100, 100);
    plane.rotateX(-Math.PI / 2);
    buildTopography(plane);

    const wireGeometry = new THREE.WireframeGeometry(plane);
    const wireMaterial = new THREE.LineBasicMaterial({
      color: 0xd24a1f,
      transparent: true,
      opacity: 0.55,
    });
    const wireframe = new THREE.LineSegments(wireGeometry, wireMaterial);
    scene.add(wireframe);

    let pointerX = 0;
    let pointerY = 0;
    const handlePointer = (event: MouseEvent): void => {
      pointerX = event.clientX / window.innerWidth - 0.5;
      pointerY = event.clientY / window.innerHeight - 0.5;
    };
    document.addEventListener('mousemove', handlePointer);

    let visible = true;
    const visibilityObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          visible = entry.isIntersecting;
        }
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
      wireframe.rotation.y = elapsed * 0.08;
      camera.position.x += (pointerX * 4 - camera.position.x) * 0.04;
      camera.position.y = 18 + pointerY * 3;
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
      visibilityObserver.disconnect();
      window.clearTimeout(loadedTimer);
      plane.dispose();
      wireGeometry.dispose();
      wireMaterial.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <section
      ref={wrapperRef}
      className="relative h-screen min-h-[760px] overflow-hidden bg-[#0B0F0E] text-[#F2EFE8]"
    >
      <canvas ref={canvasRef} className="absolute inset-0 block h-full w-full" />
      <div className="relative z-[2] flex h-full flex-col justify-between px-10 pt-[140px] pb-10">
        <div className="flex items-start justify-between font-mono text-[11px] tracking-[0.08em] uppercase text-[#5C6B5A]">
          <div>
            <div className="text-[#F2EFE8]">MANIFEST OFFICE</div>
            <div>EDITION 01 · GIBRALTAR · 36°08&apos;N 5°21&apos;W</div>
          </div>
          <div className="text-right">
            <div className="text-[#F2EFE8]">1,200 SYSTEMS</div>
            <div>ALLOCATION 00847 / 1200</div>
          </div>
        </div>

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
                      {char === ' ' ? ' ' : char}
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
        </div>

        <div className="flex items-end justify-between">
          <MonoCaption tone="lichen" className="tracking-[0.08em]">
            WIREFRAME · 1:250,000 · STRAIT OF GIBRALTAR
          </MonoCaption>
          <div
            className={`flex flex-col items-center gap-1.5 transition-opacity duration-700 ${loaded ? 'opacity-100' : 'opacity-0'}`}
            style={{ transitionDelay: '2200ms' }}
          >
            <MonoCaption tone="lichen">SCROLL</MonoCaption>
            <span className="block h-10 w-px animate-pulse bg-[#D24A1F]" />
          </div>
        </div>
      </div>
    </section>
  );
}
