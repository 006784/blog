'use client';

import { useState, useEffect, useRef, useCallback, useMemo, type DragEvent } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FolderOpen, Upload, File, Image, Video, FileText, Package, Music,
  Trash2, X, Minus,
  Copy, Check, Shield, Settings, Plus, Edit2,
  AlertCircle, CheckCircle2,
  Folder, Archive, Code, Database, Book, Link, Star, ShoppingBag,
  QrCode, LockKeyhole, WalletCards, MessageCircle, Mail,
  ChevronRight, ChevronDown, Clock,
} from 'lucide-react';
import { useAdmin } from '@/components/AdminProvider';
import {
  APPLE_EASE_SOFT,
  APPLE_SPRING_GENTLE,
  HOVER_BUTTON,
  HOVER_LIFT,
  TAP_BUTTON,
  modalBackdropVariants,
  modalPanelVariants,
} from '@/components/Animations';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import { StatePanel } from '@/components/ui/StatePanel';
import { Textarea } from '@/components/ui/Textarea';

interface Resource {
  id: string;
  name: string;
  original_name: string;
  description?: string;
  file_url: string;
  file_size: number;
  file_type: string;
  category: string;
  extension: string;
  is_public: boolean;
  download_count: number;
  tags: string[];
  created_at: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon: string;
  color: string;
  sort_order: number;
  is_system: boolean;
}

interface ResourceNotice {
  type: 'success' | 'error' | 'info';
  message: string;
}

interface ResourceProduct {
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
  resource?: Resource;
}

interface AiRechargeService {
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
  /** 代充所需凭证类型 */
  credentialType?: 'token' | 'password' | 'none';
  /** 成品号：付款后站长发送账号密码 */
  isReadyMade?: boolean;
}

const aiRechargeServices: AiRechargeService[] = [
  {
    id: 'chatgpt-plus-turkey',
    service: 'chatgpt',
    plan: 'ChatGPT Plus 土耳其区',
    desc: '土耳其区 OpenAI 官方订阅，价格约为美区 40%，GPT-4o / o3 / DALL·E / 联网 / GPTs 全功能无阉割。',
    priceMonthly: 68,
    originalPrice: 168,
    priceNote: '美区标准价 ¥168，节省超 60%',
    badge: '最低价',
    featured: true,
    credentialType: 'password',
    features: ['GPT-4o / o3 全模型', 'DALL·E 3 图像生成', '联网实时搜索', '自定义 GPTs', 'Projects 协作', '语音对话模式'],
  },
  {
    id: 'chatgpt-plus-turkey-ready',
    service: 'chatgpt',
    plan: 'ChatGPT Plus 土耳其区（成品号）',
    desc: '由站长注册并激活土耳其区 Plus 的成品账号，付款后直接发送账号密码，即买即用。',
    priceMonthly: 88,
    priceNote: '买断式账号，拿到即有效',
    badge: '即买即用',
    credentialType: 'none',
    isReadyMade: true,
    features: ['完整账号 + 密码', 'GPT-4o / o3 全模型', 'DALL·E 3 / 联网', '自定义 GPTs', '不需要提供自己的账号'],
  },
  {
    id: 'claude-pro',
    service: 'claude',
    plan: 'Claude Pro（代充）',
    desc: '5× 更高用量，Claude Sonnet / Opus 完整访问，Projects 长上下文协作，提供 Session Token 代充。',
    priceMonthly: 168,
    priceNote: '约 $20/月，月付',
    badge: '',
    credentialType: 'token',
    features: ['Claude Sonnet/Opus 全模型', '5× 更高用量', 'Projects 协作', '优先访问新功能'],
  },
  {
    id: 'claude-pro-ready',
    service: 'claude',
    plan: 'Claude Pro（成品号）',
    desc: '站长注册并激活的 Claude Pro 成品账号，付款后直接收到账号密码，无需提供个人信息。',
    priceMonthly: 188,
    priceNote: '即买即用，含完整账号',
    badge: '成品号',
    credentialType: 'none',
    isReadyMade: true,
    features: ['完整账号 + 密码', 'Claude Sonnet/Opus', '5× 用量', '不需要提供自己的账号'],
  },
  {
    id: 'chatgpt-plus',
    service: 'chatgpt',
    plan: 'ChatGPT Plus 美区（代充）',
    desc: 'GPT-4o + o3 推理模型，DALL·E 图像生成。提供 Session Token，代充到自有账号。',
    priceMonthly: 168,
    priceNote: '约 $20/月，月付',
    badge: '',
    credentialType: 'token',
    features: ['GPT-4o / o3 全模型', 'DALL·E 生图', '联网搜索', '自定义 GPTs'],
  },
  {
    id: 'claude-max',
    service: 'claude',
    plan: 'Claude Max（代充）',
    desc: '20× 或 40× 超高用量，适合重度用户和开发者，含 Claude 全系列旗舰模型。',
    priceMonthly: 800,
    priceNote: '约 $100/月，月付',
    badge: '重度用户',
    credentialType: 'token',
    features: ['20× / 40× 超高用量', '全旗舰模型', '优先响应', '适合专业工作流'],
  },
  {
    id: 'apple-id-us',
    service: 'apple',
    plan: '美区 Apple ID（代注册）',
    desc: '由站长注册美区 Apple ID，付款后 24h 内发送完整账号密码，可用于 App Store 美区下载或订阅服务。',
    priceMonthly: 38,
    priceNote: '一次性服务，含账号 + 密码',
    badge: '即买即用',
    credentialType: 'none',
    isReadyMade: true,
    features: ['美区 Apple ID 完整账号', '注册邮箱 + 密码交付', 'App Store 美区可用', '付款后 24h 内交付'],
  },
];

interface CartItem {
  id: string;
  title: string;
  price: number;
  qty: number;
}

type PaymentMethod = 'wechat' | 'alipay';

interface ShopOrder {
  id: string;
  order_number: string;
  amount_cents: number;
  status: 'pending' | 'paid' | 'delivered' | 'cancelled' | 'refunded';
}

const payQrConfig = {
  wechat: process.env.NEXT_PUBLIC_WECHAT_PAY_QR || '',
  alipay: process.env.NEXT_PUBLIC_ALIPAY_PAY_QR || '',
};

const sampleProducts: ResourceProduct[] = [
  {
    id: 'starter-curation',
    title: '效率工具资料包',
    description: '适合做个人知识库、自动化工作流和常用软件配置的入门整理包。',
    category: '工具',
    price: 19.9,
    originalPrice: 39,
    includes: ['目录索引', '安装说明', '常用配置模板', '更新记录'],
    tags: ['自用整理', '持续更新', '网盘交付'],
    updateLabel: '示例商品',
    delivery: '付款确认后发送网盘链接',
  },
  {
    id: 'learning-pack',
    title: '学习资源索引包',
    description: '把公开课程、文档、阅读路线和检索关键词整理成一份可复用索引。',
    category: '学习',
    price: 29.9,
    originalPrice: 59,
    includes: ['学习路线', '资料索引', '检索关键词', '使用建议'],
    tags: ['公开资料', '索引服务', '适合收藏'],
    updateLabel: '示例商品',
    delivery: '付款确认后发送目录与链接',
  },
];

// 图标映射
const iconMap: Record<string, typeof File> = {
  image: Image, video: Video, 'file-text': FileText, package: Package,
  music: Music, file: File, folder: Folder, archive: Archive,
  code: Code, database: Database, book: Book, link: Link, star: Star,
};

// 颜色映射 — 杂志金墨配色
const colorMap: Record<string, { color: string; bg: string }> = {
  blue:   { color: 'text-(--ink)',           bg: 'bg-(--paper-deep)' },
  purple: { color: 'text-(--ink-secondary)',  bg: 'bg-(--paper-deep)' },
  green:  { color: 'text-(--gold)',           bg: 'bg-(--paper-deep)' },
  orange: { color: 'text-(--gold)',           bg: 'bg-(--paper-deep)' },
  pink:   { color: 'text-(--ink-secondary)',  bg: 'bg-(--paper-deep)' },
  red:    { color: 'text-(--ink)',            bg: 'bg-(--paper-deep)' },
  yellow: { color: 'text-(--gold)',           bg: 'bg-(--paper-deep)' },
  cyan:   { color: 'text-(--ink-secondary)',  bg: 'bg-(--paper-deep)' },
  gray:   { color: 'text-(--ink-muted)',      bg: 'bg-(--paper-deep)' },
};

// 获取分类配置
function getCategoryConfig(category: Category | undefined) {
  if (!category) return { icon: File, color: 'text-gray-500', bg: 'bg-gray-500/10', name: '未分类' };
  const icon = iconMap[category.icon] || File;
  const colors = colorMap[category.color] || colorMap.gray;
  return { icon, ...colors, name: category.name };
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  if (bytes < 1024 * 1024 * 1024) return (bytes / 1024 / 1024).toFixed(1) + ' MB';
  return (bytes / 1024 / 1024 / 1024).toFixed(2) + ' GB';
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function getResourcePrice(resource: Resource): number {
  const priceTag = resource.tags?.find((tag) => /^price[:=]\d+(\.\d+)?$/i.test(tag));
  if (!priceTag) return 19.9;
  const price = Number(priceTag.split(/[:=]/)[1]);
  return Number.isFinite(price) && price > 0 ? price : 19.9;
}

function createProductsFromResources(resources: Resource[], categories: Category[]): ResourceProduct[] {
  const visibleResources = resources.filter((resource) => resource.is_public).slice(0, 6);
  if (visibleResources.length === 0) return sampleProducts;

  return visibleResources.map((resource) => {
    const categoryName = categories.find((category) => category.slug === resource.category)?.name || resource.category || '资源包';
    const visibleTags = (resource.tags || []).filter((tag) => !/^price[:=]/i.test(tag));

    return {
      id: resource.id,
      title: resource.name,
      description: resource.description || '精选整理资料包，付款确认后交付对应网盘链接与必要说明。',
      category: categoryName,
      price: getResourcePrice(resource),
      originalPrice: Math.round(getResourcePrice(resource) * 1.8),
      includes: [
        resource.original_name || '资源文件',
        '网盘链接',
        '提取码/访问说明',
        '后续更新记录',
      ],
      tags: visibleTags.length > 0 ? visibleTags.slice(0, 3) : ['精选整理', '网盘交付', '人工确认'],
      updateLabel: formatDate(resource.created_at),
      delivery: '付款确认后发送网盘链接',
      resource,
    };
  });
}


export default function ResourcesPage() {
  const { isAdmin } = useAdmin();
  const [resources, setResources] = useState<Resource[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [notice, setNotice] = useState<ResourceNotice | null>(null);
  const [isDropActive, setIsDropActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [checkoutProduct, setCheckoutProduct] = useState<ResourceProduct | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);

  // AI 代充引导弹窗状态（必须在 hasModalOpen 之前声明）
  const [aiFlow, setAiFlow] = useState<{
    service: AiRechargeService;
    step: 1 | 2;
    email: string;
    accountPassword: string;
    sessionToken: string;
    tokenState: 'idle' | 'valid' | 'invalid';
    tokenMsg: string;
    paymentMethod: PaymentMethod;
    note: string;
    order: ShopOrder | null;
    submitting: boolean;
    copied: boolean;
  } | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('wechat');
  const [buyerContact, setBuyerContact] = useState('');
  const [buyerNote, setBuyerNote] = useState('');
  const [orderCopied, setOrderCopied] = useState(false);
  const [checkoutOrder, setCheckoutOrder] = useState<ShopOrder | null>(null);
  const [orderSubmitting, setOrderSubmitting] = useState(false);
  
  // 上传表单
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadName, setUploadName] = useState('');
  const [uploadDesc, setUploadDesc] = useState('');
  const [uploadTags, setUploadTags] = useState('');
  const [uploadPublic, setUploadPublic] = useState(false);
  const [uploadCategory, setUploadCategory] = useState('');
  
  // 分类管理表单
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [newCatName, setNewCatName] = useState('');
  const [newCatSlug, setNewCatSlug] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('folder');
  const [newCatColor, setNewCatColor] = useState('gray');
  const [savingCategory, setSavingCategory] = useState(false);

  const pushNotice = useCallback((type: ResourceNotice['type'], message: string) => {
    setNotice({ type, message });
  }, []);
  
  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch('/api/categories');
      const data = await res.json();
      setCategories(data.categories || []);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      pushNotice('error', '分类加载失败，请稍后重试。');
    }
  }, [pushNotice]);

  const fetchResources = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/resources');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'failed');
      setResources(data.resources || []);
    } catch (error) {
      console.error('Failed to fetch resources:', error);
      setResources([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    void fetchResources();
  }, [fetchResources]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), 3000);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const hasModalOpen = Boolean(showUploadModal || showCategoryModal || checkoutProduct || cartOpen || !!aiFlow);
  useEffect(() => {
    if (!hasModalOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [hasModalOpen]);

  useEffect(() => {
    if (!hasModalOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();

      if (aiFlow) {
        setAiFlow(null);
        return;
      }

      if (cartOpen) {
        setCartOpen(false);
        return;
      }

      if (showCategoryModal) {
        setShowCategoryModal(false);
        resetCategoryForm();
        return;
      }

      if (showUploadModal) {
        setShowUploadModal(false);
        return;
      }

      if (checkoutProduct) {
        setCheckoutProduct(null);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [hasModalOpen, aiFlow, cartOpen, showCategoryModal, showUploadModal, checkoutProduct]);

  const handleUpload = async () => {
    if (!uploadFile || !isAdmin) return;
    
    setUploading(true);
    setUploadProgress(0);
    
    try {
      // 步骤1: 获取预签名URL
      const presignRes = await fetch('/api/resources/presign', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: uploadFile.name,
          fileType: uploadFile.type || 'application/octet-stream',
          fileSize: uploadFile.size,
        }),
      });
      
      const presignData = await presignRes.json();
      
      if (!presignData.success) {
        pushNotice('error', presignData.error || '获取上传链接失败');
        return;
      }
      
      // 步骤2: 直接上传到R2
      setUploadProgress(10);
      
      const uploadRes = await fetch(presignData.uploadUrl, {
        method: 'PUT',
        body: uploadFile,
        headers: {
          'Content-Type': uploadFile.type || 'application/octet-stream',
        },
      });
      
      if (!uploadRes.ok) {
        throw new Error('文件上传失败');
      }
      
      setUploadProgress(80);
      
      // 步骤3: 保存资源信息到数据库
      const saveRes = await fetch('/api/resources/save', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: uploadName || uploadFile.name.replace(/\.[^/.]+$/, ''),
          originalName: uploadFile.name,
          description: uploadDesc,
          fileUrl: presignData.publicUrl,
          fileSize: uploadFile.size,
          fileType: uploadFile.type || 'application/octet-stream',
          category: uploadCategory || presignData.category,
          isPublic: uploadPublic,
          tags: uploadTags,
        }),
      });
      
      const saveData = await saveRes.json();
      
      if (saveData.success) {
        setUploadProgress(100);
        setShowUploadModal(false);
        setIsDropActive(false);
        resetUploadForm();
        void fetchResources();
        pushNotice('success', '资源上传成功。');
      } else {
        pushNotice('error', saveData.error || '保存失败');
      }
    } catch (error) {
      console.error('Upload error:', error);
      pushNotice('error', '上传失败，请稍后重试。');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个资源吗？此操作不可恢复！')) return;
    
    try {
      const res = await fetch('/api/resources', {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      
      const data = await res.json();
      
      if (data.success) {
        setResources(prev => prev.filter(r => r.id !== id));
        pushNotice('success', '资源已删除。');
      } else {
        pushNotice('error', data.error || '删除失败');
      }
    } catch (error) {
      console.error('Delete error:', error);
      pushNotice('error', '删除失败，请稍后重试。');
    }
  };

  const resetUploadForm = () => {
    setUploadFile(null);
    setUploadName('');
    setUploadDesc('');
    setUploadTags('');
    setUploadPublic(false);
    setUploadCategory('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const pickUploadFile = useCallback((file: File | null) => {
    if (!file) return;
    setUploadFile(file);
    setUploadName(file.name.replace(/\.[^/.]+$/, ''));
    pushNotice('info', `已选择文件：${file.name}`);
  }, [pushNotice]);

  const handleDropUploadFile = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDropActive(false);

    const file = event.dataTransfer.files?.[0] || null;
    pickUploadFile(file);
  };

  // 分类管理函数
  const resetCategoryForm = () => {
    setEditingCategory(null);
    setNewCatName('');
    setNewCatSlug('');
    setNewCatDesc('');
    setNewCatIcon('folder');
    setNewCatColor('gray');
  };

  const handleEditCategory = (cat: Category) => {
    setEditingCategory(cat);
    setNewCatName(cat.name);
    setNewCatSlug(cat.slug);
    setNewCatDesc(cat.description || '');
    setNewCatIcon(cat.icon);
    setNewCatColor(cat.color);
  };

  const handleSaveCategory = async () => {
    if (!newCatName || !newCatSlug) {
      pushNotice('error', '请填写分类名称和标识符。');
      return;
    }
    
    setSavingCategory(true);
    try {
      const url = '/api/categories';
      const method = editingCategory ? 'PUT' : 'POST';
      const body = {
        ...(editingCategory && { id: editingCategory.id }),
        name: newCatName,
        slug: newCatSlug,
        description: newCatDesc,
        icon: newCatIcon,
        color: newCatColor,
      };
      
      const res = await fetch(url, {
        method,
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      
      const data = await res.json();
      
      if (data.success) {
        void fetchCategories();
        resetCategoryForm();
        pushNotice('success', editingCategory ? '分类已更新。' : '分类已创建。');
      } else {
        pushNotice('error', data.error || '保存失败');
      }
    } catch (error) {
      console.error('Save category error:', error);
      pushNotice('error', '保存失败，请稍后重试。');
    } finally {
      setSavingCategory(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('确定要删除这个分类吗？')) return;
    
    try {
      const res = await fetch('/api/categories', {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      
      const data = await res.json();
      
      if (data.success) {
        void fetchCategories();
        pushNotice('success', '分类已删除。');
      } else {
        pushNotice('error', data.error || '删除失败');
      }
    } catch (error) {
      console.error('Delete category error:', error);
      pushNotice('error', '删除失败，请稍后重试。');
    }
  };

  const cartCount = cart.reduce((sum, i) => sum + i.qty, 0);
  const cartTotal = cart.reduce((sum, i) => sum + i.price * i.qty, 0);

  const addToCart = (id: string, title: string, price: number) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === id);
      if (existing) return prev.map(i => i.id === id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { id, title, price, qty: 1 }];
    });
    pushNotice('success', `「${title}」已加入购物车`);
  };

  const removeFromCart = (id: string) => setCart(prev => prev.filter(i => i.id !== id));

  const updateCartQty = (id: string, qty: number) => {
    if (qty < 1) { removeFromCart(id); return; }
    setCart(prev => prev.map(i => i.id === id ? { ...i, qty } : i));
  };

  const checkoutCart = () => {
    if (cart.length === 0) return;
    setCartOpen(false);
    openCheckout({
      id: 'cart-order',
      title: cart.length === 1 ? cart[0].title : `购物车结算（${cart.length}件商品）`,
      description: cart.map(i => `${i.title} × ${i.qty}`).join('、'),
      category: '购物车',
      price: cartTotal,
      includes: cart.map(i => `${i.title} × ${i.qty}`),
      tags: ['购物车结算', '人工确认'],
      updateLabel: '当前',
      delivery: '付款确认后分别交付各商品',
    });
  };

  const resourceProducts = useMemo(
    () => createProductsFromResources(resources, categories),
    [resources, categories]
  );
  const checkoutOrderId = checkoutOrder?.order_number || '提交后生成';
  const activePaymentQrEnv = paymentMethod === 'wechat'
    ? 'NEXT_PUBLIC_WECHAT_PAY_QR'
    : 'NEXT_PUBLIC_ALIPAY_PAY_QR';

  const openCheckout = (product: ResourceProduct) => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    setCheckoutProduct(product);
    setPaymentMethod('wechat');
    setBuyerContact('');
    setBuyerNote('');
    setOrderCopied(false);
    setCheckoutOrder(null);
    setOrderSubmitting(false);
  };

  // ── AI 代充引导弹窗 ──────────────────────────────────────────
  const openAiFlow = (svc: AiRechargeService) => {
    window.scrollTo({ top: 0, behavior: 'auto' });
    setAiFlow({
      service: svc, step: 1 as const,
      email: '', accountPassword: '', sessionToken: '',
      tokenState: 'idle', tokenMsg: '',
      paymentMethod: 'wechat', note: '',
      order: null, submitting: false, copied: false,
    });
  };

  const validateSessionToken = (token: string): { ok: boolean; msg: string } => {
    if (!token.trim()) return { ok: false, msg: '' };
    const t = token.trim();
    const parts = t.split('.');
    if (parts.length === 3 && parts.every(p => p.length > 0)) {
      try {
        const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
        if (payload.exp && payload.exp * 1000 < Date.now()) {
          return { ok: false, msg: 'Token 已过期，请重新登录后获取' };
        }
        return { ok: true, msg: '验证通过（Access Token 格式正确）' };
      } catch {
        return { ok: false, msg: '无法解析，请确认是否完整复制' };
      }
    }
    if (t.startsWith('%7B') || t.startsWith('{')) {
      return t.length > 80
        ? { ok: true, msg: '验证通过（Session Cookie 格式）' }
        : { ok: false, msg: '内容太短，请确认是否完整复制' };
    }
    if (t.length > 100 && /^[A-Za-z0-9+/=_%.\-|]+$/.test(t)) {
      return { ok: true, msg: '验证通过' };
    }
    return { ok: false, msg: t.length < 50 ? 'Token 通常超过 100 个字符，请确认是否完整' : '格式不符预期，请确认复制方式' };
  };

  const submitAiOrder = async () => {
    if (!aiFlow) return;
    if (!aiFlow.email.trim()) {
      pushNotice('error', '请填写联系邮箱');
      return;
    }
    try {
      setAiFlow(prev => prev ? { ...prev, submitting: true } : null);
      const credNote = (() => {
        if (aiFlow.service.credentialType === 'token') return `Session Token: ${aiFlow.sessionToken.slice(0, 16)}...`;
        if (aiFlow.service.credentialType === 'password') return `OpenAI 账号: ${aiFlow.email} / 密码: ${aiFlow.accountPassword}`;
        return '成品号/代注册服务';
      })();
      const res = await fetch('/api/resource-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: aiFlow.service.id,
          resourceId: null,
          productTitle: aiFlow.service.plan,
          productCategory: aiFlow.service.service === 'apple' ? '苹果账号' : 'AI 代充',
          paymentMethod: aiFlow.paymentMethod,
          buyerContact: aiFlow.email,
          buyerNote: [aiFlow.note, credNote].filter(Boolean).join(' | '),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.order) throw new Error(data.error || '创建订单失败');
      const order = data.order as ShopOrder;
      const credLine = (() => {
        if (aiFlow.service.credentialType === 'token') return `Session Token: ${aiFlow.sessionToken}`;
        if (aiFlow.service.credentialType === 'password') return `OpenAI 账号: ${aiFlow.email}\nOpenAI 密码: ${aiFlow.accountPassword}`;
        return '';
      })();
      const text = [
        `订单号：${order.order_number}`,
        `服务：${aiFlow.service.plan}`,
        `金额：￥${(order.amount_cents / 100).toFixed(0)}`,
        `联系方式：${aiFlow.email}`,
        credLine,
        aiFlow.note ? `备注：${aiFlow.note}` : '',
      ].filter(Boolean).join('\n');
      await navigator.clipboard.writeText(text);
      setAiFlow(prev => prev ? { ...prev, order, copied: true, submitting: false } : null);
      pushNotice('success', '订单已创建，信息已复制，请扫码付款后发给站长。');
      window.setTimeout(() => setAiFlow(prev => prev ? { ...prev, copied: false } : null), 2500);
    } catch (err) {
      const msg = err instanceof Error ? err.message : '创建订单失败';
      pushNotice('error', msg);
      setAiFlow(prev => prev ? { ...prev, submitting: false } : null);
    }
  };

  const copyOrderInfo = async (order: ShopOrder) => {
    if (!checkoutProduct) return;

    const text = [
      `订单号：${order.order_number}`,
      `资源：${checkoutProduct.title}`,
      `金额：￥${(order.amount_cents / 100).toFixed(2)}`,
      `支付方式：${paymentMethod === 'wechat' ? '微信' : '支付宝'}`,
      buyerContact ? `联系方式：${buyerContact}` : '',
      buyerNote ? `备注：${buyerNote}` : '',
    ].filter(Boolean).join('\n');

    try {
      await navigator.clipboard.writeText(text);
      setOrderCopied(true);
      pushNotice('success', '订单信息已复制，付款后发给站长核对。');
      window.setTimeout(() => setOrderCopied(false), 2000);
    } catch {
      pushNotice('error', '复制失败，请手动保存订单号。');
    }
  };

  const createOrderAndCopy = async () => {
    if (!checkoutProduct) return;
    if (!buyerContact.trim()) {
      pushNotice('error', '请先填写联系方式，方便付款后交付资料。');
      return;
    }

    try {
      setOrderSubmitting(true);
      const res = await fetch('/api/resource-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: checkoutProduct.id,
          resourceId: checkoutProduct.resource?.id || null,
          productTitle: checkoutProduct.title,
          productCategory: checkoutProduct.category,
          paymentMethod,
          buyerContact,
          buyerNote,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.order) {
        throw new Error(data.error || '创建订单失败');
      }

      const order = data.order as ShopOrder;
      setCheckoutOrder(order);
      await copyOrderInfo(order);
      pushNotice('success', '订单已保存，付款后把订单信息发给站长核对。');
    } catch (error) {
      const message = error instanceof Error ? error.message : '创建订单失败';
      pushNotice('error', message);
    } finally {
      setOrderSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen px-4 py-20 pb-14 sm:px-6 lg:px-8">
      <AnimatePresence>
        {notice && (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.32, ease: APPLE_EASE_SOFT }}
            className={`fixed left-1/2 top-20 z-50 flex -translate-x-1/2 items-center gap-2 border px-4 py-2 text-sm backdrop-blur-xl ${
              notice.type === 'success'
                ? 'border-(--gold) bg-(--ink) text-(--paper)'
                : notice.type === 'error'
                  ? 'border-(--line) bg-(--paper-warm) text-(--ink-secondary)'
                  : 'border-(--line) bg-(--paper-warm) text-(--ink)'
            }`}
          >
            {notice.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : notice.type === 'error' ? (
              <AlertCircle className="h-4 w-4" />
            ) : (
              <Check className="h-4 w-4" />
            )}
            <span>{notice.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mx-auto max-w-7xl space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 20, filter: 'blur(8px)' }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.62, ease: APPLE_EASE_SOFT }}
          className="space-y-5"
        >
          <Badge tone="info" variant="soft" className="w-fit gap-1.5">
            <ShoppingBag className="h-3.5 w-3.5" />
            Shop
          </Badge>
          <div className="max-w-2xl space-y-3">
            <h1 className="text-4xl font-semibold tracking-tight text-neutral-900 sm:text-5xl">
              商店
            </h1>
            <p className="text-sm leading-7 text-neutral-600 sm:text-base">
              AI 订阅代购与精选资料包。付款确认后交付网盘链接、提取码与使用说明。
            </p>
          </div>
        </motion.div>

        {/* AI 代充服务区块 */}
        <section className="space-y-6">
          <div className="res-section-head">
            <div>
              <p className="res-section-eyebrow">Digital Subscription · 代购代充</p>
              <h2 className="res-section-title">AI 订阅代购</h2>
            </div>
            <p className="res-section-note">
              提供账号邮箱 → 扫码付款 → 24 小时内代开通到账
            </p>
          </div>

          {/* ── Featured: GPT Plus 土耳其区 ── */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: APPLE_EASE_SOFT }}
            className="res-turkey-card-bg relative overflow-hidden rounded-3xl border border-orange-300/50 shadow-(--neu-shadow)"
          >
            {/* Decorative circles */}
            <div className="res-turkey-deco pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full opacity-[0.06]" />
            <div className="res-turkey-deco pointer-events-none absolute -bottom-12 left-1/3 h-48 w-48 rounded-full opacity-[0.04]" />
            {/* Top bar */}
            <div className="h-1 w-full bg-gradient-to-r from-orange-600/80 via-orange-400 to-orange-300/50" />

            <div className="relative px-6 py-8 lg:px-10 lg:py-10">
              {/* Badges row */}
              <div className="mb-6 flex flex-wrap items-center gap-2">
                <Badge tone="warning" variant="soft" className="gap-1.5 px-3 py-1 text-xs">
                  <Star className="h-3 w-3" />
                  限时特价
                </Badge>
                <Badge tone="success" variant="soft" className="px-3 py-1 text-xs">
                  省 ¥100+/月
                </Badge>
                <span className="text-xs text-ink-muted">
                  土耳其官方区域定价 · 功能与美区 Plus 完全相同
                </span>
              </div>

              <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
                {/* ── Left: product details ── */}
                <div className="space-y-6">
                  {/* Title */}
                  <div className="flex items-start gap-4">
                    <span className="mt-1 shrink-0 text-4xl leading-none">🇹🇷</span>
                    <div>
                      <h3 className="text-2xl font-bold text-ink sm:text-3xl">
                        ChatGPT Plus 土耳其区
                      </h3>
                      <p className="mt-1 text-sm text-ink-secondary">代开通 · 月度订阅 · OpenAI 官方渠道</p>
                    </div>
                  </div>

                  <p className="max-w-xl text-sm leading-7 text-ink-secondary">
                    土耳其是 OpenAI 官方区域定价国，价格远低于美区。代你完成区域订阅开通，功能与美区 ChatGPT Plus
                    100% 相同，包含最新 GPT-4o、o3 推理、DALL·E 图像生成、联网搜索等全部旗舰功能，无任何阉割。
                  </p>

                  {/* Feature grid */}
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {[
                      'GPT-4o / o3 全模型',
                      'DALL·E 3 图像生成',
                      '联网实时搜索',
                      '自定义 GPTs',
                      'Projects 协作',
                      '语音对话模式',
                    ].map((f) => (
                      <div
                        key={f}
                        className="res-turkey-feature-item flex items-center gap-2 rounded-xl border border-orange-200/60 px-3 py-2.5"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-orange-500" />
                        <span className="text-xs font-medium text-ink">{f}</span>
                      </div>
                    ))}
                  </div>

                  {/* Price comparison */}
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="res-turkey-price-bar rounded-2xl border border-orange-300/70 px-5 py-3 text-center">
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-orange-700/70">土耳其区</p>
                      <p className="mt-1 text-3xl font-bold text-orange-700">¥68</p>
                      <p className="mt-0.5 text-[11px] text-orange-600">/月</p>
                    </div>
                    <span className="text-lg font-light text-ink-muted">vs</span>
                    <div className="rounded-2xl border border-(--border-default) bg-(--surface-raised) px-5 py-3 text-center opacity-50">
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-ink-muted">美区</p>
                      <p className="mt-1 text-3xl font-bold text-ink-muted line-through">¥168</p>
                      <p className="mt-0.5 text-[11px] text-ink-muted">/月</p>
                    </div>
                    <div className="rounded-2xl border border-emerald-300/50 bg-emerald-500/10 px-4 py-2.5">
                      <p className="text-xs font-medium text-emerald-600">每月节省</p>
                      <p className="mt-0.5 text-2xl font-bold text-emerald-600">¥100</p>
                    </div>
                  </div>

                  {/* Delivery flow */}
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-muted">购买流程</p>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
                      {['提供 OpenAI 邮箱', '扫码支付', '代开通订阅', '24h 内到账'].map((step, i) => (
                        <span key={i} className="flex items-center gap-1.5">
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-orange-500/15 text-xs font-bold text-orange-600">
                            {i + 1}
                          </span>
                          <span className="text-xs text-ink-secondary">{step}</span>
                          {i < 3 && <ChevronRight className="h-3.5 w-3.5 shrink-0 text-ink-muted/40" />}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* ── Right: purchase panel ── */}
                <div className="space-y-4">
                  {/* CTA card */}
                  <div className="rounded-2xl border border-(--border-default) bg-(--surface-raised) p-5 shadow-(--neu-shadow-sm)">
                    <p className="text-xs uppercase tracking-[0.2em] text-ink-muted">立即订阅</p>
                    <div className="mt-2 flex items-baseline gap-2">
                      <span className="text-4xl font-bold text-ink">¥68</span>
                      <span className="text-sm text-ink-muted">/月</span>
                      <span className="ml-1 text-sm text-ink-muted line-through">¥168</span>
                    </div>
                    <p className="mt-0.5 text-xs font-medium text-orange-500">土耳其官方定价，节省约 60%</p>

                    <button
                      type="button"
                      onClick={() => openAiFlow(aiRechargeServices[0])}
                      className="res-turkey-btn mt-4 w-full rounded-xl py-3.5 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:opacity-90 active:translate-y-0"
                    >
                      立即代充 ChatGPT Plus
                    </button>
                    <button
                      type="button"
                      onClick={() => addToCart(aiRechargeServices[0].id, aiRechargeServices[0].plan, aiRechargeServices[0].priceMonthly)}
                      className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl border border-orange-300/60 py-2.5 text-sm font-medium text-orange-700 transition-all hover:bg-orange-50/50"
                    >
                      <ShoppingBag className="h-4 w-4" />
                      加入购物车
                    </button>

                    <div className="mt-4 space-y-2.5 border-t border-(--border-default) pt-4">
                      <div className="flex items-center gap-2 text-xs text-ink-secondary">
                        <Shield className="h-3.5 w-3.5 shrink-0 text-orange-400" />
                        <span>官方渠道，正规月度订阅</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-ink-secondary">
                        <Clock className="h-3.5 w-3.5 shrink-0 text-orange-400" />
                        <span>24 小时内完成代充</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-ink-secondary">
                        <MessageCircle className="h-3.5 w-3.5 shrink-0 text-orange-400" />
                        <span>问题售后可联系处理</span>
                      </div>
                    </div>
                  </div>

                  {/* FAQ accordion */}
                  <div className="rounded-2xl border border-(--border-default) bg-(--surface-raised) p-5">
                    <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-ink-muted">
                      常见问题
                    </p>
                    <div className="divide-y divide-(--border-default)">
                      {[
                        ['需要提供密码吗？', '土耳其区代充需要提供 OpenAI 账号邮箱和密码，用于登录并完成区域订阅。代充完成后建议立即修改密码。'],
                        ['功能和美区一样吗？', '完全相同。土耳其区是 OpenAI 官方定价区，ChatGPT 所有功能无任何差异。'],
                        ['到期后如何续费？', '可以到期前联系续费，续费依然享受土耳其区低价，也可自行续订。'],
                      ].map(([q, a]) => (
                        <details key={q} className="group py-3 first:pt-0 last:pb-0">
                          <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-medium text-ink select-none">
                            <span>{q}</span>
                            <ChevronDown className="h-4 w-4 shrink-0 text-ink-muted transition-transform duration-200 group-open:rotate-180" />
                          </summary>
                          <p className="mt-2 text-xs leading-5 text-ink-secondary">{a}</p>
                        </details>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* ── Secondary cards ── */}
          <div className="grid gap-5 md:grid-cols-3">
            {aiRechargeServices.filter((svc) => !svc.featured).map((svc, index) => (
              <motion.article
                key={svc.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.07, duration: 0.45, ease: APPLE_EASE_SOFT }}
              >
                <div className={`res-ai-card res-ai-card--${svc.service}`}>
                  <div className="res-ai-card__bar" />
                  <div className="res-ai-card__top">
                    <div className={`res-ai-card__logo res-ai-card__logo--${svc.service}`}>
                      {svc.service === 'chatgpt' ? (
                        <svg viewBox="0 0 24 24" fill="currentColor" className="res-ai-card__logo-icon">
                          <path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0L4.155 14.4A4.504 4.504 0 0 1 2.34 7.896zm16.597 3.855l-5.843-3.371 2.019-1.168a.076.076 0 0 1 .071 0l4.663 2.692a4.496 4.496 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.234-.58zm2.019-3.023l-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.664-2.691a4.504 4.504 0 0 1 6.683 4.668zm-12.64 4.135l-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.504 4.504 0 0 1 7.375-3.453l-.142.08L8.704 5.46a.795.795 0 0 0-.393.681zm1.097-2.365l2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5z"/>
                        </svg>
                      ) : svc.service === 'apple' ? (
                        <svg viewBox="0 0 24 24" fill="currentColor" className="res-ai-card__logo-icon">
                          <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701z"/>
                        </svg>
                      ) : (
                        <svg viewBox="0 0 24 24" fill="currentColor" className="res-ai-card__logo-icon">
                          <path d="M17.304 1.01h-1.146l-3.67 10.102h-1.03L7.788 1.01H6.646L2.837 11.944H1.01v1.112h5.002v-1.112H4.076l1.27-3.496h4.778l.718 1.976-1.197 3.295-1.073 2.954 1.073.39L17.304 1.01zm-10.48 7.326L8.972 3.11l2.15 5.226H6.824zm9.49 5.217c-.647 0-1.237.234-1.692.617l-.453-1.246h-1.047v9.066h1.134v-3.42c.455.384 1.045.617 1.692.617 1.46 0 2.647-1.188 2.647-2.817s-1.188-2.647-2.647-2.817zm-.198 4.495c-.895 0-1.622-.727-1.622-1.622v-.236c0-.895.727-1.622 1.622-1.622s1.622.727 1.622 1.622v.236c0 .895-.727 1.622-1.622 1.622z"/>
                        </svg>
                      )}
                    </div>
                    <div className="res-ai-card__meta">
                      <h3 className="res-ai-card__plan">{svc.plan}</h3>
                      {svc.badge && <span className="res-ai-card__badge">{svc.badge}</span>}
                    </div>
                  </div>

                  <p className="res-ai-card__desc">{svc.desc}</p>

                  <ul className="res-ai-card__features">
                    {svc.features.map((f) => (
                      <li key={f}>{f}</li>
                    ))}
                  </ul>

                  <div className="res-ai-card__foot">
                    <div>
                      <p className="res-ai-card__price-note">{svc.priceNote}</p>
                      <p className="res-ai-card__price">¥ {svc.priceMonthly.toFixed(0)}</p>
                    </div>
                    <div className="flex flex-col gap-2">
                      <button
                        type="button"
                        className="res-ai-card__btn"
                        onClick={() => openAiFlow(svc)}
                      >
                        {svc.isReadyMade ? '立即购买' : '立即代充'}
                      </button>
                      <button
                        type="button"
                        className="res-ai-card__btn--ghost"
                        onClick={() => addToCart(svc.id, svc.plan, svc.priceMonthly)}
                      >
                        <ShoppingBag className="h-3.5 w-3.5" />
                        加入购物车
                      </button>
                    </div>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        </section>

        {/* 精选资料包 */}
        <section className="space-y-6">
          <div className="res-section-head">
            <div>
              <p className="res-section-eyebrow">Featured Packs · 资料包</p>
              <h2 className="res-section-title">精选资料包</h2>
            </div>
            {isAdmin && (
              <p className="res-section-note">
                可用资源标签 <code className="res-section-code">price:29.9</code> 控制单价
              </p>
            )}
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {resourceProducts.map((product, index) => (
              <motion.article
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.06, duration: 0.48, ease: APPLE_EASE_SOFT }}
              >
                <div className="res-product-card">
                  <div className="res-product-card__bar" />

                  <div className="res-product-card__head">
                    <span className="res-product-card__cat">{product.category}</span>
                    <span className="res-product-card__date">{product.updateLabel}</span>
                  </div>

                  <h3 className="res-product-card__name">{product.title}</h3>
                  <p className="res-product-card__desc">{product.description}</p>

                  <ul className="res-product-card__items">
                    {product.includes.slice(0, 4).map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>

                  <div className="res-product-card__foot">
                    <div>
                      <p className="res-product-card__delivery">{product.delivery}</p>
                      <p className="res-product-card__price">
                        <span className="res-product-card__price-curr">¥{product.price.toFixed(2)}</span>
                        {product.originalPrice ? (
                          <span className="res-product-card__price-orig">¥{product.originalPrice}</span>
                        ) : null}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="res-product-card__btn--ghost"
                        onClick={() => addToCart(product.id, product.title, product.price)}
                      >
                        <ShoppingBag className="h-3.5 w-3.5" />
                        加入购物车
                      </button>
                      <button
                        type="button"
                        className="res-product-card__btn"
                        onClick={() => openCheckout(product)}
                      >
                        立即购买
                      </button>
                    </div>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        </section>

        {/* admin upload trigger — only shown to admin */}
        {isAdmin && (
          <div className="flex justify-end">
            <motion.div whileHover={HOVER_BUTTON} whileTap={TAP_BUTTON} transition={APPLE_SPRING_GENTLE}>
              <Button
                onClick={() => {
                  setIsDropActive(false);
                  setShowUploadModal(true);
                }}
              >
                <Upload className="h-4 w-4" />
                上传资源
              </Button>
            </motion.div>
          </div>
        )}


        {/* 下单弹窗 */}
        {typeof document !== 'undefined' && checkoutProduct ? createPortal(
            <motion.div
              variants={modalBackdropVariants}
              initial="hidden"
              animate="visible"
              className="ios-modal-overlay fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 pb-28 pt-6 sm:pb-6"
              onPointerDown={(event) => {
                if (event.target === event.currentTarget) {
                  setCheckoutProduct(null);
                }
              }}
            >
              <motion.div
                variants={modalPanelVariants}
                className="surface-card ios-modal-card max-h-[calc(100dvh-8rem)] w-full max-w-3xl overflow-y-auto p-0 sm:max-h-[calc(100dvh-3rem)]"
              >
                <div className="sticky top-0 z-10 flex items-center justify-between border-b border-(--border-default) bg-(--surface-panel)/95 p-5 backdrop-blur-xl">
                  <div className="flex items-center gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-2xl bg-(--surface-overlay)">
                      <ShoppingBag className="h-5 w-5 text-(--color-primary-600)" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-neutral-900">确认下单</h3>
                      <p className="text-xs text-neutral-500">订单号：{checkoutOrderId}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCheckoutProduct(null)}
                    className="ios-button-press rounded-lg p-2 transition-colors hover:bg-black/5"
                    aria-label="关闭下单弹窗"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="grid gap-5 p-5 lg:grid-cols-[minmax(0,0.95fr)_minmax(18rem,1.05fr)]">
                  <div className="space-y-4">
                    <div className="rounded-3xl border border-(--border-default) bg-(--surface-base) p-5">
                      <Badge variant="soft" className="w-fit">{checkoutProduct.category}</Badge>
                      <h4 className="mt-4 text-2xl font-semibold leading-snug text-neutral-900">{checkoutProduct.title}</h4>
                      <p className="mt-3 text-sm leading-7 text-neutral-600">{checkoutProduct.description}</p>
                      <div className="mt-5 flex items-baseline gap-2">
                        <strong className="text-4xl font-semibold text-neutral-900">￥{checkoutProduct.price.toFixed(2)}</strong>
                        {checkoutProduct.originalPrice ? (
                          <span className="text-sm text-neutral-400 line-through">￥{checkoutProduct.originalPrice}</span>
                        ) : null}
                      </div>
                    </div>

                    <div className="rounded-3xl border border-(--border-default) bg-(--surface-base) p-5">
                      <p className="text-xs uppercase tracking-[0.18em] text-neutral-500">交付内容</p>
                      <div className="mt-4 grid gap-2">
                        {checkoutProduct.includes.map((item) => (
                          <div key={item} className="flex items-center gap-2 rounded-2xl bg-(--surface-overlay) px-3 py-2 text-sm text-neutral-700">
                            <CheckCircle2 className="h-4 w-4 shrink-0 text-(--color-primary-600)" />
                            <span className="truncate">{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-3xl border border-(--border-default) bg-(--surface-base) p-5">
                      <div className="flex items-start gap-3">
                        <Shield className="mt-0.5 h-5 w-5 shrink-0 text-(--color-primary-600)" />
                        <p className="text-sm leading-6 text-neutral-600">
                          付款前请确认资料包说明。本站仅支持自有整理、公开授权或可合法分享的资料，不上架侵权内容。
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="rounded-3xl border border-(--border-default) bg-(--surface-base) p-5">
                      <p className="text-xs uppercase tracking-[0.18em] text-neutral-500">选择支付方式</p>
                      <div className="mt-4 grid grid-cols-2 gap-2">
                        {[
                          ['wechat', '微信支付'],
                          ['alipay', '支付宝'],
                        ].map(([method, label]) => (
                          <button
                            key={method}
                            type="button"
                            onClick={() => setPaymentMethod(method as PaymentMethod)}
                            className={`rounded-2xl border px-4 py-3 text-sm font-medium transition ${
                              paymentMethod === method
                                ? 'border-(--color-primary-500) bg-(--surface-overlay) text-neutral-900'
                                : 'border-(--border-default) bg-transparent text-neutral-500 hover:text-neutral-900'
                            }`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>

                      <div className="mt-4 grid min-h-56 place-items-center rounded-3xl border border-dashed border-(--border-default) bg-(--surface-overlay) p-5 text-center">
                        {payQrConfig[paymentMethod] ? (
                          <div
                            className="h-44 w-44 rounded-2xl bg-white bg-contain bg-center bg-no-repeat shadow-(--shadow-sm)"
                            style={{ backgroundImage: `url(${payQrConfig[paymentMethod]})` }}
                            role="img"
                            aria-label={paymentMethod === 'wechat' ? '微信收款码' : '支付宝收款码'}
                          />
                        ) : (
                          <div>
                            <QrCode className="mx-auto h-12 w-12 text-neutral-400" />
                            <p className="mt-3 text-sm font-medium text-neutral-900">
                              {paymentMethod === 'wechat' ? '微信收款码占位' : '支付宝收款码占位'}
                            </p>
                            <p className="mt-1 text-xs leading-5 text-neutral-500">
                              配置 `{activePaymentQrEnv}` 后会显示二维码。
                            </p>
                          </div>
                        )}
                      </div>
                      <p className="mt-3 text-xs leading-5 text-neutral-500">
                        {checkoutOrder
                          ? '订单已写入数据库，后台可查看并更新支付/交付状态。'
                          : '先填写联系方式并提交订单，再扫码付款，后台会保留这笔订单。'}
                      </p>
                    </div>

                    <div className="rounded-3xl border border-(--border-default) bg-(--surface-base) p-5">
                      <label className="block text-sm font-medium text-neutral-800">联系方式</label>
                      <div className="mt-2 flex items-center gap-2 rounded-2xl border border-(--border-default) bg-(--surface-raised) px-3 py-2">
                        <Mail className="h-4 w-4 text-neutral-400" />
                        <input
                          value={buyerContact}
                          onChange={(event) => setBuyerContact(event.target.value)}
                          placeholder="邮箱 / 微信号 / Telegram"
                          className="min-w-0 flex-1 bg-transparent py-1 text-sm outline-none placeholder:text-neutral-400"
                        />
                      </div>

                      <label className="mt-4 block text-sm font-medium text-neutral-800">备注</label>
                      <textarea
                        value={buyerNote}
                        onChange={(event) => setBuyerNote(event.target.value)}
                        placeholder="例如：已付款，微信昵称是..."
                        rows={3}
                        className="mt-2 w-full resize-none rounded-2xl border border-(--border-default) bg-(--surface-raised) px-3 py-3 text-sm outline-none placeholder:text-neutral-400 focus-visible:ring-2 focus-visible:ring-(--color-primary-500)"
                      />

                      <div className="mt-4 grid gap-2">
                        <Button onClick={createOrderAndCopy} loading={orderSubmitting} className="w-full">
                          {orderCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                          {checkoutOrder ? '重新复制订单信息' : '创建订单并复制'}
                        </Button>
                        <p className="text-xs leading-5 text-neutral-500">
                          付款后把订单信息发给站长。支付平台回调或后台确认收款后，再发送网盘链接、提取码和后续更新说明。
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>,
            document.body
        ) : null}

        {/* 上传弹窗 */}
        <AnimatePresence>
          {showUploadModal && (
            <motion.div
              variants={modalBackdropVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="ios-modal-overlay fixed inset-0 z-50 flex items-center justify-center p-4"
              onClick={() => {
                setShowUploadModal(false);
                setIsDropActive(false);
              }}
            >
              <motion.div
                variants={modalPanelVariants}
                className="surface-card ios-modal-card w-full max-w-lg p-6"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-primary/10">
                      <Shield className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold">安全上传</h3>
                      <p className="text-xs text-muted-foreground">文件将经过安全检测</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    aria-label="关闭上传弹窗"
                    onClick={() => {
                      setShowUploadModal(false);
                      setIsDropActive(false);
                    }}
                    className="ios-button-press p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/10"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  {/* 文件选择 */}
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(event) => {
                      event.preventDefault();
                      setIsDropActive(true);
                    }}
                    onDragEnter={(event) => {
                      event.preventDefault();
                      setIsDropActive(true);
                    }}
                    onDragLeave={(event) => {
                      event.preventDefault();
                      setIsDropActive(false);
                    }}
                    onDrop={handleDropUploadFile}
                    className={`rounded-xl border-2 border-dashed p-6 text-center cursor-pointer transition-colors ${
                      isDropActive
                        ? 'border-primary bg-primary/10'
                        : 'border-(--ui-line) bg-secondary/20 hover:border-primary/50'
                    }`}
                  >
                    {uploadFile ? (
                      <div className="flex items-center justify-center gap-3">
                        <File className="w-8 h-8 text-primary" />
                        <div className="text-left">
                          <p className="font-medium">{uploadFile.name}</p>
                          <p className="text-xs text-muted-foreground">{formatFileSize(uploadFile.size)}</p>
                        </div>
                      </div>
                    ) : (
                      <>
                        <Upload className="w-10 h-10 mx-auto text-muted-foreground mb-2" />
                        <p className="text-muted-foreground">{isDropActive ? '松开即可上传' : '点击或拖拽文件到这里'}</p>
                        <p className="text-xs text-muted-foreground mt-1">支持图片、视频、文档、安装包等 (最大500MB)</p>
                      </>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    aria-label="选择上传文件"
                    onChange={(e) => {
                      pickUploadFile(e.target.files?.[0] || null);
                    }}
                    className="hidden"
                  />

                  {/* 资源名称 */}
                  <div>
                    <label className="block text-sm font-medium mb-2">资源名称</label>
                    <Input
                      type="text"
                      value={uploadName}
                      onChange={(e) => setUploadName(e.target.value)}
                      placeholder="为资源起个名字"
                    />
                  </div>

                  {/* 分类选择 */}
                  <div>
                    <label className="block text-sm font-medium mb-2">资源分类</label>
                    <select
                      title="选择资源分类"
                      value={uploadCategory}
                      onChange={(e) => setUploadCategory(e.target.value)}
                      className="w-full rounded-lg border border-(--border-default) bg-(--surface-raised) px-4 py-3 text-(--text-sm) text-neutral-900 shadow-(--shadow-xs) outline-none transition-all focus-visible:ring-2 focus-visible:ring-(--color-primary-500) focus-visible:ring-offset-2"
                    >
                      <option value="">自动检测</option>
                      {categories.map((cat) => (
                        <option key={cat.slug} value={cat.slug}>{cat.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* 描述 */}
                  <div>
                    <label className="block text-sm font-medium mb-2">描述</label>
                    <Textarea
                      value={uploadDesc}
                      onChange={(e) => setUploadDesc(e.target.value)}
                      placeholder="简单描述一下这个资源"
                      rows={2}
                      className="resize-none"
                    />
                  </div>

                  {/* 标签 */}
                  <div>
                    <label className="block text-sm font-medium mb-2">标签</label>
                    <Input
                      type="text"
                      value={uploadTags}
                      onChange={(e) => setUploadTags(e.target.value)}
                      placeholder="用逗号分隔多个标签"
                    />
                  </div>

                  {/* 公开选项 */}
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={uploadPublic}
                      onChange={(e) => setUploadPublic(e.target.checked)}
                      className="w-4 h-4 rounded"
                    />
                    <span className="text-sm">设为公开资源（所有人可见）</span>
                  </label>

                  {/* 安全提示 */}
                  <div className="flex items-start gap-2 p-3 border border-(--line) bg-(--paper-deep) text-(--ink-muted) text-sm">
                    <Shield className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <p>文件将经过安全检测，禁止上传可执行文件、脚本等危险文件</p>
                  </div>
                </div>

                {/* 按钮 */}
                <div className="flex gap-3 mt-6">
                  <Button
                    onClick={() => {
                      setShowUploadModal(false);
                      setIsDropActive(false);
                      resetUploadForm();
                    }}
                    variant="secondary"
                    className="flex-1"
                  >
                    取消
                  </Button>
                  <Button
                    onClick={handleUpload}
                    disabled={!uploadFile || uploading}
                    loading={uploading}
                    className="flex-1"
                  >
                    {uploading ? (
                      uploadProgress > 0 ? `${uploadProgress}%` : '上传中...'
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        安全上传
                      </>
                    )}
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 分类管理弹窗 */}
        <AnimatePresence>
          {showCategoryModal && (
            <motion.div
              variants={modalBackdropVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="ios-modal-overlay fixed inset-0 z-50 flex items-center justify-center p-4"
              onClick={() => { setShowCategoryModal(false); resetCategoryForm(); }}
            >
              <motion.div
                variants={modalPanelVariants}
                onClick={(e) => e.stopPropagation()}
                className="surface-card ios-modal-card flex max-h-[80vh] w-full max-w-2xl flex-col overflow-hidden"
              >
                {/* 头部 */}
                <div className="flex items-center justify-between p-6 border-b border-(--ui-line)">
                  <h3 className="text-xl font-bold">分类管理</h3>
                  <button
                    type="button"
                    aria-label="关闭分类管理"
                    onClick={() => { setShowCategoryModal(false); resetCategoryForm(); }}
                    className="ios-button-press rounded-lg p-2 transition-colors hover:bg-black/5 dark:hover:bg-white/10"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* 内容 */}
                <div className="p-6 overflow-y-auto flex-1">
                  {/* 添加/编辑表单 */}
                  <div className="p-4 rounded-xl border border-(--ui-line) bg-secondary/30 mb-6">
                    <h4 className="font-medium mb-4">
                      {editingCategory ? '编辑分类' : '添加新分类'}
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm mb-1">分类名称</label>
                        <Input
                          type="text"
                          value={newCatName}
                          onChange={(e) => setNewCatName(e.target.value)}
                          placeholder="例如：设计资源"
                        />
                      </div>
                      <div>
                        <label className="block text-sm mb-1">标识符</label>
                        <Input
                          type="text"
                          value={newCatSlug}
                          onChange={(e) => setNewCatSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                          placeholder="例如：design"
                          disabled={editingCategory?.is_system}
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-sm mb-1">描述</label>
                        <Input
                          type="text"
                          value={newCatDesc}
                          onChange={(e) => setNewCatDesc(e.target.value)}
                          placeholder="分类说明"
                        />
                      </div>
                      <div>
                        <label className="block text-sm mb-1">图标</label>
                        <select
                          title="选择图标"
                          value={newCatIcon}
                          onChange={(e) => setNewCatIcon(e.target.value)}
                          className="w-full rounded-lg border border-(--border-default) bg-(--surface-raised) px-4 py-3 text-neutral-900 shadow-(--shadow-xs) outline-none transition-all focus-visible:ring-2 focus-visible:ring-(--color-primary-500) focus-visible:ring-offset-2"
                        >
                          {Object.keys(iconMap).map(icon => (
                            <option key={icon} value={icon}>{icon}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm mb-1">颜色</label>
                        <select
                          title="选择颜色"
                          value={newCatColor}
                          onChange={(e) => setNewCatColor(e.target.value)}
                          className="w-full rounded-lg border border-(--border-default) bg-(--surface-raised) px-4 py-3 text-neutral-900 shadow-(--shadow-xs) outline-none transition-all focus-visible:ring-2 focus-visible:ring-(--color-primary-500) focus-visible:ring-offset-2"
                        >
                          {Object.keys(colorMap).map(color => (
                            <option key={color} value={color}>{color}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      {editingCategory && (
                        <Button
                          onClick={resetCategoryForm}
                          variant="secondary"
                        >
                          取消
                        </Button>
                      )}
                      <Button
                        onClick={handleSaveCategory}
                        disabled={savingCategory || !newCatName || !newCatSlug}
                        loading={savingCategory}
                      >
                        {!savingCategory ? <Plus className="w-4 h-4" /> : null}
                        {editingCategory ? '保存' : '添加'}
                      </Button>
                    </div>
                  </div>

                  {/* 分类列表 */}
                  <div className="space-y-2">
                    {categories.map((cat) => {
                      const config = getCategoryConfig(cat);
                      const Icon = config.icon;
                      return (
                        <div
                          key={cat.id}
                          className="flex items-center justify-between p-3 rounded-xl border border-(--ui-line) bg-secondary/30 hover:bg-secondary/50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${config.bg}`}>
                              <Icon className={`w-5 h-5 ${config.color}`} />
                            </div>
                            <div>
                              <p className="font-medium">{cat.name}</p>
                              <p className="text-xs text-muted-foreground">{cat.slug} {cat.is_system && '(系统)'}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              aria-label="编辑分类"
                              onClick={() => handleEditCategory(cat)}
                              className="ios-button-press rounded-lg p-2 transition-colors hover:bg-black/5 dark:hover:bg-white/10"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            {!cat.is_system && (
                              <button
                                type="button"
                                aria-label="删除分类"
                                onClick={() => handleDeleteCategory(cat.id)}
                                className="ios-button-press rounded-lg p-2 text-red-500 transition-colors hover:bg-red-500/10"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── AI 代充引导弹窗（2步） ── */}
      {typeof document !== 'undefined' && aiFlow ? createPortal(
        <motion.div
          variants={modalBackdropVariants}
          initial="hidden"
          animate="visible"
          className="ios-modal-overlay fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 pb-28 pt-6 sm:pb-6"
          onPointerDown={(event) => {
            if (event.target === event.currentTarget) setAiFlow(null);
          }}
        >
          <motion.div
            variants={modalPanelVariants}
            className="surface-card ios-modal-card w-full max-w-lg overflow-hidden p-0"
          >
            {/* ── 彩色头部 ── */}
            <div className={`res-ai-flow-header res-ai-flow-header--${aiFlow.service.service}`}>
              <div className="flex items-center justify-between px-5 pt-5 pb-4">
                <div className="flex items-center gap-3">
                  <div className="res-ai-flow-logo">
                    {aiFlow.service.service === 'chatgpt' ? (
                      <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 text-white">
                        <path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0L4.155 14.4A4.504 4.504 0 0 1 2.34 7.896zm16.597 3.855l-5.843-3.371 2.019-1.168a.076.076 0 0 1 .071 0l4.663 2.692a4.496 4.496 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.234-.58zm2.019-3.023l-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.664-2.691a4.504 4.504 0 0 1 6.683 4.668zm-12.64 4.135l-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.504 4.504 0 0 1 7.375-3.453l-.142.08L8.704 5.46a.795.795 0 0 0-.393.681zm1.097-2.365l2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5z"/>
                      </svg>
                    ) : aiFlow.service.service === 'apple' ? (
                      <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 text-white">
                        <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701z"/>
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 text-white">
                        <path d="M17.304 1.01h-1.146l-3.67 10.102h-1.03L7.788 1.01H6.646L2.837 11.944H1.01v1.112h5.002v-1.112H4.076l1.27-3.496h4.778l.718 1.976-1.197 3.295-1.073 2.954 1.073.39L17.304 1.01zm-10.48 7.326L8.972 3.11l2.15 5.226H6.824zm9.49 5.217c-.647 0-1.237.234-1.692.617l-.453-1.246h-1.047v9.066h1.134v-3.42c.455.384 1.045.617 1.692.617 1.46 0 2.647-1.188 2.647-2.817s-1.188-2.647-2.647-2.817zm-.198 4.495c-.895 0-1.622-.727-1.622-1.622v-.236c0-.895.727-1.622 1.622-1.622s1.622.727 1.622 1.622v.236c0 .895-.727 1.622-1.622 1.622z"/>
                      </svg>
                    )}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">{aiFlow.service.plan}</h3>
                    <p className="text-xs text-white/70">¥{aiFlow.service.priceMonthly} · {aiFlow.service.priceNote}</p>
                  </div>
                </div>
                <button type="button" aria-label="关闭" onClick={() => setAiFlow(null)}
                  className="rounded-lg p-1.5 text-white/70 hover:bg-white/15 hover:text-white transition-colors">
                  <X className="h-5 w-5" />
                </button>
              </div>
              {/* 2步指示器 */}
              <div className="flex border-t border-white/20">
                {([
                  aiFlow.service.credentialType === 'token' ? '填写邮箱 + Token' : aiFlow.service.isReadyMade ? '填写联系方式' : '填写账号信息',
                  '扫码付款',
                ] as const).map((label, i) => {
                  const stepNum = (i + 1) as 1 | 2;
                  const isActive = aiFlow.step === stepNum;
                  const isDone = aiFlow.step > stepNum;
                  return (
                    <div key={label} className={`flex flex-1 items-center justify-center gap-2 py-2.5 text-xs font-medium transition-colors ${isActive ? 'bg-white/15 text-white' : isDone ? 'text-white/80' : 'text-white/40'}`}>
                      <span className={`flex h-4.5 w-4.5 items-center justify-center rounded-full text-[10px] font-bold ${isDone ? 'bg-white text-emerald-600' : isActive ? 'bg-white/25 text-white' : 'bg-white/10 text-white/40'}`}>
                        {isDone ? <Check className="h-2.5 w-2.5" /> : stepNum}
                      </span>
                      {label}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── 步骤内容 ── */}
            <div className="max-h-[65vh] overflow-y-auto">

              {/* ─── Step 1：填写信息 ─── */}
              {aiFlow.step === 1 && (
                <div className="space-y-5 p-5">
                  {aiFlow.service.credentialType === 'token' ? (
                    <>
                      {/* Token 获取教程 */}
                      <div>
                        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-ink-muted">如何获取 Session Token</p>
                        <div className="space-y-2.5">
                          {[
                            { n: 1, title: '登录账号', desc: '在电脑浏览器打开 chatgpt.com 或 claude.ai，确认已登录' },
                            { n: 2, title: '打开开发者工具', desc: '按 F12（Windows）或 Command + Option + I（Mac）' },
                            { n: 3, title: '切到 Application 标签', desc: '顶部点「应用程序 / Application」→ 左侧展开「Cookie」→ 点击当前网站域名' },
                            { n: 4, title: '找到并复制 Token', desc: '搜索 __Secure-next-auth.session-token，点击该行，完整复制 Value 栏的内容（很长，务必全选）' },
                          ].map(({ n, title, desc }) => (
                            <div key={n} className="flex gap-3 rounded-xl border border-line bg-(--surface-raised) px-3.5 py-3">
                              <span className="res-ai-flow-step-num shrink-0">{n}</span>
                              <div>
                                <p className="text-sm font-semibold text-ink">{title}</p>
                                <p className="mt-0.5 text-xs leading-5 text-ink-secondary">{desc}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* 账号邮箱 */}
                      <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-ink">
                          需要充值的账号邮箱 <span className="text-red-400">*</span>
                        </label>
                        <div className={`flex items-center gap-2 rounded-xl border px-3.5 py-2.5 transition-colors ${aiFlow.email.trim() ? 'border-emerald-400 bg-emerald-50/50' : 'border-line bg-(--surface-raised)'}`}>
                          <Mail className="h-4 w-4 shrink-0 text-ink-muted" />
                          <input
                            value={aiFlow.email}
                            onChange={(event) => setAiFlow(prev => prev ? { ...prev, email: event.target.value } : null)}
                            placeholder="your@email.com"
                            className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-ink-muted"
                          />
                          {aiFlow.email.trim() && <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />}
                        </div>
                        <p className="text-xs text-ink-muted">用于核对充值到正确账号，不用于其他用途。</p>
                      </div>

                      {/* Session Token */}
                      <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-ink">
                          Session Token <span className="text-red-400">*</span>
                        </label>
                        <textarea
                          value={aiFlow.sessionToken}
                          onChange={(event) => {
                            const val = event.target.value;
                            const result = validateSessionToken(val);
                            setAiFlow(prev => prev ? {
                              ...prev,
                              sessionToken: val,
                              tokenState: val.trim() ? (result.ok ? 'valid' : 'invalid') : 'idle',
                              tokenMsg: result.msg,
                            } : null);
                          }}
                          placeholder="粘贴从浏览器 Cookie 复制的完整 Token，通常超过 200 个字符…"
                          rows={4}
                          className={`w-full resize-none rounded-xl border px-3.5 py-3 text-xs font-mono outline-none placeholder:text-ink-muted transition-colors focus-visible:ring-2 focus-visible:ring-gold ${
                            aiFlow.tokenState === 'valid' ? 'border-emerald-400 bg-emerald-50/50' :
                            aiFlow.tokenState === 'invalid' ? 'border-red-400 bg-red-50/30' :
                            'border-line bg-(--surface-raised)'
                          }`}
                        />
                        {aiFlow.tokenState !== 'idle' && (
                          <div className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium ${
                            aiFlow.tokenState === 'valid'
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-red-50 text-red-600'
                          }`}>
                            {aiFlow.tokenState === 'valid'
                              ? <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                              : <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                            }
                            {aiFlow.tokenMsg}
                          </div>
                        )}
                      </div>
                    </>
                  ) : aiFlow.service.credentialType === 'password' ? (
                    <>
                      <div className="res-ai-flow-info-box res-ai-flow-info-box--orange">
                        <Shield className="res-ai-flow-info-icon" />
                        <div>
                          <p className="font-semibold">需要提供 OpenAI 账号 + 密码</p>
                          <p className="mt-1 text-xs opacity-80">代充完成后立即退出登录，建议操作完成后修改密码。</p>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-ink">OpenAI 账号邮箱 <span className="text-red-400">*</span></label>
                        <div className="flex items-center gap-2 rounded-xl border border-line bg-(--surface-raised) px-3.5 py-2.5">
                          <Mail className="h-4 w-4 shrink-0 text-ink-muted" />
                          <input
                            value={aiFlow.email}
                            onChange={(event) => setAiFlow(prev => prev ? { ...prev, email: event.target.value } : null)}
                            placeholder="your@email.com"
                            className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-ink-muted"
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-ink">账号密码 <span className="text-red-400">*</span></label>
                        <div className="flex items-center gap-2 rounded-xl border border-line bg-(--surface-raised) px-3.5 py-2.5">
                          <LockKeyhole className="h-4 w-4 shrink-0 text-ink-muted" />
                          <input
                            type="password"
                            value={aiFlow.accountPassword}
                            onChange={(event) => setAiFlow(prev => prev ? { ...prev, accountPassword: event.target.value } : null)}
                            placeholder="你的 OpenAI 账号密码"
                            className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-ink-muted"
                          />
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="res-ai-flow-info-box res-ai-flow-info-box--green">
                        <CheckCircle2 className="res-ai-flow-info-icon" />
                        <div>
                          <p className="font-semibold">成品账号，无需提供个人账号信息</p>
                          <p className="mt-1 text-xs opacity-80">付款后站长会将完整账号密码发送给你，留下联系方式即可。</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        {aiFlow.service.features.map((f) => (
                          <div key={f} className="flex items-center gap-2.5 rounded-xl border border-line bg-(--surface-raised) px-3.5 py-2.5">
                            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                            <span className="text-sm text-ink">{f}</span>
                          </div>
                        ))}
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-ink">联系方式 <span className="text-red-400">*</span></label>
                        <div className="flex items-center gap-2 rounded-xl border border-line bg-(--surface-raised) px-3.5 py-2.5">
                          <Mail className="h-4 w-4 shrink-0 text-ink-muted" />
                          <input
                            value={aiFlow.email}
                            onChange={(event) => setAiFlow(prev => prev ? { ...prev, email: event.target.value } : null)}
                            placeholder="邮箱 / 微信号 / Telegram"
                            className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-ink-muted"
                          />
                        </div>
                        <p className="text-xs text-ink-muted">付款后 24h 内通过此方式发送账号密码。</p>
                      </div>
                    </>
                  )}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-ink-secondary">备注（可选）</label>
                    <textarea
                      value={aiFlow.note}
                      onChange={(event) => setAiFlow(prev => prev ? { ...prev, note: event.target.value } : null)}
                      placeholder="其他说明"
                      rows={2}
                      className="w-full resize-none rounded-xl border border-line bg-(--surface-raised) px-3.5 py-2.5 text-sm outline-none placeholder:text-ink-muted focus-visible:ring-2 focus-visible:ring-gold"
                    />
                  </div>
                </div>
              )}

              {/* ─── Step 2：扫码付款 ─── */}
              {aiFlow.step === 2 && (
                <div className="space-y-4 p-5">
                  {/* 订单摘要 */}
                  <div className="rounded-2xl border border-line bg-(--surface-raised) p-4 space-y-2 text-sm">
                    <p className="text-xs font-semibold uppercase tracking-widest text-ink-muted mb-3">订单信息</p>
                    <div className="flex justify-between">
                      <span className="text-ink-secondary">服务</span>
                      <span className="font-medium text-ink">{aiFlow.service.plan}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-ink-secondary">金额</span>
                      <span className="text-xl font-bold text-ink">¥{aiFlow.service.priceMonthly}</span>
                    </div>
                    {aiFlow.email && (
                      <div className="flex justify-between gap-4">
                        <span className="shrink-0 text-ink-secondary">{aiFlow.service.isReadyMade ? '联系方式' : '账号邮箱'}</span>
                        <span className="truncate text-right text-ink">{aiFlow.email}</span>
                      </div>
                    )}
                  </div>

                  {/* 支付方式 */}
                  <div className="grid grid-cols-2 gap-2">
                    {([['wechat', '微信支付'], ['alipay', '支付宝']] as [PaymentMethod, string][]).map(([method, label]) => (
                      <button
                        key={method}
                        type="button"
                        onClick={() => setAiFlow(prev => prev ? { ...prev, paymentMethod: method } : null)}
                        className={`rounded-xl border py-2.5 text-sm font-medium transition ${
                          aiFlow.paymentMethod === method
                            ? 'border-gold bg-gold/10 text-ink'
                            : 'border-line bg-(--surface-raised) text-ink-muted hover:text-ink'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>

                  {/* 收款码 */}
                  <div className="grid min-h-48 place-items-center rounded-2xl border border-dashed border-line bg-(--surface-raised) p-4 text-center">
                    {payQrConfig[aiFlow.paymentMethod] ? (
                      <img
                        src={payQrConfig[aiFlow.paymentMethod]}
                        alt={aiFlow.paymentMethod === 'wechat' ? '微信收款码' : '支付宝收款码'}
                        className="h-40 w-40 rounded-2xl bg-white object-contain shadow-(--shadow-sm)"
                      />
                    ) : (
                      <div>
                        <QrCode className="mx-auto h-10 w-10 text-ink-muted" />
                        <p className="mt-2 text-sm font-medium text-ink">
                          {aiFlow.paymentMethod === 'wechat' ? '微信收款码' : '支付宝收款码'}
                        </p>
                        <p className="mt-1 text-xs text-ink-muted">
                          配置 {aiFlow.paymentMethod === 'wechat' ? 'NEXT_PUBLIC_WECHAT_PAY_QR' : 'NEXT_PUBLIC_ALIPAY_PAY_QR'} 环境变量后显示
                        </p>
                      </div>
                    )}
                  </div>

                  {aiFlow.order && (
                    <div className="res-ai-flow-info-box res-ai-flow-info-box--green">
                      <CheckCircle2 className="res-ai-flow-info-icon" />
                      <div>
                        <p className="font-semibold">订单已创建</p>
                        <p className="mt-0.5 text-xs opacity-80">订单号：{aiFlow.order.order_number}，信息已复制，扫码付款后发给站长核对。</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ── 底部操作 ── */}
            <div className="flex items-center gap-3 border-t border-line bg-(--surface-raised) px-5 py-4">
              {aiFlow.step === 2 ? (
                <button
                  type="button"
                  onClick={() => setAiFlow(prev => prev ? { ...prev, step: 1 } : null)}
                  className="rounded-xl border border-line px-4 py-2.5 text-sm font-medium text-ink-secondary hover:bg-paper transition-colors"
                >
                  上一步
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setAiFlow(null)}
                  className="rounded-xl border border-line px-4 py-2.5 text-sm font-medium text-ink-secondary hover:bg-paper transition-colors"
                >
                  取消
                </button>
              )}
              <div className="flex-1" />
              {aiFlow.step === 1 ? (
                <button
                  type="button"
                  onClick={() => {
                    const { service, email, sessionToken, tokenState, accountPassword } = aiFlow;
                    if (!email.trim()) { pushNotice('error', service.credentialType === 'none' ? '请填写联系方式' : '请填写账号邮箱'); return; }
                    if (service.credentialType === 'token' && tokenState !== 'valid') {
                      pushNotice('error', 'Session Token 格式不正确，请重新检查'); return;
                    }
                    if (service.credentialType === 'password' && !accountPassword.trim()) {
                      pushNotice('error', '请填写账号密码'); return;
                    }
                    setAiFlow(prev => prev ? { ...prev, step: 2 } : null);
                  }}
                  className="res-ai-flow-next-btn"
                >
                  下一步，去付款
                  <ChevronRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={submitAiOrder}
                  disabled={aiFlow.submitting}
                  className={`res-ai-flow-next-btn ${aiFlow.submitting ? 'opacity-60' : ''}`}
                >
                  {aiFlow.submitting
                    ? '提交中…'
                    : aiFlow.order
                      ? (aiFlow.copied ? <><Check className="h-4 w-4" />已复制</> : '重新复制订单')
                      : '确认下单并复制'}
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>,
        document.body
      ) : null}

      {/* ── 购物车悬浮按钮 ── */}
      <AnimatePresence>
        {cartCount > 0 && !cartOpen && (
          <motion.button
            type="button"
            aria-label={`查看购物车，共 ${cartCount} 件`}
            onClick={() => setCartOpen(true)}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.94 }}
            transition={APPLE_SPRING_GENTLE}
            className="fixed bottom-24 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-ink text-paper shadow-2xl md:bottom-8"
          >
            <ShoppingBag className="h-6 w-6" />
            <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-gold text-[11px] font-bold text-white">
              {cartCount > 9 ? '9+' : cartCount}
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* ── 购物车抽屉 ── */}
      <AnimatePresence>
        {cartOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22 }}
              className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
              onClick={() => setCartOpen(false)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className="fixed right-0 top-0 z-50 flex h-full w-full max-w-sm flex-col bg-paper shadow-2xl"
            >
              {/* 抽屉头部 */}
              <div className="flex items-center justify-between border-b border-line px-5 py-4">
                <div className="flex items-center gap-2.5">
                  <ShoppingBag className="h-5 w-5 text-gold" />
                  <h2 className="text-base font-semibold text-ink">购物车</h2>
                  <span className="rounded-full bg-gold/15 px-2 py-0.5 text-xs font-semibold text-gold">{cartCount} 件</span>
                </div>
                <button
                  type="button"
                  aria-label="关闭购物车"
                  onClick={() => setCartOpen(false)}
                  className="rounded-lg p-2 text-ink-muted hover:bg-black/5"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* 商品列表 */}
              <div className="flex-1 overflow-y-auto bg-(--surface-base) p-4 space-y-3">
                {cart.map(item => (
                  <div key={item.id} className="flex items-center gap-3 rounded-2xl border border-line bg-paper p-3 shadow-sm">
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-medium text-ink">{item.title}</p>
                      <p className="mt-0.5 text-xs text-ink-muted">¥{item.price.toFixed(0)} / 件</p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        aria-label="减少数量"
                        onClick={() => updateCartQty(item.id, item.qty - 1)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg border border-line text-ink hover:bg-black/5"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-6 text-center text-sm font-semibold text-ink">{item.qty}</span>
                      <button
                        type="button"
                        aria-label="增加数量"
                        onClick={() => updateCartQty(item.id, item.qty + 1)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg border border-line text-ink hover:bg-black/5"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                    <button
                      type="button"
                      aria-label="移除商品"
                      onClick={() => removeFromCart(item.id)}
                      className="rounded-lg p-1.5 text-red-400 hover:bg-red-50"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>

              {/* 底部结算 */}
              <div className="border-t border-line bg-(--surface-raised) p-5 space-y-3">
                <div className="flex items-baseline justify-between">
                  <span className="text-sm font-medium text-ink-secondary">合计</span>
                  <span className="text-2xl font-bold text-ink">¥{cartTotal.toFixed(0)}</span>
                </div>
                <button
                  type="button"
                  onClick={checkoutCart}
                  className="w-full rounded-xl bg-ink py-3.5 text-sm font-semibold text-paper shadow-md transition-all hover:-translate-y-0.5 hover:opacity-90 active:translate-y-0"
                >
                  去结算
                </button>
                <button
                  type="button"
                  onClick={() => setCart([])}
                  className="w-full rounded-xl border border-line py-2 text-xs font-medium text-ink-secondary transition-colors hover:border-ink hover:text-ink"
                >
                  清空购物车
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
