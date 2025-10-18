Page({
  data: {
    collections: [],
    loading: true
  },
  onLoad() {
    this.loadCollections();
  },
  onShow() {
    this.loadCollections();
  },
  loadCollections() {
    this.setData({ loading: true });
    
    // 从本地存储加载舞厅收藏列表
    const favorites = wx.getStorageSync('dance_hall_favorites') || [];
    
    if (favorites.length === 0) {
      // 如果没有收藏数据，显示空状态
      this.setData({
        collections: [],
        loading: false
      });
      return;
    }
    
    // 获取所有舞厅数据用于显示详细信息
    wx.cloud.database().collection('dance_halls')
      .where({
        _id: wx.cloud.database().command.in(favorites)
      })
      .get()
      .then(res => {
        const collections = res.data.map(hall => ({
          _id: hall._id,
          name: hall.name || '舞厅',
          address: hall.address || '地址未知',
          image: hall.image || this.generateRandomImage(),
          rating: hall.rating || 4.0,
          price: hall.price || '价格待定',
          businessHours: hall.businessHours || '营业时间未知',
          collectTime: this.formatCollectTime(hall._id)
        }));
        
        this.setData({
          collections: collections,
          loading: false
        });
      })
      .catch(err => {
        console.error('加载收藏数据失败:', err);
        // 如果云端数据加载失败，显示错误信息
        this.setData({
          collections: [],
          loading: false
        });
      });
  },
  
  // 生成随机图片URL
  generateRandomImage() {
    const danceImages = [
      'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400',
      'https://images.unsplash.com/photo-1504609813442-a8924e83f76e?w=400',
      'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400',
      'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400',
      'https://images.unsplash.com/photo-1524368535928-5d8b7f0c7d1b?w=400',
      'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400'
    ];
    return danceImages[Math.floor(Math.random() * danceImages.length)];
  },
  
  // 格式化收藏时间
  formatCollectTime(hallId) {
    const collectRecord = wx.getStorageSync('collect_time_record') || {};
    return collectRecord[hallId] || '刚刚';
  },
  
  // 取消收藏
  deleteCollection(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '确认取消收藏',
      content: '确定要取消收藏这个舞厅吗？',
      success: (res) => {
        if (res.confirm) {
          // 从本地存储移除收藏
          let favorites = wx.getStorageSync('dance_hall_favorites') || [];
          favorites = favorites.filter(favId => favId !== id);
          wx.setStorageSync('dance_hall_favorites', favorites);
          
          // 更新收藏时间记录
          const collectRecord = wx.getStorageSync('collect_time_record') || {};
          delete collectRecord[id];
          wx.setStorageSync('collect_time_record', collectRecord);
          
          // 更新页面数据
          let collections = this.data.collections.filter(item => item._id !== id);
          this.setData({ collections });
          
          wx.showToast({
            title: '已取消收藏',
            icon: 'success'
          });
          
          // 通知首页更新收藏状态
          this.notifyHomePage(id, false);
        }
      }
    });
  },
  
  // 导航到详情页
  goToDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/detail/detail?id=${id}`
    });
  },
  
  // 通知首页更新收藏状态
  notifyHomePage(hallId, isFavorite) {
    const pages = getCurrentPages();
    if (pages.length > 1) {
      const homePage = pages.find(page => page.route === 'pages/index/index');
      if (homePage) {
        homePage.updateFavoriteStatus(hallId, isFavorite);
      }
    }
  },
  
  // 清空所有收藏
  clearAllCollections() {
    if (this.data.collections.length === 0) {
      wx.showToast({
        title: '暂无收藏',
        icon: 'none'
      });
      return;
    }
    
    wx.showModal({
      title: '清空收藏',
      content: '确定要清空所有收藏吗？此操作不可撤销。',
      success: (res) => {
        if (res.confirm) {
          // 清空本地存储
          wx.setStorageSync('dance_hall_favorites', []);
          wx.setStorageSync('collect_time_record', {});
          
          // 更新页面
          this.setData({ collections: [] });
          
          wx.showToast({
            title: '收藏已清空',
            icon: 'success'
          });
          
          // 通知首页更新所有收藏状态
          this.notifyHomePageClearAll();
        }
      }
    });
  },
  
  // 通知首页清空所有收藏状态
  notifyHomePageClearAll() {
    const pages = getCurrentPages();
    if (pages.length > 1) {
      const homePage = pages.find(page => page.route === 'pages/index/index');
      if (homePage) {
        homePage.clearAllFavorites();
      }
    }
  },
  
  // 搜索收藏
  onSearchInput(e) {
    const keyword = e.detail.value.toLowerCase();
    if (!keyword) {
      this.loadCollections();
      return;
    }
    
    const filtered = this.data.collections.filter(hall => 
      hall.name.toLowerCase().includes(keyword) ||
      hall.address.toLowerCase().includes(keyword)
    );
    
    this.setData({ collections: filtered });
  },
  
  // 图片加载错误处理
  onImageError(e) {
    const index = e.currentTarget.dataset.index;
    const collections = this.data.collections || [];
    if (collections[index]) {
      collections[index].image = '/assets/images/placeholder.png';
      this.setData({ collections });
    }
  }
})