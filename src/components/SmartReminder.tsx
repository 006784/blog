// 智能提醒组件
'use client';

import { useState, useEffect } from 'react';
import { Bell, Clock, MapPin, Sun, Moon, Trash2, Plus, CheckCircle, AlertCircle } from 'lucide-react';
import { SmartReminderService, type Reminder, type ReminderNotification } from '@/lib/diary/smart-reminder-service';

interface SmartReminderProps {
  className?: string;
}

export function SmartReminder({ className = '' }: SmartReminderProps) {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [notifications, setNotifications] = useState<ReminderNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotificationPanel, setShowNotificationPanel] = useState(false);
  const [newReminder, setNewReminder] = useState({
    title: '',
    description: '',
    type: 'daily' as Reminder['type'],
    schedule: '',
    location: { latitude: 0, longitude: 0, radius: 100, name: '' },
    weatherConditions: { temperatureThreshold: undefined as number | undefined, weatherTypes: [] as string[], location: '' }
  });
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  // 初始化和加载数据
  useEffect(() => {
    loadRemindersAndNotifications();
    
    // 定期检查提醒
    const interval = setInterval(async () => {
      await checkAndProcessReminders();
    }, 60000); // 每分钟检查一次

    return () => clearInterval(interval);
  }, []);

  // 加载提醒和通知
  const loadRemindersAndNotifications = async () => {
    setLoading(true);
    try {
      const loadedReminders = await SmartReminderService.getReminders();
      const loadedNotifications = await SmartReminderService.getNotifications();
      const unread = await SmartReminderService.getUnreadCount();

      setReminders(loadedReminders);
      setNotifications(loadedNotifications);
      setUnreadCount(unread);
    } catch (error) {
      console.error('加载提醒失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 检查并处理提醒
  const checkAndProcessReminders = async () => {
    try {
      // 这里通常需要获取用户的当前位置和天气信息
      // 在实际应用中，可以从API获取这些信息
      
      // 检查定时提醒
      const scheduledReminders = await SmartReminderService.checkScheduledReminders();
      
      // 检查位置提醒（这里模拟一个位置）
      const locationReminders = await SmartReminderService.checkLocationReminders({
        latitude: 39.9042, // 北京坐标
        longitude: 116.4074
      });
      
      // 检查天气提醒（这里模拟天气数据）
      const weatherReminders = await SmartReminderService.checkWeatherReminders({
        location: 'Beijing',
        temperature: 22,
        condition: 'sunny'
      });

      const allNewReminders = [...scheduledReminders, ...locationReminders, ...weatherReminders];

      if (allNewReminders.length > 0) {
        // 更新通知列表
        const updatedNotifications = [...allNewReminders, ...notifications];
        setNotifications(updatedNotifications);
        
        // 更新未读数
        const unread = await SmartReminderService.getUnreadCount();
        setUnreadCount(unread + allNewReminders.length);
      }
    } catch (error) {
      console.error('检查提醒失败:', error);
    }
  };

  // 创建新提醒
  const handleCreateReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const reminderData = {
        title: newReminder.title,
        description: newReminder.description,
        type: newReminder.type,
        schedule: newReminder.schedule || new Date().toISOString(),
        enabled: true
      };

      if (newReminder.type === 'location') {
        (reminderData as any).location = newReminder.location;
      } else if (newReminder.type === 'weather') {
        (reminderData as any).weatherConditions = newReminder.weatherConditions;
      }

      const createdReminder = await SmartReminderService.createReminder(reminderData as any);
      setReminders([...reminders, createdReminder]);
      setNewReminder({
        title: '',
        description: '',
        type: 'daily',
        schedule: '',
        location: { latitude: 0, longitude: 0, radius: 100, name: '' },
        weatherConditions: { temperatureThreshold: undefined, weatherTypes: [], location: '' }
      });
      setShowForm(false);
    } catch (error) {
      console.error('创建提醒失败:', error);
    }
  };

  // 删除提醒
  const handleDeleteReminder = async (id: string) => {
    try {
      const success = await SmartReminderService.deleteReminder(id);
      if (success) {
        setReminders(reminders.filter(r => r.id !== id));
      }
    } catch (error) {
      console.error('删除提醒失败:', error);
    }
  };

  // 切换提醒启用状态
  const toggleReminderStatus = async (id: string) => {
    const reminder = reminders.find(r => r.id === id);
    if (!reminder) return;

    try {
      await SmartReminderService.updateReminder(id, { enabled: !reminder.enabled });
      setReminders(reminders.map(r => 
        r.id === id ? { ...r, enabled: !r.enabled } : r
      ));
    } catch (error) {
      console.error('更新提醒状态失败:', error);
    }
  };

  // 标记通知为已读
  const markAsRead = async (id: string) => {
    try {
      await SmartReminderService.markAsRead(id);
      setNotifications(notifications.map(n => 
        n.id === id ? { ...n, read: true } : n
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('标记通知为已读失败:', error);
    }
  };

  // 标记所有通知为已读
  const markAllAsRead = async () => {
    try {
      await SmartReminderService.markAllAsRead();
      setNotifications(notifications.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('标记所有通知为已读失败:', error);
    }
  };

  // 获取图标
  const getIcon = (type: Reminder['type']) => {
    switch (type) {
      case 'daily': return <Clock className="w-4 h-4" />;
      case 'weekly': return <Clock className="w-4 h-4" />;
      case 'monthly': return <Clock className="w-4 h-4" />;
      case 'special_date': return <Clock className="w-4 h-4" />;
      case 'location': return <MapPin className="w-4 h-4" />;
      case 'weather': return <Sun className="w-4 h-4" />;
      default: return <Bell className="w-4 h-4" />;
    }
  };

  // 获取天气条件描述
  const getWeatherConditionText = (conditions: any) => {
    if (!conditions) return '';
    const parts = [];
    
    if (conditions.temperatureThreshold) {
      parts.push(`${conditions.temperatureThreshold > 0 ? '高温' : '低温'}提醒`);
    }
    
    if (conditions.weatherTypes && conditions.weatherTypes.length > 0) {
      parts.push(`天气: ${conditions.weatherTypes.join(', ')}`);
    }
    
    return parts.join(', ');
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-xl border border-gray-200 p-6 ${className}`}>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto mb-4"></div>
            <p className="text-gray-600">加载提醒系统...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-xl border border-gray-200 p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Bell className="w-5 h-5 text-amber-500" />
          智能提醒系统
        </h3>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <button
              onClick={() => setShowNotificationPanel(!showNotificationPanel)}
              className="p-2 rounded-lg hover:bg-gray-100 relative"
            >
              <Bell className="w-5 h-5 text-gray-600" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>
            
            {showNotificationPanel && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 overflow-y-auto">
                <div className="p-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-900">通知中心</h4>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className="text-sm text-amber-600 hover:text-amber-700"
                      >
                        全部标记为已读
                      </button>
                    )}
                  </div>
                </div>
                <div className="divide-y divide-gray-200">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-gray-500">
                      <Bell className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                      <p>暂无通知</p>
                    </div>
                  ) : (
                    notifications.slice(0, 10).map(notification => (
                      <div
                        key={notification.id}
                        className={`p-4 ${!notification.read ? 'bg-amber-50' : ''}`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <h5 className="font-medium text-gray-900 truncate">
                              {notification.title}
                            </h5>
                            <p className="text-sm text-gray-600 mt-1">
                              {notification.message}
                            </p>
                            <p className="text-xs text-gray-500 mt-2">
                              {new Date(notification.timestamp).toLocaleString()}
                            </p>
                          </div>
                          {!notification.read && (
                            <button
                              onClick={() => markAsRead(notification.id)}
                              className="ml-2 p-1 text-gray-400 hover:text-gray-600"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
          
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
          >
            <Plus className="w-4 h-4" />
            新增提醒
          </button>
        </div>
      </div>

      {/* 添加提醒表单 */}
      {showForm && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h4 className="font-medium text-gray-900 mb-4">创建新提醒</h4>
          <form onSubmit={handleCreateReminder}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">标题</label>
                <input
                  type="text"
                  value={newReminder.title}
                  onChange={(e) => setNewReminder({...newReminder, title: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">类型</label>
                <select
                  value={newReminder.type}
                  onChange={(e) => setNewReminder({...newReminder, type: e.target.value as any})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                >
                  <option value="daily">日常提醒</option>
                  <option value="weekly">每周提醒</option>
                  <option value="monthly">每月提醒</option>
                  <option value="special_date">特殊日期</option>
                  <option value="location">位置提醒</option>
                  <option value="weather">天气提醒</option>
                </select>
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">描述</label>
                <textarea
                  value={newReminder.description}
                  onChange={(e) => setNewReminder({...newReminder, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  rows={2}
                />
              </div>
              
              {(newReminder.type === 'location' || newReminder.type === 'weather') && (
                <div className="md:col-span-2">
                  {newReminder.type === 'location' && (
                    <div className="space-y-3">
                      <h5 className="font-medium text-gray-900">位置信息</h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">纬度</label>
                          <input
                            type="number"
                            value={newReminder.location.latitude || ''}
                            onChange={(e) => setNewReminder({
                              ...newReminder,
                              location: {...newReminder.location, latitude: Number(e.target.value)}
                            })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                            placeholder="例如: 39.9042"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">经度</label>
                          <input
                            type="number"
                            value={newReminder.location.longitude || ''}
                            onChange={(e) => setNewReminder({
                              ...newReminder,
                              location: {...newReminder.location, longitude: Number(e.target.value)}
                            })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                            placeholder="例如: 116.4074"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">半径(米)</label>
                          <input
                            type="number"
                            value={newReminder.location.radius || ''}
                            onChange={(e) => setNewReminder({
                              ...newReminder,
                              location: {...newReminder.location, radius: Number(e.target.value)}
                            })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                            placeholder="例如: 100"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">地点名称</label>
                          <input
                            type="text"
                            value={newReminder.location.name}
                            onChange={(e) => setNewReminder({
                              ...newReminder,
                              location: {...newReminder.location, name: e.target.value}
                            })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                            placeholder="例如: 办公室"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {newReminder.type === 'weather' && (
                    <div className="space-y-3">
                      <h5 className="font-medium text-gray-900">天气条件</h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">温度阈值</label>
                          <input
                            type="number"
                            value={newReminder.weatherConditions.temperatureThreshold ?? ''}
                            onChange={(e) => setNewReminder({
                              ...newReminder,
                              weatherConditions: {...newReminder.weatherConditions, temperatureThreshold: Number(e.target.value)}
                            })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                            placeholder="例如: 25度"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">地点</label>
                          <input
                            type="text"
                            value={newReminder.weatherConditions.location}
                            onChange={(e) => setNewReminder({
                              ...newReminder,
                              weatherConditions: {...newReminder.weatherConditions, location: e.target.value}
                            })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                            placeholder="例如: Beijing"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">天气类型</label>
                        <div className="flex flex-wrap gap-2">
                          {['sunny', 'rainy', 'cloudy', 'snowy', 'windy'].map(type => (
                            <label key={type} className="flex items-center">
                              <input
                                type="checkbox"
                                checked={newReminder.weatherConditions.weatherTypes?.includes(type)}
                                onChange={(e) => {
                                  const currentTypes = newReminder.weatherConditions.weatherTypes || [];
                                  let newTypes: string[];
                                  
                                  if (e.target.checked) {
                                    newTypes = [...currentTypes, type];
                                  } else {
                                    newTypes = currentTypes.filter(t => t !== type);
                                  }
                                  
                                  setNewReminder({
                                    ...newReminder,
                                    weatherConditions: {
                                      ...newReminder.weatherConditions,
                                      weatherTypes: newTypes
                                    }
                                  });
                                }}
                                className="mr-1"
                              />
                              <span className="text-sm">{type}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <div className="flex gap-3">
              <button
                type="submit"
                className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
              >
                创建提醒
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
              >
                取消
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 提醒列表 */}
      <div className="space-y-4">
        <h4 className="font-medium text-gray-900">我的提醒 ({reminders.length})</h4>
        
        {reminders.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p>还没有创建任何提醒</p>
            <p className="text-sm">点击"新增提醒"按钮创建第一个提醒</p>
          </div>
        ) : (
          <div className="space-y-3">
            {reminders.map(reminder => (
              <div
                key={reminder.id}
                className={`p-4 rounded-lg border ${
                  reminder.enabled 
                    ? 'border-amber-200 bg-amber-50' 
                    : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      reminder.enabled 
                        ? 'bg-amber-100 text-amber-600' 
                        : 'bg-gray-100 text-gray-400'
                    }`}>
                      {getIcon(reminder.type)}
                    </div>
                    <div>
                      <h5 className={`font-medium ${
                        reminder.enabled ? 'text-amber-900' : 'text-gray-500'
                      }`}>
                        {reminder.title}
                      </h5>
                      <p className="text-sm text-gray-600">
                        {reminder.type === 'location' && `位置: ${reminder.location?.name || '未知'}`}
                        {reminder.type === 'weather' && getWeatherConditionText(reminder.weatherConditions)}
                        {['daily', 'weekly', 'monthly', 'special_date'].includes(reminder.type) && 
                          `类型: ${reminder.type === 'daily' ? '每日' : reminder.type === 'weekly' ? '每周' : reminder.type === 'monthly' ? '每月' : '特殊日期'}`}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleReminderStatus(reminder.id)}
                      className={`p-2 rounded-lg ${
                        reminder.enabled
                          ? 'text-amber-600 hover:bg-amber-100'
                          : 'text-gray-400 hover:bg-gray-100'
                      }`}
                      title={reminder.enabled ? '禁用提醒' : '启用提醒'}
                    >
                      {reminder.enabled ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => handleDeleteReminder(reminder.id)}
                      className="p-2 text-red-600 hover:bg-red-100 rounded-lg"
                      title="删除提醒"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                {reminder.description && (
                  <p className="mt-2 text-sm text-gray-700 pl-10">{reminder.description}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}