// 千问API测试脚本
// 直接使用Node.js发送请求，绕过可能的封装问题

const https = require('https');
const fs = require('fs');

// 配置
const API_KEY = 'sk-65fdf4deca47406ba50849e2c2efe909'; // 从config中复制的API密钥
const API_URL = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation';
const TEST_PROMPT = '你好，请简单介绍一下你自己';

// 构建请求数据
const postData = JSON.stringify({
  model: 'qwen-plus',
  prompt: TEST_PROMPT
});

// 请求选项
const options = {
  hostname: 'dashscope.aliyuncs.com',
  port: 443,
  path: '/api/v1/services/aigc/text-generation/generation',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData),
    'Authorization': `Bearer ${API_KEY}`
  }
};

console.log('开始测试千问API...');
console.log('API URL:', API_URL);
console.log('API密钥状态:', API_KEY ? '已设置' : '未设置');
console.log('请求参数:', postData);

// 发送请求
const req = https.request(options, (res) => {
  console.log(`响应状态码: ${res.statusCode}`);
  console.log('响应头:', res.headers);
  
  let responseData = '';
  
  res.on('data', (chunk) => {
    responseData += chunk;
  });
  
  res.on('end', () => {
    console.log('响应体:', responseData);
    try {
      const parsedData = JSON.parse(responseData);
      console.log('解析后的响应:', JSON.stringify(parsedData, null, 2));
    } catch (e) {
      console.error('解析响应失败:', e);
    }
  });
});

req.on('error', (e) => {
  console.error('请求错误:', e);
});

// 写入数据
req.write(postData);
req.end();