import type { ReactElement } from 'react';

// Placeholder landing — replaced in Wave 2 of the migration when the homepage
// (`/`) is ported from `deploy/index.html`. The live demo continues to serve
// from the legacy `deploy/` directory at https://demo.maelify.com until then.
export default function HomePage(): ReactElement {
  return (
    <main className="min-h-screen flex items-center justify-center bg-[#0B0F0E] text-[#F2EFE8] p-12">
      <div className="max-w-xl text-center space-y-6">
        <p className="font-mono text-[11px] tracking-[0.12em] uppercase text-[#5C6B5A]">
          Manifest Office · Repository scaffolding
        </p>
        <h1 className="font-display font-bold text-5xl leading-[0.95] tracking-tight">
          Edition 01 is being rebuilt.
        </h1>
        <p className="font-body text-lg leading-relaxed text-[#F2EFE8]/85">
          The live storefront continues to operate at{' '}
          <a
            href="https://demo.maelify.com"
            className="text-[#D24A1F] underline-offset-4 hover:underline"
          >
            demo.maelify.com
          </a>{' '}
          while this Next.js refactor lands feature-by-feature.
        </p>
      </div>
    </main>
  );
}
