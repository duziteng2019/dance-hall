// 我的页面逻辑
Page({
  data: {
    userInfo: {
      nickname: '',
      desc: '',
      isLogin: false
    }
  },

  onLoad() {
    this.loadUserInfo();
  },

  // 加载用户信息
  loadUserInfo() {
    // 模拟获取用户信息
    const userInfo = wx.getStorageSync('userInfo') || {
      nickname: '',
      desc: '点击登录，享受更多服务',
      isLogin: false
    };
    
    this.setData({ userInfo });
  },

  // 登录
  onLogin() {
    wx.showModal({
      title: '登录提示',
      content: '是否使用微信登录？',
      success: (res) => {
        if (res.confirm) {
          // 模拟登录成功
          const userInfo = {
            nickname: '舞厅爱好者',
            desc: '已登录，尽享专属服务',
            isLogin: true
          };
          
          this.setData({ userInfo });
          wx.setStorageSync('userInfo', userInfo);
          
          wx.showToast({
            title: '登录成功',
            icon: 'success'
          });
        }
      }
    });
  },

  // 菜单点击
  onMenuTap(e) {
    const type = e.currentTarget.dataset.type;
    
    switch(type) {
      case 'favorites':
        wx.showToast({ title: '我的收藏功能开发中', icon: 'none' });
        break;
      case 'history':
        wx.showToast({ title: '浏览历史功能开发中', icon: 'none' });
        break;
      case 'reviews':
        wx.showToast({ title: '我的评价功能开发中', icon: 'none' });
        break;
      case 'settings':
        wx.showToast({ title: '设置功能开发中', icon: 'none' });
        break;
    }
  },

  // 底部导航切换
  onTabChange(e) {
    const index = e.detail.index;
    if (index === 0) {
      wx.switchTab({
        url: '/pages/index/index'
      });
    }
  }
})