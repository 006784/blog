import { normalizeDiaryAttachments, normalizeDiaryLocationMeta } from '@/lib/diary-editor';
import { supabaseAdmin as supabase, type Diary } from './supabase';

type DiaryWriteInput = {
  title?: unknown;
  content?: unknown;
  mood?: unknown;
  weather?: unknown;
  location?: unknown;
  images?: unknown;
  tags?: unknown;
  mood_tags?: unknown;
  mood_score?: unknown;
  drawing_url?: unknown;
  attachments?: unknown;
  location_meta?: unknown;
  is_public?: unknown;
  environment?: unknown;
  environment_data?: unknown;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function normalizeString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}

function normalizeStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    : [];
}

export function isMissingEnvironmentColumnError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const err = error as { code?: string; message?: string };
  return (
    err.code === 'PGRST204' &&
    typeof err.message === 'string' &&
    err.message.includes('environment_data')
  );
}

export function buildDiaryPayload(
  input: DiaryWriteInput,
  diaryDate: string
): Partial<Diary> & { diary_date: string; content: string; word_count: number; updated_at: string } {
  const content = typeof input.content === 'string' ? input.content.trim() : '';
  const moodTags = normalizeStringArray(input.mood_tags);
  const tags = normalizeStringArray(input.tags);
  const hasAttachmentsField = Array.isArray(input.attachments);
  const attachments = normalizeDiaryAttachments(input.attachments);
  const hasLocationMetaField = input.location_meta !== undefined;
  const locationMeta = normalizeDiaryLocationMeta(input.location_meta);

  const baseEnvironment = isRecord(input.environment_data)
    ? input.environment_data
    : isRecord(input.environment)
      ? input.environment
      : null;

  const editorMeta: Record<string, unknown> = {};

  if (typeof input.mood_score === 'number' && Number.isFinite(input.mood_score)) {
    editorMeta.mood_score = input.mood_score;
  }

  if (moodTags.length > 0) {
    editorMeta.mood_tags = moodTags;
  }

  const drawingUrl = normalizeString(input.drawing_url);
  if (drawingUrl) {
    editorMeta.drawing_url = drawingUrl;
  }

  if (hasAttachmentsField) {
    editorMeta.attachments = attachments;
  }

  const environment_data = (() => {
    if (!baseEnvironment && Object.keys(editorMeta).length === 0 && !hasLocationMetaField) return null;

    const merged = baseEnvironment ? { ...baseEnvironment } : {};
    if (Object.keys(editorMeta).length > 0) {
      const existingEditor = isRecord(merged.editor) ? merged.editor : {};
      merged.editor = { ...existingEditor, ...editorMeta };
    }

    if (hasLocationMetaField) {
      if (locationMeta) {
        merged.location = locationMeta;
      } else {
        delete merged.location;
      }
    }
    return merged;
  })();

  const imageUrls = hasAttachmentsField
    ? attachments
        .filter((attachment) => attachment.type === 'image' || attachment.type === 'gif')
        .map((attachment) => attachment.url)
    : normalizeStringArray(input.images);

  const payload: Partial<Diary> & {
    diary_date: string;
    content: string;
    word_count: number;
    updated_at: string;
  } = {
    diary_date: diaryDate,
    title: normalizeString(input.title),
    content,
    mood: normalizeString(input.mood),
    weather: normalizeString(input.weather),
    location: normalizeString(input.location),
    images: imageUrls,
    tags: tags.length > 0 ? tags : moodTags,
    is_public: typeof input.is_public === 'boolean' ? input.is_public : false,
    word_count: content.length,
    updated_at: new Date().toISOString(),
  };

  if (environment_data) {
    payload.environment_data = environment_data as Diary['environment_data'];
  }

  return payload;
}

async function insertDiary(
  payload: Partial<Diary> & { diary_date: string; content: string; word_count: number; updated_at: string }
) {
  return supabase
    .from('diaries')
    .insert([{ ...payload, created_at: new Date().toISOString() }])
    .select()
    .single();
}

async function updateDiaryById(
  id: string,
  payload: Partial<Diary> & { diary_date: string; content: string; word_count: number; updated_at: string }
) {
  return supabase
    .from('diaries')
    .update(payload)
    .eq('id', id)
    .select()
    .single();
}

export async function saveDiary(
  payload: Partial<Diary> & { diary_date: string; content: string; word_count: number; updated_at: string },
  id?: string
) {
  let result = id
    ? await updateDiaryById(id, payload)
    : await insertDiary(payload);

  if (isMissingEnvironmentColumnError(result.error)) {
    const legacyPayload = { ...payload };
    delete (legacyPayload as { environment_data?: unknown }).environment_data;

    result = id
      ? await updateDiaryById(id, legacyPayload)
      : await insertDiary(legacyPayload);
  }

  return result;
}

export async function saveDiaryByDate(
  payload: Partial<Diary> & { diary_date: string; content: string; word_count: number; updated_at: string }
) {
  const { data: existing, error: lookupError } = await supabase
    .from('diaries')
    .select('id')
    .eq('diary_date', payload.diary_date)
    .maybeSingle();

  if (lookupError) {
    return { data: null, error: lookupError };
  }

  return saveDiary(payload, existing?.id);
}
