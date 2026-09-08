// 自定义 tabBar（微信小程序原生组件）
// 注意：uni-app 编译时会原样拷贝本目录，不进行转换，因此必须使用微信原生语法。
// 装修配置由各 tab 页面调用 utils/tabbar.js 拉取后端接口后，通过 applyConfig 推送至此。
// 后端无配置时不渲染任何兜底数据，整条 tabBar 隐藏。

// 修正页面路径：去除前导斜杠与 query/hash、兼容完整链接、修正 page/ 前缀为 pages/、兜底修复历史损坏路径
function normalizePagePath(path) {
  if (!path) return ''
  let p = String(path).trim()
  // 剥离 query 与 hash，避免带参数的链接导致路径匹配失败
  p = p.split('?')[0].split('#')[0]
  // 兼容粘贴的完整链接（如 https://xxx/pages/order/index 或 https://xxx/#/pages/order/index），提取页面路径
  const match = p.match(/(?:^|\/)(pages\/[\w./-]+)(?:\/?)$/)
  if (match) {
    p = match[1]
  }
  p = p.replace(/^\/+/, '')
  p = p.replace(/^page\//, 'pages/')
  // 兜底：pages 后直接跟非斜杠字符（如历史错误的 pagescategory/index）时补上斜杠
  p = p.replace(/^pages(?=[^\/])/, 'pages/')
  // 去除尾部多余的斜杠
  p = p.replace(/\/+$/, '')
  return p
}

Component({
  data() {
    // 启动时优先读取已缓存主题；无缓存时用白色兜底(无配置时整条隐藏, 不参与显示)
    const theme = wx.getStorageSync('theme')
    const primary = (theme && theme.colors && theme.colors.primary) || '#ffffff'
    return {
      // 后端未返回有效配置前不显示
      visible: false,
      list: [],
      selected: 0,
      // 类型: iconText / image / text
      showIcon: true,
      showText: true,
      bgColor: '#ffffff',
      textColor: '#999999',
      selectedColor: primary,
      // 主题色（用于选中色等无法走 CSS 变量场景的兜底），applyConfig 时会从 storage 重新读取
      _themePrimary: primary,
      barHeight: 50
    }
  },
  lifetimes: {
    attached() {
      // 每次 attached 时同步从 storage 读最新主题色，确保装修配置推送过来时能跟随后台主题
      const t = wx.getStorageSync('theme')
      if (t && t.colors && t.colors.primary) {
        this.data._themePrimary = t.colors.primary
      }
      // 优先使用页面缓存的最新配置(图标地址已在 utils/tabbar.js 中补全)
      const config = wx.getStorageSync('tabbar') || null
      console.log('[custom-tabbar] attached, cache config:', config)
      if (config && config.items && config.items.length) {
        this.applyConfig(config)
        this.syncSelected()
      }
    }
  },
  methods: {
    // 应用后台装修配置；无有效配置时整条隐藏
    applyConfig(config) {
      console.log('[custom-tabbar] applyConfig start, config:', config)
      if (!config || !config.items || !config.items.length) {
        console.log('[custom-tabbar] applyConfig hide: no items')
        this.setData({ visible: false, list: [] })
        return
      }
      // 兼容 enabled 未设置的场景：有导航项即视为开启
      const enabled = config.enabled !== false
      if (!enabled) {
        console.log('[custom-tabbar] applyConfig hide: enabled=false')
        this.setData({ visible: false, list: [] })
        return
      }
      const style = config.style || {}
      const list = config.items.map(item => {
        return {
          text: item.name || '',
          pagePath: normalizePagePath(item.url),
          icon: item.iconUrl || '',
          selectedIcon: item.iconSelectedUrl || item.iconUrl || ''
        }
      }).filter(item => item.pagePath && item.text)

      if (!list.length) {
        console.log('[custom-tabbar] applyConfig hide: all items invalid')
        this.setData({ visible: false, list: [] })
        return
      }

      this.setData({
        visible: true,
        list: list,
        showIcon: config.type !== 'text',
        showText: config.type !== 'image',
        bgColor: style.bgColor || '#ffffff',
        textColor: style.textColor || '#999999',
        selectedColor: style.selectedColor || this.data._themePrimary,
        barHeight: Math.max(40, Math.min(Number(style.height) || 50, 80))
      })
      console.log('[custom-tabbar] applyConfig done, list:', list)
      this.syncSelected()
    },
    // 同步选中态并延迟重试：页面切换动画期间路由可能尚未就绪，
    // 首次 onShow 时按旧路由设置会选错，延迟重试保证路由稳定后最终校正到位
    syncSelected() {
      let times = 0
      const doSync = () => {
        this.setSelectedByPath()
        if (times < 3) {
          times++
          setTimeout(doSync, 300)
        }
      }
      doSync()
    },
    // 根据当前页面路径设置选中项
    setSelectedByPath() {
      // 首次启动时页面 onShow 可能先于组件 attached，此时 data 尚未初始化，
      // 直接 return，attached/applyConfig 就绪后会重新同步
      const list = (this.data && Array.isArray(this.data.list)) ? this.data.list : []
      if (!list.length) {
        console.log('[custom-tabbar] setSelectedByPath: list not ready, skip')
        return
      }
      const pages = getCurrentPages()
      const current = pages[pages.length - 1]
      if (!current) {
        console.log('[custom-tabbar] setSelectedByPath: no current page')
        return
      }
      // 去掉前导斜杠和 query string（如 pages/category/index?storeId=1）
      const route = (current.route || '').replace(/^\/+/, '').split('?')[0]
      console.log('[custom-tabbar] setSelectedByPath route:', route, 'list:', list)
      const index = list.findIndex(item => {
        const p = (item.pagePath || '').replace(/^\/+/, '')
        return p === route
      })
      console.log('[custom-tabbar] setSelectedByPath matched index:', index, 'current selected:', this.data.selected)
      if (index >= 0 && index !== this.data.selected) {
        this.setData({ selected: index })
      } else if (index < 0 && this.data.visible && this.data.selected >= 0) {
        // 当前页面不在底部导航列表中时取消高亮，避免停留在上一个页面的选中态造成“选中与页面不匹配”
        console.log('[custom-tabbar] setSelectedByPath no match, clear selected')
        this.setData({ selected: -1 })
      }
    },
    // 切换 tab
    switchTab(e) {
      const { path, index } = e.currentTarget.dataset
      const idx = Number(index)
      if (!path || idx === this.data.selected) {
        return
      }
      // 乐观更新选中态，保证点击后立即有反馈
      this.setData({ selected: idx })
      wx.switchTab({
        url: '/' + path,
        fail: () => {
          // 跳转失败时回退选中态
          this.setSelectedByPath()
        }
      })
    }
  }
})
