// 底部导航栏组件逻辑
Component({
  properties: {
    activeIndex: {
      type: Number,
      value: 0
    }
  },

  methods: {
    onTabChange(e) {
      const index = e.currentTarget.dataset.index;
      this.triggerEvent('change', { index });
    }
  }
})