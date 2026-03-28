import type { Diary } from '@/lib/supabase';

export type DiaryAttachmentType = 'image' | 'video' | 'audio' | 'gif' | 'document';

export interface DiaryAttachmentMeta {
  id: string;
  url: string;
  type: DiaryAttachmentType;
  name: string;
  size: number;
  mimeType?: string;
  thumbnail?: string;
  duration?: number;
  dimensions?: {
    width: number;
    height: number;
  };
  createdAt: string;
}

export interface DiaryLocationMeta {
  latitude: number;
  longitude: number;
  accuracy?: number;
  address?: string;
  city?: string;
  country?: string;
  label?: string;
  capturedAt?: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

export function normalizeDiaryAttachments(value: unknown): DiaryAttachmentMeta[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(isRecord)
    .reduce<DiaryAttachmentMeta[]>((result, item, index) => {
      const url = typeof item.url === 'string' ? item.url.trim() : '';
      if (!url) {
        return result;
      }

      const rawType = typeof item.type === 'string' ? item.type : 'document';
      const type: DiaryAttachmentType =
        rawType === 'image' ||
        rawType === 'video' ||
        rawType === 'audio' ||
        rawType === 'gif' ||
        rawType === 'document'
          ? rawType
          : 'document';

      const dimensions = isRecord(item.dimensions) &&
        isFiniteNumber(item.dimensions.width) &&
        isFiniteNumber(item.dimensions.height)
        ? {
            width: item.dimensions.width,
            height: item.dimensions.height,
          }
        : undefined;

      result.push({
        id:
          typeof item.id === 'string' && item.id.trim().length > 0
            ? item.id
            : `attachment-${index}-${Date.now()}`,
        url,
        type,
        name:
          typeof item.name === 'string' && item.name.trim().length > 0
            ? item.name
            : '未命名附件',
        size: isFiniteNumber(item.size) ? item.size : 0,
        mimeType: typeof item.mimeType === 'string' ? item.mimeType : undefined,
        thumbnail: typeof item.thumbnail === 'string' ? item.thumbnail : undefined,
        duration: isFiniteNumber(item.duration) ? item.duration : undefined,
        dimensions,
        createdAt:
          typeof item.createdAt === 'string' && item.createdAt.trim().length > 0
            ? item.createdAt
            : new Date().toISOString(),
      } satisfies DiaryAttachmentMeta);
      return result;
    }, []);
}

export function normalizeDiaryLocationMeta(value: unknown): DiaryLocationMeta | null {
  if (!isRecord(value)) {
    return null;
  }

  if (!isFiniteNumber(value.latitude) || !isFiniteNumber(value.longitude)) {
    return null;
  }

  return {
    latitude: value.latitude,
    longitude: value.longitude,
    accuracy: isFiniteNumber(value.accuracy) ? value.accuracy : undefined,
    address: typeof value.address === 'string' ? value.address : undefined,
    city: typeof value.city === 'string' ? value.city : undefined,
    country: typeof value.country === 'string' ? value.country : undefined,
    label: typeof value.label === 'string' ? value.label : undefined,
    capturedAt: typeof value.capturedAt === 'string' ? value.capturedAt : undefined,
  };
}

export function getDiaryLocationLabel(
  locationMeta: DiaryLocationMeta | null,
  fallback?: string | null
): string {
  if (locationMeta?.label) {
    return locationMeta.label;
  }

  if (locationMeta?.city && locationMeta?.country) {
    return `${locationMeta.city} · ${locationMeta.country}`;
  }

  if (locationMeta?.city) {
    return locationMeta.city;
  }

  if (typeof fallback === 'string' && fallback.trim().length > 0) {
    return fallback.trim();
  }

  if (locationMeta) {
    return `${locationMeta.latitude.toFixed(4)}, ${locationMeta.longitude.toFixed(4)}`;
  }

  return '';
}

export function extractDiaryEditorState(diary: Diary | null) {
  const environmentData =
    diary?.environment_data && isRecord(diary.environment_data)
      ? (diary.environment_data as Record<string, unknown>)
      : null;

  const editor =
    environmentData?.editor && isRecord(environmentData.editor)
      ? (environmentData.editor as Record<string, unknown>)
      : null;

  const moodTags = Array.isArray(editor?.mood_tags)
    ? editor.mood_tags.filter((item): item is string => typeof item === 'string')
    : diary?.tags || [];

  return {
    mood_score: isFiniteNumber(editor?.mood_score) ? editor.mood_score : undefined,
    mood_tags: moodTags,
    drawing_url: typeof editor?.drawing_url === 'string' ? editor.drawing_url : undefined,
    attachments: normalizeDiaryAttachments(editor?.attachments),
    locationMeta: normalizeDiaryLocationMeta(environmentData?.location),
  };
}
