// 数据库工具类 - 使用微信小程序本地存储模拟数据库

const DB_KEY = 'food_recognition_history';

class Database {
  /**
   * 保存识别结果到数据库
   * @param {Object} record - 要保存的记录对象
   * @returns {Promise<Object>} 保存成功的记录（包含ID和时间戳）
   */
  static async saveRecognition(record) {
    try {
      // 获取现有历史记录
      const history = this.getHistory();
      
      // 创建新记录，添加ID和时间戳
      const newRecord = {
        id: `record_${Date.now()}`,
        timestamp: Date.now(),
        ...record
      };
      
      // 添加到历史记录
      history.unshift(newRecord);
      
      // 保存到本地存储
      wx.setStorageSync(DB_KEY, JSON.stringify(history));
      
      console.log('识别结果保存成功:', newRecord);
      return newRecord;
    } catch (error) {
      console.error('保存识别结果失败:', error);
      throw new Error('保存失败');
    }
  }

  /**
   * 获取历史记录
   * @param {number} limit - 限制返回条数，默认100条
   * @returns {Array} 历史记录数组
   */
  static getHistory(limit = 100) {
    try {
      const historyStr = wx.getStorageSync(DB_KEY);
      if (!historyStr) return [];
      
      const history = JSON.parse(historyStr);
      return history.slice(0, limit);
    } catch (error) {
      console.error('获取历史记录失败:', error);
      return [];
    }
  }

  /**
   * 根据ID获取单条记录
   * @param {string} id - 记录ID
   * @returns {Object|null} 找到的记录或null
   */
  static getRecordById(id) {
    try {
      const history = this.getHistory();
      return history.find(record => record.id === id) || null;
    } catch (error) {
      console.error('获取记录失败:', error);
      return null;
    }
  }

  /**
   * 删除记录
   * @param {string} id - 记录ID
   * @returns {Promise<boolean>} 删除是否成功
   */
  static async deleteRecord(id) {
    try {
      let history = this.getHistory();
      const initialLength = history.length;
      
      // 过滤掉要删除的记录
      history = history.filter(record => record.id !== id);
      
      if (history.length === initialLength) {
        throw new Error('未找到要删除的记录');
      }
      
      // 保存更新后的历史记录
      wx.setStorageSync(DB_KEY, JSON.stringify(history));
      
      console.log('记录删除成功:', id);
      return true;
    } catch (error) {
      console.error('删除记录失败:', error);
      throw error;
    }
  }

  /**
   * 清空所有历史记录
   * @returns {Promise<boolean>} 清空是否成功
   */
  static async clearHistory() {
    try {
      wx.removeStorageSync(DB_KEY);
      console.log('历史记录已清空');
      return true;
    } catch (error) {
      console.error('清空历史记录失败:', error);
      throw error;
    }
  }

  /**
   * 搜索历史记录
   * @param {string} keyword - 搜索关键词
   * @returns {Array} 匹配的记录数组
   */
  static searchRecords(keyword) {
    try {
      const history = this.getHistory();
      const lowerKeyword = keyword.toLowerCase();
      
      return history.filter(record => {
        // 搜索记录中的物体名称
        if (record.items && Array.isArray(record.items)) {
          return record.items.some(item => 
            item.name.toLowerCase().includes(lowerKeyword)
          );
        }
        return false;
      });
    } catch (error) {
      console.error('搜索记录失败:', error);
      return [];
    }
  }
}

module.exports = Database;