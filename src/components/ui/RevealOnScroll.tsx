'use client';

import { useEffect, useRef, useState } from 'react';

import type { ReactElement, ReactNode } from 'react';

// Single-shot IntersectionObserver reveal. Replaces the `.reveal-trigger` +
// inline observer pattern in the legacy deploy/ pages. Adds `data-in-view`
// once the element crosses the threshold, then unobserves to keep the
// observer pool small.

interface RevealOnScrollProps {
  children: ReactNode;
  className?: string;
  /** Tailwind class applied when the element is NOT yet in view. */
  hiddenClassName?: string;
  /** Tailwind class applied once the element has entered the viewport. */
  visibleClassName?: string;
  /** Intersection threshold (0–1). Default matches legacy behaviour. */
  threshold?: number;
  /** Root margin string. Default matches legacy behaviour. */
  rootMargin?: string;
  /** Element tag to render. */
  as?: 'div' | 'section' | 'article';
}

export function RevealOnScroll({
  children,
  className = '',
  hiddenClassName = 'opacity-0 translate-y-6',
  visibleClassName = 'opacity-100 translate-y-0',
  threshold = 0.15,
  rootMargin = '0px 0px -10% 0px',
  as: Tag = 'div',
}: RevealOnScrollProps): ReactElement {
  const ref = useRef<HTMLDivElement | null>(null);
  const [inView, setInView] = useState<boolean>(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    if (typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry?.isIntersecting) {
          setInView(true);
          observer.unobserve(element);
        }
      },
      { threshold, rootMargin },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [threshold, rootMargin]);

  const stateClass = inView ? visibleClassName : hiddenClassName;
  return (
    <Tag
      ref={ref as unknown as React.RefObject<HTMLDivElement>}
      data-in-view={inView ? 'true' : 'false'}
      className={`transition-all duration-700 ease-out ${stateClass} ${className}`}
    >
      {children}
    </Tag>
  );
}
