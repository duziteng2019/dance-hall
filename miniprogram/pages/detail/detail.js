// pages/detail/detail.js
const app = getApp()

Page({
  data: {
    hallInfo: {
      id: '',
      name: '',
      subtitle: '',
      coverImage: '',
      businessHours: '',
      phone: '',
      address: '',
      avgPrice: '',
      tags: [],
      description: '',
      photos: [],
      reviews: []
    },
    isCollected: false,
    isOpen: false // 营业状态
  },

  onLoad(options) {
    const hallId = options.id
    this.loadHallDetail(hallId)
    this.checkCollectionStatus(hallId)
  },

  // 加载舞厅详情
  loadHallDetail(hallId) {
    wx.showLoading({ title: '加载中...' })
    
    // 模拟数据，实际项目中替换为API调用
    setTimeout(() => {
      this.setData({
        hallInfo: {
          id: hallId,
          name: '星光舞厅',
          subtitle: '高端社交舞厅 | 专业DJ驻场',
          coverImage: 'https://example.com/hall-cover.jpg',
          businessHours: '18:00-02:00',
          phone: '13800138000',
          address: '北京市朝阳区三里屯路1号',
          avgPrice: '150',
          tags: ['高端场所', '专业DJ', 'VIP包厢', '酒水畅饮'],
          description: '星光舞厅是北京最顶级的社交舞厅之一，拥有专业的音响设备和灯光效果，每周邀请知名DJ驻场演出。VIP包厢提供私密空间和专属服务，适合商务洽谈和高端社交。',
          photos: [
            'https://example.com/hall-photo1.jpg',
            'https://example.com/hall-photo2.jpg',
            'https://example.com/hall-photo3.jpg'
          ],
          reviews: [
            {
              id: 1,
              username: '张先生',
              avatar: 'https://example.com/avatar1.jpg',
              time: '2023-10-15',
              rating: 5,
              content: '环境非常好，音响效果一流，服务也很周到。'
            },
            {
              id: 2,
              username: '李女士',
              avatar: 'https://example.com/avatar2.jpg',
              time: '2023-10-10',
              rating: 4,
              content: 'DJ很棒，就是人有点多，建议提前预约。'
            }
          ]
        }
      })
      // 判断营业状态
      this.checkBusinessStatus()
      wx.hideLoading()
    }, 800)
  },

  // 判断营业状态
  checkBusinessStatus() {
    const businessHours = this.data.hallInfo.businessHours
    if (!businessHours || businessHours === '暂停营业' || businessHours === '休息中') {
      this.setData({ isOpen: false })
      return
    }

    const now = new Date()
    const currentTime = now.getHours() * 60 + now.getMinutes()
    
    // 处理营业时间格式：如 "18:00-02:00" 或 "13:30-17:30、19:30-02:00"
    const timeRanges = businessHours.split('、').map(range => {
      const [start, end] = range.split('-')
      const startTime = this.timeToMinutes(start.trim())
      let endTime = this.timeToMinutes(end.trim())
      
      // 处理跨天的情况（如 22:00-02:00）
      if (endTime < startTime) {
        endTime += 24 * 60 // 结束时间加一天
      }
      
      return { start: startTime, end: endTime }
    })

    // 检查当前时间是否在任何一个营业时间段内
    const isOpen = timeRanges.some(range => {
      let adjustedCurrentTime = currentTime
      let adjustedStartTime = range.start
      let adjustedEndTime = range.end
      
      // 如果营业时间跨天，需要调整当前时间的比较逻辑
      if (range.end > 24 * 60) {
        // 对于跨天营业，如果当前时间在0点之后但小于开始时间，说明是前一天晚上
        if (currentTime < range.start && currentTime < range.end - 24 * 60) {
          adjustedCurrentTime += 24 * 60 // 当前时间加一天，与调整后的结束时间比较
        }
      }
      
      return adjustedCurrentTime >= range.start && adjustedCurrentTime < range.end
    })

    this.setData({ isOpen })
  },

  // 时间字符串转换为分钟数
  timeToMinutes(timeStr) {
    const [hours, minutes] = timeStr.split(':').map(Number)
    return hours * 60 + (minutes || 0)
  },

  // 测试营业时间计算（开发阶段使用）
  testBusinessHours() {
    const testCases = [
      { businessHours: '22:00-02:00', currentTime: '23:00', expected: true },
      { businessHours: '22:00-02:00', currentTime: '01:00', expected: true },
      { businessHours: '22:00-02:00', currentTime: '03:00', expected: false },
      { businessHours: '22:00-02:00', currentTime: '21:00', expected: false },
      { businessHours: '13:30-17:30、19:30-02:00', currentTime: '16:00', expected: true },
      { businessHours: '13:30-17:30、19:30-02:00', currentTime: '20:00', expected: true },
      { businessHours: '13:30-17:30、19:30-02:00', currentTime: '18:00', expected: false }
    ]

    console.log('=== 营业时间计算测试开始 ===')
    testCases.forEach((testCase, index) => {
      const fakeHallInfo = { businessHours: testCase.businessHours }
      this.setData({ hallInfo: fakeHallInfo })
      
      // 模拟当前时间
      const [hours, minutes] = testCase.currentTime.split(':').map(Number)
      const mockDate = new Date()
      mockDate.setHours(hours, minutes)
      
      // 直接调用判断逻辑
      const isOpen = this.testBusinessHoursLogic(testCase.businessHours, hours * 60 + minutes)
      
      const result = isOpen === testCase.expected ? '✅ 通过' : '❌ 失败'
      console.log(`测试 ${index + 1}: ${result} | ${testCase.businessHours} @ ${testCase.currentTime} => ${isOpen} (期望: ${testCase.expected})`)
    })
    console.log('=== 营业时间计算测试结束 ===')
  },

  // 独立的营业时间判断逻辑（用于测试）
  testBusinessHoursLogic(businessHours, currentTime) {
    if (!businessHours || businessHours === '暂停营业' || businessHours === '休息中') {
      return false
    }

    const timeRanges = businessHours.split('、').map(range => {
      const [start, end] = range.split('-')
      const startTime = this.timeToMinutes(start.trim())
      let endTime = this.timeToMinutes(end.trim())
      
      if (endTime < startTime) {
        endTime += 24 * 60
      }
      
      return { start: startTime, end: endTime }
    })

    return timeRanges.some(range => {
      let adjustedCurrentTime = currentTime
      
      if (range.end > 24 * 60) {
        if (currentTime < range.start && currentTime < range.end - 24 * 60) {
          adjustedCurrentTime += 24 * 60
        }
      }
      
      return adjustedCurrentTime >= range.start && adjustedCurrentTime < range.end
    })
  },

  // 检查收藏状态
  checkCollectionStatus(hallId) {
    const collectedHalls = wx.getStorageSync('collectedHalls') || []
    this.setData({
      isCollected: collectedHalls.some(item => item.id === hallId)
    })
  },

  // 返回上一页
  goBack() {
    wx.navigateBack()
  },

  // 拨打电话
  makeCall(e) {
    const phone = e.currentTarget.dataset.phone
    wx.makePhoneCall({
      phoneNumber: phone
    })
  },

  // 打开地图
  openLocation() {
    const { address } = this.data.hallInfo
    wx.openLocation({
      name: this.data.hallInfo.name,
      address: address
    })
  },

  // 预览图片
  previewImage(e) {
    const index = e.currentTarget.dataset.index
    wx.previewImage({
      current: this.data.hallInfo.photos[index],
      urls: this.data.hallInfo.photos
    })
  },

  // 切换收藏状态
  toggleCollection() {
    const hallId = this.data.hallInfo.id
    let collectedHalls = wx.getStorageSync('collectedHalls') || []
    
    if (this.data.isCollected) {
      // 取消收藏
      collectedHalls = collectedHalls.filter(item => item.id !== hallId)
      wx.showToast({ title: '已取消收藏', icon: 'none' })
    } else {
      // 添加收藏
      collectedHalls.push({
        id: hallId,
        name: this.data.hallInfo.name,
        coverImage: this.data.hallInfo.coverImage,
        avgPrice: this.data.hallInfo.avgPrice
      })
      wx.showToast({ title: '收藏成功', icon: 'success' })
    }
    
    wx.setStorageSync('collectedHalls', collectedHalls)
    this.setData({
      isCollected: !this.data.isCollected
    })
  },

  // 分享
  shareHall() {
    wx.showShareMenu({
      withShareTicket: true
    })
  },

  // 立即预约
  makeReservation() {
    wx.navigateTo({
      url: '/pages/reservation/reservation?id=' + this.data.hallInfo.id
    })
  },

  onShareAppMessage() {
    return {
      title: this.data.hallInfo.name,
      path: '/pages/detail/detail?id=' + this.data.hallInfo.id,
      imageUrl: this.data.hallInfo.coverImage
    }
  }
})