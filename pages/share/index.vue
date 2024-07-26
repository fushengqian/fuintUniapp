<template>
  <mescroll-body ref="mescrollRef" :sticky="true" @init="mescrollInit" :down="{ use: false }" :up="upOption" @up="upCallback">
     <view class="poster">
        <view class="tips">邀请好友即获得奖励！</view>
          <view class="iconfont icon-gift"></view>
          <view class="action-btn">
              <view class="btn-wrapper">
                <view class="btn-item" @click="shareNow">立即邀请</view>
              </view>
          </view>
        </view>
     </view>
     <!-- 分享对话框 start -->
     <u-popup v-model="shareShow" mode="bottom" border-radius="14" height="453">
         <view class="share-popup">
             <text class="share-title">立即分享</text>
             <view class="row">
                 <view class="col-6" @click="doShare('share')">
                     <view class="iconfont icon-download-post"></view>
                     <text class="mt-1">生成海报</text>
                 </view>
                 <view class="col-6" @click="doShare('copy')">
                     <view class="iconfont icon-fenxiang-post"></view>
                     <text class="mt-1">复制链接</text>
                 </view>
             </view>
             <view class="share-btn" @click="shareShow = false">
                <view class="btn-wrapper">
                  <view class="btn-item" @click="shareNow">取消分享</view>
                </view>
             </view>
         </view>
     </u-popup>
     <!-- 分享对话框 end -->
     
     <view class="title-wrapper">
       <view class="title">邀请记录</view>
     </view>

     <!-- 邀请列表 -->
     <view class="share-list">
      <view class="share-item show-type" v-for="(item, index) in list.content" :key="index" @click="onTargetDetail(item.id)">
        <block>
          <view class="share-item-left flex-box">
            <view class="share-item-image">
                <image class="image" :src="item.subUserInfo.avatar"></image>
            </view>
            <view class="share-item-title twolist-hidden">
              <view class="name">{{ item.subUserInfo.name }}</view>
              <view class="no">会员号：{{ item.subUserInfo.userNo }}</view>
            </view>
            <view class="share-item-footer m-top10">
              <text class="share-views f-24 col-8">邀请时间：{{ item.createTime | timeFormat('yyyy-mm-dd hh:MM') }}</text>
            </view>
          </view>
        </block>
      </view>
     </view>
  </mescroll-body>
  
</template>

<script>
  import MescrollBody from '@/components/mescroll-uni/mescroll-body.vue'
  import MescrollMixin from '@/components/mescroll-uni/mescroll-mixins'
  import * as ShareApi from '@/api/share'
  import { getEmptyPaginateObj, getMoreListData } from '@/utils/app'

  const pageSize = 15

  export default {
    components: {
      MescrollBody
    },
    mixins: [MescrollMixin],
    data() {
      return {
        // 立即分享
        shareShow: false,
        // 邀请列表
        list: getEmptyPaginateObj(),
        // 上拉加载配置
        upOption: {
          // 首次自动执行
          auto: true,
          // 每页数据的数量; 默认10
          page: { size: pageSize },
          // 数量要大于3条才显示无更多数据
          noMoreSize: 3,
        }
      }
    },

    methods: {

      /**
       * 上拉加载的回调 (页面初始化时也会执行一次)
       * 其中page.num:当前页 从1开始, page.size:每页数据条数,默认10
       * @param {Object} page
       */
      upCallback(page) {
        const app = this;
        // 设置列表数据
        app.getShareList(page.num)
          .then(list => {
            const curPageLen = list.content.length;
            const totalSize = list.content.totalElements;
            app.mescroll.endBySize(curPageLen, totalSize);
          })
          .catch(() => app.mescroll.endErr());
      },

      /**
       * 获取邀请列表
       * @param {Number} pageNo 页码
       */
      getShareList(pageNo = 1) {
        const app = this
        return new Promise((resolve, reject) => {
          ShareApi.list({  page: pageNo }, { load: false })
            .then(result => {
              // 合并新数据
              const newList = result.data;
              app.list.content = getMoreListData(newList, app.list, pageNo);
              resolve(newList);
            })
            .catch(result => reject());
        })
      },
      
      /**
       * 立即邀请
       */
      shareNow() {
         this.shareShow = true;
      },
      
      /**
       * 确认分享
       */
      doShare(action) {
        this.shareShow = false;
        if (action == 'copy') {
            uni.setClipboardData({
                data: "https://www.fuint.cn/h5/?spm=163",
                success: function() {
                    uni.showToast({
                        title: "复制成功",
                        icon: 'none'
                    });
                },
                fail: () => {
                    uni.showToast({
                        title: "复制失败",
                        icon: 'none'
                    });
                }
            })
        }
      },
    }
  }
</script>

<style lang="scss" scoped>
  /* 顶部选项卡 */
  .container {
    min-height: 100vh;
  }
  .poster {
      padding: 20rpx;
      text-align: center;
      .iconfont {
          text-align: center;
          font-size: 120rpx;
          margin: 50rpx;
          color: $fuint-theme;
      }
      .action-btn {
         text-align: center;
         margin-top: 10rpx;
        .btn-wrapper {
          height: 100%;
          display: block;
          align-items: center;
          width: 70%;
          margin: 0 auto;
          .btn-item {
            font-size: 28rpx;
            height: 80rpx;
            line-height: 80rpx;
            text-align: center;
            color: #fff;
            border-radius: 80rpx;
            background: linear-gradient(to right, #f9211c, #ff6335);
          }
        }
      }
  }
  
  .share-popup {
      padding: 20rpx;
      font-size: 30rpx;
      text-align: center;
      .share-title {
          margin-top: 40rpx;
          font-size: 35rpx;
          font-weight: bold;
      }
      .row {
          margin-top: 30rpx;
          padding-top: 80rpx;
          clear: both;
          height: 240rpx;
          .col-6 {
              width: 50%;
              float: left;
              .mt-1 {
                 line-height: 60rpx;
              }
              .iconfont {
                  color: $fuint-theme;
                  font-size: 56rpx;
              }
          }
      }
      .share-btn {
         text-align: center;
        .btn-wrapper {
          height: 100%;
          display: block;
          align-items: center;
          width: 80%;
          margin: 0 auto;
          border: solid 2rpx #ccc;
          border-radius: 80rpx;
          .btn-item {
            font-size: 28rpx;
            height: 80rpx;
            line-height: 80rpx;
            text-align: center;
            color: #333;
          }
        }
      }
  }

  .title-wrapper {
    display: flex;
    width: 100%;
    height: 88rpx;
    line-height: 88rpx;
    color: #333;
    padding-left: 20rpx;
    font-size: 30rpx;
    font-weight: bold;
    background: #fff;
    margin-top: 50rpx;
    border-bottom: 1rpx solid #e4e4e4;
    z-index: 100;
    overflow: hidden;
    white-space: nowrap;
  }

  /* 分享列表 */
  .share-list {
    padding-top: 10rpx;
    line-height: 1;
    background: #f7f7f7;
  }

  .share-item {
    margin-bottom: 10rpx;
    padding: 20rpx;
    background: #fff;

    &:last-child {
      margin-bottom: 0;
    }

    .share-item-title {
      max-height: 80rpx;
      font-size: 24rpx;
      color: #333;
      .name {
          font-weight: bold;
      }
      .no {
          margin-top: 20rpx;
          font-size: 20rpx;
          color: #888888;
      }
    }

    .share-item-image .image {
      display: block;
      border-radius: 100rpx;
      height: 100rpx;
      width: 100rpx;
      border: 2rpx solid #cccccc;
      float: left;
      background: #ccc;
    }
    .share-item-footer {
      margin-top: 0rpx;  
      clear: both;
      text-align: right;
    }
  }

  .show-type {
    display: flex;
    .share-item-left {
      padding-right: 20rpx;
      width: 10rpx;
    }
    .share-item-title {
      min-height: 100rpx;
      float: left;
      margin-left: 10rpx;
    }
  }
</style>
