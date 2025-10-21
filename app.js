App({
  onLaunch: function() {
    // 应用启动时执行
    console.log('App Launch')
  },
  onShow: function() {
    // 应用显示时执行
    console.log('App Show')
  },
  onHide: function() {
    // 应用隐藏时执行
    console.log('App Hide')
  },
  globalData: {
    userInfo: null
  }
})