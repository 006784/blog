import crypto from 'crypto';
import type { NextRequest } from 'next/server';
import { isoBase64URL } from '@simplewebauthn/server/helpers';
import type {
  AuthenticatorTransportFuture,
  CredentialDeviceType,
  WebAuthnCredential,
} from '@simplewebauthn/server';
import { getAdminLoginEmail } from '@/lib/admin-email-login';
import { logger } from '@/lib/logger';
import { defaultProfile, normalizeProfile } from '@/lib/profile';
import { supabaseAdmin } from '@/lib/supabase';

const PASSKEYS_KEY = 'admin_passkeys';
const PROFILE_KEY = 'profile';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function normalizeString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeTransports(value: unknown): AuthenticatorTransportFuture[] | undefined {
  if (!Array.isArray(value)) return undefined;

  const allowed = new Set<AuthenticatorTransportFuture>([
    'ble',
    'cable',
    'hybrid',
    'internal',
    'nfc',
    'smart-card',
    'usb',
  ]);

  const transports = value.filter(
    (item): item is AuthenticatorTransportFuture =>
      typeof item === 'string' && allowed.has(item as AuthenticatorTransportFuture)
  );

  return transports.length > 0 ? transports : undefined;
}

export interface StoredAdminPasskey {
  id: string;
  name: string;
  publicKey: string;
  counter: number;
  transports?: AuthenticatorTransportFuture[];
  deviceType?: CredentialDeviceType;
  backedUp?: boolean;
  createdAt: string;
  lastUsedAt?: string;
}

export interface PublicAdminPasskey {
  id: string;
  name: string;
  deviceType?: CredentialDeviceType;
  backedUp?: boolean;
  createdAt: string;
  lastUsedAt?: string;
}

function normalizePasskeys(value: unknown): StoredAdminPasskey[] {
  if (!Array.isArray(value)) return [];

  return value
    .filter(isRecord)
    .reduce<StoredAdminPasskey[]>((result, item, index) => {
      const id = normalizeString(item.id);
      const publicKey = normalizeString(item.publicKey);
      if (!id || !publicKey) return result;

      const counter = typeof item.counter === 'number' && Number.isFinite(item.counter)
        ? item.counter
        : 0;

      const deviceType =
        item.deviceType === 'singleDevice' || item.deviceType === 'multiDevice'
          ? item.deviceType
          : undefined;

      result.push({
        id,
        name: normalizeString(item.name) || `通行密钥 ${index + 1}`,
        publicKey,
        counter,
        transports: normalizeTransports(item.transports),
        deviceType,
        backedUp: typeof item.backedUp === 'boolean' ? item.backedUp : undefined,
        createdAt: normalizeString(item.createdAt) || new Date().toISOString(),
        lastUsedAt: normalizeString(item.lastUsedAt) || undefined,
      } satisfies StoredAdminPasskey);

      return result;
    }, []);
}

export function sanitizePasskeyForClient(passkey: StoredAdminPasskey): PublicAdminPasskey {
  return {
    id: passkey.id,
    name: passkey.name,
    deviceType: passkey.deviceType,
    backedUp: passkey.backedUp,
    createdAt: passkey.createdAt,
    lastUsedAt: passkey.lastUsedAt,
  };
}

export async function getStoredAdminPasskeys(): Promise<StoredAdminPasskey[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from('site_settings')
      .select('value')
      .eq('key', PASSKEYS_KEY)
      .maybeSingle();

    if (error) throw error;
    return normalizePasskeys(data?.value);
  } catch (error) {
    logger.error('读取管理员通行密钥失败', {
      module: 'auth',
      error: error instanceof Error ? error.message : String(error),
    });
    return [];
  }
}

async function saveStoredAdminPasskeys(passkeys: StoredAdminPasskey[]): Promise<void> {
  const { error } = await supabaseAdmin
    .from('site_settings')
    .upsert(
      {
        key: PASSKEYS_KEY,
        value: passkeys,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'key' }
    );

  if (error) throw error;
}

export async function upsertStoredAdminPasskey(passkey: StoredAdminPasskey): Promise<void> {
  const current = await getStoredAdminPasskeys();
  const next = [
    passkey,
    ...current.filter((item) => item.id !== passkey.id),
  ];
  await saveStoredAdminPasskeys(next);
}

export async function removeStoredAdminPasskey(id: string): Promise<void> {
  const current = await getStoredAdminPasskeys();
  await saveStoredAdminPasskeys(current.filter((item) => item.id !== id));
}

export function toWebAuthnCredential(passkey: StoredAdminPasskey): WebAuthnCredential {
  return {
    id: passkey.id,
    publicKey: isoBase64URL.toBuffer(passkey.publicKey),
    counter: passkey.counter,
    transports: passkey.transports,
  };
}

export function createAdminPasskeyUserId(seed: string): Uint8Array {
  const digest = crypto.createHash('sha256').update(seed).digest();
  const buffer = new ArrayBuffer(digest.length);
  new Uint8Array(buffer).set(digest);
  return new Uint8Array(buffer);
}

export function getPasskeyRelyingParty(request: NextRequest) {
  const nextPublicSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, '');
  const siteOrigin = request.nextUrl.origin.replace(/\/$/, '');
  const origins = Array.from(new Set([siteOrigin, nextPublicSiteUrl].filter(Boolean) as string[]));
  const rpIDs = Array.from(new Set(origins.map((origin) => new URL(origin).hostname)));
  return {
    rpName: process.env.NEXT_PUBLIC_SITE_NAME || 'Lumen',
    origin: siteOrigin,
    origins,
    rpID: request.nextUrl.hostname,
    rpIDs,
  };
}

export async function getAdminPasskeyUserIdentity(): Promise<{
  userName: string;
  userDisplayName: string;
  userIdSeed: string;
}> {
  const fallbackEmail = (await getAdminLoginEmail()) || 'admin@localhost';

  try {
    const { data, error } = await supabaseAdmin
      .from('site_settings')
      .select('value')
      .eq('key', PROFILE_KEY)
      .maybeSingle();

    if (error) throw error;

    const profile = normalizeProfile(data?.value ?? defaultProfile);
    return {
      userName: fallbackEmail,
      userDisplayName: profile.nickname || '管理员',
      userIdSeed: fallbackEmail,
    };
  } catch {
    return {
      userName: fallbackEmail,
      userDisplayName: '管理员',
      userIdSeed: fallbackEmail,
    };
  }
}
