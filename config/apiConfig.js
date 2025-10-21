// AI API 配置文件
// 注意：敏感信息（如API密钥）从本地环境配置文件加载，不应硬编码

// 尝试加载本地环境配置文件，包含敏感信息
let localEnv = {};
try {
  localEnv = require('./.env.local.js');
  console.log('已加载本地环境配置文件');
} catch (error) {
  console.warn('未找到本地环境配置文件.env.local.js，使用默认配置');
  localEnv = {
    apiKeys: {
      openai: '',
      ernie: { apiKey: '', secretKey: '' },
      hunyuan: '',
      qwen: ''
    }
  };
}

const API_CONFIG = {
  // 通用配置
  baseConfig: {
    timeout: 30000, // 请求超时时间（毫秒）
    retryCount: 3   // 请求失败重试次数
  },
  
  // OpenAI API 配置
  openai: {
    baseUrl: 'https://api.openai.com/v1',
    apiKey: localEnv.apiKeys.openai || 'your_openai_api_key',
    model: 'gpt-3.5-turbo',
    temperature: 0.7
  },
  
  // 百度文心一言 API 配置
  ernie: {
    baseUrl: 'https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/completions_pro',
    apiKey: localEnv.apiKeys.ernie?.apiKey || 'your_baidu_api_key',
    secretKey: localEnv.apiKeys.ernie?.secretKey || 'your_baidu_secret_key',
    model: 'ernie-bot-turbo'
  },
  
  // 腾讯云混元大模型 API 配置
  hunyuan: {
    baseUrl: 'https://hunyuan.cloud.tencent.com/v1/chat/completions',
    apiKey: localEnv.apiKeys.hunyuan || 'your_tencent_api_key',
    model: 'hunyuan-pro'
  },
  
  // 阿里云通义千问 API 配置
  qwen: {
    baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
    apiKey: localEnv.apiKeys.qwen || 'your_qwen_api_key',
    // model: 'qwen-plus'
    model: 'qwen3-vl-plus'
  }
};

// 导出配置
module.exports = API_CONFIG;