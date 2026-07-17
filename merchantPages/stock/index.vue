<template>
  <mescroll-body ref="mescrollRef" :sticky="true" @init="mescrollInit" :down="{ native: true }" @down="downCallback"
    :up="upOption" @up="upCallback">

    <!-- 页面标题栏 -->
    <view class="page-header">
      <view class="header-title">库存盘点</view>
      <view class="header-add" @click="onAdd">
        <text class="iconfont icon-add"></text>
        <text>发起盘点</text>
      </view>
    </view>

    <!-- 状态筛选 -->
    <view class="status-tabs">
      <view class="tab-item" :class="{ active: filterStatus === '' }" @click="onFilterChange('')">全部</view>
      <view class="tab-item" :class="{ active: filterStatus === 'A' }" @click="onFilterChange('A')">盘点中</view>
      <view class="tab-item" :class="{ active: filterStatus === 'B' }" @click="onFilterChange('B')">已完成</view>
    </view>

    <!-- 盘点记录列表 -->
    <view class="check-list" v-if="list.length > 0">
      <view class="check-item" v-for="(item, index) in list" :key="index" @click="onDetail(item)">
        <view class="check-header">
          <view class="check-no">
            <text class="no-label">单号：</text>
            <text class="no-value">{{ item.checkNo }}</text>
          </view>
          <view class="check-status">
            <text v-if="item.status === 'A'" class="status-dot dot-ing"></text>
            <text v-else-if="item.status === 'B'" class="status-dot dot-done"></text>
            <text class="status-text">{{ item.status === 'A' ? '盘点中' : '已完成' }}</text>
          </view>
        </view>
        <view class="check-body">
          <view class="check-info">
            <text class="info-item">
              <text class="info-label">盘点时间：</text>
              <text>{{ formatTime(item.checkTime) }}</text>
            </text>
            <text v-if="item.description" class="info-item">
              <text class="info-label">备注：</text>
              <text>{{ item.description }}</text>
            </text>
          </view>
        </view>
        <view class="check-footer">
          <text class="footer-operator">操作人：{{ item.operator || '-' }}</text>
          <view class="footer-actions" @click.stop>
            <text v-if="item.status === 'A'" class="action-btn action-edit" @click="onDetail(item)">录入盘点</text>
            <text class="action-btn action-delete" @click="onDelete(item)">删除</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 空数据 -->
    <view v-if="!isLoading && list.length === 0" class="empty-wrap">
      <view class="empty-icon iconfont icon-wushuju"></view>
      <view class="empty-text">暂无盘点记录</view>
      <button class="empty-btn" @click="onAdd">发起盘点</button>
    </view>

  </mescroll-body>
</template>

<script>
  import MescrollBody from '@/components/mescroll-uni/mescroll-body.vue'
  import MescrollMixin from '@/components/mescroll-uni/mescroll-mixins'
  import * as StockApi from '@/api/merchant/stock'

  const pageSize = 15

  export default {
    components: {
      MescrollBody
    },
    mixins: [MescrollMixin],

    data() {
      return {
        filterStatus: '',
        list: [],
        isLoading: false,
        totalSize: 0,
        upOption: {
          auto: true,
          page: { size: pageSize },
          noMoreSize: 4,
        }
      }
    },

    onShow() {
      this.mescroll.resetUpScroll()
    },

    methods: {
      // 格式化时间
      formatTime(dateStr) {
        if (!dateStr) return '-'
        return dateStr
      },

      // 状态筛选切换
      onFilterChange(status) {
        this.filterStatus = status
        this.mescroll.resetUpScroll()
      },

      // 上拉加载
      upCallback(page) {
        const app = this
        app.getCheckList(page.num)
          .then(list => {
            const curPageLen = list ? list.length : 0
            app.mescroll.endBySize(curPageLen, app.totalSize)
          })
          .catch(() => app.mescroll.endErr())
      },

      // 获取盘点列表
      getCheckList(pageNo = 1) {
        const app = this
        app.isLoading = true
        const param = {
          page: pageNo,
          pageSize: pageSize
        }
        if (app.filterStatus) {
          param.status = app.filterStatus
        }

        return new Promise((resolve, reject) => {
          StockApi.stockCheckList(param)
            .then(result => {
              app.isLoading = false
              const paginationResponse = result.data.paginationResponse || {}
              app.totalSize = paginationResponse.totalElements || 0
              const newList = paginationResponse.content || []

              if (pageNo === 1) {
                app.list = newList
              } else {
                app.list = app.list.concat(newList)
              }
              resolve(newList)
            })
            .catch(err => {
              app.isLoading = false
              reject(err)
            })
        })
      },

      // 发起盘点
      onAdd() {
        this.$navTo('merchantPages/stock/add')
      },

      // 查看/录入盘点详情
      onDetail(item) {
        this.$navTo(`merchantPages/stock/detail?checkId=${item.id}`)
      },

      // 删除盘点记录
      onDelete(item) {
        const tip = item.status === 'A' ? '盘点中的记录删除后不可恢复，确认删除？' : '确认删除该盘点记录？'
        uni.showModal({
          title: '提示',
          content: tip,
          success: (res) => {
            if (res.confirm) {
              StockApi.deleteStockCheck({ checkId: item.id })
                .then(() => {
                  uni.showToast({ title: '删除成功', icon: 'success' })
                  this.mescroll.resetUpScroll()
                })
                .catch(() => {
                  uni.showToast({ title: '删除失败', icon: 'none' })
                })
            }
          }
        })
      }
    }
  }
</script>

<style lang="scss" scoped>
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 30rpx 30rpx 20rpx;
    background: #fff;

    .header-title {
      font-size: 32rpx;
      font-weight: bold;
      color: #333;
    }

    .header-add {
      display: flex;
      align-items: center;
      font-size: 26rpx;
      color: $fuint-theme;
      font-weight: bold;

      .iconfont {
        margin-right: 8rpx;
        font-size: 30rpx;
      }
    }
  }

  .status-tabs {
    display: flex;
    background: #fff;
    padding: 0 30rpx 20rpx;
    gap: 24rpx;

    .tab-item {
      font-size: 26rpx;
      color: #666;
      padding: 10rpx 28rpx;
      border-radius: 30rpx;
      background: #f5f5f5;

      &.active {
        color: #fff;
        background: $fuint-theme;
      }
    }
  }

  .check-list {
    padding: 20rpx;
    box-sizing: border-box;
  }

  .check-item {
    margin-bottom: 20rpx;
    padding: 24rpx;
    background: #fff;
    border-radius: 16rpx;
    box-shadow: 0 1rpx 5rpx 0px rgba(0, 0, 0, 0.05);

    &:last-child {
      margin-bottom: 0;
    }
  }

  .check-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16rpx;

    .check-no {
      font-size: 28rpx;

      .no-label {
        color: #999;
      }

      .no-value {
        color: #333;
        font-weight: bold;
      }
    }

    .check-status {
      display: flex;
      align-items: center;

      .status-dot {
        width: 12rpx;
        height: 12rpx;
        border-radius: 50%;
        margin-right: 8rpx;

        &.dot-ing {
          background: #ff976a;
        }

        &.dot-done {
          background: #07c160;
        }
      }

      .status-text {
        font-size: 24rpx;
        color: #999;
      }
    }
  }

  .check-body {
    margin-bottom: 16rpx;

    .check-info {
      display: flex;
      flex-direction: column;
      gap: 8rpx;

      .info-item {
        font-size: 24rpx;
        color: #666;
      }

      .info-label {
        color: #999;
      }
    }
  }

  .check-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 16rpx;
    border-top: 1rpx solid #f0f0f0;

    .footer-operator {
      font-size: 22rpx;
      color: #999;
    }

    .footer-actions {
      display: flex;
      gap: 16rpx;

      .action-btn {
        font-size: 24rpx;
        padding: 8rpx 24rpx;
        border-radius: 30rpx;
        border: 1rpx solid #eee;

        &.action-edit {
          color: $fuint-theme;
          border-color: $fuint-theme;
        }

        &.action-delete {
          color: #ee0a24;
          border-color: #ee0a24;
        }
      }
    }
  }

  .empty-wrap {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding-top: 200rpx;

    .empty-icon {
      font-size: 120rpx;
      color: #ddd;
    }

    .empty-text {
      margin-top: 20rpx;
      font-size: 28rpx;
      color: #999;
    }

    .empty-btn {
      margin-top: 30rpx;
      width: 220rpx;
      height: 64rpx;
      line-height: 64rpx;
      text-align: center;
      font-size: 28rpx;
      color: #fff;
      border-radius: 32rpx;
      background: $fuint-theme;
      border: none;
    }
  }
</style>
