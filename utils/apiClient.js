// API 客户端工具
// 用于封装和处理与各种AI服务的API调用

const API_CONFIG = require('../config/apiConfig.js');

// 清理和验证prompt内容的辅助函数
function sanitizePrompt(prompt) {
  if (!prompt || typeof prompt !== 'string') {
    return '';
  }
  
  // 移除可能导致JSON解析错误的控制字符
  let cleanPrompt = prompt
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
    .trim();
  
  // 限制长度，避免过大的请求
  if (cleanPrompt.length > 5000) {
    console.warn('Prompt长度超过5000字符，已截断');
    cleanPrompt = cleanPrompt.substring(0, 5000);
  }
  
  return cleanPrompt;
}

// 封装微信小程序的request请求
function request(options) {
  console.log('请求函数被调用，原始选项:', JSON.stringify(options));
  
  // 创建请求选项，移除手动序列化
  let requestOptions = { ...options };
  
  // 确保Content-Type头正确设置
  if (!requestOptions.header) {
    requestOptions.header = {};
  }
  if (!requestOptions.header['Content-Type']) {
    requestOptions.header['Content-Type'] = 'application/json';
  }
  
  console.log('最终请求选项:', JSON.stringify(requestOptions));
  
  return new Promise((resolve, reject) => {
    wx.request({
      ...requestOptions,
      success: (res) => {
        console.log('请求成功，状态码:', res.statusCode);
        console.log('响应头:', JSON.stringify(res.header));
        console.log('响应数据:', JSON.stringify(res.data));
        
        // 检查HTTP状态码
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data);
        } else {
          const error = new Error(`请求失败: ${res.statusCode}`);
          error.response = res;
          reject(error);
        }
      },
      fail: (err) => {
        console.error('请求失败:', JSON.stringify(err));
        reject(err);
      }
    });
  });
}

// AI API 客户端类
class AIClient {
  constructor() {
    this.config = API_CONFIG;
  }

  // OpenAI API 调用方法
  async callOpenAI(prompt, messages = []) {
    try {
      // 构建请求消息
      const requestMessages = [
        { role: 'system', content: prompt },
        ...messages
      ];

      // 发送请求
      const result = await request({
        url: `${this.config.openai.baseUrl}/chat/completions`,
        method: 'POST',
        header: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.openai.apiKey}`
        },
        data: {
          model: this.config.openai.model,
          messages: requestMessages,
          temperature: this.config.openai.temperature
        },
        timeout: this.config.baseConfig.timeout
      });

      return result;
    } catch (error) {
      console.error('OpenAI API调用失败:', error);
      throw error;
    }
  }

  // 百度文心一言 API 调用方法（简化版）
  async callErnie(prompt) {
    try {
      // 获取access_token（实际实现需调用百度认证接口）
      // 这里为简化示例，实际使用时需要先获取token
      const accessToken = 'your_access_token'; // 临时占位

      const result = await request({
        url: `${this.config.ernie.baseUrl}?access_token=${accessToken}`,
        method: 'POST',
        header: {
          'Content-Type': 'application/json'
        },
        data: {
          model: this.config.ernie.model,
          messages: [
            { role: 'user', content: prompt }
          ]
        },
        timeout: this.config.baseConfig.timeout
      });

      return result;
    } catch (error) {
      console.error('文心一言 API调用失败:', error);
      throw error;
    }
  }

  // 阿里云通义千问 API 调用方法（同时使用prompt和messages参数）
  async callQwen({ prompt, imgUrl}) {
    console.log('开始调用阿里云通义千问API');
    console.log('原始参数 - prompt类型:', typeof prompt);
    console.log('原始参数 - prompt是否存在:', prompt ? '是' : '否');
    
    try {
      // 使用辅助函数清理和验证prompt参数
      const cleanPrompt = sanitizePrompt(prompt);
      
      if (!cleanPrompt) {
        throw new Error('参数错误：prompt必须是一个有效的非空字符串');
      }
      
      console.log('清理后的prompt类型:', typeof cleanPrompt);
      console.log('清理后的prompt长度:', cleanPrompt.length);
      console.log('prompt内容前100字符:', cleanPrompt.substring(0, 100));

      // 检查prompt中是否包含图像数据
      const containsImage = cleanPrompt.includes('<image>');
      
      console.log('检测结果 - 是否包含图像:', containsImage);

      // 重要：使用配置中的原始URL和模型，避免自定义选择
      const apiUrl = this.config.qwen.baseUrl;
      const model = this.config.qwen.model;
      
      console.log('使用API (从配置):', apiUrl);
      console.log('使用模型 (从配置):', model);
      
      // 重要：同时提供prompt和messages参数，确保API能识别到参数
      const apiParams = {
        model: model,
         "messages": [
          {
            "role": "user",
            "content": [
              {
                "type": "image_url",
                "image_url": {
                  "url": imgUrl
                }
              },
              {
                "type": "text",
                "text": "请将图片中识别出的物体名称以逗号分隔的形式列出来"
              }
            ]
          }
        ],
        // prompt: cleanPrompt,
        // // 同时提供messages参数，按照API要求的格式
        // messages: [
        //   { role: 'user', content: cleanPrompt }
        // ]
      };
      
      // 添加可选参数
      if (containsImage) {
        apiParams.temperature = 0.1;
        apiParams.max_tokens = 500;
        apiParams.result_format = 'text';
      } else {
        apiParams.temperature = 0.7;
        apiParams.max_tokens = 200;
      }
      
      console.log('最终API请求参数对象:', JSON.stringify(apiParams, null, 2));
      console.log('API密钥状态:', this.config.qwen.apiKey ? '已设置' : '未设置');
      
      // 创建最终的请求选项对象，确保所有字段正确
      const requestOptions = {
        url: apiUrl,
        method: 'POST',
        header: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.qwen.apiKey}`
        },
        data: apiParams,
        timeout: containsImage ? 60000 : 30000,
      };
      
      console.log('完整请求配置:', JSON.stringify(requestOptions, null, 2));
      
      // 发送请求
      console.log('即将发送HTTP请求到:', apiUrl);
      const result = await request(requestOptions);
      
      console.log('收到API响应:', JSON.stringify(result));
      return result;
    } catch (error) {
      console.error('阿里云通义千问 API调用失败:', error);
      // 输出详细错误信息便于调试
      if (error.errMsg) {
        console.error('微信请求错误:', error.errMsg);
        error.customMessage = error.errMsg;
      }
      if (error.response) {
        console.error('API响应错误:', JSON.stringify(error.response));
      }
      if (error.message) {
        console.error('错误消息:', error.message);
      }
      
      throw error;
    }
  }

  // 错误处理和重试逻辑
  async withRetry(apiCall, maxRetries = 3) {
    let lastError;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await apiCall();
      } catch (error) {
        lastError = error;
        console.log(`尝试 ${attempt + 1} 失败，${maxRetries - attempt - 1} 次重试机会`);
        
        // 等待一段时间后重试（指数退避策略）
        if (attempt < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
        }
      }
    }
    
    throw lastError;
  }
}

// 导出单例实例
module.exports = new AIClient();