'use client';

import { useEffect, useEffectEvent, useState } from 'react';
import { motion } from 'framer-motion';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, ResponsiveContainer,
} from 'recharts';
import { Eye, Users, TrendingUp, Heart, Loader2, Monitor, Smartphone, Tablet } from 'lucide-react';
import { ContributionHeatmap } from './ContributionHeatmap';

// ── 类型 ──────────────────────────────────────────────────

interface OverviewData {
  pv: number;
  uv: number;
  totalViews: number;
  totalLikes: number;
  totalBookmarks: number;
  topPages: { path: string; title: string; count: number }[];
}

interface TrendDay {
  date: string;
  pv: number;
  uv: number;
}

interface DeviceData {
  devices: { name: string; value: number }[];
  browsers: { name: string; value: number }[];
}

// ── 常量 ──────────────────────────────────────────────────

const PERIOD_OPTIONS = [
  { label: '7天', value: 7 },
  { label: '30天', value: 30 },
  { label: '90天', value: 90 },
];

const PIE_COLORS = ['#c4a96d', '#8b5cf6', '#3b82f6', '#10b981', '#f59e0b'];

const DEVICE_ICONS: Record<string, React.ReactNode> = {
  desktop:  <Monitor className="w-4 h-4" />,
  mobile:   <Smartphone className="w-4 h-4" />,
  tablet:   <Tablet className="w-4 h-4" />,
};

// ── 统计卡片 ──────────────────────────────────────────────

function StatCard({ icon, label, value, sub }: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-zinc-200/60 dark:border-zinc-700/60 bg-white/60 dark:bg-zinc-800/60 p-4 backdrop-blur"
    >
      <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 mb-2">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <div className="text-2xl font-semibold text-zinc-800 dark:text-zinc-100">
        {typeof value === 'number' ? value.toLocaleString() : value}
      </div>
      {sub && <div className="mt-0.5 text-xs text-zinc-400">{sub}</div>}
    </motion.div>
  );
}

// ── 主组件 ────────────────────────────────────────────────

export function AnalyticsDashboard() {
  const [period, setPeriod] = useState(30);
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [trend, setTrend] = useState<TrendDay[]>([]);
  const [devices, setDevices] = useState<DeviceData | null>(null);
  const [heatmapData, setHeatmapData] = useState<{ date: string; count: number }[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAll = useEffectEvent(async () => {
    setLoading(true);
    try {
      const [overviewRes, trendRes, devicesRes, postsRes] = await Promise.all([
        fetch(`/api/stats?type=overview&days=${period}`),
        fetch(`/api/stats?type=trend&days=${period}`),
        fetch(`/api/stats?type=devices&days=${period}`),
        fetch(`/api/stats?type=posts&days=365`),
      ]);

      const [overviewData, trendData, devicesData, postsData] = await Promise.all([
        overviewRes.json(),
        trendRes.json(),
        devicesRes.json(),
        postsRes.json(),
      ]);

      if (overviewData.success) setOverview(overviewData.data);
      if (trendData.success) setTrend(trendData.data);
      if (devicesData.success) setDevices(devicesData.data);

      // 构建热力图数据（文章发布日期）
      if (postsData.success && Array.isArray(postsData.data)) {
        const counts: Record<string, number> = {};
        postsData.data.forEach((p: { created_at?: string }) => {
          if (p.created_at) {
            const d = p.created_at.split('T')[0];
            counts[d] = (counts[d] || 0) + 1;
          }
        });
        setHeatmapData(Object.entries(counts).map(([date, count]) => ({ date, count })));
      }
    } catch (err) {
      console.error('Analytics load error:', err);
    } finally {
      setLoading(false);
    }
  });

  useEffect(() => {
    void loadAll();
  }, [period]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-zinc-500">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        加载统计数据…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 时间范围切换 */}
      <div className="flex items-center gap-2">
        {PERIOD_OPTIONS.map(({ label, value }) => (
          <button
            key={value}
            onClick={() => setPeriod(value)}
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
              period === value
                ? 'bg-zinc-800 text-white dark:bg-white dark:text-zinc-900'
                : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* 统计卡片 */}
      {overview && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard icon={<Eye className="w-4 h-4" />}    label={`近 ${period} 天 PV`}  value={overview.pv}           sub="页面浏览量" />
          <StatCard icon={<Users className="w-4 h-4" />}   label={`近 ${period} 天 UV`}  value={overview.uv}           sub="独立访客" />
          <StatCard icon={<TrendingUp className="w-4 h-4" />} label="累计阅读"            value={overview.totalViews}   sub="所有文章合计" />
          <StatCard icon={<Heart className="w-4 h-4" />}   label="累计点赞"               value={overview.totalLikes}   sub="所有文章合计" />
        </div>
      )}

      {/* 趋势折线图 */}
      {trend.length > 0 && (
        <div className="rounded-2xl border border-zinc-200/60 dark:border-zinc-700/60 bg-white/60 dark:bg-zinc-800/60 p-4 backdrop-blur">
          <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-4">访问趋势</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={trend} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: '#9ca3af' }}
                tickFormatter={(v) => v.slice(5)}
              />
              <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid rgba(0,0,0,0.1)' }}
                labelFormatter={(v) => `日期：${v}`}
              />
              <Line type="monotone" dataKey="pv" stroke="#c4a96d" strokeWidth={2} dot={false} name="PV" />
              <Line type="monotone" dataKey="uv" stroke="#8b5cf6" strokeWidth={2} dot={false} name="UV" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* 设备分布 + 热门页面 */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* 设备饼图 */}
        {devices && devices.devices.length > 0 && (
          <div className="rounded-2xl border border-zinc-200/60 dark:border-zinc-700/60 bg-white/60 dark:bg-zinc-800/60 p-4 backdrop-blur">
            <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">设备分布</h3>
            <div className="flex items-center gap-4">
              <ResponsiveContainer width={100} height={100}>
                <PieChart>
                  <Pie data={devices.devices} cx="50%" cy="50%" innerRadius={28} outerRadius={44} dataKey="value" paddingAngle={2}>
                    {devices.devices.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5">
                {devices.devices.map((d, i) => (
                  <div key={d.name} className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                    <span className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                      {DEVICE_ICONS[d.name] || null}
                      {d.name}
                    </span>
                    <span className="text-xs font-medium text-zinc-700 dark:text-zinc-200">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 热门页面 */}
        {overview && overview.topPages.length > 0 && (
          <div className="rounded-2xl border border-zinc-200/60 dark:border-zinc-700/60 bg-white/60 dark:bg-zinc-800/60 p-4 backdrop-blur">
            <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">热门页面 Top 5</h3>
            <ul className="space-y-2">
              {overview.topPages.slice(0, 5).map((page, i) => (
                <li key={page.path} className="flex items-center gap-2">
                  <span className="text-xs text-zinc-400 w-4">{i + 1}</span>
                  <span className="flex-1 text-xs text-zinc-600 dark:text-zinc-300 truncate">{page.title || page.path}</span>
                  <span className="text-xs font-medium text-zinc-500">{page.count}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* 内容产出热力图 */}
      <div className="rounded-2xl border border-zinc-200/60 dark:border-zinc-700/60 bg-white/60 dark:bg-zinc-800/60 p-4 backdrop-blur">
        <ContributionHeatmap data={heatmapData} title="内容产出热力图" weeks={52} />
      </div>
    </div>
  );
}
