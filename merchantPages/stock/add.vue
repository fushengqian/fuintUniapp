<template>
  <view class="container">
    <!-- 备注 -->
    <view class="info-list">
      <view class="info-item">
        <view class="contacts">
          <text class="name">盘点备注</text>
          <input class="weui-input value" type="text" v-model="description" placeholder="选填，如：月末盘点"/>
        </view>
      </view>
    </view>

    <!-- 商品列表标题 -->
    <view class="goods-header">
      <text class="goods-title">盘点商品</text>
      <text class="goods-count">已选 {{ selectedGoods.length }} 种</text>
    </view>

    <!-- 商品列表 -->
    <view class="goods-list">
      <view class="goods-item" v-for="(item, index) in goodsList" :key="index">
        <view class="goods-item_main" @click="toggleGoods(item)">
          <view class="checkbox" :class="{ checked: isSelected(item) }">
            <text v-if="isSelected(item)" class="iconfont icon-gouxuan"></text>
          </view>
          <image v-if="item.logo" class="goods-logo" :src="getImageUrl(item.logo)" mode="aspectFill"></image>
          <view v-else class="goods-logo-placeholder">
            <text class="iconfont icon-shangcheng"></text>
          </view>
          <view class="goods-info">
            <view class="goods-name twolist-hidden">{{ item.name }}</view>
            <view class="goods-meta">
              <text class="meta-stock">库存: {{ item.stock || 0 }}</text>
              <text class="meta-price">¥{{ item.price || 0 }}</text>
            </view>
          </view>
        </view>

        <!-- 多规格商品展开 -->
        <view v-if="isSelected(item) && !item.isSingleSpec && item.skuList && item.skuList.length > 0" class="sku-list">
          <view class="sku-item" v-for="(sku, skuIndex) in item.skuList" :key="skuIndex"
            :class="{ 'sku-selected': isSkuSelected(item.id, sku.id) }"
            @click="toggleSku(item, sku)">
            <text class="sku-name">{{ sku.name }}</text>
            <text class="sku-stock">库存: {{ sku.stock || 0 }}</text>
          </view>
        </view>
      </view>

      <!-- 加载更多 -->
      <view v-if="hasMore" class="load-more" @click="loadMoreGoods">
        <text>加载更多商品</text>
      </view>

      <!-- 空数据 -->
      <view v-if="goodsList.length === 0 && !loading" class="empty-wrap">
        <view class="empty-icon iconfont icon-wushuju"></view>
        <view class="empty-text">暂无商品</view>
      </view>
    </view>

    <!-- 底部操作按钮 -->
    <view class="footer-fixed">
      <view class="btn-wrapper">
        <view class="btn-item btn-item-main" @click="createCheck()">
          发起盘点（{{ selectedGoods.length }}种商品）
        </view>
      </view>
    </view>
  </view>
</template>

<script>
  import * as GoodsApi from '@/api/merchant/goods'
  import * as StockApi from '@/api/merchant/stock'

  const pageSize = 20

  export default {
    data() {
      return {
        description: '',
        goodsList: [],
        selectedGoods: [],
        selectedSkus: [],
        imagePath: '',
        pageNo: 1,
        hasMore: true,
        loading: false
      }
    },

    onLoad() {
      this.loadGoods()
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

      // 加载商品列表
      loadGoods(pageNo = 1) {
        const app = this
        app.loading = true
        const param = {
          page: pageNo,
          pageSize: pageSize,
          status: 'A'
        }

        GoodsApi.goodsList(param)
          .then(result => {
            app.loading = false
            app.imagePath = result.data.imagePath || ''
            const pagination = result.data.paginationResponse || {}
            const newList = pagination.content || []

            if (pageNo === 1) {
              app.goodsList = newList
            } else {
              app.goodsList = app.goodsList.concat(newList)
            }

            app.pageNo = pageNo
            app.hasMore = newList.length >= pageSize
          })
          .catch(() => {
            app.loading = false
          })
      },

      // 加载更多
      loadMoreGoods() {
        this.loadGoods(this.pageNo + 1)
      },

      // 判断商品是否选中
      isSelected(item) {
        return this.selectedGoods.some(g => g.id === item.id && !g.skuId)
      },

      // 判断SKU是否选中
      isSkuSelected(goodsId, skuId) {
        return this.selectedGoods.some(g => g.id === goodsId && g.skuId === skuId)
      },

      // 切换商品选中
      toggleGoods(item) {
        const idx = this.selectedGoods.findIndex(g => g.id === item.id && !g.skuId)

        if (idx > -1) {
          // 已选中，取消选中（同时取消该商品下的所有SKU）
          this.selectedGoods = this.selectedGoods.filter(g => g.id !== item.id)
        } else {
          // 未选中
          if (item.isSingleSpec === 'Y') {
            // 单规格：直接添加
            this.selectedGoods.push({
              id: item.id,
              name: item.name,
              stock: item.stock || 0
            })
          } else {
            // 多规格：添加商品本身（作为父项）
            this.selectedGoods.push({
              id: item.id,
              name: item.name,
              stock: item.stock || 0
            })
          }
        }
      },

      // 切换SKU选中
      toggleSku(item, sku) {
        const idx = this.selectedGoods.findIndex(g => g.id === item.id && g.skuId === sku.id)

        if (idx > -1) {
          this.selectedGoods.splice(idx, 1)
        } else {
          this.selectedGoods.push({
            id: item.id,
            skuId: sku.id,
            name: item.name + ' - ' + sku.name,
            stock: sku.stock || 0,
            goodsId: item.id
          })
        }
      },

      // 创建盘点
      createCheck() {
        const app = this
        if (app.selectedGoods.length === 0) {
          app.$error('请选择盘点商品')
          return
        }

        // 构建商品列表参数
        const goodsList = []
        app.selectedGoods.forEach(g => {
          const goodsItem = { goodsId: g.id || g.goodsId }
          if (g.skuId) {
            goodsItem.skuId = g.skuId
          }
          goodsList.push(goodsItem)
        })

        uni.showModal({
          title: '确认发起盘点',
          content: `将对 ${goodsList.length} 种商品进行盘点，确认发起？`,
          success: (res) => {
            if (res.confirm) {
              app.isLoading = true
              StockApi.createStockCheck({
                description: app.description,
                goodsList: goodsList
              })
                .then(result => {
                  app.isLoading = false
                  uni.showToast({ title: '发起成功', icon: 'success' })
                  setTimeout(() => {
                    uni.navigateBack()
                  }, 1500)
                })
                .catch(() => {
                  app.isLoading = false
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
    margin: 0 auto;
    padding: 30rpx 40rpx;
    width: 94%;
    box-shadow: 0 1rpx 5rpx 0px rgba(0, 0, 0, 0.05);
    border-radius: 16rpx;
    background: #fff;
  }

  .contacts {
    font-size: 30rpx;

    .name {
      margin-left: 0px;
    }

    .value {
      float: right;
      color: #999;
      text-align: right;
    }
  }

  .goods-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 30rpx 30rpx 16rpx;

    .goods-title {
      font-size: 30rpx;
      font-weight: bold;
      color: #333;
    }

    .goods-count {
      font-size: 24rpx;
      color: $fuint-theme;
    }
  }

  .goods-list {
    padding: 0 20rpx 120rpx;
  }

  .goods-item {
    margin-bottom: 16rpx;
    background: #fff;
    border-radius: 16rpx;
    padding: 20rpx;
    box-shadow: 0 1rpx 5rpx 0px rgba(0, 0, 0, 0.05);

    .goods-item_main {
      display: flex;
      align-items: center;
    }
  }

  .checkbox {
    width: 40rpx;
    height: 40rpx;
    border-radius: 50%;
    border: 2rpx solid #ddd;
    margin-right: 20rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;

    &.checked {
      background: $fuint-theme;
      border-color: $fuint-theme;

      .iconfont {
        color: #fff;
        font-size: 24rpx;
      }
    }
  }

  .goods-logo {
    width: 100rpx;
    height: 100rpx;
    border-radius: 12rpx;
    background: #f5f5f5;
    flex-shrink: 0;
  }

  .goods-logo-placeholder {
    width: 100rpx;
    height: 100rpx;
    border-radius: 12rpx;
    background: #f5f5f5;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;

    .iconfont {
      font-size: 40rpx;
      color: #ccc;
    }
  }

  .goods-info {
    flex: 1;
    margin-left: 20rpx;

    .goods-name {
      font-size: 28rpx;
      color: #333;
      line-height: 1.3;
      white-space: normal;
    }

    .goods-meta {
      display: flex;
      align-items: center;
      margin-top: 8rpx;
      gap: 16rpx;

      .meta-stock {
        font-size: 22rpx;
        color: #999;
      }

      .meta-price {
        font-size: 26rpx;
        color: #f03c3c;
        font-weight: bold;
      }
    }
  }

  .sku-list {
    margin-top: 16rpx;
    padding-top: 16rpx;
    border-top: 1rpx solid #f0f0f0;
    padding-left: 60rpx;

    .sku-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12rpx 16rpx;
      margin-bottom: 8rpx;
      border-radius: 8rpx;
      background: #f9f9f9;
      font-size: 24rpx;

      &.sku-selected {
        background: rgba(0, 172, 172, 0.1);
        color: $fuint-theme;
      }

      .sku-name {
        color: #333;
      }

      .sku-stock {
        color: #999;
      }
    }
  }

  .load-more {
    text-align: center;
    padding: 24rpx;
    font-size: 26rpx;
    color: $fuint-theme;
  }

  .empty-wrap {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding-top: 120rpx;

    .empty-icon {
      font-size: 100rpx;
      color: #ddd;
    }

    .empty-text {
      margin-top: 16rpx;
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
