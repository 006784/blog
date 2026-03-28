import { NextRequest, NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/auth-server';

export const dynamic = 'force-dynamic';

function buildFallbackLabel(latitude: number, longitude: number) {
  return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
}

export async function GET(request: NextRequest) {
  if (!await requireAdminSession(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const latitude = Number(searchParams.get('lat'));
  const longitude = Number(searchParams.get('lon'));

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return NextResponse.json({ error: '无效坐标' }, { status: 400 });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&zoom=16&addressdetails=1`,
      {
        headers: {
          'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
          'User-Agent': 'LumenBlog/1.0 (location reverse geocoding)',
        },
        signal: controller.signal,
        cache: 'no-store',
      }
    );

    if (!response.ok) {
      return NextResponse.json({
        location: {
          label: buildFallbackLabel(latitude, longitude),
          latitude,
          longitude,
        },
      });
    }

    const result = await response.json() as {
      display_name?: string;
      address?: Record<string, string | undefined>;
    };

    const city =
      result.address?.city ||
      result.address?.town ||
      result.address?.village ||
      result.address?.county ||
      result.address?.state;
    const country = result.address?.country;
    const address = result.display_name;
    const label =
      city && country
        ? `${city} · ${country}`
        : city || address || buildFallbackLabel(latitude, longitude);

    return NextResponse.json({
      location: {
        label,
        address,
        city,
        country,
        latitude,
        longitude,
      },
    });
  } catch {
    return NextResponse.json({
      location: {
        label: buildFallbackLabel(latitude, longitude),
        latitude,
        longitude,
      },
    });
  } finally {
    clearTimeout(timeout);
  }
}
