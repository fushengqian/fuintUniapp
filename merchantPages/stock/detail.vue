<template>
  <view class="container" v-if="!loading">
    <!-- 盘点基本信息 -->
    <view class="info-list">
      <view class="info-item">
        <view class="contacts">
          <text class="name">盘点单号</text>
          <text class="value">{{ stockCheck.checkNo }}</text>
        </view>
      </view>
      <view class="info-item">
        <view class="contacts">
          <text class="name">盘点时间</text>
          <text class="value">{{ formatTime(stockCheck.checkTime) }}</text>
        </view>
      </view>
      <view class="info-item">
        <view class="contacts">
          <text class="name">状态</text>
          <text class="value" :class="stockCheck.status === 'A' ? 'text-ing' : 'text-done'">
            {{ stockCheck.status === 'A' ? '盘点中' : '已完成' }}
          </text>
        </view>
      </view>
      <view v-if="stockCheck.description" class="info-item">
        <view class="contacts">
          <text class="name">备注</text>
          <text class="value">{{ stockCheck.description }}</text>
        </view>
      </view>
      <view class="info-item">
        <view class="contacts">
          <text class="name">操作人</text>
          <text class="value">{{ stockCheck.operator || '-' }}</text>
        </view>
      </view>
    </view>

    <!-- 盘点商品明细 -->
    <view class="check-goods-section">
      <view class="section-title">
        <text>盘点明细</text>
        <text class="section-count">共 {{ itemList.length }} 种</text>
      </view>

      <view class="item-list" v-if="itemList.length > 0">
        <view class="item-card" v-for="(item, index) in itemList" :key="index">
          <view class="item-top">
            <image v-if="item.goodsLogo" class="item-logo" :src="getImageUrl(item.goodsLogo)" mode="aspectFill"></image>
            <view v-else class="item-logo-placeholder">
              <text class="iconfont icon-shangcheng"></text>
            </view>
            <view class="item-info">
              <view class="item-name twolist-hidden">{{ item.goodsName }}</view>
              <view v-if="item.skuName" class="item-sku">规格：{{ item.skuName }}</view>
              <view class="item-price">¥{{ item.goodsPrice || 0 }}</view>
            </view>
          </view>

          <view class="item-bottom">
            <view class="stock-row">
              <view class="stock-col">
                <text class="stock-label">系统库存</text>
                <text class="stock-value">{{ item.systemStock }}</text>
              </view>
              <view class="stock-col">
                <text class="stock-label">实际库存</text>
                <text v-if="stockCheck.status === 'B'" class="stock-value" :class="{ 'diff-stock': item.diffStock !== 0 }">
                  {{ item.actualStock }}
                </text>
                <input v-else class="stock-input" type="digit" v-model="item._actualStock"
                  :placeholder="item.systemStock + ''" @input="calcDiff(item)" />
              </view>
              <view class="stock-col">
                <text class="stock-label">差异</text>
                <text class="stock-value" :class="{ 'diff-stock': item._diffStock > 0, 'diff-minus': item._diffStock < 0 }">
                  {{ stockCheck.status === 'B' ? (item.diffStock || 0) : (item._diffStock || 0) }}
                </text>
              </view>
            </view>

            <!-- 盘点备注（盘点中可编辑） -->
            <view v-if="stockCheck.status === 'A'" class="item-remark">
              <input class="remark-input" type="text" v-model="item._remark"
                placeholder="备注（选填）" />
            </view>
            <view v-else-if="item.description" class="item-remark">
              <text class="remark-text">备注：{{ item.description }}</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 空数据 -->
      <view v-if="itemList.length === 0" class="empty-wrap">
        <view class="empty-text">暂无盘点明细</view>
      </view>
    </view>

    <!-- 底部操作按钮 -->
    <view v-if="stockCheck.status === 'A'" class="footer-fixed">
      <view class="btn-wrapper">
        <view class="btn-item btn-item-main" @click="submitCheck()">提交盘点</view>
      </view>
    </view>
  </view>
</template>

<script>
  import * as StockApi from '@/api/merchant/stock'

  export default {
    data() {
      return {
        checkId: '',
        loading: true,
        stockCheck: {},
        itemList: [],
        imagePath: ''
      }
    },

    onLoad(options) {
      this.checkId = options.checkId || ''
      if (this.checkId) {
        this.loadDetail()
      }
    },

    onShow() {
      if (this.checkId) {
        this.loadDetail()
      }
    },

    methods: {
      // 获取图片完整URL
      getImageUrl(logo) {
        if (!logo) return ''
        if (logo.startsWith('http://') || logo.startsWith('https://')) {
          return logo
        }
        return (this.imagePath || '') + logo
      },

      // 格式化时间
      formatTime(dateStr) {
        if (!dateStr) return '-'
        return dateStr
      },

      // 计算差异
      calcDiff(item) {
        const actualVal = parseFloat(item._actualStock) || item.systemStock
        item._actualStock = actualVal
        item._diffStock = actualVal - item.systemStock
      },

      // 加载盘点详情
      loadDetail() {
        const app = this
        app.loading = true

        StockApi.stockCheckDetail({ checkId: app.checkId })
          .then(result => {
            app.loading = false
            app.stockCheck = result.data.stockCheck || {}
            app.itemList = result.data.itemList || []
            app.imagePath = result.data.imagePath || ''

            // 初始化盘点中的可编辑数据
            if (app.stockCheck.status === 'A') {
              app.itemList.forEach(item => {
                item._actualStock = item.actualStock
                item._diffStock = item.diffStock || 0
                item._remark = item.description || ''
              })
            }
          })
          .catch(() => {
            app.loading = false
          })
      },

      // 提交盘点
      submitCheck() {
        const app = this

        // 验证
        let hasEmpty = false
        const goodsList = app.itemList.map(item => {
          const actualStock = item._actualStock !== undefined && item._actualStock !== ''
            ? parseFloat(item._actualStock)
            : item.systemStock

          if (item._actualStock === '' || item._actualStock === undefined) {
            hasEmpty = true
          }

          return {
            goodsId: item.goodsId,
            skuId: item.skuId || 0,
            actualStock: actualStock,
            description: item._remark || ''
          }
        })

        if (hasEmpty) {
          uni.showModal({
            title: '提示',
            content: '部分商品未填写实际库存，将默认使用系统库存，确认提交？',
            success: (res) => {
              if (res.confirm) {
                app.doSubmit(goodsList)
              }
            }
          })
          return
        }

        app.doSubmit(goodsList)
      },

      doSubmit(goodsList) {
        const app = this

        uni.showModal({
          title: '确认提交',
          content: '提交后库存差异将自动调整，确认提交盘点结果？',
          success: (res) => {
            if (res.confirm) {
              StockApi.submitStockCheck({
                checkId: app.checkId,
                goodsList: goodsList
              })
                .then(() => {
                  uni.showToast({ title: '提交成功', icon: 'success' })
                  setTimeout(() => {
                    app.loadDetail()
                  }, 1000)
                })
                .catch(() => {
                  uni.showToast({ title: '提交失败', icon: 'none' })
                })
            }
          }
        })
      }
    }
  }
</script>

<style lang="scss" scoped>
  .info-list {
    margin-top: 25rpx;
  }

  .info-item {
    margin: 0 auto 16rpx auto;
    padding: 24rpx 40rpx;
    width: 94%;
    box-shadow: 0 1rpx 5rpx 0px rgba(0, 0, 0, 0.05);
    border-radius: 16rpx;
    background: #fff;
  }

  .contacts {
    font-size: 28rpx;
    display: flex;
    justify-content: space-between;
    align-items: center;

    .name {
      color: #666;
    }

    .value {
      color: #333;
      text-align: right;

      &.text-ing {
        color: #ff976a;
        font-weight: bold;
      }

      &.text-done {
        color: #07c160;
        font-weight: bold;
      }
    }
  }

  .check-goods-section {
    padding: 20rpx 0 120rpx;
  }

  .section-title {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20rpx 30rpx 16rpx;
    font-size: 30rpx;
    font-weight: bold;
    color: #333;

    .section-count {
      font-size: 24rpx;
      color: $fuint-theme;
      font-weight: normal;
    }
  }

  .item-list {
    padding: 0 20rpx;
  }

  .item-card {
    margin-bottom: 16rpx;
    padding: 20rpx;
    background: #fff;
    border-radius: 16rpx;
    box-shadow: 0 1rpx 5rpx 0px rgba(0, 0, 0, 0.05);
  }

  .item-top {
    display: flex;
    align-items: center;
    margin-bottom: 16rpx;
    padding-bottom: 16rpx;
    border-bottom: 1rpx solid #f5f5f5;
  }

  .item-logo {
    width: 80rpx;
    height: 80rpx;
    border-radius: 10rpx;
    background: #f5f5f5;
    flex-shrink: 0;
  }

  .item-logo-placeholder {
    width: 80rpx;
    height: 80rpx;
    border-radius: 10rpx;
    background: #f5f5f5;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;

    .iconfont {
      font-size: 36rpx;
      color: #ccc;
    }
  }

  .item-info {
    flex: 1;
    margin-left: 16rpx;

    .item-name {
      font-size: 28rpx;
      color: #333;
      line-height: 1.3;
      white-space: normal;
    }

    .item-sku {
      font-size: 22rpx;
      color: #999;
      margin-top: 4rpx;
    }

    .item-price {
      font-size: 26rpx;
      color: #f03c3c;
      font-weight: bold;
      margin-top: 6rpx;
    }
  }

  .item-bottom {
    .stock-row {
      display: flex;
      justify-content: space-between;
    }

    .stock-col {
      flex: 1;
      text-align: center;

      .stock-label {
        display: block;
        font-size: 22rpx;
        color: #999;
        margin-bottom: 8rpx;
      }

      .stock-value {
        display: block;
        font-size: 30rpx;
        font-weight: bold;
        color: #333;

        &.diff-stock {
          color: #f03c3c;
        }

        &.diff-minus {
          color: #00acac;
        }
      }

      .stock-input {
        display: block;
        width: 120rpx;
        margin: 0 auto;
        height: 54rpx;
        line-height: 54rpx;
        text-align: center;
        font-size: 30rpx;
        font-weight: bold;
        color: #333;
        border: 2rpx solid $fuint-theme;
        border-radius: 8rpx;
        background: #f9f9f9;
      }
    }

    .item-remark {
      margin-top: 12rpx;
      padding-top: 12rpx;
      border-top: 1rpx solid #f5f5f5;

      .remark-input {
        font-size: 24rpx;
        color: #666;
        height: 50rpx;
        line-height: 50rpx;
        background: #f9f9f9;
        padding: 0 16rpx;
        border-radius: 8rpx;
      }

      .remark-text {
        font-size: 24rpx;
        color: #999;
      }
    }
  }

  .empty-wrap {
    display: flex;
    align-items: center;
    justify-content: center;
    padding-top: 100rpx;

    .empty-text {
      font-size: 28rpx;
      color: #999;
    }
  }

  .footer-fixed {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    height: 100rpx;
    background: #fff;
    z-index: 11;
    padding-bottom: env(safe-area-inset-bottom);

    .btn-wrapper {
      height: 100%;
      display: flex;
      align-items: center;
      padding: 0 20rpx;
    }

    .btn-item {
      flex: 1;
      font-size: 28rpx;
      height: 80rpx;
      line-height: 80rpx;
      text-align: center;
      color: #fff;
      border-radius: 40rpx;
    }

    .btn-item-main {
      background: linear-gradient(to right, #f9211c, #ff6335);
    }
  }
</style>
