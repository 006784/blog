'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  User, Camera, Save, X, Loader2, 
  MapPin, Briefcase, Mail, Github, Twitter, Globe,
  Quote, StickyNote
} from 'lucide-react';
import { ImageUploader } from '@/components/ImageUploader';
import { useProfile } from '@/components/ProfileProvider';
import { useAdmin } from '@/components/AdminProvider';

export default function ProfilePage() {
  const { profile, updateProfile, loading: profileLoading } = useProfile();
  const { isAdmin, showLoginModal } = useAdmin();
  const [formData, setFormData] = useState(profile);
  const [saving, setSaving] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState('');

  useEffect(() => {
    setFormData(profile);
    setAvatarPreview(profile.avatar);
  }, [profile]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isAdmin) {
      showLoginModal();
      return;
    }
    
    setSaving(true);
    try {
      await updateProfile(formData);
    } catch (error) {
      console.error('保存失败:', error);
    } finally {
      setSaving(false);
    }
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <User className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">需要管理员权限才能编辑个人资料</p>
          <button 
            onClick={showLoginModal}
            className="btn-primary"
          >
            管理员登录
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-3xl md:text-4xl font-bold gradient-text mb-4">
            个人资料设置
          </h1>
          <p className="text-muted-foreground">
            自定义你的个人信息和展示内容
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card rounded-2xl border border-border/50 p-6 md:p-8"
        >
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* 头像上传 */}
            <div>
              <label className="block text-sm font-medium mb-4">头像</label>
              <div className="flex items-center gap-6">
                <div className="relative">
                  {avatarPreview ? (
                    <img 
                      src={avatarPreview} 
                      alt="头像预览" 
                      className="w-24 h-24 rounded-full object-cover border-4 border-primary/20"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[var(--gradient-start)] to-[var(--gradient-end)] flex items-center justify-center">
                      <User className="w-10 h-10 text-white" />
                    </div>
                  )}
                  {avatarPreview && (
                    <button
                      type="button"
                      onClick={() => {
                        setAvatarPreview('');
                        setFormData({ ...formData, avatar: '' });
                      }}
                      className="absolute -top-2 -right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
                <ImageUploader
                  onUpload={(url) => {
                    setAvatarPreview(url);
                    setFormData({ ...formData, avatar: url });
                  }}
                  folder="avatars"
                  aspectRatio="square"
                  className="flex-1 max-w-xs"
                />
              </div>
            </div>

            {/* 基本信息 */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">网名 *</label>
                <input
                  type="text"
                  value={formData.nickname}
                  onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-muted border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  placeholder="你的网名"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">签名</label>
                <input
                  type="text"
                  value={formData.signature}
                  onChange={(e) => setFormData({ ...formData, signature: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-muted border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  placeholder="一句话介绍自己"
                />
              </div>
            </div>

            {/* 座右铭 */}
            <div>
              <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                <Quote className="w-4 h-4" />
                座右铭
              </label>
              <textarea
                value={formData.motto}
                onChange={(e) => setFormData({ ...formData, motto: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-muted border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none"
                rows={3}
                placeholder="激励自己的话语"
              />
            </div>

            {/* 个人简介 */}
            <div>
              <label className="block text-sm font-medium mb-2">个人简介</label>
              <textarea
                value={formData.bio || ''}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-muted border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none"
                rows={4}
                placeholder="详细介绍你自己..."
              />
            </div>

            {/* 详细信息 */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                  <Briefcase className="w-4 h-4" />
                  职业
                </label>
                <input
                  type="text"
                  value={formData.occupation || ''}
                  onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-muted border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  placeholder="你的职业"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  地点
                </label>
                <input
                  type="text"
                  value={formData.location || ''}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-muted border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  placeholder="你所在的城市"
                />
              </div>
            </div>

            {/* 社交链接 */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">社交链接</h3>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                  <input
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="flex-1 px-4 py-3 rounded-xl bg-muted border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm"
                    placeholder="邮箱地址"
                  />
                </div>
                
                <div className="flex items-center gap-3">
                  <Github className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                  <input
                    type="url"
                    value={formData.github || ''}
                    onChange={(e) => setFormData({ ...formData, github: e.target.value })}
                    className="flex-1 px-4 py-3 rounded-xl bg-muted border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm"
                    placeholder="GitHub 链接"
                  />
                </div>
                
                <div className="flex items-center gap-3">
                  <Twitter className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                  <input
                    type="url"
                    value={formData.twitter || ''}
                    onChange={(e) => setFormData({ ...formData, twitter: e.target.value })}
                    className="flex-1 px-4 py-3 rounded-xl bg-muted border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm"
                    placeholder="Twitter 链接"
                  />
                </div>
                
                <div className="flex items-center gap-3">
                  <Globe className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                  <input
                    type="url"
                    value={formData.website || ''}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    className="flex-1 px-4 py-3 rounded-xl bg-muted border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm"
                    placeholder="个人网站"
                  />
                </div>
              </div>
            </div>

            {/* 保存按钮 */}
            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={saving}
                className="btn-primary px-8 py-3 flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    保存中...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    保存设置
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}