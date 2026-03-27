'use client';

import { createContext, useCallback, useContext, useState, useEffect, ReactNode } from 'react';
import { defaultProfile, normalizeProfile, type Profile } from '@/lib/profile';

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

  const readProfileFromStorage = useCallback(() => {
    if (typeof window === 'undefined') return null;

    const saved = localStorage.getItem('site_profile');
    if (!saved) return null;

    try {
      return normalizeProfile(JSON.parse(saved));
    } catch {
      return null;
    }
  }, []);

  const loadProfile = useCallback(async () => {
    try {
      const res = await fetch('/api/profile', {
        credentials: 'include',
        cache: 'no-store',
      });

      if (res.ok) {
        const result = await res.json();
        const nextProfile = normalizeProfile(result?.data);
        setProfile(nextProfile);
        if (typeof window !== 'undefined') {
          localStorage.setItem('site_profile', JSON.stringify(nextProfile));
        }
        return;
      }

      const fallbackProfile = readProfileFromStorage();
      if (fallbackProfile) {
        setProfile(fallbackProfile);
      }
    } catch {
      const fallbackProfile = readProfileFromStorage();
      if (fallbackProfile) {
        setProfile(fallbackProfile);
      }
    } finally {
      setLoading(false);
    }
  }, [readProfileFromStorage]);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  async function updateProfile(updates: Partial<Profile>) {
    const previousProfile = profile;
    const newProfile = normalizeProfile({ ...profile, ...updates });
    setProfile(newProfile);

    if (typeof window !== 'undefined') {
      localStorage.setItem('site_profile', JSON.stringify(newProfile));
    }

    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newProfile),
      });

      const result = await res.json().catch(() => null);
      if (!res.ok || !result?.success) {
        throw new Error(result?.error || '保存个人资料失败');
      }

      const savedProfile = normalizeProfile(result.data);
      setProfile(savedProfile);
      if (typeof window !== 'undefined') {
        localStorage.setItem('site_profile', JSON.stringify(savedProfile));
      }
    } catch (error) {
      setProfile(previousProfile);
      if (typeof window !== 'undefined') {
        localStorage.setItem('site_profile', JSON.stringify(previousProfile));
      }
      throw error;
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
