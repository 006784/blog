export interface Profile {
  nickname: string;
  avatar: string;
  signature: string;
  motto: string;
  bio: string;
  location: string;
  occupation: string;
  github: string;
  twitter: string;
  linkedin: string;
  email: string;
  website: string;
}

export const defaultProfile: Profile = {
  nickname: 'Lumen博主',
  avatar: '',
  signature: '探索 · 记录 · 分享',
  motto: '用代码编织梦想，用文字记录时光',
  bio: '热爱技术与生活的开发者',
  location: '',
  occupation: '',
  github: '',
  twitter: '',
  linkedin: '',
  email: '',
  website: '',
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function normalizeString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

export function normalizeProfile(value: unknown): Profile {
  const input = isRecord(value) ? value : {};

  return {
    nickname: normalizeString(input.nickname) || defaultProfile.nickname,
    avatar: normalizeString(input.avatar),
    signature: normalizeString(input.signature) || defaultProfile.signature,
    motto: normalizeString(input.motto) || defaultProfile.motto,
    bio: normalizeString(input.bio) || defaultProfile.bio,
    location: normalizeString(input.location),
    occupation: normalizeString(input.occupation),
    github: normalizeString(input.github),
    twitter: normalizeString(input.twitter),
    linkedin: normalizeString(input.linkedin),
    email: normalizeString(input.email),
    website: normalizeString(input.website),
  };
}
