// 语音录制组件
'use client';

import { useState, useRef, useEffect } from 'react';
import { Mic, Square, Pause, RotateCcw, Volume2, Download } from 'lucide-react';
import { MultimediaService, type AudioRecording } from '@/lib/diary/multimedia-service';

interface VoiceRecorderProps {
  onRecordingComplete: (recording: AudioRecording) => void;
  className?: string;
}

export function VoiceRecorder({ onRecordingComplete, className = '' }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordings, setRecordings] = useState<AudioRecording[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    // 检查浏览器是否支持录音
    setSupported(MultimediaService.isRecordingSupported());
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const startRecording = async () => {
    if (!(await MultimediaService.startRecording())) {
      alert('无法启动录音，请检查麦克风权限');
      return;
    }

    setIsRecording(true);
    setIsPaused(false);
    setRecordingTime(0);

    // 开始计时
    timerRef.current = setInterval(() => {
      setRecordingTime(prev => prev + 1);
    }, 1000);
  };

  const stopRecording = async () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    const recording = await MultimediaService.stopRecording();
    if (recording) {
      setRecordings(prev => [...prev, recording]);
      onRecordingComplete(recording);
    }

    setIsRecording(false);
    setIsPaused(false);
    setRecordingTime(0);
  };

  const pauseRecording = () => {
    MultimediaService.pauseRecording();
    setIsPaused(true);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const resumeRecording = () => {
    MultimediaService.resumeRecording();
    setIsPaused(false);
    
    // 重新开始计时
    timerRef.current = setInterval(() => {
      setRecordingTime(prev => prev + 1);
    }, 1000);
  };

  const cancelRecording = () => {
    MultimediaService.cancelRecording();
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsRecording(false);
    setIsPaused(false);
    setRecordingTime(0);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const deleteRecording = (id: string) => {
    setRecordings(prev => {
      const recordingToDelete = prev.find(r => r.id === id);
      if (recordingToDelete) {
        URL.revokeObjectURL(recordingToDelete.url);
      }
      return prev.filter(r => r.id !== id);
    });
  };

  if (!supported) {
    return (
      <div className={`p-4 bg-red-50 border border-red-200 rounded-lg ${className}`}>
        <p className="text-red-700 text-sm">您的浏览器不支持录音功能</p>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-xl border border-gray-200 p-4 ${className}`}>
      <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
        <Mic className="w-4 h-4" />
        语音录制
      </h4>

      {/* 录音控制 */}
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={isRecording ? stopRecording : startRecording}
          className={`flex items-center justify-center w-12 h-12 rounded-full ${
            isRecording 
              ? 'bg-red-500 hover:bg-red-600' 
              : 'bg-green-500 hover:bg-green-600'
          } text-white transition-colors`}
          title={isRecording ? '停止录音' : '开始录音'}
        >
          {isRecording ? <Square className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>

        {isRecording && (
          <>
            <button
              onClick={isPaused ? resumeRecording : pauseRecording}
              className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-500 hover:bg-blue-600 text-white transition-colors"
              title={isPaused ? '恢复录音' : '暂停录音'}
            >
              {isPaused ? '▶' : <Pause className="w-4 h-4" />}
            </button>
            
            <button
              onClick={cancelRecording}
              className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-500 hover:bg-gray-600 text-white transition-colors"
              title="取消录音"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </>
        )}

        <div className="ml-auto text-sm font-mono text-gray-600">
          {formatTime(recordingTime)}
        </div>
      </div>

      {/* 录音状态提示 */}
      {isRecording && (
        <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-red-600 font-medium">正在录音</span>
            </div>
            <div className="flex-1 h-1 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-red-500 animate-pulse" 
                style={{ width: `${(recordingTime % 5) * 20}%` }}
              ></div>
            </div>
          </div>
        </div>
      )}

      {/* 录音列表 */}
      {recordings.length > 0 && (
        <div className="space-y-2">
          <h5 className="text-sm font-medium text-gray-700">已录制的音频</h5>
          {recordings.map(recording => (
            <div key={recording.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
              <Volume2 className="w-4 h-4 text-gray-500" />
              <div className="flex-1 min-w-0">
                <div className="text-sm text-gray-900 truncate">
                  录音 {recording.id.split('_')[1]}
                </div>
                <div className="text-xs text-gray-500">
                  {recording.duration.toFixed(1)}秒 • {new Date(recording.createdAt).toLocaleString()}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <audio 
                  src={recording.url} 
                  controls 
                  className="max-w-32"
                />
                <button
                  onClick={() => deleteRecording(recording.id)}
                  className="p-1 text-red-500 hover:bg-red-50 rounded"
                  title="删除录音"
                >
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}