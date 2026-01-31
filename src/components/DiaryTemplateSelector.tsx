// 日记模板选择组件
'use client';

import { useState, useEffect } from 'react';
import { 
  Calendar, 
  MapPin, 
  Heart, 
  Cloud, 
  BookOpen, 
  Briefcase, 
  GraduationCap, 
  Activity, 
  Plus, 
  Edit3, 
  Trash2,
  Sparkles
} from 'lucide-react';
import { DiaryTemplateService, type DiaryTemplate, type TemplateVariable } from '@/lib/diary/template-service';

interface DiaryTemplateSelectorProps {
  onSelect: (template: DiaryTemplate, variables: Record<string, string>) => void;
  currentContent?: string;
}

export function DiaryTemplateSelector({ onSelect, currentContent }: DiaryTemplateSelectorProps) {
  const [templates, setTemplates] = useState<DiaryTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<DiaryTemplate | null>(null);
  const [templateVariables, setTemplateVariables] = useState<Record<string, string>>({});
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customTemplateName, setCustomTemplateName] = useState('');
  const [customTemplateContent, setCustomTemplateContent] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [variableErrors, setVariableErrors] = useState<Record<string, string>>({});

  // 初始化模板数据
  useEffect(() => {
    const allTemplates = DiaryTemplateService.getAllTemplates();
    setTemplates(allTemplates);
  }, []);

  // 当选择模板时，初始化变量
  useEffect(() => {
    if (selectedTemplate) {
      const variables = DiaryTemplateService.getTemplateVariables(selectedTemplate);
      const initialVars: Record<string, string> = {};
      
      variables.forEach(variable => {
        initialVars[variable.name] = variable.defaultValue;
      });
      
      // 如果有当前内容，尝试保留部分内容
      if (currentContent && currentContent.trim()) {
        initialVars.content = currentContent;
      }
      
      setTemplateVariables(initialVars);
    }
  }, [selectedTemplate, currentContent]);

  // 获取分类图标
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'travel': return <MapPin className="w-4 h-4" />;
      case 'work': return <Briefcase className="w-4 h-4" />;
      case 'study': return <GraduationCap className="w-4 h-4" />;
      case 'health': return <Activity className="w-4 h-4" />;
      case 'creative': return <Sparkles className="w-4 h-4" />;
      case 'custom': return <Edit3 className="w-4 h-4" />;
      default: return <BookOpen className="w-4 h-4" />;
    }
  };

  // 获取分类名称
  const getCategoryName = (category: string) => {
    switch (category) {
      case 'travel': return '旅行';
      case 'work': return '工作';
      case 'study': return '学习';
      case 'life': return '生活';
      case 'health': return '健康';
      case 'creative': return '创作';
      case 'custom': return '自定义';
      default: return category;
    }
  };

  // 处理变量更改
  const handleVariableChange = (name: string, value: string) => {
    setTemplateVariables(prev => ({
      ...prev,
      [name]: value
    }));

    // 清除该字段的错误
    if (variableErrors[name]) {
      setVariableErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // 验证必填字段
  const validateRequiredFields = (): boolean => {
    if (!selectedTemplate) return false;

    const variables = DiaryTemplateService.getTemplateVariables(selectedTemplate);
    const errors: Record<string, string> = {};

    variables.forEach(variable => {
      if (variable.required && !templateVariables[variable.name]?.trim()) {
        errors[variable.name] = '此字段为必填项';
      }
    });

    setVariableErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // 应用模板
  const handleApplyTemplate = () => {
    if (!selectedTemplate) return;

    if (!validateRequiredFields()) {
      return;
    }

    const result = DiaryTemplateService.applyTemplate(selectedTemplate, templateVariables);
    onSelect(selectedTemplate, templateVariables);
  };

  // 创建自定义模板
  const handleCreateCustomTemplate = () => {
    if (!customTemplateName.trim() || !customTemplateContent.trim()) {
      alert('请输入模板名称和内容');
      return;
    }

    try {
      const validation = DiaryTemplateService.validateTemplateContent(customTemplateContent);
      if (!validation.isValid) {
        alert(validation.errors.join('\n'));
        return;
      }

      const newTemplate = DiaryTemplateService.createCustomTemplate(
        customTemplateName,
        customTemplateContent
      );

      DiaryTemplateService.saveCustomTemplate(newTemplate);
      
      // 更新模板列表
      const updatedTemplates = [...templates, newTemplate];
      setTemplates(updatedTemplates);
      
      // 重置表单
      setCustomTemplateName('');
      setCustomTemplateContent('');
      setShowCustomForm(false);
      
      alert('自定义模板创建成功！');
    } catch (error) {
      console.error('创建自定义模板失败:', error);
      alert('创建自定义模板失败');
    }
  };

  // 删除自定义模板
  const handleDeleteTemplate = (templateId: string) => {
    if (!confirm('确定要删除这个自定义模板吗？')) return;

    if (DiaryTemplateService.deleteCustomTemplate(templateId)) {
      setTemplates(templates.filter(t => t.id !== templateId));
      if (selectedTemplate?.id === templateId) {
        setSelectedTemplate(null);
      }
      alert('模板删除成功！');
    } else {
      alert('模板删除失败');
    }
  };

  // 过滤模板
  const filteredTemplates = activeCategory === 'all' 
    ? templates 
    : templates.filter(t => t.category === activeCategory);

  return (
    <div className="space-y-6">
      {/* 模板分类导航 */}
      <div className="flex flex-wrap gap-2 pb-4 border-b border-gray-200">
        {[
          { id: 'all', name: '全部', icon: <BookOpen className="w-4 h-4" /> },
          { id: 'travel', name: '旅行', icon: <MapPin className="w-4 h-4" /> },
          { id: 'work', name: '工作', icon: <Briefcase className="w-4 h-4" /> },
          { id: 'study', name: '学习', icon: <GraduationCap className="w-4 h-4" /> },
          { id: 'life', name: '生活', icon: <Heart className="w-4 h-4" /> },
          { id: 'health', name: '健康', icon: <Activity className="w-4 h-4" /> },
          { id: 'custom', name: '自定义', icon: <Edit3 className="w-4 h-4" /> }
        ].map(category => (
          <button
            key={category.id}
            onClick={() => setActiveCategory(category.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors ${
              activeCategory === category.id
                ? 'bg-amber-100 text-amber-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {category.icon}
            {category.name}
          </button>
        ))}
      </div>

      {/* 创建自定义模板按钮 */}
      <div className="flex justify-between items-center">
        <h3 className="font-medium text-gray-900">
          {activeCategory === 'all' ? '日记模板' : getCategoryName(activeCategory) + '模板'}
        </h3>
        <button
          onClick={() => setShowCustomForm(!showCustomForm)}
          className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors text-sm"
        >
          <Plus className="w-4 h-4" />
          创建模板
        </button>
      </div>

      {/* 创建自定义模板表单 */}
      {showCustomForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h4 className="font-medium text-gray-900 mb-4">创建自定义模板</h4>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                模板名称
              </label>
              <input
                type="text"
                value={customTemplateName}
                onChange={(e) => setCustomTemplateName(e.target.value)}
                placeholder="为您的模板起个名字"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                模板内容
                <span className="text-xs text-gray-500 ml-2">(使用 &#123;&#123;变量名&#125;&#125; 格式添加占位符)</span>
              </label>
              <textarea
                value={customTemplateContent}
                onChange={(e) => setCustomTemplateContent(e.target.value)}
                placeholder={`例如：\n今天天气：{{weather}}\n心情：{{mood}}\n事件：{{event}}`}
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 resize-none"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleCreateCustomTemplate}
                className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
              >
                创建模板
              </button>
              <button
                onClick={() => {
                  setShowCustomForm(false);
                  setCustomTemplateName('');
                  setCustomTemplateContent('');
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 模板列表 */}
      <div className="grid gap-4">
        {filteredTemplates.map(template => (
          <div
            key={template.id}
            className={`border rounded-xl p-4 transition-all cursor-pointer ${
              selectedTemplate?.id === template.id
                ? 'border-amber-500 bg-amber-50'
                : 'border-gray-200 hover:border-amber-300 hover:bg-amber-25'
            }`}
            onClick={() => setSelectedTemplate(template)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  {getCategoryIcon(template.category)}
                  <h4 className="font-medium text-gray-900">{template.name}</h4>
                  {template.isPublic && (
                    <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded-full">
                      预设
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 mb-2">{template.description}</p>
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span>{getCategoryName(template.category)}</span>
                  <span>{template.placeholders.length} 个占位符</span>
                  <span>{new Date(template.updatedAt).toLocaleDateString()}</span>
                </div>
              </div>
              {!template.isPublic && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteTemplate(template.id);
                  }}
                  className="p-1 text-red-500 hover:bg-red-50 rounded"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* 模板变量输入区域 */}
      {selectedTemplate && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h4 className="font-medium text-gray-900 mb-4">
            填写 {selectedTemplate.name} 的信息
          </h4>
          
          <div className="grid gap-4">
            {DiaryTemplateService.getTemplateVariables(selectedTemplate).map(variable => (
              <div key={variable.name}>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {variable.description} {variable.required && <span className="text-red-500">*</span>}
                </label>
                <input
                  type="text"
                  value={templateVariables[variable.name] || ''}
                  onChange={(e) => handleVariableChange(variable.name, e.target.value)}
                  placeholder={variable.defaultValue}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 ${
                    variableErrors[variable.name] 
                      ? 'border-red-500' 
                      : 'border-gray-300'
                  }`}
                />
                {variableErrors[variable.name] && (
                  <p className="mt-1 text-sm text-red-600">{variableErrors[variable.name]}</p>
                )}
              </div>
            ))}
          </div>

          <div className="mt-6 flex gap-3">
            <button
              onClick={handleApplyTemplate}
              className="px-6 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors font-medium"
            >
              应用模板
            </button>
            <button
              onClick={() => setSelectedTemplate(null)}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              取消
            </button>
          </div>
        </div>
      )}
    </div>
  );
}