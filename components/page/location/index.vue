<template>
  <!-- 定位店铺 -->
  <view class="main-loc">
      <view v-if="storeInfo.name" class="diy-location">
        <view class="inner" @click="onTargetLocation">
          <view class="location-input">
            <text class="store">
               <text class="name">{{ storeInfo.name }}</text>
               <text class="switch">[切换店铺]</text>
               <text class="address"><text class="location-icon iconfont icon-dingwei"></text>{{ storeInfo.address }}</text>
            </text>
          </view>
        </view>
      </view>
  </view>
</template>

<script>
  export default {

    /**
     * 组件的属性列表
     * 用于组件自定义设置
     */
    props: {
      itemStyle: Object,
      storeInfo: Object
    },

    /**
     * 组件的方法列表
     * 更新属性和数据的方法与更新页面数据的方法类似
     */
    methods: {
      /**
       * 跳转到定位页面页面
       */
      onTargetLocation() {
        this.$navTo('pages/location/index')
      }
    }

  }
</script>

<style lang="scss" scoped>
.main-loc{
  height: 100rpx;
  .diy-location {
    background: #fff;
    padding: 0rpx 20rpx 20rpx 20rpx;
    /* #ifdef H5 */
    padding-top: 20rpx;
    /* #endif */
    position: fixed;
    z-index: 99999;
    width: 100%;
    border-bottom: solid 1rpx #CCCCCC;
  }

  .inner {
    height: 82rpx;
    overflow: hidden;
    &.radius {
      border-radius: 10rpx;
    }
    &.round {
      border-radius: 60rpx;
    }
  }

  .location-input {
    color: #484848;
    padding-left: 10rpx;
  }
  
  .store {
      .name {
          font-size: 32rpx;
          font-weight: bold;
      }
      .switch {
          margin-left: 15rpx;
          font-size: 22rpx;
          color: #00acac;
      }
      .address {
          clear: bold;
          display: block;
          margin-top: 6rpx;
          font-size: 25rpx;
          margin-left: 0rpx;
          .location-icon {
            margin-right: 8rpx;
            font-size: 26rpx;
          }
      }
  }
}
  
</style>
