import type { AppState, Post, Reply, ReviewState } from './types';
import { agentProfiles, defaultPrivacy, momentImages, STORAGE_KEY } from './constants';

let lastGeneratedId = 0;

function reserveIds(count: number): number {
  const startId = Math.max(lastGeneratedId + 1, Date.now());
  lastGeneratedId = startId + count - 1;
  return startId;
}

export function generateAiReplies(text: string): Reply[] {
  const baseId = reserveIds(agentProfiles.length);
  return agentProfiles.map((agent, index) => ({
    id: baseId + index,
    author: agent.name,
    role: 'AI' as const,
    text:
      index === 0
        ? '我读到的是一种很真实的消耗感。你愿意把它说出来，已经是在照顾自己。'
        : index === 1
          ? '这段分享里的关键词是"需要被理解"。这不是脆弱，而是你在认真确认自己的感受。'
          : '可以先做一个很小的恢复动作：喝水、离开屏幕十分钟，或写下今天最值得肯定的一件事。',
  }));
}

export function generatePeerReplies(topic: string): Reply[] {
  const baseId = reserveIds(3);
  return [
    `我也经历过类似的${topic}，看到你写出来会觉得不孤单。`,
    '这件事不需要马上解决，先被接住也很重要。',
    '谢谢你把真实的一面放在这里，这种表达本身很有力量。',
  ].map((text, index) => ({ id: baseId + index, author: `同频用户 ${index + 1}`, role: '同频用户' as const, text }));
}

export function moderateText(text: string): { review: ReviewState; risk: number; topic: string; mood: string; reason: string } {
  const blockedWords = ['诈骗', '刷单', '返利', '贷款', '赌博', '违法', '加群赚钱'];
  const careWords = ['崩溃', '难受', '孤独', '焦虑', '撑不住', '不想活'];
  const linkRisk = /https?:\/\/|www\.|加微信|VX|QQ/i.test(text);
  const blockedHit = blockedWords.some((word) => text.includes(word));
  const careHit = careWords.some((word) => text.includes(word));
  if (blockedHit || linkRisk) return { review: '已拦截', risk: linkRisk ? 92 : 86, topic: '风险内容', mood: '需处理', reason: '疑似广告、诈骗、导流或违法内容' };
  if (careHit) return { review: '需复核', risk: 44, topic: '情绪支持', mood: '需要陪伴', reason: '存在强烈负面情绪或危机关键词' };
  return { review: '已通过', risk: Math.min(20, Math.max(3, Math.round(text.length / 8))), topic: '生活片段', mood: '被记录', reason: '未命中高风险规则' };
}

export function avatarFor(name: string): string {
  if (name.includes('Luna')) return 'LU';
  if (name.includes('我')) return 'ME';
  return name.match(/\d+/)?.[0]?.slice(-2) ?? '匿';
}

export function imageFor(post: Post): string {
  if (post.image) return post.image;
  return momentImages[Math.abs(post.id) % momentImages.length];
}

export function initialState(): AppState {
  return {
    posts: [],
    reviewTasks: [],
    securityEvents: [
      { id: 1, label: 'WAF 初始化', detail: 'Web Application Firewall 已启用', level: '正常' },
      { id: 2, label: 'CDN 加速', detail: '内容分发网络已配置', level: '正常' },
    ],
    privacy: defaultPrivacy,
  };
}

export function readCachedState(): AppState {
  try {
    const cached = localStorage.getItem(STORAGE_KEY);
    return cached ? (JSON.parse(cached) as AppState) : initialState();
  } catch {
    return initialState();
  }
}
