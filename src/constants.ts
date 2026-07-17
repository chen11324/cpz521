import type { PrivacySettings, SocialProvider, SocialStage } from './types';

export const API_BASE = 'http://localhost:8787/api';
export const STORAGE_KEY = 'empathy-circle.state';

export const coverImages = [
  '/images/cover-sunrise.svg',
  '/images/cover-sea.svg',
  '/images/cover-film.svg',
];

export const momentImages = [
  '/images/moment-1.svg',
  '/images/moment-2.svg',
  '/images/moment-3.svg',
  '/images/moment-4.svg',
];

export const themes = [
  { name: '晨光', className: 'theme-sunrise' },
  { name: '海盐', className: 'theme-sea' },
  { name: '胶片', className: 'theme-film' },
];

export const defaultPrivacy: PrivacySettings = { anonymousDefault: true, allowPeerMatch: true, localAuditLog: true };

export const agentProfiles = [
  { name: '暖声', role: '情绪陪伴', focus: '先承接情绪，再给出稳定感' },
  { name: '镜面', role: '价值澄清', focus: '帮助用户看见自己的需求和边界' },
  { name: '行动灯', role: '行动支持', focus: '给出低压力、可执行的下一步' },
];

export const circleProfiles = [
  { name: '下班后缓冲区', members: 1284, match: '职场压力、关系边界、恢复能量' },
  { name: '城市迁移互助', members: 736, match: '换城市、独立生活、家庭沟通' },
  { name: '深夜小事收纳所', members: 2190, match: '匿名倾诉、轻量陪伴、睡前回应' },
];

export const socialFlows: Record<SocialProvider, { stage: SocialStage; title: string; detail: string; action: string; accent: string }> = {
  '微信': { stage: '扫码确认', title: '微信开放平台扫码登录', detail: '使用微信客户端扫描二维码，确认后回到网页绑定手机号。', action: '刷新微信二维码', accent: '#18794e' },
  'QQ': { stage: '扫码确认', title: 'QQ 互联扫码登录', detail: '使用手机 QQ 扫码或在已登录 QQ 环境中授权头像昵称。', action: '刷新 QQ 二维码', accent: '#1f67b1' },
  'Apple': { stage: 'Apple 授权', title: 'Sign in with Apple', detail: '通过 Apple ID、Face ID/Touch ID 或双重认证码完成授权。', action: '继续 Apple 授权', accent: '#202725' },
};

export const demoCredentials = [
  { username: 'user', password: 'User@123', role: '用户' as const },
  { username: 'reviewer', password: 'Review@123', role: '内容审核员' as const },
  { username: 'operator', password: 'Operate@123', role: '运营管理员' as const },
  { username: 'superadmin', password: 'Admin@123', role: '最高管理员' as const },
];

export const permissionRows = [
  { role: '用户', scope: '发布动态、匿名展示、同频互动、举报内容' },
  { role: '内容审核员', scope: '处理人工审核队列，不能查看账号权限和 AI 密钥' },
  { role: '运营管理员', scope: '审核内容、查看账号权限和安全事件，不能配置 AI 密钥' },
  { role: '最高管理员', scope: '全部后台权限，包含 DeepSeek API 配置和连通测试' },
];
