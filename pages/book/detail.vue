<template>
  <view v-if="!isLoading" class="container b-f p-b">
    <view class="book-title">
      <text>{{ detail.title }}</text>
    </view>
    <view class="book-little dis-flex flex-x-between m-top10">
      <view class="book-little-left">
        <text class="book-views f-24 col-8">{{ detail.click }}次浏览</text>
      </view>
      <view class="book-little-right">
        <text class="book-views f-24 col-8">{{ detail.createTime | timeFormat('yyyy-mm-dd hh:MM') }}</text>
      </view>
    </view>
    <view class="book-content m-top20">
      <jyf-parser :html="detail.description"></jyf-parser>
    </view>
    <!-- 快捷导航 -->
    <shortcut />
  </view>
</template>

<script>
  import jyfParser from '@/components/jyf-parser/jyf-parser'
  import Shortcut from '@/components/shortcut'
  import * as BookApi from '@/api/book'

  export default {
    components: {
      Shortcut
    },
    data() {
      return {
        // 当前预约ID
        bookId: null,
        // 加载中
        isLoading: true,
        // 当前预约详情
        detail: null
      }
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad(options) {
      // 记录预约ID
      this.bookId = options.bookId;
      // 获取预约详情
      this.getBookDetail();
    },

    methods: {

      // 获取预约项目详情
      getBookDetail() {
        const app = this
        app.isLoading = true
        BookApi.detail(app.bookId)
          .then(result => {
              app.detail = result.data.BookInfo;
          })
          .finally(() => app.isLoading = false)
      }
    }
  }
</script>

<style lang="scss" scoped>
  .container {
    min-height: 100vh;
    padding: 30rpx;
    background: #fff;
  }
  .book-title {
     margin-bottom: 20rpx;
     font-size: 35rpx;
     display: block;
  }
  .book-content {
     font-size: 28rpx;
  }
</style>
