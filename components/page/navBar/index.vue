<template>
  <!-- 导航组 -->
  <view class="diy-navBar" :style="{ background: itemStyle.background, color: itemStyle.textColor }">
    <view class="data-list" :class="[`avg-sm-${itemStyle.rowsNum}`]">
      <view class="item-nav" v-for="(dataItem, index) in dataList" :key="index">
        <view class="nav-to" :class="'nav-' + index" @click="onLink(dataItem.linkUrl)">
          <view class="item-image">
            <image class="image" mode="widthFix" :src="dataItem.imgUrl"></image>
          </view>
          <view class="item-text onelist-hidden">
             <view class="text">{{ dataItem.text }}</view>
             <view class="tip">{{ dataItem.tip }}</view>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
  import mixin from '../mixin'

  export default {
    name: "NavBar",
    /**
     * 组件的属性列表
     * 用于组件自定义设置
     */
    props: {
      itemIndex: String,
      itemStyle: Object,
      params: Object,
      dataList: Array
    },

    mixins: [mixin],

    /**
     * 组件的方法列表
     * 更新属性和数据的方法与更新页面数据的方法类似
     */
    methods: {
        onLink(linkObj) {
            this.$navTo(linkObj)
        }
    }

  }
</script>

<style lang="scss" scoped>
  .diy-navBar .data-list::after {
    clear: both;
    content: " ";
    display: table;
  }

  .item-nav {
    float: left;
    margin: 10rpx 0px 4rpx 0px;
    text-align: center;
    background: #ffffff;
    padding: 2rpx;
    color: #0c5566;
    font-weight: bold;
    .nav-to {
        margin: 0rpx 8px 0px 8px;
        padding: 38rpx 10rpx 10rpx 10rpx;
        border-radius: 20rpx;
        height: 150rpx;
        background: linear-gradient(to bottom, #ffffff, #f5f5f5);
        border: solid 1rpx #ccc;
    }
    .nav-0 {
        margin: 0rpx 4px 0px 8px;
    }
    .nav-1 {
        margin: 0rpx 8px 0px 4px;
    }
    .nav-2 {
        margin: 0rpx 4px 0px 8px;
    }
    .nav-3 {
        margin: 0rpx 8px 0px 4px;
    }
    .nav-4 {
        margin: 0rpx 4px 0px 8px;
    }
    .nav-5 {
        margin: 0rpx 8px 0px 4px;
    }
    .item-text {
      text-align: left;
      padding-left: 20rpx;
      .text {
          font-size: 32rpx;
      }
      .tip {
          font-size: 22rpx;
          margin-top: 8rpx;
          color: #999;
      }
    }

    .item-image {
      margin-bottom: 4px;
      font-size: 0;
      margin-left: 30rpx;
      width: 88rpx;
      height: 88rpx;
      float: left;
    }

    .item-image .image {
      width: 80rpx;
      height: 80rpx;
    }

  }

  /* 分列布局 */
  .diy-navBar .avg-sm-3>.item-nav {
    width: 33.33333333%;
  }

  .diy-navBar .avg-sm-4>.item-nav {
    width: 25%;
  }

  .diy-navBar .avg-sm-2>.item-nav {
    width: 50%;
  }
</style>
