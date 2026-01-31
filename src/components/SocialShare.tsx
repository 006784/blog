// 社交分享组件
'use client';

import { useState, useEffect } from 'react';
import { Share2, Heart, MessageCircle, ExternalLink, Copy, Check, Globe, Users, TrendingUp } from 'lucide-react';
import { SocialShareService, type ShareOptions } from '@/lib/diary/social-share-service';

interface SocialShareProps {
  diary: any;
  className?: string;
}

export function SocialShare({ diary, className = '' }: SocialShareProps) {
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  const [likes, setLikes] = useState(diary.likes || 0);
  const [liked, setLiked] = useState(false);
  const [shareStats, setShareStats] = useState(SocialShareService.getShareStats());

  // 更新分享统计
  useEffect(() => {
    setShareStats(SocialShareService.getShareStats());
  }, []);

  // 处理分享到平台
  const handleShare = (platform: string) => {
    const shareOptions: ShareOptions = {
      title: diary.title || '日记分享',
      text: diary.content?.substring(0, 100) + (diary.content?.length > 100 ? '...' : '') || '分享一篇有趣的日记',
      url: SocialShareService.generatePublicLink(diary.id),
      hashtags: diary.tags ? diary.tags.slice(0, 3) : []
    };

    if (platform === 'copy') {
      navigator.clipboard.writeText(shareOptions.url).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    } else {
      SocialShareService.shareToPlatform(platform, shareOptions);
    }

    setShowShareMenu(false);
  };

  // 处理点赞
  const handleLike = () => {
    if (liked) {
      setLikes(likes - 1);
    } else {
      setLikes(likes + 1);
    }
    setLiked(!liked);
  };

  // 获取社交平台图标
  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'twitter': return '🐦';
      case 'facebook': return '📘';
      case 'linkedin': return '💼';
      case 'weibo': return '📸';
      case 'copy': return copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />;
      default: return <Share2 className="w-4 h-4" />;
    }
  };

  return (
    <div className={`bg-white rounded-xl border border-gray-200 p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-medium text-gray-900 flex items-center gap-2">
          <Share2 className="w-4 h-4" />
          社交分享
        </h4>
        
        <div className="flex items-center gap-4 text-sm text-gray-500">
          <span className="flex items-center gap-1">
            <Heart className={`w-4 h-4 ${liked ? 'fill-red-500 text-red-500' : ''}`} />
            {likes}
          </span>
          <span className="flex items-center gap-1">
            <MessageCircle className="w-4 h-4" />
            {diary.comments || 0}
          </span>
          <span className="flex items-center gap-1">
            <Share2 className="w-4 h-4" />
            {shareStats.shareCount || 0}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* 点赞按钮 */}
        <button
          onClick={handleLike}
          className={`flex items-center gap-1 px-3 py-2 rounded-lg transition-colors ${
            liked 
              ? 'bg-red-100 text-red-600 hover:bg-red-200' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <Heart className={`w-4 h-4 ${liked ? 'fill-current' : ''}`} />
          <span className="text-sm">点赞</span>
        </button>

        {/* 分享按钮 */}
        <div className="relative">
          <button
            onClick={() => setShowShareMenu(!showShareMenu)}
            className="flex items-center gap-2 px-3 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
          >
            <Share2 className="w-4 h-4" />
            <span className="text-sm">分享</span>
          </button>

          {showShareMenu && (
            <div className="absolute bottom-full left-0 mb-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
              <div className="p-2">
                <div className="text-xs font-medium text-gray-500 mb-2">分享到</div>
                {SocialShareService.getSocialPlatforms().map((platform) => (
                  <button
                    key={platform.name}
                    onClick={() => handleShare(platform.name)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-left rounded hover:bg-gray-100 transition-colors"
                  >
                    <span>{getPlatformIcon(platform.name)}</span>
                    <span className="text-sm">{platform.displayName}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 公开分享链接 */}
        <button
          onClick={() => {
            const publicLink = SocialShareService.generatePublicLink(diary.id);
            navigator.clipboard.writeText(publicLink).then(() => {
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            });
          }}
          className="flex items-center gap-1 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm"
        >
          <Globe className="w-4 h-4" />
          {copied ? '已复制' : '公开链接'}
        </button>
      </div>

      {/* 分享统计 */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        <h5 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
          <TrendingUp className="w-3 h-3" />
          分享统计
        </h5>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-1">
            <span className="text-gray-500">总分享:</span>
            <span className="font-medium">{shareStats.shareCount || 0}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-gray-500">最近分享:</span>
            <span className="font-medium">
              {shareStats.lastShared ? new Date(shareStats.lastShared).toLocaleDateString() : '无'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// 朋友圈时间线组件
interface TimelineProps {
  diaries: any[];
  className?: string;
}

export function TimelineView({ diaries, className = '' }: TimelineProps) {
  const timelineData = SocialShareService.generateTimelineData(diaries);

  return (
    <div className={`bg-white rounded-xl border border-gray-200 p-4 ${className}`}>
      <h4 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
        <Users className="w-4 h-4" />
        朋友圈时间线
      </h4>

      <div className="space-y-6">
        {timelineData.map((day) => (
          <div key={day.date} className="border-l-2 border-amber-200 pl-4">
            <h5 className="font-medium text-gray-700 mb-3 -ml-4">{day.date}</h5>
            
            <div className="space-y-4">
              {day.entries.map((entry) => (
                <div key={entry.id} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <img
                      src={entry.avatar}
                      alt={entry.author}
                      className="w-8 h-8 rounded-full"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-gray-900">{entry.author}</span>
                        <span className="text-xs text-gray-500">
                          {entry.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      
                      <h6 className="font-medium text-gray-900 mb-2">{entry.title}</h6>
                      <p className="text-gray-700 mb-2">{entry.content}</p>
                      
                      {entry.tags && entry.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {entry.tags.map((tag: string, idx: number) => (
                            <span key={idx} className="px-2 py-1 bg-amber-100 text-amber-800 text-xs rounded">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                      
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <button className="flex items-center gap-1 hover:text-red-500">
                          <Heart className="w-3 h-3" />
                          {entry.likes}
                        </button>
                        <button className="flex items-center gap-1 hover:text-blue-500">
                          <MessageCircle className="w-3 h-3" />
                          {entry.comments}
                        </button>
                        <button className="flex items-center gap-1 hover:text-green-500">
                          <ExternalLink className="w-3 h-3" />
                          {entry.shares}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}