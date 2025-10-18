Page({
  data: {
    loading: true,
    history: []
  },

  onLoad: function(options) {
    this.loadHistory()
  },

  onShow: function() {
    this.loadHistory()
  },

  // 加载浏览历史
  loadHistory: function() {
    this.setData({ loading: true })
    
    // 从本地存储获取舞厅浏览历史
    const history = wx.getStorageSync('dance_hall_history') || []
    
    if (history.length === 0) {
      this.setData({
        history: [],
        loading: false
      })
      return
    }
    
    // 获取舞厅详细信息
    wx.cloud.database().collection('dance_halls')
      .where({
        _id: wx.cloud.database().command.in(history.map(h => h.hallId))
      })
      .get()
      .then(res => {
        // 合并历史记录和舞厅信息
        const historyWithDetails = history.map(record => {
          const hall = res.data.find(h => h._id === record.hallId)
          return {
            ...record,
            name: hall ? hall.name : '未知舞厅',
            address: hall ? hall.address : '地址未知',
            image: hall ? (hall.image || this.generateRandomImage()) : this.generateRandomImage(),
            rating: hall ? hall.rating : 4.0
          }
        }).filter(record => record.name !== '未知舞厅') // 过滤掉找不到的舞厅
        
        this.setData({
          history: historyWithDetails,
          loading: false
        })
      })
      .catch(err => {
        console.error('加载舞厅历史数据失败:', err)
        // 如果云端加载失败，只显示基本信息
        const historyWithBasicInfo = history.map(record => ({
          ...record,
          name: '舞厅' + record.hallId.substring(0, 4),
          address: '地址未知',
          image: this.generateRandomImage(),
          rating: 4.0
        }))
        
        this.setData({
          history: historyWithBasicInfo,
          loading: false
        })
      })
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
    ]
    return danceImages[Math.floor(Math.random() * danceImages.length)]
  },

  // 查看详情
  navigateToDetail: function(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/detail/detail?id=${id}`
    })
  },

  // 删除单条历史记录
  removeHistory: function(e) {
    const hallId = e.currentTarget.dataset.id
    
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这条浏览记录吗？',
      success: (res) => {
        if (res.confirm) {
          // 从本地存储删除
          let history = wx.getStorageSync('dance_hall_history') || []
          history = history.filter(h => h.hallId !== hallId)
          wx.setStorageSync('dance_hall_history', history)
          
          wx.showToast({
            title: '删除成功',
            icon: 'success'
          })
          
          // 重新加载列表
          this.loadHistory()
        }
      }
    })
  },

  // 清除全部历史记录
  clearHistory: function() {
    wx.showModal({
      title: '确认清除',
      content: '确定要清除所有浏览历史吗？此操作不可恢复',
      success: (res) => {
        if (res.confirm) {
          // 清除本地存储
          wx.setStorageSync('dance_hall_history', [])
          
          wx.showToast({
            title: '已清除全部历史',
            icon: 'success'
          })
          
          // 更新页面
          this.setData({
            history: []
          })
        }
      }
    })
  },

  // 跳转到首页
  goToIndex: function() {
    wx.switchTab({
      url: '/pages/index/index'
    })
  },

  // 格式化时间显示
  formatTime: function(timestamp) {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now - date
    
    if (diff < 60000) { // 1分钟内
      return '刚刚'
    } else if (diff < 3600000) { // 1小时内
      return Math.floor(diff / 60000) + '分钟前'
    } else if (diff < 86400000) { // 1天内
      return Math.floor(diff / 3600000) + '小时前'
    } else if (diff < 604800000) { // 1周内
      return Math.floor(diff / 86400000) + '天前'
    } else {
      return date.getMonth() + 1 + '月' + date.getDate() + '日'
    }
  }
})