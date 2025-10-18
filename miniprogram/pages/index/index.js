// 防抖函数
const debounce = (func, delay) => {
  let timer = null;
  return function() {
    clearTimeout(timer);
    timer = setTimeout(() => {
      func.apply(this, arguments);
    }, delay);
  };
};

Page({
  data: {
    loading: true,
    isLoading: true,
    filteredHalls: [],
    allHalls: [], // 保存所有原始数据
    searchText: "",
    activeFilter: 0,
    showBackToTop: false,
    scrollTop: null, // 滚动位置
    userLocation: null, // 用户当前位置
    locationLoading: false, // 位置加载状态
    locationFetched: false, // 位置获取标记
    filterOptions: ['全部', '营业中', '附近', '推荐'] // 筛选选项
  },

  onLoad() {
    // 初始化测试数据
    this.setData({
      allHalls: [],
      filteredHalls: [],
      loading: false,
      isLoading: false
    });
    
    // 初始化显示所有数据
    this.setData({
      filteredHalls: this.data.allHalls
    });
    
    // 获取用户位置（仅一次）
    if (!this.data.locationFetched) {
      this.getUserLocation();
    }
    // 防抖处理搜索
    this.debouncedSearch = debounce(this.filterHalls, 300);
  },

  onShow() {
    // 页面显示时仅刷新数据，不重复获取位置
    if (this.data.userLocation && this.data.locationFetched) {
      this.loadRealData();
    }
  },

  // 获取用户当前位置
  getUserLocation() {
    this.setData({ locationLoading: true, locationFetched: true });
    
    wx.getSetting({
      success: (res) => {
        if (res.authSetting['scope.userLocation']) {
          // 用户已授权位置权限
          this.getCurrentLocation();
        } else {
          // 用户未授权，请求授权
          wx.authorize({
            scope: 'scope.userLocation',
            success: () => {
              this.getCurrentLocation();
            },
            fail: () => {
              console.log('用户拒绝位置授权');
              this.setData({ locationLoading: false });
              // 继续加载数据，但没有位置信息
              this.loadRealData();
            }
          });
        }
      },
      fail: () => {
        this.setData({ locationLoading: false });
        this.loadRealData();
      }
    });
  },

  // 获取当前地理位置
  getCurrentLocation() {
    wx.getLocation({
      type: 'gcj02', // 国测局坐标
      success: (res) => {
        console.log('获取位置成功:', res);
        this.setData({
          userLocation: {
            latitude: res.latitude,
            longitude: res.longitude
          },
          locationLoading: false
        });
        // 获取位置后加载数据
        this.loadRealData();
      },
      fail: (err) => {
        console.error('获取位置失败:', err);
        this.setData({ locationLoading: false });
        // 继续加载数据，但没有位置信息
        this.loadRealData();
      }
    });
  },

  // 从云端数据库加载真实数据
  loadRealData() {
    this.setData({ loading: true });
    
    // 使用云开发数据库查询
    wx.cloud.database().collection('dance_halls')
      .limit(20) // 限制加载数量，避免数据过多
      .get()
      .then(res => {
        console.log('云端数据加载成功:', res.data);
        
        // 处理数据格式，确保与前端界面兼容
        const realData = res.data.map((item, index) => {
          // 如果item是字符串，解析JSON
          const hall = typeof item === 'string' ? JSON.parse(item) : item;
          
          // 计算距离（如果用户位置可用）
          const distance = this.calculateDistance(hall);
          
          return {
            _id: hall._id,
            name: hall.name || hall.navigation || '舞厅',
            address: hall.address || hall.city || '地址未知',
            image: this.generateRandomImage(index), // 生成随机图片
            rating: parseFloat(hall.rating) || 4.0 + Math.random() * 1.0, // 使用真实评分或随机值
            isFavorite: Math.random() > 0.7, // 随机收藏状态
            isNew: Math.random() > 0.8, // 随机新开业状态
            hasDiscount: Math.random() > 0.6, // 随机优惠状态
            price: hall.price || '价格待定',
            businessHours: hall.businessHours || '营业时间未知',
            status: hall.status || '状态未知',
            viewCount: hall.viewCount || 0,
            latitude: hall.latitude, // 舞厅纬度
            longitude: hall.longitude, // 舞厅经度
            distance: distance, // 距离（公里）
            distanceText: this.formatDistance(distance) // 格式化距离文本
          };
        });
        
        // 按距离排序（由近到远）
        const sortedData = this.sortByDistance(realData);
        
        this.setData({
          allHalls: sortedData,
          filteredHalls: sortedData,
          loading: false
        });
      })
      .catch(err => {
        console.error('云端数据加载失败:', err);
        // 如果云端数据加载失败，回退到模拟数据
        this.loadMockData();
      });
  },

  // 计算两点之间的距离（使用Haversine公式）
  calculateDistance(hall) {
    const userLocation = this.data.userLocation;
    if (!userLocation || !hall.latitude || !hall.longitude) {
      return null; // 无法计算距离
    }
    
    const R = 6371; // 地球半径（公里）
    const dLat = this.deg2rad(hall.latitude - userLocation.latitude);
    const dLon = this.deg2rad(hall.longitude - userLocation.longitude);
    
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(userLocation.latitude)) * Math.cos(this.deg2rad(hall.latitude)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c; // 距离（公里）
    
    return Math.round(distance * 100) / 100; // 保留两位小数
  },

  // 角度转弧度
  deg2rad(deg) {
    return deg * (Math.PI/180);
  },

  // 格式化距离文本
  formatDistance(distance) {
    if (distance === null) return '距离未知';
    if (distance < 1) {
      return `${Math.round(distance * 1000)}米`; // 小于1公里显示米
    }
    return `${distance}公里`;
  },

  // 按距离排序（由近到远）
  sortByDistance(data) {
    const userLocation = this.data.userLocation;
    if (!userLocation) {
      return data; // 没有位置信息，不排序
    }
    
    return [...data].sort((a, b) => {
      // 有距离的排在前面，距离未知的排在后面
      if (a.distance === null && b.distance === null) return 0;
      if (a.distance === null) return 1;
      if (b.distance === null) return -1;
      
      return a.distance - b.distance; // 由近到远排序
    });
  },

  // 生成随机图片URL
  generateRandomImage(index) {
    const danceImages = [
      'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400',
      'https://images.unsplash.com/photo-1504609813442-a8924e83f76e?w=400',
      'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400',
      'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400',
      'https://images.unsplash.com/photo-1524368535928-5d8b7f0c7d1b?w=400',
      'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400'
    ];
    return danceImages[index % danceImages.length];
  },

  // 加载模拟数据（备用方案）
  loadMockData() {
    const mockData = [
      {
        _id: '1',
        name: '星光舞厅',
        address: '北京市朝阳区三里屯',
        image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400',
        rating: 4.8,
        isFavorite: false,
        isNew: true,
        hasDiscount: true
      },
      {
        _id: '2', 
        name: '梦幻舞蹈空间',
        address: '上海市徐汇区淮海中路',
        image: 'https://images.unsplash.com/photo-1504609813442-a8924e83f76e?w=400',
        rating: 4.6,
        isFavorite: true,
        isNew: false,
        hasDiscount: true
      },
      {
        _id: '3',
        name: '炫彩舞厅',
        address: '广州市天河区珠江新城',
        image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400',
        rating: 4.7,
        isFavorite: false,
        isNew: true,
        hasDiscount: false
      },
      {
        _id: '4',
        name: '音乐之夜',
        address: '深圳市南山区科技园',
        image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400',
        rating: 4.5,
        isFavorite: false,
        isNew: false,
        hasDiscount: true
      },
      {
        _id: '5',
        name: '星空舞会',
        address: '成都市武侯区天府三街',
        image: 'https://images.unsplash.com/photo-1524368535928-5d8b7f0c7d1b?w=400',
        rating: 4.9,
        isFavorite: true,
        isNew: false,
        hasDiscount: false
      },
      {
        _id: '6',
        name: '时尚舞厅',
        address: '杭州市西湖区文三路',
        image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400',
        rating: 4.4,
        isFavorite: false,
        isNew: true,
        hasDiscount: true
      }
    ];
    
    this.setData({
      allHalls: mockData,
      filteredHalls: mockData,
      loading: false
    });
  },

  // 搜索输入事件
  onSearchInput(e) {
    this.setData({ searchText: e.detail.value });
    this.debouncedSearch();
  },

  // 清除搜索
  onClearSearch() {
    this.setData({ 
      searchText: "",
      activeFilter: 0 
    });
    this.loadMockData();
  },

  // 搜索焦点
  onSearchFocus() {
    // 可以添加搜索框的焦点动画
    console.log('搜索框获得焦点');
  },

  // 筛选器切换
  onFilterToggle() {
    wx.showActionSheet({
      itemList: ['高级筛选', '排序方式', '地图模式', '取消'],
      success: (res) => {
        if (res.tapIndex === 0) {
          this.showAdvancedFilter();
        } else if (res.tapIndex === 1) {
          this.showSortOptions();
        } else if (res.tapIndex === 2) {
          this.switchToMapMode();
        }
      }
    });
  },

  // 筛选标签点击
  onFilterTagTap(e) {
    const index = e.currentTarget.dataset.index;
    this.setData({ activeFilter: index });
    this.filterByTag(index);
  },

  // 根据标签筛选
  filterByTag(tagIndex) {
    const allHalls = this.data.allHalls;
    let filtered = allHalls;
    
    switch(tagIndex) {
      case 0: // 全部
        filtered = allHalls;
        break;
      case 1: // 热门推荐
        filtered = allHalls.filter(hall => hall.rating >= 4.5);
        break;
      case 2: // 附近
        if (this.data.userLocation) {
          // 只显示距离在10公里以内的舞厅
          filtered = allHalls.filter(hall => hall.distance !== null && hall.distance <= 10);
        } else {
          // 没有位置信息，显示提示
          wx.showToast({
            title: '请开启位置权限',
            icon: 'none'
          });
          filtered = allHalls;
        }
        break;
      case 3: // 评分高
        filtered = [...allHalls].sort((a, b) => b.rating - a.rating);
        break;
      case 4: // 新开业
        filtered = allHalls.filter(hall => hall.isNew);
        break;
      case 5: // 有优惠
        filtered = allHalls.filter(hall => hall.hasDiscount);
        break;
    }
    
    this.setData({ filteredHalls: filtered });
  },

  // 高级筛选
  showAdvancedFilter() {
    wx.showModal({
      title: '高级筛选',
      content: '此功能正在开发中',
      showCancel: false
    });
  },

  // 排序选项
  showSortOptions() {
    wx.showActionSheet({
      itemList: ['按评分排序', '按距离排序', '按价格排序', '按名称排序', '取消'],
      success: (res) => {
        const halls = this.data.filteredHalls;
        let sorted = [...halls];
        
        switch(res.tapIndex) {
          case 0: // 评分
            sorted.sort((a, b) => b.rating - a.rating);
            break;
          case 1: // 距离
            sorted.sort((a, b) => a.name.localeCompare(b.name));
            break;
          case 2: // 价格
            sorted.sort((a, b) => a.name.localeCompare(b.name));
            break;
          case 3: // 名称
            sorted.sort((a, b) => a.name.localeCompare(b.name));
            break;
        }
        
        if (res.tapIndex < 4) {
          this.setData({ filteredHalls: sorted });
        }
      }
    });
  },

  // 地图模式
  switchToMapMode() {
    wx.showModal({
      title: '地图模式',
      content: '地图功能正在开发中',
      showCancel: false
    });
  },

  // 切换收藏状态
  onToggleFavorite(e) {
    e.stopPropagation();
    const id = e.currentTarget.dataset.id;
    const halls = this.data.filteredHalls;
    
    const updatedHalls = halls.map(hall => {
      if (hall._id === id) {
        return {
          ...hall,
          isFavorite: !hall.isFavorite
        };
      }
      return hall;
    });
    
    this.setData({ filteredHalls: updatedHalls });
    
    wx.showToast({
      title: updatedHalls.find(h => h._id === id).isFavorite ? '已收藏' : '已取消收藏',
      icon: 'success'
    });
  },

  // 导航到详情页
  navigateToDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/detail/detail?id=${id}`
    });
  },

  // 图片加载错误处理
  onImageError(e) {
    const index = e.currentTarget.dataset.index;
    const halls = this.data.filteredHalls || [];
    if (halls[index]) {
      halls[index].image = '/assets/images/placeholder.png';
      this.setData({ filteredHalls: halls });
    }
  },

  // 重置筛选
  onResetFilters() {
    this.setData({ 
      searchText: "",
      activeFilter: 0 
    });
    this.setData({ filteredHalls: this.data.allHalls });
    
    wx.showToast({
      title: '筛选已重置',
      icon: 'success'
    });
  },

  // 刷新数据
  onRefresh() {
    this.setData({ loading: true });
    
    // 重新从云端加载数据
    this.loadRealData();
  },

  // 请求位置权限
  onRequestLocationPermission() {
    this.getUserLocation();
  },

  // 地图切换
  onMapToggle() {
    wx.showModal({
      title: '地图模式',
      content: '地图功能即将上线，敬请期待！',
      showCancel: false
    });
  },

  // 排序选项
  onSortToggle() {
    wx.showActionSheet({
      itemList: ['距离最近', '评分最高', '价格最低', '名称排序', '取消'],
      success: (res) => {
        const halls = this.data.allHalls;
        let sorted = [...halls];
        
        switch(res.tapIndex) {
          case 0: // 距离最近
            sorted = this.sortByDistance(halls);
            break;
          case 1: // 评分最高
            sorted.sort((a, b) => b.rating - a.rating);
            break;
          case 2: // 价格最低
            // 这里可以根据实际价格数据排序
            sorted.sort((a, b) => a.name.localeCompare(b.name));
            break;
          case 3: // 名称排序
            sorted.sort((a, b) => a.name.localeCompare(b.name));
            break;
        }
        
        if (res.tapIndex < 4) {
          this.setData({ 
            filteredHalls: sorted,
            activeFilter: 0 // 重置筛选
          });
          
          wx.showToast({
            title: '排序已更新',
            icon: 'success'
          });
        }
      }
    });
  },

  // 回到顶部
  onBackToTop() {
    wx.pageScrollTo({
      scrollTop: 0,
      duration: 300
    });
  },

  // 页面滚动事件
  onPageScroll(e) {
    if (e.scrollTop > 300) {
      if (!this.data.showBackToTop) {
        this.setData({ showBackToTop: true });
      }
    } else {
      if (this.data.showBackToTop) {
        this.setData({ showBackToTop: false });
      }
    }
  },

  // 搜索输入处理
  onSearchInput(e) {
    this.setData({ searchText: e.detail.value });
    this.debouncedSearch();
  },

  // 搜索确认
  onSearchConfirm(e) {
    this.setData({ searchText: e.detail.value });
    this.filterHalls();
  },

  // 筛选标签点击
  onFilterTap(e) {
    const index = e.currentTarget.dataset.index;
    this.setData({ activeFilter: index });
    this.applyFilter(index);
  },

  // 应用筛选
  applyFilter(filterIndex) {
    let filtered = [...this.data.allHalls];
    
    switch(filterIndex) {
      case 0: // 全部
        break;
      case 1: // 营业中
        filtered = filtered.filter(hall => hall.status === '营业中');
        break;
      case 2: // 附近
        filtered = filtered.sort((a, b) => {
          const distanceA = parseFloat(a.distance);
          const distanceB = parseFloat(b.distance);
          return distanceA - distanceB;
        });
        break;
      case 3: // 推荐
        filtered = filtered.filter(hall => hall.status === '营业中')
                          .sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));
        break;
    }
    
    // 如果有搜索文本，继续应用搜索过滤
    if (this.data.searchText) {
      const searchText = this.data.searchText.toLowerCase();
      filtered = filtered.filter(hall => {
        return hall.name.toLowerCase().includes(searchText) ||
               hall.address.toLowerCase().includes(searchText);
      });
    }
    
    this.setData({ filteredHalls: filtered });
  },

  // 滚动事件处理
  onScroll(e) {
    const scrollTop = e.detail.scrollTop;
    if (scrollTop > 300) {
      if (!this.data.showBackToTop) {
        this.setData({ showBackToTop: true });
      }
    } else {
      if (this.data.showBackToTop) {
        this.setData({ showBackToTop: false });
      }
    }
  },

  // 回到顶部
  backToTop() {
    // 对于scroll-view，需要设置scroll-top属性
    this.setData({ scrollTop: 0 });
    setTimeout(() => {
      this.setData({ scrollTop: null });
    }, 300);
  },

  // 通用搜索筛选
  filterHalls() {
    this.applyFilter(this.data.activeFilter);
  }
})