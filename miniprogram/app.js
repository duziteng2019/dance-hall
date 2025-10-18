App({
  onLaunch: function() {
    // 初始化云开发
    wx.cloud.init({
      env: 'cloud1-3gffxfbw1b36f8a6', // 云开发环境ID
      traceUser: true
    });
  }
});