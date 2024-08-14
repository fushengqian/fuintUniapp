<template>
    <view class="content">
        <view class="top-v" v-show="shopName.length>0"><text class="shopName">预约【{{shopName}}】</text><text class="moreShop" @click="toMoreShop">切换门店</text></view>
        <view class="info-v">
            <view class="title">
                ｜请选择预约日期
            </view>
                <view class="list-v">
                    <view @click="dateClick(index)" v-for="(item, index) in dateArr" :key="index" :class="[activeDateItemIndex==index?'activeItem':'item-v']">
                        <view>{{item.week}}</view>
                        <view>{{ item.date }}</view>
                    </view>
                </view>
        </view>
        <view class="info-v">
            <view class="title">
                ｜请选择时段
            </view>
                <view class="list-v">
                    <view @click="sessionClick(index)" v-for="(item, index) in sessionArr" :key="index"  :class="[activeSessionItemIndex==index?'activeItem':'item-v']">
                        <view>{{item}}</view>
                    </view>
                </view>
        </view>
        <view class="btn" @click="doSubmit">确定预约</view>
    </view>
</template>

<script>
    import * as BookApi from '@/api/book'
    export default {
        data() {
            return {
                bookId: null,
                // 当前预约详情
                detail: null,
                dateArr: [ { week: '星期一', date : '8月29号' }, { week: '星期二', date : '8月30号' }, { week: '星期三', date : '9月1号' }, { week: '星期四', date : '9月2号' }, { week: '星期五', date : '9月3号' }, { week: '星期日', date : '9月10号' }, { week: '星期日', date : '9月10号' }, { week: '星期日', date : '9月10号' }, { week: '星期日', date : '9月10号' }], 
                selectDate: '29号', //选择的日期数据
                activeDateItemIndex: 0,
                activeSessionItemIndex: 0,
                sessionArr: [ '09:00-12:00', '14:00-16:30', '20:00-22:45' ],
                shopName: '海口永万路店',
                shopId: '1001'
            }
        },onLoad(options) {
            // 记录预约ID
            this.bookId = options.bookId;
            // 获取预约详情
            this.getBookDetail();
        },onShow() {
            if(uni.getStorageSync('shopId').length ==0){
                uni.redirectTo({
                    url:'shop'
                })
                return;
            }
            this.shopName = '';
            this.shopId = '';
            let that = this; 
            that.shopName = uni.getStorageSync('shopName');
            that.shopId = uni.getStorageSync('shopId');
            //根据店铺id获取店铺名称
            this.$tokenRequest({url:'shop/getShopName/'+this.shopId,method:'get'}).then(res => {
                this.shopName = res.data;
            }, error => {})
            this.activeDateItemIndex=0;
            this.activeSessionItemIndex=0;
            let t = new Date().getHours();
            if(t <= 9){
                this.sessionArr= ['上午','下午','晚上'];
            }else if(t <= 13){
                this.sessionArr= ['下午','晚上'];
            }else{
                this.sessionArr= ['晚上'];
            }
            //获取日期tab数据 
            this.dateArr = this.dateData();
            // //默认选中的日期
            this.selectDate = `${this.dateArr[0]['date']}(${this.dateArr[0]['week']})`;
            this.showPage = true;
        },
        methods: {
            // 获取预约项目详情
            getBookDetail() {
              const app = this
              app.isLoading = true
              BookApi.detail(app.bookId)
                .then(result => {
                    app.detail = result.data.bookInfo;
                })
                .finally(() => app.isLoading = false)
            },
            // 切换门店
            toMoreShop() {
                // empty
            },
            // 确定预约
            doSubmit() {
                let that = this;
                uni.showModal({
                    title: '提示',
                    content: '确定预约【'+that.shopName+'】吗?',
                    success: function (res) {
                        if(res.confirm) {
                            let data = {
                                dateTxt:that.dateArr[that.activeDateItemIndex]['date'],
                                dateIndex : that.activeDateItemIndex,
                                sessionTxt:that.sessionArr[that.activeSessionItemIndex],
                                sessionIndex:that.activeSessionItemIndex
                            }
                            uni.setStorageSync('conditionData', data);
                        }
                    }
                });
            },
            sessionClick(index) {
                this.activeSessionItemIndex = index;
            },
            dateClick(index) {
                this.activeDateItemIndex = index;
                this.activeSessionItemIndex = 0;//初始化
                this.sessionArr= ['上午','下午','晚上'];
                if(this.activeDateItemIndex ===0){
                    let t = new Date().getHours();
                    if(t <= 9){
                        this.sessionArr= ['上午','下午','晚上'];
                    }else if(t <= 13){
                        this.sessionArr= ['下午','晚上'];
                    }else{
                        this.sessionArr= ['晚上'];
                    }
                }
            },
            strFormat(str) {
                return str < 10 ? `0${str}` : str
            },
            timeStamp(time) {
                const dates = new Date(time)
                const year = dates.getFullYear()
                const month = dates.getMonth() + 1
                const date = dates.getDate()
                const day = dates.getDay()
                const hour = dates.getHours()
                const min = dates.getMinutes()
                const days = ['日', '一', '二', '三', '四', '五', '六']
                return {
                    allDate: `${year}/${this.strFormat(month)}/${this.strFormat(date)}`,//注:此处ios系统如"-"分割无法显示,只能用"/"分割符
                    date: `${this.strFormat(month)}月${this.strFormat(date)}号`, //返回的日期 07-01
                    day: `星期${days[day]}`, //返回的礼拜天数  星期一
                    hour: this.strFormat(hour) + ':' + this.strFormat(min) //返回的时钟 08:00
                }
            },
            dateData() {
                const time = []
                const date = new Date()
                const now = date.getTime() //获取当前日期的时间戳
                let timeStr = 3600 * 24 * 1000 //一天的时间戳
                for (let i = 0; i < 6; i++) {
                    const timeObj = {}
                    timeObj.date = this.timeStamp(now + timeStr * i).date //保存日期
                    timeObj.timeStamp = now + timeStr * i //保存时间戳
                    if (i == 0) {
                        timeObj.week = '今天'
                    } else if (i == 1) {
                        timeObj.week = '明天'
                    } else if (i == 2) {
                        timeObj.week = '后天'
                    } else {
                        timeObj.week = this.timeStamp(now + timeStr * i).day
                    }
                    time.push(timeObj)
                }
                return time
            }
        }
    }
</script>

<style lang="scss" scoped>
    .content{
        .top-v{
            margin: 20rpx;
            .shopName{
                font-weight: bold;
                font-size: 32rpx;
            }
            .moreShop{
                float: right;
                color: $fuint-theme;
                border: 1rpx solid $fuint-theme;
                padding: 6rpx;
                border-radius: 20rpx;
                font-size: 24rpx;
            }
        }
        padding-bottom: 50rpx;
    }
    .getInfo-v{
        background-color: #fff;
        padding: 50rpx 30rpx;
        border-radius: 20rpx;
        width: 600rpx;
        .getInfo-btn{
            background-color: $fuint-theme;
            color: #fff;
            padding: 20rpx;
            border-radius: 10rpx;
            margin-top: 30rpx;
            text-align: center;
        }
    }
    .btn {
        margin: 20rpx auto;
        background-color: $fuint-theme;
        padding: 20rpx;
        border-radius: 40rpx;
        text-align: center;
        color: #fff;
        width: 680rpx;
        font-size: 30rpx;
        margin-top: 50rpx;
    }
    
    .info-v{
        padding: 20rpx;
        background-color: #fff;
        margin-bottom: 20rpx;
        .title{
            font-weight: 800;
            color: $fuint-theme;
        }
        .list-v{
            padding: 20rpx;
            display: flex;
            flex-wrap: wrap;
            .item-v{
                border-radius: 20rpx;
                font-size: 30rpx;
                margin-top: 10rpx;
                margin-left: 10rpx;
                width: 30%;
                border: 1rpx solid #999;
                text-align: center;
                padding: 20rpx;
            }
            .activeItem {
                font-size: 30rpx;
                border-radius: 20rpx;
                margin-top: 10rpx;
                margin-left: 10rpx;
                width: 30%;
                font-weight: 900;
                background-color: $fuint-theme;
                border: 1rpx solid #ccc;
                color: #fff;
                text-align: center;
                padding: 20rpx;
            }
        }
    }
</style>
