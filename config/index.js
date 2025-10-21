// 配置文件索引
// 统一管理和导出所有配置

// 导入各配置模块
const apiConfig = require('./apiConfig.js');
const envConfig = require('./env.js');

// 统一导出配置
module.exports = {
  // API 配置
  api: apiConfig,
  
  // 环境配置
  env: envConfig,
  
  // 合并配置对象，便于使用
  getConfig() {
    return {
      ...apiConfig,
      ...envConfig,
      // 环境特定的API配置
      currentApiConfig: envConfig.useMockData 
        ? {
            ...apiConfig,
            // 使用模拟API时的特殊配置
            isMock: true,
            mockDelay: 500 // 模拟延迟（毫秒）
          }
        : apiConfig
    };
  }
};

// 提供便捷的配置访问方式
module.exports.isDev = envConfig.environment === 'development';
module.exports.isProd = envConfig.environment === 'production';
module.exports.debugMode = envConfig.debug;