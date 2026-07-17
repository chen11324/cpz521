export type Visibility = '匿名' | '实名';
export type ReviewState = '已通过' | '需复核' | '已拦截';
export type ReviewStatus = '待处理' | '已通过' | '已拒绝' | '已升级';
export type ActiveView = '广场' | '空间' | '智能体' | '审核';
export type Role = '用户' | '内容审核员' | '运营管理员' | '最高管理员';

export type SessionUser = { id: string; username: string; name: string; role: Role; phone: string };
export type Account = SessionUser;
export type SocialProvider = '微信' | 'QQ' | 'Apple';
export type SocialStage = '扫码确认' | 'App 授权' | 'Apple 授权';
export type AiSettings = { provider: string; endpoint: string; model: string; apiKeyMasked: string; enabled: boolean };
export type AiTestResult = { ok: boolean; mode: string; message: string; content?: string; reply?: string; analysis?: { review: ReviewState; risk: number; topic: string; mood: string; reason: string } };
export type QRCodePayload = { label: string; url: string; image: string };

export type Reply = { id: number; author: string; role: 'AI' | '同频用户'; text: string };
export type Post = {
  id: number;
  author: string;
  visibility: Visibility;
  image?: string;
  mood: string;
  text: string;
  topic: string;
  time: string;
  review: ReviewState;
  risk: number;
  likes: number;
  reports: number;
  aiReplies: Reply[];
  peerReplies: Reply[];
};
export type ReviewTask = { id: number; postId: number; label: string; reason: string; risk: number; status: ReviewStatus };
export type SecurityEvent = { id: number; label: string; detail: string; level: '正常' | '警告' | '拦截' };
export type PrivacySettings = { anonymousDefault: boolean; allowPeerMatch: boolean; localAuditLog: boolean };
export type AppState = { posts: Post[]; reviewTasks: ReviewTask[]; securityEvents: SecurityEvent[]; privacy: PrivacySettings };
