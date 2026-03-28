'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  User, Save, X, Loader2, 
  MapPin, Briefcase, Mail, Github, Twitter, Globe,
  Quote
} from 'lucide-react';
import { ImageUploader } from '@/components/ImageUploader';
import { PasskeyManager } from '@/components/PasskeyManager';
import { useProfile } from '@/components/ProfileProvider';
import { useAdmin } from '@/components/AdminProvider';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { StatePanel } from '@/components/ui/StatePanel';
import { Textarea } from '@/components/ui/Textarea';

export default function ProfilePage() {
  const { profile, updateProfile, loading: profileLoading } = useProfile();
  const { isAdmin, loading: adminLoading, showLoginModal } = useAdmin();
  const [formData, setFormData] = useState(profile);
  const [saving, setSaving] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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
    setSaveMessage(null);
    try {
      await updateProfile(formData);
      setSaveMessage({ type: 'success', text: '个人资料已保存' });
    } catch (error) {
      console.error('保存失败:', error);
      setSaveMessage({
        type: 'error',
        text: error instanceof Error ? error.message : '保存失败，请稍后重试',
      });
    } finally {
      setSaving(false);
    }
  }

  if (profileLoading || adminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <StatePanel
          tone="loading"
          title="正在加载个人资料"
          description="稍等一下，我们正在同步最新的站点信息。"
          icon={<Loader2 className="h-6 w-6 animate-spin" />}
          className="w-full max-w-md"
        />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <StatePanel
          tone="empty"
          title="需要管理员权限"
          description="个人资料页现在已经接入服务端保存，编辑前需要先登录管理员会话。"
          icon={<User className="h-6 w-6" />}
          action={<Button onClick={() => showLoginModal()}>管理员登录</Button>}
          className="w-full max-w-md"
        />
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
        >
          <Card variant="elevated" padding="lg" className="border border-[color:var(--border-default)]">
          <form onSubmit={handleSubmit} className="space-y-8">
            {saveMessage && (
              <div className="rounded-[var(--radius-lg)] border border-[color:var(--border-default)] bg-[var(--surface-raised)] px-4 py-3">
                <div className="mb-2">
                  <Badge tone={saveMessage.type === 'success' ? 'success' : 'error'}>
                    {saveMessage.type === 'success' ? '已保存' : '保存失败'}
                  </Badge>
                </div>
                <p className="text-sm text-[var(--color-neutral-700)]">
                  {saveMessage.text}
                </p>
              </div>
            )}

            {/* 头像上传 */}
            <div>
              <label className="block text-sm font-medium mb-4">头像</label>
              <div className="flex items-center gap-6">
                <div className="relative">
                  {avatarPreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={avatarPreview}
                      alt="头像预览"
                      width={96}
                      height={96}
                      className="w-24 h-24 rounded-full object-cover border-4 border-primary/20"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[var(--gradient-start)] to-[var(--gradient-end)] flex items-center justify-center">
                      <User className="w-10 h-10 text-white" />
                    </div>
                  )}
                  {avatarPreview && (
                    <Button
                      type="button"
                      onClick={() => {
                        setAvatarPreview('');
                        setFormData({ ...formData, avatar: '' });
                      }}
                      variant="danger"
                      size="sm"
                      className="absolute -top-2 -right-2 h-8 w-8 rounded-full p-0"
                    >
                      <X className="w-3 h-3" />
                    </Button>
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
                <Input
                  type="text"
                  value={formData.nickname}
                  onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                  placeholder="你的网名"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">签名</label>
                <Input
                  type="text"
                  value={formData.signature}
                  onChange={(e) => setFormData({ ...formData, signature: e.target.value })}
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
              <Textarea
                value={formData.motto}
                onChange={(e) => setFormData({ ...formData, motto: e.target.value })}
                className="resize-none"
                rows={3}
                placeholder="激励自己的话语"
              />
            </div>

            {/* 个人简介 */}
            <div>
              <label className="block text-sm font-medium mb-2">个人简介</label>
              <Textarea
                value={formData.bio || ''}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                className="resize-none"
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
                <Input
                  type="text"
                  value={formData.occupation || ''}
                  onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                  placeholder="你的职业"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  地点
                </label>
                <Input
                  type="text"
                  value={formData.location || ''}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
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
                  <Input
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="flex-1"
                    placeholder="邮箱地址"
                  />
                </div>
                
                <div className="flex items-center gap-3">
                  <Github className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                  <Input
                    type="url"
                    value={formData.github || ''}
                    onChange={(e) => setFormData({ ...formData, github: e.target.value })}
                    className="flex-1"
                    placeholder="GitHub 链接"
                  />
                </div>
                
                <div className="flex items-center gap-3">
                  <Twitter className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                  <Input
                    type="url"
                    value={formData.twitter || ''}
                    onChange={(e) => setFormData({ ...formData, twitter: e.target.value })}
                    className="flex-1"
                    placeholder="Twitter 链接"
                  />
                </div>
                
                <div className="flex items-center gap-3">
                  <Globe className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                  <Input
                    type="url"
                    value={formData.website || ''}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    className="flex-1"
                    placeholder="个人网站"
                  />
                </div>
              </div>
            </div>

            {/* 保存按钮 */}
            <div className="flex justify-end pt-4">
              <Button
                type="submit"
                loading={saving}
                className="min-w-[8.5rem]"
              >
                <Save className="w-4 h-4" />
                {saving ? '保存中...' : '保存设置'}
              </Button>
            </div>
          </form>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18 }}
          className="mt-8"
        >
          <PasskeyManager />
        </motion.div>
      </div>
    </div>
  );
}
