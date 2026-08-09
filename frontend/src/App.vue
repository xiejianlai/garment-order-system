<script setup lang="ts">
import { onLaunch, onShow } from '@dcloudio/uni-app';

onLaunch(() => {
  console.log('App Launch — 外贸服装订单系统');
  // 不在 onLaunch 中做任何 token 检查或跳转
  // login/index 是 pages.json 首页，由它自己的 onLoad 处理 token 检查
  // 避免 reLaunch/switchTab 与页面生命周期冲突
});

onShow(() => {
  console.log('App Show');
});
</script>

<style>
/* 全局样式 */
page {
  background-color: #f5f5f5;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  font-size: 28rpx;
  color: #333333;
}

/* 通用工具类 */
.container {
  padding: 20rpx;
}

.card {
  background: #ffffff;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 20rpx;
}

.flex {
  display: flex;
}

.flex-between {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.text-primary {
  color: #185FA5;
}

.text-secondary {
  color: #999999;
  font-size: 24rpx;
}

.text-danger {
  color: #E24B4A;
}

.text-success {
  color: #1D9E75;
}

.text-warning {
  color: #EF9F27;
}

/* 状态标签 */
.tag {
  display: inline-block;
  padding: 4rpx 16rpx;
  border-radius: 8rpx;
  font-size: 22rpx;
}

.tag-blue {
  background: #E6F1FB;
  color: #185FA5;
}

.tag-green {
  background: #E1F5EE;
  color: #0F6E56;
}

.tag-red {
  background: #FCEBEB;
  color: #A32D2D;
}

.tag-amber {
  background: #FAEEDA;
  color: #854F0B;
}

.tag-gray {
  background: #F1EFE8;
  color: #5F5E5A;
}
</style>
