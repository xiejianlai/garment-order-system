<script setup lang="ts">
import { onLaunch, onShow } from '@dcloudio/uni-app';
import { useUserStore } from './stores/user';

const userStore = useUserStore();

onLaunch(() => {
  console.log('App Launch — 外贸服装订单系统');

  // 检查登录状态 — 小程序和H5共用
  // login/index 是 pages.json 中的首页，app 启动时已经自动加载
  const token = uni.getStorageSync('token');
  if (token) {
    // 记录当前 token，防止与用户手动登录产生竞态
    const tokenAtLaunch = token;
    userStore.fetchCurrentUser()
      .then(() => {
        // 仅当 token 没有被用户重新登录覆盖时才跳转
        if (uni.getStorageSync('token') === tokenAtLaunch) {
          setTimeout(() => {
            uni.switchTab({ url: '/pages/orders/index' });
          }, 100);
        }
      })
      .catch(() => {
        // 仅当 token 没有被用户重新登录覆盖时才清除
        if (uni.getStorageSync('token') === tokenAtLaunch) {
          // token失效，静默清除（不调用 logout 避免 reLaunch 冲突）
          uni.removeStorageSync('token');
          uni.removeStorageSync('userInfo');
          userStore.userInfo = null;
        }
      });
  }
  // 无token时不需要做任何操作，login/index 已经是首页
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
