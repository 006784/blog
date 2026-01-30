'use client';

import { useState } from 'react';

export default function SecurityDemo() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    website: ''
  });
  const [response, setResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResponse(null);

    try {
      const res = await fetch('/api/secure-contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Origin': window.location.origin,
          // 注意：在真实应用中，这里应该包含真实的CSRF令牌
          'X-CSRF-Token': 'demo-token' // 演示用的令牌
        },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      setResponse(data);
    } catch (error) {
      setResponse({ success: false, error: '网络错误' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🔒 安全功能演示
          </h1>
          <p className="text-lg text-gray-600">
            展示博客项目的安全防护功能
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">联系表单测试</h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                姓名 *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                placeholder="请输入您的姓名"
                required
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                邮箱 *
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                placeholder="请输入您的邮箱"
                required
              />
            </div>

            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                主题 *
              </label>
              <input
                type="text"
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                placeholder="请输入主题"
                required
              />
            </div>

            <div>
              <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-2">
                网站 (可选)
              </label>
              <input
                type="url"
                id="website"
                name="website"
                value={formData.website}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                placeholder="https://example.com"
              />
            </div>

            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                消息内容 *
              </label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                rows={5}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none"
                placeholder="请输入您的消息内容"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  提交中...
                </>
              ) : (
                '提交表单'
              )}
            </button>
          </form>

          {response && (
            <div className={`mt-6 p-4 rounded-lg ${
              response.success 
                ? 'bg-green-50 border border-green-200' 
                : 'bg-red-50 border border-red-200'
            }`}>
              <div className="flex items-start gap-3">
                <div className={`text-xl ${response.success ? 'text-green-600' : 'text-red-600'}`}>
                  {response.success ? '✅' : '❌'}
                </div>
                <div>
                  <h3 className={`font-medium ${response.success ? 'text-green-800' : 'text-red-800'}`}>
                    {response.success ? '提交成功' : '提交失败'}
                  </h3>
                  <p className={`${response.success ? 'text-green-700' : 'text-red-700'} mt-1`}>
                    {response.message || response.error}
                  </p>
                  {response.errors && (
                    <ul className="mt-2 text-sm text-red-600 list-disc list-inside">
                      {response.errors.map((error: string, index: number) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">🛡️ 已实现的安全功能</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-blue-50 p-6 rounded-lg">
              <h3 className="text-lg font-medium text-blue-800 mb-3">输入验证与清理</h3>
              <ul className="text-blue-700 space-y-2 text-sm">
                <li>• XSS攻击防护</li>
                <li>• 危险协议过滤</li>
                <li>• 字符串长度限制</li>
                <li>• 嵌套数据递归清理</li>
              </ul>
            </div>

            <div className="bg-purple-50 p-6 rounded-lg">
              <h3 className="text-lg font-medium text-purple-800 mb-3">CSRF保护</h3>
              <ul className="text-purple-700 space-y-2 text-sm">
                <li>• 来源验证</li>
                <li>• 敏感路径保护</li>
                <li>• 自定义头部检查</li>
                <li>• 跨域请求拦截</li>
              </ul>
            </div>

            <div className="bg-green-50 p-6 rounded-lg">
              <h3 className="text-lg font-medium text-green-800 mb-3">安全响应</h3>
              <ul className="text-green-700 space-y-2 text-sm">
                <li>• Content Security Policy</li>
                <li>• 安全头部设置</li>
                <li>• 结构化错误响应</li>
                <li>• 日志记录集成</li>
              </ul>
            </div>

            <div className="bg-orange-50 p-6 rounded-lg">
              <h3 className="text-lg font-medium text-orange-800 mb-3">速率限制</h3>
              <ul className="text-orange-700 space-y-2 text-sm">
                <li>• API请求限制</li>
                <li>• 敏感操作限制</li>
                <li>• 文件上传限制</li>
                <li>• 内存级限流算法</li>
              </ul>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="text-lg font-medium text-gray-800 mb-4">🔧 技术实现</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <pre className="text-sm text-gray-700 overflow-x-auto">
{`// 核心安全模块
import { sanitizeInput, csrfProtection, createSecureResponse } from '@/lib/security'

// 在API路由中使用
export async function POST(request: NextRequest) {
  // 1. CSRF保护
  if (!csrfProtection(request)) {
    return createSecureResponse({ error: '安全验证失败' }, { status: 403 })
  }
  
  // 2. 输入清理
  const cleanData = sanitizeInput(await request.json())
  
  // 3. 业务逻辑处理
  const result = await processFormData(cleanData)
  
  // 4. 安全响应
  return createSecureResponse(result)
}`}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}