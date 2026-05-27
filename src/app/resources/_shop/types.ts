export interface ResourceProduct {
  id: string;
  title: string;
  description: string;
  category: string;
  price: number;
  originalPrice?: number;
  includes: string[];
  tags: string[];
  updateLabel: string;
  delivery: string;
}

export interface AiRechargeService {
  id: string;
  service: 'chatgpt' | 'claude' | 'apple';
  plan: string;
  desc: string;
  priceMonthly: number;
  originalPrice?: number;
  priceNote: string;
  badge?: string;
  features: string[];
  featured?: boolean;
  credentialType?: 'token' | 'password' | 'none';
  isReadyMade?: boolean;
}

export interface AccountService {
  id: string;
  platform: 'twitter' | 'telegram' | 'gmail' | 'instagram';
  name: string;
  desc: string;
  price: number;
  originalPrice?: number;
  badge?: string;
  features: string[];
  delivery: string;
}

export interface DigitalItem {
  id: string;
  type: 'ebook' | 'video';
  title: string;
  desc: string;
  price: number;
  originalPrice?: number;
  badge?: string;
  includes: string[];
  delivery: string;
  tags: string[];
}

export interface DigitalProduct {
  id: string;
  title: string;
  description: string;
  type: 'ebook' | 'video';
  price: number;
  original_price: number | null;
  cover_url: string | null;
  netdisk_type: 'baidu' | 'quark';
  tags: string[];
  sort_order: number;
  created_at: string;
}

export interface CartItem {
  id: string;
  title: string;
  price: number;
  qty: number;
}

export type PaymentMethod = 'wechat' | 'alipay';

export interface ShopOrder {
  id: string;
  order_number: string;
  amount_cents: number;
  status: 'pending' | 'paid' | 'delivered' | 'cancelled' | 'refunded';
}

export interface ShopNotice {
  type: 'success' | 'error' | 'info';
  message: string;
}
