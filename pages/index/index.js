// 引入配置、API客户端和数据库工具
const config = require('../../config/index.js');
const apiConfig = require('../../config/apiConfig.js');
const apiClient = require('../../utils/apiClient.js');
const Database = require('../../utils/db.js');

Page({
  data: {
    // 页面数据
    imageSrc: '', // 存储拍照后的图片路径
    showCamera: false,
    isRecognizing: false,
    recognizedObjects: [],
    recognizedItems: [], // 识别结果列表
    recognitionError: '',
    historyRecords: [], // 历史记录数据
    isLoadingHistory: false // 加载历史数据的状态
  },
  onLoad: function() {
    // 页面加载时执行
    console.log('Page loaded')
    // 输出当前环境配置信息
    console.log('当前环境:', config.env.environment);
    console.log('调试模式:', config.debugMode);
    
    // 不再主动请求相机权限，改为按需请求
    
    // 加载历史数据
    this.loadHistoryData();
  },
  
  // 加载历史识别数据
  loadHistoryData: function() {
    try {
      this.setData({ isLoadingHistory: true });
      
      // 从数据库获取历史记录
      const history = Database.getHistory();
      
      console.log('加载到的历史记录:', history);
      
      this.setData({
        historyRecords: history,
        isLoadingHistory: false
      });
    } catch (error) {
      console.error('加载历史数据失败:', error);
      this.setData({ isLoadingHistory: false });
    }
  },
  
  // 刷新历史数据（用于识别成功后重新加载）
  refreshHistoryData: function() {
    this.loadHistoryData();
  },
  
  // 删除单条历史记录
  deleteHistoryRecord: function(e) {
    const recordId = e.currentTarget.dataset.id;
    
    // 弹出确认对话框
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这条历史记录吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            // 调用数据库删除方法
            await Database.deleteRecord(recordId);
            
            // 删除成功后刷新历史数据
            this.refreshHistoryData();
            
            wx.showToast({
              title: '删除成功',
              icon: 'success'
            });
          } catch (error) {
            console.error('删除记录失败:', error);
            wx.showToast({
              title: '删除失败，请重试',
              icon: 'none'
            });
          }
        }
      }
    });
  },
  
  // 打开摄像头
  openCamera: function() {
    // 先请求相机权限
    this.requestCameraPermission().then(hasPermission => {
      if (hasPermission) {
        this.setData({ showCamera: true });
      } else {
        wx.showToast({
          title: '需要相机权限才能拍照',
          icon: 'none'
        });
      }
    });
  },
  
  // 关闭摄像头
  closeCamera: function() {
    this.setData({ showCamera: false });
  },
  onShow: function() {
    // 页面显示时执行
    console.log('Page shown')
  },
  
  // 请求相机权限
  requestCameraPermission: function() {
    return new Promise((resolve, reject) => {
      wx.getSetting({
        success: (res) => {
          if (res.authSetting['scope.camera']) {
            resolve(true);
          } else {
            wx.authorize({
              scope: 'scope.camera',
              success: () => {
                console.log('相机权限已授权');
                resolve(true);
              },
              fail: () => {
                console.log('相机权限被拒绝');
                resolve(false);
              }
            });
          }
        },
        fail: () => {
          resolve(false);
        }
      });
    });
  },
  
  // 拍照功能
  takePhoto: function() {
    // 创建相机上下文
    const ctx = wx.createCameraContext();
    
    // 执行拍照
    ctx.takePhoto({
      quality: 'high', // 照片质量
      success: (res) => {
        // 拍照成功，获取图片路径
        this.setData({
          imageSrc: res.tempImagePath,
          recognizedObjects: [],
          recognitionError: ''
        });
        console.log('拍照成功，图片路径：', res.tempImagePath);
        
        // 关闭摄像头
        this.setData({ showCamera: false });
        
        // 调用图像识别函数
        this.recognizeImage(res.tempImagePath);
      },
      fail: (err) => {
        // 拍照失败
        console.error('拍照失败：', err);
        wx.showToast({
          title: '拍照失败，请重试',
          icon: 'none'
        });
      }
    });
  },
  
  // 图像识别函数 - 优化版本
  recognizeImage: function(imagePath) {
    // 设置识别中状态
    this.setData({
      isRecognizing: true,
      recognitionError: '',
      recognizedObjects: []
    });
    
    console.log('开始处理图片识别，图片路径:', imagePath);
    
    // 首先需要将图片转为base64
    wx.getFileSystemManager().readFile({
      filePath: imagePath,
      encoding: 'base64',
      success: async (res) => {
        const base64Image = res.data;
        console.log('图片转换为base64成功，长度:', base64Image.length);
        
        try {
          // 优化提示词，使其更明确地指导模型识别物体
          const recognitionPrompt = '请仔细分析这张图片，识别并列出图中所有可见的物体。请严格按照以下格式返回：物体1,物体2,物体3,...。不要添加任何额外的描述或解释。';
          
          console.log('准备调用阿里云通义千问API');
          
          // 直接构建符合API要求的多模态消息格式
          // 注意：不再需要消息对象，直接构建prompt字符串
          const fullPrompt = recognitionPrompt + '\n<image>data:image/jpeg;base64,' + base64Image + '</image>';
          
          console.log('多模态prompt字符串创建完成');
          console.log('prompt类型:', typeof fullPrompt);
          console.log('prompt长度:', fullPrompt.length);
          console.log('是否包含image标签:', fullPrompt.includes('<image'));
          
          // 直接调用callQwen，传递prompt字符串
          console.log('即将执行API调用，使用完整prompt字符串');
          const result = await apiClient.callQwen({ prompt: fullPrompt, imgUrl: 'data:image/jpeg;base64,' + base64Image });
          
          console.log('API调用成功，响应结果:', JSON.stringify(result));
          
          // 解析识别结果 - 处理JSON格式的响应数据
          let recognizedItems = [];
          if (result) {
            try {
              // 处理标准格式
              if (result.output && result.output.text) {
                const textResult = result.output.text.trim();
                console.log('识别到的文本结果:', textResult);
                // 尝试解析JSON格式
                recognizedItems = JSON.parse(textResult);
                console.log('成功解析JSON格式结果:', recognizedItems);
              }
              // 处理可能的其他格式
              else if (result.choices && result.choices[0] && result.choices[0].message && result.choices[0].message.content) {
                const textResult = result.choices[0].message.content.trim();
                console.log('识别到的文本结果(备选格式):', textResult);
                // 尝试解析JSON格式
                recognizedItems = JSON.parse(textResult);
                console.log('成功解析JSON格式结果:', recognizedItems);
              }
              
              // 验证解析结果是否为数组
              if (!Array.isArray(recognizedItems)) {
                console.error('解析结果不是有效的数组格式');
                recognizedItems = [];
              }
            } catch (jsonError) {
              console.error('JSON解析失败:', jsonError);
              console.log('尝试使用备用解析方案');
              // 如果JSON解析失败，保持原有的逗号分隔解析方式作为备用
              let textResult = '';
              if (result.output && result.output.text) {
                textResult = result.output.text.trim();
              } else if (result.choices && result.choices[0] && result.choices[0].message && result.choices[0].message.content) {
                textResult = result.choices[0].message.content.trim();
              }
              // 简单的逗号分隔解析作为后备方案
              const objects = textResult.split(',').map(item => item.trim()).filter(item => item);
              // 转换为所需的数据结构
              recognizedItems = objects.map(name => ({ name, date: '未知' }));
            }
          }
          
          console.log('解析后的识别结果:', recognizedItems);
          
          // 更新识别结果
          this.setData({
            recognizedItems: recognizedItems,
            isRecognizing: false
          });
          
          // 保存识别结果到数据库
          if (recognizedItems.length > 0) {
            // 检查是否所有物品都有有效的保持期且不超过300天
            const hasValidItems = recognizedItems.some(item => {
              if (!item.date || item.date === '未知') {
                return false;
              }
              
              // 尝试提取天数
              const daysMatch = item.date.match(/\d+/);
              if (!daysMatch) {
                return false;
              }
              
              const days = parseInt(daysMatch[0], 10);
              return !isNaN(days) && days <= 300;
            });
            
            // 只有当至少有一个物品有有效保持期且不超过300天时才保存
            if (hasValidItems) {
              try {
                // 创建要保存的记录
                const recordToSave = {
                  imageSrc: imagePath,
                  items: recognizedItems,
                  itemCount: recognizedItems.length,
                  recognitionDate: new Date().toLocaleString()
                };
                
                // 保存到数据库
                await Database.saveRecognition(recordToSave);
                console.log('识别结果已保存到数据库');
                
                // 刷新历史数据列表
                this.refreshHistoryData();
              } catch (saveError) {
                console.error('保存识别结果到数据库失败:', saveError);
                // 保存失败不影响用户体验，只记录日志
              }
            } else {
              console.log('识别结果中没有有效的保持期（保持期未知或超过300天），不保存到历史记录');
            }
          }
          
          // 如果没有识别到物体，给用户提示
          if (recognizedItems.length === 0) {
            this.setData({
              recognitionError: '未识别到任何物体'
            });
            wx.showToast({
              title: '未识别到任何物体',
              icon: 'none'
            });
          } else {
            // 识别成功提示
            wx.showToast({
              title: '成功识别到 ' + recognizedItems.length + ' 个物体',
              icon: 'success'
            });
          }
          
        } catch (error) {
          // 输出详细错误信息便于调试
          console.error('图像识别失败:', error);
          console.log('错误详情:', JSON.stringify(error));
          
          let errorMsg = '识别服务暂时不可用';
          // 根据错误类型提供更具体的提示
          if (error.errMsg || error.customMessage) {
            const errDetail = error.errMsg || error.customMessage;
            console.error('网络请求错误详情:', errDetail);
            
            if (errDetail.includes('request:fail')) {
              if (errDetail.includes('timeout')) {
                errorMsg = '请求超时，请稍后重试';
              } else if (errDetail.includes('network')) {
                errorMsg = '网络连接异常，请检查网络设置';
              } else if (errDetail.includes('ssl')) {
                errorMsg = 'SSL证书验证失败';
              } else {
                errorMsg = '网络请求失败，请检查网络连接';
              }
            }
          } else if (error.message) {
            if (error.message.includes('401')) {
              errorMsg = 'API密钥无效，请检查配置';
            } else if (error.message.includes('403')) {
              errorMsg = '无权限访问，请检查API密钥权限';
            } else if (error.message.includes('404')) {
              errorMsg = '请求的接口不存在';
            } else if (error.message.includes('timeout')) {
              errorMsg = '请求超时，请稍后重试';
            }
          }
          
          // 自动使用模拟识别结果，确保功能演示正常
          this.setData({
            recognitionError: errorMsg + ' (已使用模拟数据)',
            isRecognizing: false,
            // 提供模拟识别结果，便于演示和测试
            recognizedItems: [
              { name: '面包', date: '3天' },
              { name: '牛奶', date: '7天' },
              { name: '水果', date: '5天' },
              { name: '鸡蛋', date: '10天' },
              { name: '蔬菜', date: '4天' }
            ]
          });
          
          wx.showModal({
            title: '识别说明',
            content: errorMsg + '\n\n已自动使用模拟识别结果进行展示。',
            showCancel: false,
            success: () => {
              // 可以在这里添加额外的操作
            }
          });
        }
      },
      fail: (err) => {
        console.error('读取图片失败:', err);
        console.log('图片读取错误详情:', JSON.stringify(err));
        this.setData({
          recognitionError: '图片处理失败: ' + (err.errMsg || '未知错误'),
          isRecognizing: false
        });
        
        wx.showToast({
          title: '图片处理失败，请重试',
          icon: 'none'
        });
      }
    });
  },
  

})