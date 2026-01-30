import { Diary } from '@/lib/supabase';

// 获取日记列表
export async function getDiariesFromApi(params: {
  page?: number;
  limit?: number;
  mood?: string;
  startDate?: string;
  endDate?: string;
}): Promise<{ data: Diary[]; pagination: any }> {
  const { page = 1, limit = 10, mood, startDate, endDate } = params;
  
  let url = `/api/diaries?page=${page}&limit=${limit}`;
  if (mood) url += `&mood=${mood}`;
  if (startDate) url += `&startDate=${startDate}`;
  if (endDate) url += `&endDate=${endDate}`;
  
  const response = await fetch(url);
  const result = await response.json();
  
  if (!result.success) {
    throw new Error(result.error || '获取日记列表失败');
  }
  
  return result;
}

// 获取单篇日记
export async function getDiaryByIdFromApi(id: string): Promise<Diary> {
  const response = await fetch(`/api/diaries/${id}`);
  const result = await response.json();
  
  if (!result.success) {
    throw new Error(result.error || '获取日记详情失败');
  }
  
  return result.data;
}

// 创建日记
export async function createDiaryFromApi(
  diary: Partial<Diary>,
  token: string
): Promise<Diary> {
  const response = await fetch('/api/diaries', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(diary),
  });
  
  const result = await response.json();
  
  if (!result.success) {
    throw new Error(result.error || '创建日记失败');
  }
  
  return result.data;
}

// 更新日记
export async function updateDiaryFromApi(
  id: string,
  updates: Partial<Diary>,
  token: string
): Promise<Diary> {
  const response = await fetch(`/api/diaries/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(updates),
  });
  
  const result = await response.json();
  
  if (!result.success) {
    throw new Error(result.error || '更新日记失败');
  }
  
  return result.data;
}

// 删除日记
export async function deleteDiaryFromApi(
  id: string,
  token: string
): Promise<void> {
  const response = await fetch(`/api/diaries/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  
  const result = await response.json();
  
  if (!result.success) {
    throw new Error(result.error || '删除日记失败');
  }
}