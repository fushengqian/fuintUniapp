<template>
  <view class="container" :style="themeVars">
      <empty v-if="!storeInfo" :isLoading="isLoading" tips="数据加载中..."></empty>
      <!-- 页面装修模式：读取后台装修配置动态渲染 -->
      <Page v-if="storeInfo && pageItems.length > 0" :items="pageItems" :imagePath="imagePath" :storeInfo="storeInfo"/>
      <!-- 默认布局（未装修时兼容旧版本） -->
      <block v-if="storeInfo && pageItems.length === 0">
          <!-- 门店信息 + 搜索框：吸顶固定 -->
          <view class="index-sticky-header">
              <Location v-if="storeInfo" :storeInfo="storeInfo"/>
              <Search v-if="storeInfo" tips="请输入搜索关键字..." @event="$navTo('pages/search/index')"/>
          </view>
          <Banner v-if="storeInfo" :itemStyle="options.bannerStyle" :params="options.bannerParam" :dataList="banner"/>
          <Blank v-if="storeInfo" :itemStyle="options.blankStyle"/>
          <NavBar v-if="storeInfo" :itemStyle="options.navStyle" :params="{}" :dataList="navigation"/>
          <Blank v-if="storeInfo" :itemStyle="options.blankStyle"/>
          <Goods v-if="storeInfo" :itemStyle="options.goodsStyle" :isReflash="isReflash" ref="mescrollItem" :params="options.goodsParams"/>
      </block>
      <!-- 自定义 tabBar 占位 -->
      <view class="tabbar-safe-area"></view>
      <!-- #ifdef H5 -->
      <h5-tabbar ref="h5Tabbar"></h5-tabbar>
      <!-- #endif -->
  </view>
</template>

<script>
  import { setCartTabBadge, showMessage } from '@/utils/app'
  import Location from '@/components/page/location'
  import Search from '@/components/search'
  import Banner from '@/components/page/banner'
  import NavBar from '@/components/page/navBar'
  import Blank from '@/components/page/blank'
  import Goods from '@/components/page/goods'
  import Page from '@/components/page'
  import Empty from '@/components/empty'
  import * as settingApi from '@/api/setting'
  import * as Api from '@/api/page'
  import MescrollCompMixin from "@/components/mescroll-uni/mixins/mescroll-comp.js";
  import config from '@/config'
  import { loadAndApplyTabbar } from '@/utils/tabbar'
  // #ifdef H5
  import H5Tabbar from '@/components/tabbar/index.vue'
  // #endif

  const App = getApp()
  
  export default {
    mixins: [MescrollCompMixin],
    components: {
       Location,
       Search,
       Banner,
       NavBar,
       Blank,
       Goods,
       Page,
       Empty,
       // #ifdef H5
       H5Tabbar
       // #endif
    },
    data() {
      return {
        options: {
            "blankStyle": {
                "height": "5",
                "background": "#ffffff",
            },
            "goodsStyle": {
                "background": "#F6F6F6",
                "display": "list",
                "column": 2,
                "show": ["goodsName", "goodsPrice", "linePrice", "sellingPoint", "goodsSales"]
            },
            "goodsParams": {
                "source": "auto",
                "auto": {
                    "category": 0,
                    "goodsSort": "all",
                    "showNum": 40
                }
            },
            "bannerStyle": {
                "btnColor": "#ffffff",
                "btnShape": "round",
                "interval": 2.5,
                
            },
            "bannerParam": {
                "interval": 2000
            },
            "navStyle": {
                "background": "#ffffff",
                "rowsNum": "2",
            }
        },
        banner: [],
        navigation: [],
        pageItems: [],
        imagePath: '',
        storeInfo: null,
        isReflash: false,
        isLoading: false,
        // 页面装修数据是否已请求过（首次进入、或切换店铺后重新拉取）
        pageLoaded: false,
        // 页面装修数据请求进行中标识（防止重复请求）
        pageLoading: false,
        // 门店信息请求进行中标识（防止重复请求）
        storeFetching: false
      }
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad({ storeId }) {
      storeId = storeId ? parseInt(storeId) : 0;
      if (storeId > 0) {
          uni.setStorageSync('storeId', storeId);
          uni.setStorageSync("reflashHomeData", true);
      }
      // 装修数据统一在 onGetStoreInfo 获取到当前店铺 storeId/merchantNo 后再加载，
      // 确保首页装修接口带的是用户实际所在商户的参数，而不是默认商户号
    },

    /**
     * 生命周期函数--监听页面显示
     */
    onShow() {
      const app = this;
      // 拉取 tabBar 配置（缓存优先），自定义 tabBar 实例可能尚未就绪会自动重试
      loadAndApplyTabbar(this)
      // #ifdef H5
      this.$refs.h5Tabbar && this.$refs.h5Tabbar.refresh()
      // #endif
      // #ifdef MP-WEIXIN
      // 微信注入的 getTabBar 挂在原生页面实例上，uni-app 需经 $scope 访问
      const host = this.$scope || this
      const tb = typeof host.getTabBar === 'function' && host.getTabBar()
      tb && tb.syncSelected && tb.syncSelected()
      // #endif
      showMessage();
      setCartTabBadge();
      app.onGetStoreInfo();
      uni.getLocation({
          type: 'gcj02',
          success(res){
              uni.setStorageSync('latitude', res.latitude);
              uni.setStorageSync('longitude', res.longitude);
              app.onGetStoreInfo();
          },
          fail(e) {
             // empty
          }
      })
    },

    methods: {
        
        /**
         * 加载页面数据
         * @param {Object} callback
         */
        getPageData(callback) {
          const app = this;
          if (app.pageLoading) {
              return;
          }
          app.pageLoading = true;
          Api.home()
            .then(result => {
                 // #ifdef DEBUG
                 console.log('[home response]', JSON.stringify(result.data))
                 // #endif
                 app.imagePath = result.data.imagePath || app.imagePath || '';
                 // 优先使用后台装修配置
                 if (result.data.page && result.data.page.components && result.data.page.components.length > 0) {
                     app.pageItems = result.data.page.components;
                 } else {
                     // 未装修时回退默认数据（兼容旧版本）
                     app.pageItems = [];
                     app.banner = result.data.banner;
                     app.navigation = result.data.navigation;
                 }
                 uni.removeStorageSync("reflashHomeData");
                 app.isReflash = false;
            })
            .finally(() => {
                 // 无论成功失败都标记为已加载，避免后续 onShow 重复请求
                 app.pageLoading = false;
                 app.pageLoaded = true;
                 callback && callback()
            })
        },
        
        /**
         * 下拉刷新
         */
        onPullDownRefresh() {
          // 获取数据
          this.getPageData(() => {
             uni.stopPullDownRefresh()
          })
        },
        
        /**
         * 获取默认店铺
         * */
         onGetStoreInfo() {
            const app = this;
            if (app.storeFetching) {
                return;
            }
            app.storeFetching = true;
            settingApi.systemConfig()
             .then(result => {
                 app.storeInfo = result.data.storeInfo;
                 if (app.storeInfo) {
                     uni.setStorageSync("storeId", app.storeInfo.id);
                     uni.setStorageSync("merchantNo", app.storeInfo.merchantNo);
                     // 首次进入、或切换店铺需要刷新时，用当前商户/门店参数拉取页面数据
                     let isReflash = uni.getStorageSync("reflashHomeData");
                     app.isReflash = isReflash;
                     if (isReflash === true || !app.pageLoaded) {
                         app.getPageData();
                     }
                 }
             })
             .finally(() => {
                 app.storeFetching = false;
             })
         }
    },

    /**
     * 分享当前页面
     */
    onShareAppMessage() {
      const app = this
      return {
         title: config.name,
         path: "/pages/index/index?" + app.$getShareUrlParams()
      }
    },

    /**
     * 分享到朋友圈
     * 本接口为 Beta 版本，暂只在 Android 平台支持，详见分享到朋友圈 (Beta)
     * https://developers.weixin.qq.com/miniprogram/dev/framework/open-ability/share-timeline.html
     */
    onShareTimeline() {
      const app = this
      const { page } = app
      return {
        title: config.name,
        path: "/pages/index/index?" + app.$getShareUrlParams()
      }
    }

  }
</script>

<style lang="scss" scoped>
/* 默认布局：门店信息 + 搜索框作为一个整体吸顶固定 */
.index-sticky-header {
  position: sticky;
  top: 0;
  z-index: 100;
}
/* 搜索组件内部默认是 fixed 定位，默认布局中由上面 sticky 容器负责吸顶，
   这里改回文档流，否则其不占位会遮挡下方的焦点图 */
.index-sticky-header ::v-deep .search-wrapper {
  position: static;
}
</style>
