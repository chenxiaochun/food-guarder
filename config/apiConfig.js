// AI API 配置文件
// 注意：实际使用时请将真实的API密钥替换为占位符，并在实际开发环境中通过安全方式注入

const API_CONFIG = {
  // 通用配置
  baseConfig: {
    timeout: 30000, // 请求超时时间（毫秒）
    retryCount: 3   // 请求失败重试次数
  },
  
  // OpenAI API 配置
  openai: {
    baseUrl: 'https://api.openai.com/v1',
    apiKey: 'your_openai_api_key', // 请替换为实际API密钥
    model: 'gpt-3.5-turbo',
    temperature: 0.7
  },
  
  // 百度文心一言 API 配置
  ernie: {
    baseUrl: 'https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/completions_pro',
    apiKey: 'your_baidu_api_key', // 请替换为实际API密钥
    secretKey: 'your_baidu_secret_key', // 请替换为实际Secret Key
    model: 'ernie-bot-turbo'
  },
  
  // 腾讯云混元大模型 API 配置
  hunyuan: {
    baseUrl: 'https://hunyuan.cloud.tencent.com/v1/chat/completions',
    apiKey: 'your_tencent_api_key', // 请替换为实际API密钥
    model: 'hunyuan-pro'
  },
  
  // 阿里云通义千问 API 配置
  qwen: {
    baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
    apiKey: 'sk-65fdf4deca47406ba50849e2c2efe909', // 请替换为实际API密钥
    // model: 'qwen-plus'
    model: 'qwen3-vl-plus'
  }
};

// 导出配置
module.exports = API_CONFIG;