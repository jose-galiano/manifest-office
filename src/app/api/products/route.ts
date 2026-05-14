// GET /api/products — returns the 10 Edition 01 products with images,
// variants, colorways, and live allocation. No-cache so the allocation
// counter on the storefront ticks up in real time.

import { NextResponse } from 'next/server';

import { fetchManifestProducts } from '@/lib/services/fetch-products';
import { MissingEnvError } from '@/lib/utils/env';

const NO_CACHE_HEADERS: HeadersInit = {
  'Cache-Control': 'no-store, max-age=0, must-revalidate',
  'Access-Control-Allow-Origin': '*',
};

export async function GET(): Promise<Response> {
  try {
    const result = await fetchManifestProducts();
    if (!result.ok) {
      return NextResponse.json(
        { error: result.error, detail: result.detail ?? null },
        { status: 500, headers: NO_CACHE_HEADERS },
      );
    }
    return NextResponse.json(result.data, { status: 200, headers: NO_CACHE_HEADERS });
  } catch (caught) {
    if (caught instanceof MissingEnvError) {
      return NextResponse.json(
        { error: 'missing_credentials', variable: caught.variable },
        { status: 500, headers: NO_CACHE_HEADERS },
      );
    }
    return NextResponse.json(
      {
        error: 'fetch_failed',
        message: caught instanceof Error ? caught.message : 'unknown_error',
      },
      { status: 500, headers: NO_CACHE_HEADERS },
    );
  }
}
