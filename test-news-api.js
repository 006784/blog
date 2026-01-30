const http = require('http');

function testNewsAPI() {
  const postData = JSON.stringify({
    recipientEmail: '2047389870@qq.com',
    categories: ['technology', 'international'],
    minImportanceScore: 50,
    maxItemsPerCategory: 2
  });

  const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/news/test/',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  console.log('正在发送测试请求...');

  const req = http.request(options, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('状态码:', res.statusCode);
      console.log('响应头:', res.headers);
      console.log('响应数据:', data);
      
      try {
        const result = JSON.parse(data);
        if (result.success) {
          console.log('✅ 邮件发送成功！');
          console.log('新闻简报ID:', result.data.newsletterId);
          console.log('收集新闻数:', result.data.itemsCount);
          console.log('分类数:', result.data.categoriesCount);
        } else {
          console.log('❌ 发送失败:', result.error);
          console.log('详细信息:', result.message);
        }
      } catch (parseError) {
        console.log('响应数据解析失败:', parseError);
        console.log('原始响应:', data);
      }
    });
  });

  req.on('error', (error) => {
    console.error('请求错误:', error);
  });

  req.write(postData);
  req.end();
}

testNewsAPI();