'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Globe,
  ImagePlus,
  Lock,
  Loader2,
  LocateFixed,
  MapPin,
  Mic,
  Pause,
  Square,
  Trash2,
  Video,
  Volume2,
} from 'lucide-react';
import { type Diary } from '@/lib/supabase';
import {
  type DiaryAttachmentMeta,
  type DiaryLocationMeta,
  getDiaryLocationLabel,
} from '@/lib/diary-editor';
import { type DiaryTheme } from '@/lib/diary/themes';
import { MultimediaService } from '@/lib/diary/multimedia-service';
import { useDiaryAutoSave } from '@/hooks/useDiaryAutoSave';
import { DrawingCanvas } from './DrawingCanvas';
import { MOOD_LEVELS, MoodPicker } from './MoodPicker';
import { ThemeSwitcher } from './ThemeSwitcher';
import { type WeatherData, WeatherPicker } from './WeatherPicker';

const PLACEHOLDER: Record<DiaryTheme, string> = {
  kraft: '今天……',
  washi: '今日の記録…',
  literary: '谨以此文，记录今日所思……',
  minimal: '写点什么…',
};

interface DiaryData {
  id?: string;
  diary_date: string;
  title?: string;
  content: string;
  mood_score: number;
  mood_tags: string[];
  weather: WeatherData | null;
  location?: string;
  location_meta?: DiaryLocationMeta | null;
  drawing_url?: string;
  attachments?: DiaryAttachmentMeta[];
  is_public?: boolean;
}

interface Props {
  theme: DiaryTheme;
  onThemeChange: (t: DiaryTheme) => void;
  date: Date;
  initial?: Partial<DiaryData>;
  onSaved?: (d: Diary) => void;
}

type LocationState = 'idle' | 'locating' | 'ready' | 'error';

function inferAttachmentType(fileType: string): DiaryAttachmentMeta['type'] {
  if (fileType === 'image/gif') {
    return 'gif';
  }
  if (fileType.startsWith('image/')) {
    return 'image';
  }
  if (fileType.startsWith('video/')) {
    return 'video';
  }
  if (fileType.startsWith('audio/')) {
    return 'audio';
  }
  return 'document';
}

function formatFileSize(size: number): string {
  if (size < 1024) {
    return `${size} B`;
  }
  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDuration(duration?: number): string {
  if (!duration || !Number.isFinite(duration)) {
    return '';
  }
  const mins = Math.floor(duration / 60);
  const secs = Math.floor(duration % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function DiaryEditor({ theme, onThemeChange, date, initial, onSaved }: Props) {
  const dateStr = date.toISOString().split('T')[0];
  const [title, setTitle] = useState(initial?.title || '');
  const [content, setContent] = useState(initial?.content || '');
  const [moodScore, setMoodScore] = useState(initial?.mood_score || 3);
  const [moodTags, setMoodTags] = useState<string[]>(initial?.mood_tags || []);
  const [weather, setWeather] = useState<WeatherData | null>(initial?.weather || null);
  const [location, setLocation] = useState(initial?.location || '');
  const [locationMeta, setLocationMeta] = useState<DiaryLocationMeta | null>(
    initial?.location_meta || null
  );
  const [locationState, setLocationState] = useState<LocationState>(
    initial?.location || initial?.location_meta ? 'ready' : 'idle'
  );
  const [locationError, setLocationError] = useState('');
  const [showDrawing, setShowDrawing] = useState(false);
  const [drawingUrl, setDrawingUrl] = useState(initial?.drawing_url || '');
  const [attachments, setAttachments] = useState<DiaryAttachmentMeta[]>(
    initial?.attachments || []
  );
  const [isPublic, setIsPublic] = useState(initial?.is_public ?? false);
  const [uploadingAttachments, setUploadingAttachments] = useState(false);
  const [attachmentError, setAttachmentError] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordingSupported] = useState(() =>
    typeof window !== 'undefined' ? MultimediaService.isRecordingSupported() : true
  );

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recordTimerRef = useRef<number | null>(null);
  const autoLocateTriggeredRef = useRef(false);

  const stopRecordingTimer = useCallback(() => {
    if (recordTimerRef.current !== null) {
      window.clearInterval(recordTimerRef.current);
      recordTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) {
      return;
    }
    ta.style.height = 'auto';
    ta.style.height = `${ta.scrollHeight}px`;
  }, [content]);

  useEffect(() => {
    return () => {
      stopRecordingTimer();
      MultimediaService.cancelRecording();
    };
  }, [stopRecordingTimer]);

  const uploadDiaryFiles = useCallback(async (files: File[]) => {
    if (!files.length) {
      return;
    }

    setUploadingAttachments(true);
    setAttachmentError('');

    const nextAttachments: DiaryAttachmentMeta[] = [];
    const errors: string[] = [];

    for (const file of files) {
      const validation = MultimediaService.validateFile(file);
      if (!validation.isValid) {
        errors.push(`${file.name}: ${validation.error}`);
        continue;
      }

      const localPreviewUrl = URL.createObjectURL(file);
      const mediaInfo = await MultimediaService.getMediaInfo(localPreviewUrl, file.type);
      MultimediaService.revokeObjectURL(localPreviewUrl);

      const uploaded = await MultimediaService.uploadMedia(file, 'diary-media');
      if (!uploaded.success || !uploaded.url) {
        errors.push(`${file.name}: ${uploaded.error || '上传失败'}`);
        continue;
      }

      nextAttachments.push({
        id: `attachment-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        url: uploaded.url,
        type: inferAttachmentType(file.type),
        name: file.name,
        size: file.size,
        mimeType: file.type,
        thumbnail: file.type.startsWith('image/') ? uploaded.url : undefined,
        duration: mediaInfo.duration,
        dimensions: mediaInfo.dimensions,
        createdAt: new Date().toISOString(),
      });
    }

    setAttachments((prev) => [...prev, ...nextAttachments]);
    if (errors.length > 0) {
      setAttachmentError(errors.join('；'));
    }
    setUploadingAttachments(false);
  }, []);

  const handleLocate = useCallback(async (mode: 'auto' | 'manual' = 'manual') => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      if (mode === 'manual') {
        setLocationState('error');
        setLocationError('当前浏览器不支持定位。');
      }
      return;
    }

    setLocationState('locating');
    setLocationError('');

    await new Promise<void>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const baseLocation: DiaryLocationMeta = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            capturedAt: new Date().toISOString(),
          };

          let nextLocation = baseLocation;

          try {
            const res = await fetch(
              `/api/location/reverse?lat=${baseLocation.latitude}&lon=${baseLocation.longitude}`,
              { credentials: 'include' }
            );
            const data = (await res.json().catch(() => null)) as
              | {
                  location?: Partial<DiaryLocationMeta>;
                }
              | null;

            if (res.ok && data?.location) {
              nextLocation = {
                ...baseLocation,
                ...data.location,
                latitude: baseLocation.latitude,
                longitude: baseLocation.longitude,
                accuracy: baseLocation.accuracy,
                capturedAt: baseLocation.capturedAt,
              };
            }
          } catch {
            // 使用坐标作为回退文案
          }

          const label = getDiaryLocationLabel(nextLocation, location);
          setLocation(label);
          setLocationMeta({ ...nextLocation, label });
          setLocationState('ready');
          resolve();
        },
        (error) => {
          setLocationState('error');
          if (mode === 'manual') {
            setLocationError(error.message || '定位失败，请检查浏览器定位权限。');
          }
          resolve();
        },
        {
          enableHighAccuracy: true,
          timeout: 12000,
          maximumAge: 5 * 60 * 1000,
        }
      );
    });
  }, [location]);

  useEffect(() => {
    if (autoLocateTriggeredRef.current || initial?.id || location || locationMeta) {
      return;
    }

    autoLocateTriggeredRef.current = true;
    queueMicrotask(() => {
      void handleLocate('auto');
    });
  }, [handleLocate, initial?.id, location, locationMeta]);

  const handleAttachmentSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const fileList = event.target.files;
    if (!fileList || fileList.length === 0) {
      return;
    }

    await uploadDiaryFiles(Array.from(fileList));
    event.target.value = '';
  };

  const handleStartRecording = async () => {
    setAttachmentError('');
    const started = await MultimediaService.startRecording();
    if (!started) {
      setAttachmentError('无法启动录音，请确认浏览器已允许麦克风权限。');
      return;
    }

    setIsRecording(true);
    setIsPaused(false);
    setRecordingTime(0);
    recordTimerRef.current = window.setInterval(() => {
      setRecordingTime((prev) => prev + 1);
    }, 1000);
  };

  const handlePauseRecording = () => {
    MultimediaService.pauseRecording();
    setIsPaused(true);
    stopRecordingTimer();
  };

  const handleResumeRecording = () => {
    MultimediaService.resumeRecording();
    setIsPaused(false);
    recordTimerRef.current = window.setInterval(() => {
      setRecordingTime((prev) => prev + 1);
    }, 1000);
  };

  const handleCancelRecording = () => {
    MultimediaService.cancelRecording();
    stopRecordingTimer();
    setIsRecording(false);
    setIsPaused(false);
    setRecordingTime(0);
  };

  const handleStopRecording = async () => {
    stopRecordingTimer();
    const recording = await MultimediaService.stopRecording();
    setIsRecording(false);
    setIsPaused(false);
    setRecordingTime(0);

    if (!recording) {
      setAttachmentError('录音保存失败，请再试一次。');
      return;
    }

    const audioFile = new File(
      [recording.blob],
      `diary-recording-${Date.now()}.webm`,
      {
        type: recording.mimeType,
        lastModified: Date.now(),
      }
    );

    await uploadDiaryFiles([audioFile]);
    MultimediaService.revokeObjectURL(recording.url);
  };

  const handleSaveDrawing = (dataUrl: string) => {
    setDrawingUrl(dataUrl);
    setShowDrawing(false);
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((attachment) => attachment.id !== id));
  };

  const payload = {
    id: initial?.id,
    diary_date: dateStr,
    title,
    content,
    mood_score: moodScore,
    mood_tags: moodTags,
    mood: MOOD_LEVELS.find((m) => m.score === moodScore)?.label,
    weather: weather
      ? `${weather.icon}${weather.label}${weather.temp !== undefined ? ` ${weather.temp}°C` : ''}`
      : '',
    location,
    location_meta: locationMeta,
    attachments,
    drawing_url: drawingUrl || undefined,
    is_public: isPublic,
  };

  const { status, statusLabel, save } = useDiaryAutoSave(payload, { onSaved });

  const bodyFont =
    theme === 'kraft' ? "'Caveat', cursive" : 'var(--d-font-body)';
  const bodyFontSize = theme === 'kraft' ? '18px' : '16px';

  return (
    <div className="flex h-full flex-col">
      <div
        className="flex flex-wrap items-center gap-4 border-b px-6 py-3"
        style={{ borderColor: 'var(--d-border)', background: 'var(--d-bg)' }}
      >
        <span
          className="text-sm"
          style={{
            fontFamily: 'var(--d-font-title)',
            color: 'var(--d-ink)',
            letterSpacing: '.05em',
          }}
        >
          {date.toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'short',
          })}
        </span>

        <div className="h-4 w-px" style={{ background: 'var(--d-border)' }} />

        <WeatherPicker weather={weather} onChange={setWeather} />

        <div className="h-4 w-px" style={{ background: 'var(--d-border)' }} />

        <MoodPicker
          score={moodScore}
          tags={moodTags}
          onScoreChange={setMoodScore}
          onTagsChange={setMoodTags}
        />

        <div className="flex items-center gap-1.5">
          <MapPin size={13} style={{ color: 'var(--d-ink-3)' }} />
          <input
            value={location}
            onChange={(event) => setLocation(event.target.value)}
            placeholder="地点"
            className="w-28 bg-transparent text-xs outline-none"
            style={{
              color: 'var(--d-ink-2)',
              fontFamily: 'var(--d-font-body)',
              borderBottom: location ? '1px solid var(--d-border)' : 'none',
            }}
          />
          <button
            type="button"
            onClick={() => void handleLocate('manual')}
            className="flex items-center gap-1 text-[11px] transition-opacity hover:opacity-70"
            style={{ color: 'var(--d-accent)', letterSpacing: '.08em' }}
          >
            {locationState === 'locating' ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <LocateFixed className="h-3.5 w-3.5" />
            )}
            定位
          </button>
        </div>

        <div className="flex-1" />

        <button
          type="button"
          onClick={() => setShowDrawing((prev) => !prev)}
          className="text-xs transition-opacity hover:opacity-60"
          style={{
            color: showDrawing ? 'var(--d-accent)' : 'var(--d-ink-3)',
            letterSpacing: '.1em',
          }}
        >
          ✏ 涂鸦
        </button>

        <ThemeSwitcher current={theme} onChange={onThemeChange} />

        <button
          type="button"
          onClick={() => setIsPublic((prev) => !prev)}
          title={isPublic ? '当前公开，点击设为私密' : '当前私密，点击设为公开'}
          className="flex items-center gap-1 text-[11px] transition-opacity hover:opacity-70"
          style={{ color: isPublic ? 'var(--d-accent)' : 'var(--d-ink-3)', letterSpacing: '.08em' }}
        >
          {isPublic ? <Globe className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
          {isPublic ? '公开' : '私密'}
        </button>
      </div>

      {showDrawing ? (
        <div className="flex-none px-6 pt-4">
          <DrawingCanvas
            theme={theme}
            onSave={handleSaveDrawing}
            onClose={() => setShowDrawing(false)}
          />
        </div>
      ) : null}

      <div className="flex-1 overflow-y-auto px-6 py-6">
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="标题（可选）"
          className="mb-4 w-full bg-transparent outline-none"
          style={{
            fontFamily: 'var(--d-font-title)',
            fontSize: '1.2rem',
            color: 'var(--d-ink)',
            borderBottom: title ? '1px solid var(--d-border)' : 'none',
            paddingBottom: title ? 8 : 0,
          }}
        />

        <div
          className="mb-4 rounded-2xl border px-4 py-3"
          style={{ borderColor: 'var(--d-border)', background: 'var(--d-bg-warm)' }}
        >
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 border px-3 py-1.5 text-xs transition-opacity hover:opacity-70"
              style={{ borderColor: 'var(--d-border)', color: 'var(--d-ink-2)' }}
            >
              <ImagePlus className="h-3.5 w-3.5" />
              添加图片 / 视频 / 音频
            </button>

            {recordingSupported ? (
              isRecording ? (
                <>
                  <button
                    type="button"
                    onClick={isPaused ? handleResumeRecording : handlePauseRecording}
                    className="inline-flex items-center gap-1.5 border px-3 py-1.5 text-xs transition-opacity hover:opacity-70"
                    style={{ borderColor: 'var(--d-border)', color: 'var(--d-ink-2)' }}
                  >
                    {isPaused ? <Mic className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
                    {isPaused ? '继续录音' : '暂停录音'}
                  </button>
                  <button
                    type="button"
                    onClick={handleStopRecording}
                    className="inline-flex items-center gap-1.5 border px-3 py-1.5 text-xs transition-opacity hover:opacity-70"
                    style={{ borderColor: 'var(--d-accent)', color: 'var(--d-accent)' }}
                  >
                    <Square className="h-3.5 w-3.5" />
                    停止并保存
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelRecording}
                    className="inline-flex items-center gap-1.5 border px-3 py-1.5 text-xs transition-opacity hover:opacity-70"
                    style={{ borderColor: 'var(--d-border)', color: 'var(--d-ink-3)' }}
                  >
                    取消
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => void handleStartRecording()}
                  className="inline-flex items-center gap-1.5 border px-3 py-1.5 text-xs transition-opacity hover:opacity-70"
                  style={{ borderColor: 'var(--d-border)', color: 'var(--d-ink-2)' }}
                >
                  <Mic className="h-3.5 w-3.5" />
                  录音
                </button>
              )
            ) : null}

            {uploadingAttachments ? (
              <span className="inline-flex items-center gap-1 text-[11px]" style={{ color: 'var(--d-accent)' }}>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                正在上传附件
              </span>
            ) : null}

            {isRecording ? (
              <span className="text-[11px]" style={{ color: 'var(--d-accent)', letterSpacing: '.08em' }}>
                录音中 · {formatDuration(recordingTime)}
              </span>
            ) : null}
          </div>

          {(locationError || attachmentError) ? (
            <p className="mt-3 text-[11px]" style={{ color: '#b04545', letterSpacing: '.04em' }}>
              {locationError || attachmentError}
            </p>
          ) : null}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*,audio/*"
            multiple
            className="hidden"
            onChange={handleAttachmentSelect}
          />
        </div>

        <textarea
          ref={textareaRef}
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder={PLACEHOLDER[theme]}
          className="block w-full resize-none bg-transparent outline-none"
          style={{
            fontFamily: bodyFont,
            fontSize: bodyFontSize,
            lineHeight: 2.1,
            color: 'var(--d-ink)',
            minHeight: 300,
          }}
        />

        {drawingUrl ? (
          <div className="mt-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={drawingUrl}
              alt="涂鸦"
              className="max-w-full border"
              style={{
                borderColor: 'var(--d-border)',
                transform: `rotate(${theme === 'kraft' ? '-0.5deg' : '0deg'})`,
              }}
            />
          </div>
        ) : null}

        {attachments.length > 0 ? (
          <div className="mt-6 space-y-3">
            <div className="flex items-center justify-between">
              <p
                className="text-xs"
                style={{
                  color: 'var(--d-ink-3)',
                  letterSpacing: '.14em',
                  fontFamily: 'var(--d-font-title)',
                }}
              >
                附件
              </p>
              <span className="text-[11px]" style={{ color: 'var(--d-ink-3)' }}>
                {attachments.length} 个
              </span>
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {attachments.map((attachment) => (
                <div
                  key={attachment.id}
                  className="overflow-hidden border"
                  style={{ borderColor: 'var(--d-border)', background: 'var(--d-bg)' }}
                >
                  <div className="relative">
                    {(attachment.type === 'image' || attachment.type === 'gif') ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={attachment.url}
                        alt={attachment.name}
                        className="h-40 w-full object-cover"
                      />
                    ) : attachment.type === 'video' ? (
                      <video
                        src={attachment.url}
                        controls
                        className="h-40 w-full object-cover"
                      />
                    ) : attachment.type === 'audio' ? (
                      <div className="flex h-40 items-center justify-center bg-[var(--d-bg-warm)]">
                        <div className="w-full max-w-[280px] px-4">
                          <div className="mb-3 flex items-center gap-2" style={{ color: 'var(--d-ink-2)' }}>
                            <Volume2 className="h-4 w-4" />
                            <span className="text-sm">语音 / 音频附件</span>
                          </div>
                          <audio src={attachment.url} controls className="w-full" />
                        </div>
                      </div>
                    ) : (
                      <div className="flex h-40 items-center justify-center bg-[var(--d-bg-warm)]">
                        <div className="text-sm" style={{ color: 'var(--d-ink-3)' }}>
                          已添加附件
                        </div>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => removeAttachment(attachment.id)}
                      className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full border bg-white/80 backdrop-blur"
                      style={{ borderColor: 'var(--d-border)', color: '#b04545' }}
                      aria-label={`删除 ${attachment.name}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="space-y-1 px-3 py-3">
                    <div className="flex items-center gap-2 text-[11px]" style={{ color: 'var(--d-ink-3)' }}>
                      {attachment.type === 'image' || attachment.type === 'gif' ? (
                        <ImagePlus className="h-3.5 w-3.5" />
                      ) : attachment.type === 'video' ? (
                        <Video className="h-3.5 w-3.5" />
                      ) : (
                        <Volume2 className="h-3.5 w-3.5" />
                      )}
                      <span>{attachment.type}</span>
                    </div>
                    <p
                      className="line-clamp-1 text-sm"
                      style={{ color: 'var(--d-ink)', fontFamily: 'var(--d-font-title)' }}
                    >
                      {attachment.name}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 text-[11px]" style={{ color: 'var(--d-ink-3)' }}>
                      <span>{formatFileSize(attachment.size)}</span>
                      {attachment.duration ? <span>{formatDuration(attachment.duration)}</span> : null}
                      {attachment.dimensions ? (
                        <span>{attachment.dimensions.width}×{attachment.dimensions.height}</span>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <div
        className="flex flex-none items-center gap-4 border-t px-6 py-1.5"
        style={{ borderColor: 'var(--d-border)' }}
      >
        <span
          className="text-[11px] tracking-wider"
          style={{
            color:
              status === 'saving'
                ? 'var(--d-accent)'
                : status === 'error'
                  ? '#c94040'
                  : 'var(--d-ink-3)',
            letterSpacing: '.15em',
            fontFamily: 'var(--d-font-title)',
          }}
        >
          {statusLabel}
        </span>
        <div className="flex-1" />
        {locationMeta ? (
          <span className="text-[11px]" style={{ color: 'var(--d-ink-3)', letterSpacing: '.1em' }}>
            <MapPin className="mr-1 inline h-3 w-3" />
            {getDiaryLocationLabel(locationMeta, location)}
          </span>
        ) : null}
        <span className="text-[11px]" style={{ color: 'var(--d-ink-3)', letterSpacing: '.1em' }}>
          {attachments.length} 附件
        </span>
        <span className="text-[11px]" style={{ color: 'var(--d-ink-3)', letterSpacing: '.1em' }}>
          {content.length} 字
        </span>
        <button
          onClick={save}
          className="border-b text-[11px] transition-opacity hover:opacity-60"
          style={{
            color: 'var(--d-accent)',
            borderColor: 'var(--d-accent)',
            letterSpacing: '.1em',
          }}
        >
          保存
        </button>
      </div>
    </div>
  );
}
