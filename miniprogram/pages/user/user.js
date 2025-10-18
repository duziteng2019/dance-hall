Page({
  data: {
    userInfo: {},
    membershipLevel: "普通会员",
    points: 0,
    favoriteCount: 0,
    historyCount: 0,
    loginStatus: false
  },
  onLoad() {
    this.loadUserInfo();
    this.loadStatistics();
  },
  onShow() {
    this.loadStatistics();
  },
  loadUserInfo() {
    // 尝试获取用户信息
    wx.getStorage({
      key: 'userInfo',
      success: (res) => {
        this.setData({
          userInfo: res.data,
          loginStatus: true
        });
      },
      fail: () => {
        this.setData({
          userInfo: {
            nickName: '未登录',
            avatarUrl: '/assets/images/avatar-default.png'
          },
          loginStatus: false
        });
      }
    });
  },
  loadStatistics() {
    // 加载收藏和浏览历史统计
    const favorites = wx.getStorageSync('dance_hall_favorites') || [];
    const history = wx.getStorageSync('dance_hall_history') || [];
    
    this.setData({
      favoriteCount: favorites.length,
      historyCount: history.length
    });
  },
  getUserProfile() {
    if (this.data.loginStatus) {
      return;
    }
    
    wx.getUserProfile({
      desc: '用于完善会员资料',
      success: (res) => {
        const userInfo = res.userInfo;
        wx.setStorageSync('userInfo', userInfo);
        this.setData({
          userInfo: userInfo,
          loginStatus: true
        });
        
        wx.showToast({
          title: '登录成功',
          icon: 'success'
        });
      },
      fail: () => {
        wx.showToast({
          title: '授权失败',
          icon: 'none'
        });
      }
    });
  },
  navigateToCollection() {
    wx.navigateTo({
      url: '/pages/collection/collection'
    });
  },
  navigateToHistory() {
    wx.navigateTo({
      url: '/pages/history/history'
    });
  },
  clearCache() {
    wx.showModal({
      title: '清除缓存',
      content: '确定要清除所有缓存数据吗？',
      success: (res) => {
        if (res.confirm) {
          wx.clearStorageSync();
          this.setData({
            userInfo: {},
            loginStatus: false,
            favoriteCount: 0,
            historyCount: 0
          });
          
          wx.showToast({
            title: '缓存已清除',
            icon: 'success'
          });
        }
      }
    });
  },
  contactService() {
    wx.showModal({
      title: '联系客服',
      content: '客服电话：400-123-4567\n服务时间：9:00-18:00',
      showCancel: false
    });
  },
  aboutApp() {
    wx.showModal({
      title: '关于舞厅小程序',
      content: '舞厅信息查询小程序\n版本：1.0.0\n提供全国舞厅信息查询服务',
      showCancel: false
    });
  }
})