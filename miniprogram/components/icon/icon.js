Component({
  properties: {
    type: {
      type: String,
      value: 'default'
    },
    size: {
      type: String,
      value: 'medium'
    },
    color: {
      type: String,
      value: ''
    },
    customClass: {
      type: String,
      value: ''
    },
    customStyle: {
      type: String,
      value: ''
    }
  },

  data: {
    iconText: ''
  },

  lifetimes: {
    attached() {
      this.setIconText();
    }
  },

  observers: {
    'type': function(newType) {
      this.setIconText();
    }
  },

  methods: {
    setIconText() {
      const iconMap = {
        'home': '🏠',
        'user': '👤',
        'search': '🔍',
        'heart': '❤️',
        'star': '⭐',
        'plus': '➕',
        'minus': '➖',
        'close': '✖️',
        'check': '✅',
        'arrow-right': '→',
        'arrow-left': '←',
        'arrow-up': '↑',
        'arrow-down': '↓',
        'menu': '☰',
        'more': '⋯',
        'edit': '✏️',
        'delete': '🗑️',
        'share': '📤',
        'download': '⬇️',
        'upload': '⬆️',
        'camera': '📷',
        'image': '🖼️',
        'video': '🎥',
        'music': '🎵',
        'phone': '📞',
        'message': '💬',
        'mail': '📧',
        'location': '📍',
        'time': '⏰',
        'calendar': '📅',
        'setting': '⚙️',
        'help': '❓',
        'info': 'ℹ️',
        'warning': '⚠️',
        'error': '❌',
        'success': '✅',
        'default': '●'
      };

      this.setData({
        iconText: iconMap[this.data.type] || iconMap['default']
      });
    },

    onTap() {
      this.triggerEvent('tap');
    }
  }
});