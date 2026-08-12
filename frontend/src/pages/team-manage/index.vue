<template>
  <view class="team-page">
    <!-- 非管理员提示 -->
    <view v-if="!userStore.isAdmin" class="no-perm">
      <text class="no-perm-text">仅管理员可管理团队成员，如需操作请联系公司管理员。</text>
    </view>

    <template v-else>
      <!-- Tab 切换 -->
      <view class="tab-bar">
        <view class="tab-item" :class="{ active: tab === 'members' }" @tap="tab = 'members'">团队成员</view>
        <view class="tab-item" :class="{ active: tab === 'teams' }" @tap="tab = 'teams'">团队管理</view>
      </view>

      <!-- ============ 成员列表 ============ -->
      <view v-if="tab === 'members'" class="content">
        <view class="add-bar">
          <text class="add-hint">共 {{ companyInfo?.userCount || 0 }} 名成员</text>
          <button class="add-btn" @tap="openMemberForm('add')">＋ 添加成员</button>
        </view>

        <view v-if="loading" class="loading-tip">加载中...</view>
        <view v-else-if="!companyInfo?.users?.length" class="empty-tip">还没有成员，点击右上角"添加成员"</view>

        <view v-for="m in companyInfo?.users || []" :key="m.id" class="member-card">
          <view class="member-main">
            <view class="avatar" :style="{ background: m.avatarColor || '#185FA5' }">
              <text class="avatar-text">{{ m.realName?.charAt(0) || m.username?.charAt(0) }}</text>
            </view>
            <view class="member-info">
              <view class="member-name-row">
                <text class="member-name">{{ m.realName }}</text>
                <text class="role-chip">{{ ROLE_LABELS[m.role] || m.role }}</text>
                <text v-if="m.teamName" class="team-chip">{{ m.teamName }}</text>
                <text v-if="m.status === 'disabled'" class="disabled-chip">已停用</text>
              </view>
              <text class="member-sub">@{{ m.username }}{{ m.phone ? '  ·  ' + m.phone : '' }}</text>
              <text class="member-sub">{{ m.lastLoginAt ? '最近登录: ' + formatTime(m.lastLoginAt) : '从未登录' }}</text>
            </view>
          </view>
          <view class="member-actions">
            <text class="action-edit" @tap="openMemberForm('edit', m)">编辑</text>
            <text class="action-del" @tap="handleDeleteMember(m)">删除</text>
          </view>
        </view>
      </view>

      <!-- ============ 团队列表 ============ -->
      <view v-else class="content">
        <view class="add-bar">
          <text class="add-hint">共 {{ companyInfo?.teams?.length || 0 }} 个团队</text>
          <button class="add-btn" @tap="openTeamForm('add')">＋ 新建团队</button>
        </view>

        <view v-if="loading" class="loading-tip">加载中...</view>
        <view v-else-if="!companyInfo?.teams?.length" class="empty-tip">
          还没有团队。创建团队后，可在"团队成员"里把成员分配到对应团队，便于按团队管理。
        </view>

        <view v-for="t in companyInfo?.teams || []" :key="t.id" class="team-card">
          <view class="team-main">
            <view class="team-avatar">👥</view>
            <view class="team-info">
              <view class="team-name-row">
                <text class="team-name">{{ t.name }}</text>
                <text class="team-count">{{ t.memberCount }} 人</text>
              </view>
              <text class="team-remark">{{ t.remark || '暂无备注' }}</text>
            </view>
          </view>
          <view class="member-actions">
            <text class="action-edit" @tap="openTeamForm('edit', t)">编辑</text>
            <text class="action-del" @tap="handleDeleteTeam(t)">删除</text>
          </view>
        </view>
      </view>
    </template>

    <!-- ============ 成员表单弹层 ============ -->
    <view v-if="memberForm.show" class="overlay">
      <view class="overlay-mask" @tap="closeMemberForm"></view>
      <view class="overlay-panel">
        <view class="panel-title">{{ memberForm.mode === 'add' ? '添加成员' : '编辑成员' }}</view>

        <view class="field">
          <text class="field-label">姓名</text>
          <input v-model="memberForm.realName" class="field-input" placeholder="真实姓名" placeholder-class="ph" />
        </view>
        <view class="field">
          <text class="field-label">登录账号</text>
          <input v-model="memberForm.username" class="field-input" placeholder="登录账号，公司内唯一" placeholder-class="ph" />
        </view>
        <view class="field">
          <text class="field-label">密码</text>
          <input v-model="memberForm.password" class="field-input" :type="memberForm.showPwd ? 'text' : 'password'" :placeholder="memberForm.mode === 'edit' ? '不修改请留空' : '至少6位'" placeholder-class="ph" />
        </view>
        <view class="field">
          <text class="field-label">角色</text>
          <picker mode="selector" :range="roleLabels" :value="roleIndex" @change="onRoleChange">
            <view class="picker-value">{{ roleLabels[roleIndex] || '请选择角色' }}</view>
          </picker>
        </view>
        <view class="field">
          <text class="field-label">所属团队</text>
          <picker mode="selector" :range="teamNames" :value="teamIndex" @change="onTeamChange">
            <view class="picker-value">{{ teamNames[teamIndex] || '无团队' }}</view>
          </picker>
        </view>
        <view class="field">
          <text class="field-label">电话</text>
          <input v-model="memberForm.phone" class="field-input" type="number" placeholder="选填" placeholder-class="ph" />
        </view>
        <view v-if="memberForm.mode === 'edit'" class="field">
          <text class="field-label">状态</text>
          <picker mode="selector" :range="['启用', '停用']" :value="memberForm.status === 'disabled' ? 1 : 0" @change="onStatusChange">
            <view class="picker-value">{{ memberForm.status === 'disabled' ? '停用' : '启用' }}</view>
          </picker>
        </view>

        <view class="panel-actions">
          <button class="btn-cancel" @tap="closeMemberForm">取消</button>
          <button class="btn-save" :loading="saving" @tap="saveMember">保存</button>
        </view>
      </view>
    </view>

    <!-- ============ 团队表单弹层 ============ -->
    <view v-if="teamForm.show" class="overlay">
      <view class="overlay-mask" @tap="closeTeamForm"></view>
      <view class="overlay-panel">
        <view class="panel-title">{{ teamForm.mode === 'add' ? '新建团队' : '编辑团队' }}</view>

        <view class="field">
          <text class="field-label">团队名称</text>
          <input v-model="teamForm.name" class="field-input" placeholder="如：理单一组" placeholder-class="ph" />
        </view>
        <view class="field">
          <text class="field-label">备注</text>
          <input v-model="teamForm.remark" class="field-input" placeholder="选填" placeholder-class="ph" />
        </view>

        <view class="panel-actions">
          <button class="btn-cancel" @tap="closeTeamForm">取消</button>
          <button class="btn-save" :loading="saving" @tap="saveTeam">保存</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { useUserStore } from '../../stores/user';
import { getCompanyInfo, createTeam, updateTeam, deleteTeam, addMember, updateMember, deleteMember } from '../../api/company';
import { ROLE_LABELS } from '../../types';
import type { CompanyInfo, MemberInfo, TeamInfo } from '../../api/company';

const userStore = useUserStore();
const tab = ref<'members' | 'teams'>('members');
const loading = ref(false);
const saving = ref(false);
const companyInfo = ref<CompanyInfo | null>(null);

const ROLE_KEYS = ['admin', 'coordinator', 'merchandiser', 'customer'];
const roleLabels = ROLE_KEYS.map(r => ROLE_LABELS[r]);

// ============ 数据加载 ============
async function load() {
  loading.value = true;
  try {
    companyInfo.value = await getCompanyInfo();
  } catch (e) {
    console.error('加载公司信息失败:', e);
  } finally {
    loading.value = false;
  }
}

onShow(() => {
  load();
});

// ============ 成员表单 ============
const memberForm = reactive({
  show: false,
  mode: 'add' as 'add' | 'edit',
  editId: 0,
  realName: '',
  username: '',
  password: '',
  role: 'coordinator',
  teamId: null as number | null,
  phone: '',
  status: 'active',
  showPwd: false,
});

function openMemberForm(mode: 'add' | 'edit', member?: MemberInfo) {
  memberForm.show = true;
  memberForm.mode = mode;
  memberForm.editId = member?.id || 0;
  memberForm.realName = member?.realName || '';
  memberForm.username = member?.username || '';
  memberForm.password = '';
  memberForm.role = member?.role || 'coordinator';
  memberForm.teamId = member?.teamId || null;
  memberForm.phone = member?.phone || '';
  memberForm.status = member?.status || 'active';
  memberForm.showPwd = false;
}

function closeMemberForm() {
  memberForm.show = false;
}

const roleIndex = computed(() => {
  const idx = ROLE_KEYS.indexOf(memberForm.role);
  return idx >= 0 ? idx : 0;
});

const teamNames = computed(() => {
  const names = (companyInfo.value?.teams || []).map(t => t.name);
  return ['无团队', ...names];
});

const teamIndex = computed(() => {
  const teams = companyInfo.value?.teams || [];
  const idx = teams.findIndex(t => t.id === memberForm.teamId);
  return idx >= 0 ? idx + 1 : 0;
});

function onRoleChange(e: any) {
  memberForm.role = ROLE_KEYS[Number(e.detail.value)] || 'coordinator';
}

function onTeamChange(e: any) {
  const idx = Number(e.detail.value);
  if (idx === 0) {
    memberForm.teamId = null;
  } else {
    const team = (companyInfo.value?.teams || [])[idx - 1];
    memberForm.teamId = team ? team.id : null;
  }
}

function onStatusChange(e: any) {
  memberForm.status = Number(e.detail.value) === 0 ? 'active' : 'disabled';
}

async function saveMember() {
  if (!memberForm.realName.trim()) return uni.showToast({ title: '请输入姓名', icon: 'none' });
  if (!memberForm.username.trim()) return uni.showToast({ title: '请输入登录账号', icon: 'none' });
  if (memberForm.mode === 'add' && (!memberForm.password || memberForm.password.length < 6)) {
    return uni.showToast({ title: '密码至少6位', icon: 'none' });
  }

  saving.value = true;
  try {
    const payload = {
      realName: memberForm.realName.trim(),
      username: memberForm.username.trim(),
      role: memberForm.role,
      phone: memberForm.phone.trim() || undefined,
      teamId: memberForm.teamId,
    };
    if (memberForm.mode === 'add') {
      await addMember({ ...payload, password: memberForm.password });
      uni.showToast({ title: '成员已添加', icon: 'success' });
    } else {
      await updateMember(memberForm.editId, {
        ...payload,
        status: memberForm.status,
        password: memberForm.password || undefined,
      });
      uni.showToast({ title: '成员已更新', icon: 'success' });
    }
    closeMemberForm();
    load();
  } catch (e: any) {
    console.error('保存成员失败:', e.message);
  } finally {
    saving.value = false;
  }
}

function handleDeleteMember(m: MemberInfo) {
  uni.showModal({
    title: '删除成员',
    content: `确定删除成员「${m.realName}」吗？该账号将无法登录。`,
    confirmColor: '#E64340',
    success: async (res) => {
      if (!res.confirm) return;
      try {
        await deleteMember(m.id);
        uni.showToast({ title: '已删除', icon: 'success' });
        load();
      } catch (e: any) {
        console.error('删除失败:', e.message);
      }
    },
  });
}

// ============ 团队表单 ============
const teamForm = reactive({
  show: false,
  mode: 'add' as 'add' | 'edit',
  editId: 0,
  name: '',
  remark: '',
});

function openTeamForm(mode: 'add' | 'edit', team?: TeamInfo) {
  teamForm.show = true;
  teamForm.mode = mode;
  teamForm.editId = team?.id || 0;
  teamForm.name = team?.name || '';
  teamForm.remark = team?.remark || '';
}

function closeTeamForm() {
  teamForm.show = false;
}

async function saveTeam() {
  if (!teamForm.name.trim()) return uni.showToast({ title: '请输入团队名称', icon: 'none' });
  saving.value = true;
  try {
    if (teamForm.mode === 'add') {
      await createTeam(teamForm.name.trim(), teamForm.remark.trim() || undefined);
      uni.showToast({ title: '团队已创建', icon: 'success' });
    } else {
      await updateTeam(teamForm.editId, teamForm.name.trim(), teamForm.remark.trim() || undefined);
      uni.showToast({ title: '团队已更新', icon: 'success' });
    }
    closeTeamForm();
    load();
  } catch (e: any) {
    console.error('保存团队失败:', e.message);
  } finally {
    saving.value = false;
  }
}

function handleDeleteTeam(t: TeamInfo) {
  uni.showModal({
    title: '删除团队',
    content: `确定删除团队「${t.name}」吗？`,
    confirmColor: '#E64340',
    success: async (res) => {
      if (!res.confirm) return;
      try {
        await deleteTeam(t.id);
        uni.showToast({ title: '已删除', icon: 'success' });
        load();
      } catch (e: any) {
        console.error('删除失败:', e.message);
      }
    },
  });
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => (n < 10 ? '0' + n : '' + n);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
</script>

<style scoped>
.team-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 40rpx;
}

.no-perm {
  padding: 120rpx 40rpx;
  text-align: center;
}
.no-perm-text {
  font-size: 28rpx;
  color: #888780;
}

.tab-bar {
  display: flex;
  background: #fff;
  position: sticky;
  top: 0;
  z-index: 10;
  border-bottom: 1rpx solid #f0f0f0;
}
.tab-item {
  flex: 1;
  text-align: center;
  padding: 26rpx 0;
  font-size: 30rpx;
  color: #5F5E5A;
  position: relative;
}
.tab-item.active {
  color: #185FA5;
  font-weight: 600;
}
.tab-item.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 56rpx;
  height: 6rpx;
  border-radius: 3rpx;
  background: #185FA5;
}

.content {
  padding: 20rpx;
}
.add-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20rpx;
}
.add-hint {
  font-size: 24rpx;
  color: #888780;
}
.add-btn {
  width: 200rpx;
  height: 68rpx;
  line-height: 68rpx;
  background: #185FA5;
  color: #fff;
  font-size: 26rpx;
  border-radius: 12rpx;
  border: none;
  margin: 0;
}
.add-btn::after {
  border: none;
}

.loading-tip,
.empty-tip {
  text-align: center;
  color: #888780;
  font-size: 26rpx;
  padding: 60rpx 0;
}

.member-card,
.team-card {
  background: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 20rpx;
}
.member-main,
.team-main {
  display: flex;
  align-items: center;
}
.avatar {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.avatar-text {
  color: #fff;
  font-size: 32rpx;
  font-weight: 600;
}
.member-info,
.team-info {
  flex: 1;
  margin-left: 20rpx;
  min-width: 0;
}
.member-name-row,
.team-name-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10rpx;
}
.member-name,
.team-name {
  font-size: 30rpx;
  font-weight: 600;
  color: #2C2C2A;
}
.role-chip {
  font-size: 20rpx;
  color: #185FA5;
  background: #E8F1FA;
  border-radius: 8rpx;
  padding: 4rpx 12rpx;
}
.team-chip {
  font-size: 20rpx;
  color: #9C6F00;
  background: #FFF7E0;
  border-radius: 8rpx;
  padding: 4rpx 12rpx;
}
.disabled-chip {
  font-size: 20rpx;
  color: #999;
  background: #f0f0f0;
  border-radius: 8rpx;
  padding: 4rpx 12rpx;
}
.member-sub,
.team-remark {
  display: block;
  font-size: 22rpx;
  color: #888780;
  margin-top: 8rpx;
}
.team-count {
  font-size: 22rpx;
  color: #52A8E8;
  background: #E8F1FA;
  border-radius: 8rpx;
  padding: 4rpx 12rpx;
}
.team-avatar {
  font-size: 48rpx;
  width: 80rpx;
  height: 80rpx;
  background: #F2F7FC;
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.member-actions {
  display: flex;
  justify-content: flex-end;
  gap: 40rpx;
  margin-top: 16rpx;
  padding-top: 16rpx;
  border-top: 1rpx solid #f5f5f5;
}
.action-edit {
  font-size: 26rpx;
  color: #185FA5;
}
.action-del {
  font-size: 26rpx;
  color: #E64340;
}

/* ===== 弹层 ===== */
.overlay {
  position: fixed;
  inset: 0;
  z-index: 100;
}
.overlay-mask {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
}
.overlay-panel {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  background: #fff;
  border-radius: 24rpx 24rpx 0 0;
  padding: 32rpx 30rpx calc(40rpx + env(safe-area-inset-bottom));
  max-height: 80vh;
  overflow-y: auto;
}
.panel-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #2C2C2A;
  margin-bottom: 24rpx;
}
.field {
  display: flex;
  align-items: center;
  padding: 22rpx 0;
  border-bottom: 1rpx solid #f0f0f0;
}
.field-label {
  width: 160rpx;
  font-size: 28rpx;
  color: #2C2C2A;
  flex-shrink: 0;
}
.field-input {
  flex: 1;
  font-size: 28rpx;
  color: #333;
}
.ph {
  color: #B4B2A9;
}
.picker-value {
  font-size: 28rpx;
  color: #333;
  padding: 10rpx 0;
}
.panel-actions {
  display: flex;
  gap: 20rpx;
  margin-top: 36rpx;
}
.btn-cancel {
  flex: 1;
  height: 84rpx;
  line-height: 84rpx;
  background: #f5f5f5;
  color: #5F5E5A;
  font-size: 30rpx;
  border-radius: 12rpx;
  border: none;
}
.btn-cancel::after {
  border: none;
}
.btn-save {
  flex: 1;
  height: 84rpx;
  line-height: 84rpx;
  background: #185FA5;
  color: #fff;
  font-size: 30rpx;
  border-radius: 12rpx;
  border: none;
}
.btn-save::after {
  border: none;
}
</style>
