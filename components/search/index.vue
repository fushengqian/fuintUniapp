<template>
  <!-- 搜索框 -->
  <view class="search-wrapper">
    <view class="index-search" @click="onClick">
      <view class="index-cont-search t-c">
        <text class="search-icon iconfont icon-sousuo"></text>
        <text class="search-text">{{ tips }}</text>
      </view>
    </view>
  </view>
</template>

<script>
  export default {
    props: {
      tips: {
        type: String,
        default: '搜索关键字'
      },
      itemStyle: Object,
    },
    data() {
      return {}
    },

    methods: {
      onClick() {
        this.$emit('event')
      }
    }
  }
</script>

<style lang="scss" scoped>
  .search-wrapper {
    padding: 5rpx 12rpx 10rpx 12rpx;
    display: block;
    position: fixed;
    z-index: 999999;
    width: 100%;
    background: linear-gradient(to bottom, #02b9b9, #03cece);
    /* #ifdef H5 */
    margin-top: 13rpx;
    /* #endif */
  }

  .index-search {
    border-bottom: 0;
    background: #fff;
    border-radius: 40rpx;
    overflow: hidden;
    font-size: 28rpx;
    color: #6d6d6d;
    box-sizing: border-box;
    height: 82rpx;
    line-height: 82rpx;
    border: solid 2rpx #cccccc;
    text-align: left;
    display: block;
    margin-top: 10rpx;
    .index-cont-search {
      width: 100%;
      font-size: 30rpx;
      background: #f5f5f5;
      text-align: left;
      display: flex;
      justify-content: center;
      align-items: center;
    }

    .index-cont-search .search-icon {
      font-size: 38rpx;
      font-weight: bold;
    }

    .index-cont-search .search-text {
      margin-left: 14rpx;
    }

  }
</style>
