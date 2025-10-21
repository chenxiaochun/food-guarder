// 环境配置文件
// 根据当前环境加载不同的配置

// 判断当前环境（开发环境或生产环境）
// 注意：在实际项目中，可以通过微信小程序的编译模式或环境变量来区分
const isDev = true; // true表示开发环境，false表示生产环境

// 开发环境配置
const devConfig = {
  environment: 'development',
  debug: true,
  // 设置为false以使用真实API
  useMockData: false,
  apiEndpoint: 'https://api-dev.example.com',
  // 开发环境可以使用更宽松的API调用限制
  apiRateLimit: {
    maxRequests: 100,
    timeWindow: 60 // 秒
  }
};

// 生产环境配置
const prodConfig = {
  environment: 'production',
  debug: false,
  useMockData: false,
  apiEndpoint: 'https://api.example.com',
  // 生产环境应设置合理的API调用限制
  apiRateLimit: {
    maxRequests: 1000,
    timeWindow: 3600 // 秒
  }
};

// 根据环境选择配置
const envConfig = isDev ? devConfig : prodConfig;

// 导出环境配置
module.exports = envConfig;