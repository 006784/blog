'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, ChevronDown, ChevronRight, FileText, Clock, Eye } from 'lucide-react';
import Link from 'next/link';
import { supabase, type Post } from '@/lib/supabase';

interface ArchiveYear {
  year: number;
  months: {
    month: number;
    posts: Post[];
  }[];
}

export default function ArchivePage() {
  const [archives, setArchives] = useState<ArchiveYear[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedYears, setExpandedYears] = useState<number[]>([]);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const { data: posts } = await supabase
        .from('posts')
        .select('*')
        .eq('published', true)
        .order('created_at', { ascending: false });

      if (posts) {
        // 按年月分组
        const grouped: Record<number, Record<number, Post[]>> = {};
        
        posts.forEach((post) => {
          const date = new Date(post.created_at);
          const year = date.getFullYear();
          const month = date.getMonth() + 1;
          
          if (!grouped[year]) grouped[year] = {};
          if (!grouped[year][month]) grouped[year][month] = [];
          grouped[year][month].push(post);
        });

        // 转换为数组格式
        const archiveData: ArchiveYear[] = Object.entries(grouped)
          .map(([year, months]) => ({
            year: parseInt(year),
            months: Object.entries(months)
              .map(([month, posts]) => ({
                month: parseInt(month),
                posts,
              }))
              .sort((a, b) => b.month - a.month),
          }))
          .sort((a, b) => b.year - a.year);

        setArchives(archiveData);
        // 默认展开最新年份
        if (archiveData.length > 0) {
          setExpandedYears([archiveData[0].year]);
        }
      }
    } catch (error) {
      console.error('Failed to fetch posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleYear = (year: number) => {
    setExpandedYears((prev) =>
      prev.includes(year) ? prev.filter((y) => y !== year) : [...prev, year]
    );
  };

  const monthNames = [
    '一月', '二月', '三月', '四月', '五月', '六月',
    '七月', '八月', '九月', '十月', '十一月', '十二月'
  ];

  const totalPosts = archives.reduce(
    (acc, year) => acc + year.months.reduce((m, month) => m + month.posts.length, 0),
    0
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 页面标题 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-4">
            <Calendar className="w-4 h-4" />
            <span className="text-sm font-medium">文章归档</span>
          </div>
          <h1 className="text-4xl font-bold mb-4">时光机</h1>
          <p className="text-muted-foreground">
            共 {totalPosts} 篇文章，记录点滴思考
          </p>
        </motion.div>

        {/* 时间线 */}
        <div className="relative">
          {/* 时间线轴 */}
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary via-primary/50 to-transparent" />

          {archives.map((yearData, yearIndex) => (
            <motion.div
              key={yearData.year}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: yearIndex * 0.1 }}
              className="relative mb-8"
            >
              {/* 年份标题 */}
              <button
                onClick={() => toggleYear(yearData.year)}
                className="flex items-center gap-4 mb-4 group"
              >
                <div className="relative z-10 w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white font-bold shadow-lg shadow-primary/25">
                  {expandedYears.includes(yearData.year) ? (
                    <ChevronDown className="w-6 h-6" />
                  ) : (
                    <ChevronRight className="w-6 h-6" />
                  )}
                </div>
                <div>
                  <h2 className="text-2xl font-bold group-hover:text-primary transition-colors">
                    {yearData.year}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {yearData.months.reduce((acc, m) => acc + m.posts.length, 0)} 篇文章
                  </p>
                </div>
              </button>

              {/* 月份和文章列表 */}
              {expandedYears.includes(yearData.year) && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="ml-6 pl-10 border-l border-border/50"
                >
                  {yearData.months.map((monthData) => (
                    <div key={monthData.month} className="mb-6">
                      <h3 className="text-lg font-semibold mb-3 text-primary/80">
                        {monthNames[monthData.month - 1]}
                      </h3>
                      <div className="space-y-3">
                        {monthData.posts.map((post) => (
                          <motion.div
                            key={post.id}
                            whileHover={{ x: 4 }}
                            className="group"
                          >
                            <Link
                              href={`/blog/${post.slug}`}
                              className="flex items-start gap-3 p-3 rounded-xl bg-card/50 hover:bg-card border border-transparent hover:border-border transition-all"
                            >
                              <FileText className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium group-hover:text-primary transition-colors line-clamp-1">
                                  {post.title}
                                </h4>
                                {post.description && (
                                  <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
                                    {post.description}
                                  </p>
                                )}
                                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {new Date(post.created_at).toLocaleDateString('zh-CN', {
                                      month: 'short',
                                      day: 'numeric'
                                    })}
                                  </span>
                                  {post.views !== undefined && (
                                    <span className="flex items-center gap-1">
                                      <Eye className="w-3 h-3" />
                                      {post.views}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </Link>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  ))}
                </motion.div>
              )}
            </motion.div>
          ))}

          {archives.length === 0 && (
            <div className="text-center py-20">
              <Calendar className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground">暂无文章</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
