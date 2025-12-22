'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';

export interface Profile {
  nickname: string;
  avatar: string;
  signature: string;
  motto: string;
  bio?: string;
  location?: string;
  occupation?: string;
  github?: string;
  twitter?: string;
  linkedin?: string;
  email?: string;
  website?: string;
}

const defaultProfile: Profile = {
  nickname: '拾光博主',
  avatar: '',
  signature: '探索 · 记录 · 分享',
  motto: '用代码编织梦想，用文字记录时光',
  bio: '热爱技术与生活的开发者',
  location: '',
  occupation: '',
  github: '',
  twitter: '',
  email: '',
  website: '',
};

interface ProfileContextType {
  profile: Profile;
  loading: boolean;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const ProfileContext = createContext<ProfileContextType | null>(null);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<Profile>(defaultProfile);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      // 首先尝试从Supabase加载
      const { data, error } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'profile')
        .single();
      
      if (data && !error) {
        setProfile({ ...defaultProfile, ...data.value });
      } else if (typeof window !== 'undefined') {
        // 如果Supabase没有数据，尝试从localStorage加载
        const saved = localStorage.getItem('site_profile');
        if (saved) {
          setProfile({ ...defaultProfile, ...JSON.parse(saved) });
        }
      }
    } catch (error) {
      // 降级到localStorage
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('site_profile');
        if (saved) {
          setProfile({ ...defaultProfile, ...JSON.parse(saved) });
        }
      }
    } finally {
      setLoading(false);
    }
  }

  async function updateProfile(updates: Partial<Profile>) {
    const newProfile = { ...profile, ...updates };
    setProfile(newProfile);
    
    // 保存到localStorage作为备份
    localStorage.setItem('site_profile', JSON.stringify(newProfile));
    
    try {
      // 尝试保存到Supabase
      const { error } = await supabase
        .from('site_settings')
        .upsert({
          key: 'profile',
          value: newProfile,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'key' });
      
      if (error) {
        console.error('保存到Supabase失败:', error);
      }
    } catch (error) {
      console.error('保存失败:', error);
    }
  }

  async function refreshProfile() {
    await loadProfile();
  }

  return (
    <ProfileContext.Provider value={{ profile, loading, updateProfile, refreshProfile }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const context = useContext(ProfileContext);
  if (!context) {
    return {
      profile: defaultProfile,
      loading: false,
      updateProfile: async () => {},
      refreshProfile: async () => {},
    };
  }
  return context;
}
