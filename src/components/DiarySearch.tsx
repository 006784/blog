// 日记搜索组件
'use client';

import { useState, useEffect } from 'react';
import { Search, X, Filter, Calendar, Heart, Cloud, Hash } from 'lucide-react';
import { DiarySearchService, type SearchOptions, type SearchResult } from '@/lib/diary/search-service';

interface DiarySearchProps {
  diaries: any[];
  onSearchResults: (results: SearchResult[]) => void;
  onClearSearch: () => void;
}

export function DiarySearch({ diaries, onSearchResults, onClearSearch }: DiarySearchProps) {
  const [query, setQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [searchOptions, setSearchOptions] = useState<SearchOptions>({
    sortBy: 'date',
    sortOrder: 'desc'
  });
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchStats, setSearchStats] = useState<any>(null);

  // 执行搜索
  const performSearch = () => {
    if (!query.trim() && Object.keys(searchOptions).length <= 2) {
      setSearchResults([]);
      setSearchStats(null);
      onSearchResults([]);
      return;
    }
    
    const options: SearchOptions = {
      ...searchOptions,
      query: query.trim()
    };
    
    const results = DiarySearchService.searchDiaries(diaries, options);
    const stats = DiarySearchService.getSearchStats(diaries, options);
    
    setSearchResults(results);
    setSearchStats(stats);
    onSearchResults(results);
  };

  // 更新搜索选项
  const updateSearchOptions = (updates: Partial<SearchOptions>) => {
    setSearchOptions(prev => ({ ...prev, ...updates }));
  };

  // 清空搜索
  const clearSearch = () => {
    setQuery('');
    setSearchOptions({ sortBy: 'date', sortOrder: 'desc' });
    setSearchResults([]);
    setSearchStats(null);
    onClearSearch();
  };

  // 监听查询变化自动搜索
  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch();
    }, 300);
    
    return () => clearTimeout(timer);
  }, [query, JSON.stringify(searchOptions)]);

  return (
    <div className="mb-8">
      {/* 搜索框 */}
      <div className="relative mb-4">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="搜索日记内容、标题..."
          className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
        />
        {query && (
          <button
            onClick={clearSearch}
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
          >
            <X className="h-5 w-5 text-gray-400 hover:text-gray-600" />
          </button>
        )}
      </div>

      {/* 高级筛选按钮 */}
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            showFilters 
              ? 'bg-amber-100 text-amber-700' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <Filter className="w-4 h-4" />
          高级筛选
        </button>
        
        {/* 搜索统计 */}
        {searchStats && (
          <div className="text-sm text-gray-600">
            找到 {searchStats.totalResults} 篇日记
          </div>
        )}
      </div>

      {/* 高级筛选面板 */}
      {showFilters && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 日期范围 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                日期范围
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  value={searchOptions.dateFrom || ''}
                  onChange={(e) => updateSearchOptions({ dateFrom: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                />
                <input
                  type="date"
                  value={searchOptions.dateTo || ''}
                  onChange={(e) => updateSearchOptions({ dateTo: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                />
              </div>
            </div>

            {/* 排序选项 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">排序方式</label>
              <div className="space-y-2">
                <select
                  value={searchOptions.sortBy || 'date'}
                  onChange={(e) => updateSearchOptions({ sortBy: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                >
                  <option value="date">按日期</option>
                  <option value="relevance">按相关性</option>
                  <option value="title">按标题</option>
                </select>
                
                <select
                  value={searchOptions.sortOrder || 'desc'}
                  onChange={(e) => updateSearchOptions({ sortOrder: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                >
                  <option value="desc">降序</option>
                  <option value="asc">升序</option>
                </select>
              </div>
            </div>

            {/* 情绪筛选 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Heart className="w-4 h-4 inline mr-1" />
                情绪筛选
              </label>
              <div className="flex flex-wrap gap-2">
                {['happy', 'sad', 'angry', 'calm'].map(emotion => (
                  <button
                    key={emotion}
                    onClick={() => {
                      const currentEmotions = searchOptions.emotions || [];
                      const newEmotions = currentEmotions.includes(emotion)
                        ? currentEmotions.filter(e => e !== emotion)
                        : [...currentEmotions, emotion];
                      updateSearchOptions({ emotions: newEmotions });
                    }}
                    className={`px-3 py-1 rounded-full text-xs ${
                      (searchOptions.emotions || []).includes(emotion)
                        ? 'bg-amber-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {emotion}
                  </button>
                ))}
              </div>
            </div>

            {/* 天气筛选 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Cloud className="w-4 h-4 inline mr-1" />
                天气筛选
              </label>
              <div className="flex flex-wrap gap-2">
                {['sunny', 'rainy', 'cloudy', 'snowy'].map(weather => (
                  <button
                    key={weather}
                    onClick={() => {
                      const currentWeather = searchOptions.weather || [];
                      const newWeather = currentWeather.includes(weather)
                        ? currentWeather.filter(w => w !== weather)
                        : [...currentWeather, weather];
                      updateSearchOptions({ weather: newWeather });
                    }}
                    className={`px-3 py-1 rounded-full text-xs ${
                      (searchOptions.weather || []).includes(weather)
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {weather}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 搜索统计详情 */}
          {searchStats && (
            <div className="mt-6 pt-4 border-t border-gray-200">
              <h4 className="font-medium text-gray-900 mb-3">搜索统计</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="text-gray-500">总计结果</div>
                  <div className="font-semibold">{searchStats.totalResults}</div>
                </div>
                {searchStats.dateRange && (
                  <>
                    <div>
                      <div className="text-gray-500">最早日期</div>
                      <div className="font-semibold">{searchStats.dateRange.min}</div>
                    </div>
                    <div>
                      <div className="text-gray-500">最新日期</div>
                      <div className="font-semibold">{searchStats.dateRange.max}</div>
                    </div>
                  </>
                )}
              </div>
              
              {/* 情绪分布 */}
              {Object.keys(searchStats.emotionDistribution).length > 0 && (
                <div className="mt-4">
                  <div className="text-gray-500 mb-2">情绪分布</div>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(searchStats.emotionDistribution).map(([emotion, count]) => (
                      <span key={emotion} className="px-2 py-1 bg-amber-100 text-amber-800 rounded-full text-xs">
                        {emotion}: {count as number}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 搜索结果预览 */}
      {searchResults.length > 0 && (
        <div className="bg-gray-50 rounded-xl p-4 mb-6">
          <h3 className="font-medium text-gray-900 mb-3">搜索结果预览</h3>
          <div className="space-y-3 max-h-60 overflow-y-auto">
            {searchResults.slice(0, 3).map(result => (
              <div key={result.id} className="bg-white rounded-lg p-3 border border-gray-200">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{result.title}</h4>
                    <p className="text-sm text-gray-600 mt-1">{result.excerpt}</p>
                    <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                      <span>{new Date(result.date).toLocaleDateString()}</span>
                      {result.metadata.emotion && (
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full">
                          {result.metadata.emotion}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-xs text-gray-400">
                    相关度: {Math.round(result.score)}
                  </div>
                </div>
              </div>
            ))}
            {searchResults.length > 3 && (
              <div className="text-center text-sm text-gray-500">
                还有 {searchResults.length - 3} 篇结果...
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}