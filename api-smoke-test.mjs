const API_BASE = 'http://localhost:8787/api';
let authToken = '';

async function request(path, init) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { 'content-type': 'application/json', ...(authToken ? { authorization: `Bearer ${authToken}` } : {}), ...(init?.headers ?? {}) },
  });
  if (!response.ok) throw new Error(`${init?.method ?? 'GET'} ${path} failed with ${response.status}`);
  return response.json();
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const reset = await request('/state', { method: 'DELETE' });
assert(reset.posts.length >= 3, 'reset should include seed posts');
assert(reset.reviewTasks.length >= 1, 'reset should include moderation queue');
assert(reset.securityEvents.length >= 2, 'reset should include security events');

const login = await request('/auth/login', { method: 'POST', body: JSON.stringify({ username: 'superadmin', password: 'Admin@123' }) });
authToken = login.token;
assert(login.user.role === '最高管理员', 'super admin login should return highest role');

const socialLogin = await request('/auth/social', { method: 'POST', body: JSON.stringify({ provider: '微信', phone: '13800138000' }) });
assert(socialLogin.user.role === '用户', 'social login should create user role');

const accounts = await request('/admin/accounts');
assert(accounts.accounts.length === 4, 'admin accounts should be listed');

const aiSettings = await request('/admin/ai-settings', { method: 'PATCH', body: JSON.stringify({ model: 'gpt-5-mini', enabled: true, apiKey: 'sk-demo-12345678' }) });
assert(aiSettings.enabled === true, 'AI settings should update');
assert(aiSettings.apiKeyMasked.includes('***'), 'AI key should be masked');

const approved = await request('/posts', {
  method: 'POST',
  body: JSON.stringify({ visibility: '\u533f\u540d', text: '\u4eca\u5929\u7ec8\u4e8e\u628a\u538b\u5728\u5fc3\u91cc\u7684\u4e8b\u60c5\u8bf4\u51fa\u6765\u4e86\uff0c\u611f\u89c9\u8f7b\u4e86\u4e00\u70b9\u3002' }),
});
const approvedPost = approved.posts.find((post) => post.text.includes('\u611f\u89c9\u8f7b\u4e86\u4e00\u70b9'));
assert(Boolean(approvedPost), 'normal post should be returned');
assert(approvedPost.risk < 30, 'normal post should have low risk');
assert(approvedPost.aiReplies.length === 3, 'normal post should generate AI replies');
assert(approvedPost.peerReplies.length === 3, 'normal post should generate peer replies');

const blocked = await request('/posts', {
  method: 'POST',
  body: JSON.stringify({ visibility: '\u533f\u540d', text: '\u52a0\u5fae\u4fe1\u9886\u53d6\u8fd4\u5229\uff0c\u5237\u5355\u8d5a\u94b1\uff0chttp://example.com' }),
});
const blockedPost = blocked.posts.find((post) => post.text.includes('http://example.com'));
assert(Boolean(blockedPost), 'risky post should be returned');
assert(blockedPost.risk >= 80, 'risky post should have high risk');
assert(blockedPost.aiReplies.length === 0, 'blocked post should not generate AI replies');
assert(blocked.reviewTasks.some((task) => task.postId === blockedPost.id), 'blocked post should create review task');

const reported = await request('/reports', { method: 'POST', body: JSON.stringify({ postId: approvedPost.id }) });
assert(reported.reviewTasks.length > approved.reviewTasks.length, 'report should create moderation task');

const pendingTask = reported.reviewTasks.find((task) => task.status !== '\u5df2\u901a\u8fc7' && task.status !== '\u5df2\u62d2\u7edd');
assert(Boolean(pendingTask), 'there should be a pending-like task');
const reviewed = await request(`/review-tasks/${pendingTask.id}`, { method: 'PATCH', body: JSON.stringify({ status: '\u5df2\u901a\u8fc7' }) });
assert(reviewed.reviewTasks.some((task) => task.id === pendingTask.id && task.status === '\u5df2\u901a\u8fc7'), 'review task should update status');

const privacy = await request('/privacy', { method: 'PATCH', body: JSON.stringify({ allowPeerMatch: false }) });
assert(privacy.privacy.allowPeerMatch === false, 'privacy settings should update');

const security = await request('/security/simulate', { method: 'POST' });
assert(security.securityEvents.length > privacy.securityEvents.length, 'security simulation should add event');

const targetBeforeLike = reviewed.posts.find((post) => post.id === blockedPost.id) ?? reviewed.posts[0];
const liked = await request('/likes', { method: 'POST', body: JSON.stringify({ postId: targetBeforeLike.id }) });
const targetAfterLike = liked.posts.find((post) => post.id === targetBeforeLike.id);
assert(targetAfterLike.likes > targetBeforeLike.likes, 'like should increment count');

console.log('API smoke test passed');
