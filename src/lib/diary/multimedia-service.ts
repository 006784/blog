// 多媒体增强服务
// 包含语音录制、GIF支持等功能

export interface AudioRecording {
  id: string;
  blob: Blob;
  url: string;
  duration: number;
  mimeType: string;
  createdAt: Date;
}

export interface MediaAttachment {
  id: string;
  file: File;
  url: string;
  type: 'image' | 'video' | 'audio' | 'gif' | 'document';
  name: string;
  size: number;
  thumbnail?: string;
  createdAt: Date;
}

export class MultimediaService {
  // 语音录制相关
  private static mediaRecorder: MediaRecorder | null = null;
  private static audioChunks: Blob[] = [];
  private static recordingStartTime: number | null = null;

  /**
   * 检查浏览器是否支持录音
   */
  static isRecordingSupported(): boolean {
    return !!(navigator.mediaDevices && window.MediaRecorder);
  }

  /**
   * 开始录音
   */
  static async startRecording(onDataAvailable?: (chunk: Blob) => void): Promise<boolean> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      this.mediaRecorder = new MediaRecorder(stream);
      this.audioChunks = [];
      this.recordingStartTime = Date.now();

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
          onDataAvailable?.(event.data);
        }
      };

      this.mediaRecorder.start();
      return true;
    } catch (error) {
      console.error('录音启动失败:', error);
      return false;
    }
  }

  /**
   * 停止录音
   */
  static async stopRecording(): Promise<AudioRecording | null> {
    return new Promise((resolve) => {
      if (!this.mediaRecorder) {
        resolve(null);
        return;
      }

      this.mediaRecorder.onstop = async () => {
        try {
          const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
          const audioUrl = URL.createObjectURL(audioBlob);
          const duration = this.recordingStartTime 
            ? (Date.now() - this.recordingStartTime) / 1000 
            : 0;

          const recording: AudioRecording = {
            id: `recording_${Date.now()}`,
            blob: audioBlob,
            url: audioUrl,
            duration,
            mimeType: 'audio/webm',
            createdAt: new Date()
          };

          // 停止所有音轨
          this.mediaRecorder!.stream.getTracks().forEach(track => track.stop());
          this.mediaRecorder = null;
          this.recordingStartTime = null;

          resolve(recording);
        } catch (error) {
          console.error('停止录音失败:', error);
          resolve(null);
        }
      };

      this.mediaRecorder.stop();
    });
  }

  /**
   * 暂停录音
   */
  static pauseRecording(): void {
    this.mediaRecorder?.pause();
  }

  /**
   * 恢复录音
   */
  static resumeRecording(): void {
    this.mediaRecorder?.resume();
  }

  /**
   * 取消录音
   */
  static cancelRecording(): void {
    if (this.mediaRecorder) {
      this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
      this.mediaRecorder = null;
      this.audioChunks = [];
      this.recordingStartTime = null;
    }
  }

  /**
   * 处理媒体文件附件
   */
  static async processMediaAttachments(files: FileList): Promise<MediaAttachment[]> {
    const attachments: MediaAttachment[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const url = URL.createObjectURL(file);
      
      // 确定文件类型
      let type: MediaAttachment['type'] = 'document';
      if (file.type.startsWith('image/')) {
        type = 'image';
      } else if (file.type.startsWith('video/')) {
        type = 'video';
      } else if (file.type.startsWith('audio/')) {
        type = 'audio';
      } else if (file.type === 'image/gif') {
        type = 'gif';
      }

      // 生成缩略图（如果是图片或视频）
      let thumbnail: string | undefined;
      if (type === 'image') {
        thumbnail = await this.createImageThumbnail(file);
      } else if (type === 'video') {
        // 视频缩略图需要特殊处理，这里简化处理
        thumbnail = url;
      }

      const attachment: MediaAttachment = {
        id: `attachment_${Date.now()}_${i}`,
        file,
        url,
        type,
        name: file.name,
        size: file.size,
        thumbnail,
        createdAt: new Date()
      };

      attachments.push(attachment);
    }

    return attachments;
  }

  /**
   * 创建图片缩略图
   */
  private static createImageThumbnail(file: File): Promise<string> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // 设置缩略图尺寸
        const maxWidth = 200;
        const maxHeight = 200;
        let { width, height } = img;

        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };

      img.src = URL.createObjectURL(file);
    });
  }

  /**
   * 验证文件类型和大小
   */
  static validateFile(file: File, maxSize: number = 50 * 1024 * 1024): { isValid: boolean; error?: string } {
    // 检查文件大小
    if (file.size > maxSize) {
      return {
        isValid: false,
        error: `文件太大 (${(file.size / 1024 / 1024).toFixed(2)}MB)，最大支持${maxSize / 1024 / 1024}MB`
      };
    }

    // 检查文件类型
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'video/mp4', 'video/webm', 'video/quicktime',
      'audio/mp3', 'audio/wav', 'audio/mpeg', 'audio/webm',
      'image/gif' // 专门列出GIF
    ];

    if (!allowedTypes.includes(file.type)) {
      return {
        isValid: false,
        error: `不支持的文件类型: ${file.type}`
      };
    }

    return { isValid: true };
  }

  /**
   * 上传媒体文件到服务器
   */
  static async uploadMedia(file: File, folder: string = 'diary-media'): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', folder);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || '上传失败');
      }

      return {
        success: true,
        url: result.url
      };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message
      };
    }
  }

  /**
   * 从URL获取媒体信息
   */
  static getMediaInfo(url: string, type: string): Promise<{ duration?: number; dimensions?: { width: number; height: number } }> {
    return new Promise((resolve) => {
      if (type.startsWith('image/')) {
        const img = new Image();
        img.onload = () => {
          resolve({
            dimensions: { width: img.naturalWidth, height: img.naturalHeight }
          });
        };
        img.onerror = () => resolve({});
        img.src = url;
      } else if (type.startsWith('video/')) {
        const video = document.createElement('video');
        video.preload = 'metadata';
        video.onloadedmetadata = () => {
          resolve({
            duration: video.duration,
            dimensions: { width: video.videoWidth, height: video.videoHeight }
          });
          URL.revokeObjectURL(url);
        };
        video.onerror = () => {
          resolve({});
          URL.revokeObjectURL(url);
        };
        video.src = url;
      } else if (type.startsWith('audio/')) {
        const audio = document.createElement('audio');
        audio.preload = 'metadata';
        audio.onloadedmetadata = () => {
          resolve({ duration: audio.duration });
          URL.revokeObjectURL(url);
        };
        audio.onerror = () => {
          resolve({});
          URL.revokeObjectURL(url);
        };
        audio.src = url;
      } else {
        resolve({});
      }
    });
  }

  /**
   * 释放媒体资源
   */
  static revokeObjectURL(url: string): void {
    URL.revokeObjectURL(url);
  }

  /**
   * 获取支持的媒体类型
   */
  static getSupportedMediaTypes(): string[] {
    return [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'video/mp4', 'video/webm', 'video/quicktime',
      'audio/mp3', 'audio/wav', 'audio/mpeg', 'audio/webm'
    ];
  }
}

// 语音波形可视化工具
export class AudioVisualizer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private analyser: AnalyserNode;
  private dataArray: Uint8Array;

  constructor(canvas: HTMLCanvasElement, audioContext: AudioContext, source: MediaStreamAudioSourceNode) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;

    this.analyser = audioContext.createAnalyser();
    this.analyser.fftSize = 256;
    const bufferLength = this.analyser.frequencyBinCount;
    this.dataArray = new Uint8Array(bufferLength);

    source.connect(this.analyser);
  }

  draw(): void {
    const width = this.canvas.width;
    const height = this.canvas.height;

    requestAnimationFrame(() => this.draw());

    this.analyser.getByteFrequencyData(this.dataArray);

    this.ctx.fillStyle = 'rgb(0, 0, 0)';
    this.ctx.fillRect(0, 0, width, height);

    const barWidth = (width / this.dataArray.length) * 2.5;
    let barHeight;
    let x = 0;

    for (let i = 0; i < this.dataArray.length; i++) {
      barHeight = this.dataArray[i] / 2;

      const red = barHeight + 100;
      const green = 200 - barHeight;
      const blue = 100;

      this.ctx.fillStyle = `rgb(${red}, ${green}, ${blue})`;
      this.ctx.fillRect(x, height - barHeight, barWidth, barHeight);

      x += barWidth + 1;
    }
  }
}