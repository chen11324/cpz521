import { createServer } from 'node:http';
import { mkdir } from 'node:fs/promises';
import { DatabaseSync } from 'node:sqlite';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', 'data');
const DB_FILE = join(DATA_DIR, 'empathy-circle.sqlite');
const PORT = Number(process.env.API_PORT ?? 8787);
const demoAccounts = [
  { id: 'u-1001', username: 'user', password: 'User@123', name: '林屿', role: '用户', phone: '138****2210' },
  { id: 'a-3001', username: 'reviewer', password: 'Review@123', name: '周审核', role: '内容审核员', phone: '139****3051' },
  { id: 'a-2001', username: 'operator', password: 'Operate@123', name: '许运营', role: '运营管理员', phone: '137****6628' },
  { id: 'a-1001', username: 'superadmin', password: 'Admin@123', name: '系统管理员', role: '最高管理员', phone: '136****8801' },
];

// === RBAC role auth ===
function resolveRoleFromRequest(request) {
  const auth = (request.headers.authorization ?? '').trim();
  if (!auth) return null;
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : auth;
  if (!token.startsWith('demo-')) return null;
  const parts = token.split('-');
  if (parts.length < 3) return null;
  const accountId = parts[1] + '-' + parts[2];
  const account = demoAccounts.find((a) => a.id === accountId);
  return account ? account.role : null;
}

const ROLE_LEVEL = { '最高管理员': 4, '运营管理员': 3, '内容审核员': 2, '用户': 1 };

function requireRole(request, response, minRole) {
  const role = resolveRoleFromRequest(request);
  if (!role) { send(response, 401, { error: '请先登录' }); return false; }
  if ((ROLE_LEVEL[role] ?? 0) < (ROLE_LEVEL[minRole] ?? 0)) {
    send(response, 403, { error: '权限不足：你的角色无权访问此功能' });
    return false;
  }
  return true;
}

await mkdir(DATA_DIR, { recursive: true });
const db = new DatabaseSync(DB_FILE);
let lastId = Date.now();
let runtimeAiApiKey = process.env.DEEPSEEK_API_KEY ?? '';

const defaultPrivacy = { anonymousDefault: true, allowPeerMatch: true, localAuditLog: true };
const agentProfiles = [
  { name: '暖声', role: '情绪陪伴' },
  { name: '镜面', role: '价值澄清' },
  { name: '行动灯', role: '行动支持' },
];
const seedPosts = [
  {
    id: 1,
    author: '匿名用户 2048',
    visibility: '匿名',
    mood: '有点疲惫',
    text: '今天把一个拖了很久的项目交付了，明明应该开心，但回家路上突然觉得很空。',
    topic: '职场压力',
    time: '刚刚',
    review: '已通过',
    risk: 8,
    likes: 42,
    reports: 0,
  },
  {
    id: 2,
    author: 'Luna',
    visibility: '实名',
    mood: '被看见',
    text: '第一次主动跟朋友说我最近状态不好，对方没有评价，只是陪我散步。原来讲出来没有那么可怕。',
    topic: '关系支持',
    time: '12 分钟前',
    review: '已通过',
    risk: 4,
    likes: 66,
    reports: 0,
  },
  {
    id: 3,
    author: '匿名用户 7193',
    visibility: '匿名',
    mood: '纠结',
    text: '想换城市生活，但又怕家里人不理解。希望有类似经历的人说说真实感受。',
    topic: '人生选择',
    time: '38 分钟前',
    review: '需复核',
    risk: 22,
    likes: 18,
    reports: 1,
  },
];

function reserveIds(count) {
  const startId = Math.max(lastId + 1, Date.now());
  lastId = startId + count - 1;
  return startId;
}

function nowId() {
  return reserveIds(1);
}

function toBool(value) {
  return Boolean(value);
}

function toInt(value) {
  return value ? 1 : 0;
}

function generateAiReplies(text) {
  const baseId = reserveIds(agentProfiles.length);
  return agentProfiles.map((agent, index) => ({
    id: baseId + index,
    author: agent.name,
    role: 'AI',
    text:
      index === 0
        ? '我读到的是一种很真实的消耗感。你愿意把它说出来，已经是在照顾自己。'
        : index === 1
          ? '这段分享里的关键词是“需要被理解”。这不是脆弱，而是你在认真确认自己的感受。'
          : '可以先做一个很小的恢复动作：喝水、离开屏幕十分钟，或写下今天最值得肯定的一件事。',
    sourceTextLength: text.length,
  }));
}

function generatePeerReplies(topic) {
  const baseId = reserveIds(3);
  return [
    `我也经历过类似的${topic}，看到你写出来会觉得不孤单。`,
    '这件事不需要马上解决，先被接住也很重要。',
    '谢谢你把真实的一面放在这里，这种表达本身很有力量。',
  ].map((text, index) => ({ id: baseId + index, author: `同频用户 ${index + 1}`, role: '同频用户', text }));
}

function moderateText(text) {
  const blockedWords = ['诈骗', '刷单', '返利', '贷款', '赌博', '违法', '加群赚钱'];
  const careWords = ['崩溃', '难受', '孤独', '焦虑', '撑不住', '不想活'];
  const linkRisk = /https?:\/\/|www\.|加微信|VX|QQ/i.test(text);
  const blockedHit = blockedWords.some((word) => text.includes(word));
  const careHit = careWords.some((word) => text.includes(word));

  if (blockedHit || linkRisk) return { review: '已拦截', risk: linkRisk ? 92 : 86, topic: '风险内容', mood: '需处理', reason: '疑似广告、诈骗、导流或违法内容' };
  if (careHit) return { review: '需复核', risk: 44, topic: '情绪支持', mood: '需要陪伴', reason: '存在强烈负面情绪或危机关键词' };
  return { review: '已通过', risk: Math.min(20, Math.max(3, Math.round(text.length / 8))), topic: '生活片段', mood: '被记录', reason: '未命中高风险规则' };
}

async function testAiService(input) {
  const settings = getAiSettings();
  const endpoint = String(input.endpoint || settings.endpoint || 'https://api.deepseek.com/v1').replace(/\/$/, '');
  const model = String(input.model || settings.model || 'deepseek-chat');
  const apiKey = String(input.apiKey || runtimeAiApiKey || process.env.DEEPSEEK_API_KEY || '');
  const sample = String(input.sample || '今天很焦虑，担心自己的状态影响工作。');

  if (!apiKey) {
    return {
      ok: false,
      mode: 'local-fallback',
      message: '未配置 DeepSeek API Key，已返回本地情绪分析与审核结果',
      analysis: moderateText(sample),
      reply: generateAiReplies(sample)[0].text,
    };
  }

  const aiResponse = await fetch(`${endpoint}/chat/completions`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      messages: [
        { role: 'system', content: '你是同频回声的情绪分析和内容审核助手。请用 JSON 返回 mood, risk, review, reason, reply。review 只能是 已通过、需复核、已拦截。' },
        { role: 'user', content: sample },
      ],
    }),
  });
  const payload = await aiResponse.json().catch(() => ({}));
  if (!aiResponse.ok) {
    return { ok: false, mode: 'deepseek', message: payload.error?.message || `DeepSeek 请求失败：${aiResponse.status}` };
  }
  return {
    ok: true,
    mode: 'deepseek',
    model,
    message: 'DeepSeek API 连接成功，已完成情绪分析与审核测试',
    content: payload.choices?.[0]?.message?.content ?? '',
  };
}

function initDb() {
  db.exec(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY,
      author TEXT NOT NULL,
      visibility TEXT NOT NULL,
      mood TEXT NOT NULL,
      text TEXT NOT NULL,
      topic TEXT NOT NULL,
      time TEXT NOT NULL,
      review TEXT NOT NULL,
      risk INTEGER NOT NULL,
      likes INTEGER NOT NULL,
      reports INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS replies (
      id INTEGER PRIMARY KEY,
      post_id INTEGER NOT NULL,
      author TEXT NOT NULL,
      role TEXT NOT NULL,
      text TEXT NOT NULL,
      source_text_length INTEGER,
      FOREIGN KEY(post_id) REFERENCES posts(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS review_tasks (
      id INTEGER PRIMARY KEY,
      post_id INTEGER NOT NULL,
      label TEXT NOT NULL,
      reason TEXT NOT NULL,
      risk INTEGER NOT NULL,
      status TEXT NOT NULL,
      FOREIGN KEY(post_id) REFERENCES posts(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS security_events (
      id INTEGER PRIMARY KEY,
      label TEXT NOT NULL,
      detail TEXT NOT NULL,
      level TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS privacy_settings (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      anonymous_default INTEGER NOT NULL,
      allow_peer_match INTEGER NOT NULL,
      local_audit_log INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS ai_settings (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      provider TEXT NOT NULL,
      endpoint TEXT NOT NULL,
      model TEXT NOT NULL,
      api_key_masked TEXT NOT NULL,
      enabled INTEGER NOT NULL
    );
  `);

  db.prepare("INSERT OR IGNORE INTO ai_settings (id, provider, endpoint, model, api_key_masked, enabled) VALUES (1, 'OpenAI Compatible', 'https://api.openai.com/v1', 'gpt-5-mini', '', 0)").run();

  const row = db.prepare('SELECT COUNT(*) AS count FROM posts').get();
  if (row.count === 0) resetStore();
}

function insertPost(post) {
  db.prepare(`
    INSERT INTO posts (id, author, visibility, mood, text, topic, time, review, risk, likes, reports)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(post.id, post.author, post.visibility, post.mood, post.text, post.topic, post.time, post.review, post.risk, post.likes, post.reports);
}

function insertReply(postId, reply) {
  db.prepare(`
    INSERT INTO replies (id, post_id, author, role, text, source_text_length)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(reply.id, postId, reply.author, reply.role, reply.text, reply.sourceTextLength ?? null);
}

function insertReviewTask(task) {
  db.prepare('INSERT INTO review_tasks (id, post_id, label, reason, risk, status) VALUES (?, ?, ?, ?, ?, ?)')
    .run(task.id, task.postId, task.label, task.reason, task.risk, task.status);
}

function insertSecurityEvent(event) {
  db.prepare('INSERT INTO security_events (id, label, detail, level) VALUES (?, ?, ?, ?)')
    .run(event.id, event.label, event.detail, event.level);
}

function resetStore() {
  db.exec('BEGIN IMMEDIATE');
  try {
    db.exec('DELETE FROM replies; DELETE FROM review_tasks; DELETE FROM security_events; DELETE FROM posts; DELETE FROM privacy_settings;');
    for (const post of seedPosts) {
      insertPost(post);
      if (post.review !== '已拦截') generateAiReplies(post.text).forEach((reply) => insertReply(post.id, reply));
      if (post.review === '已通过') generatePeerReplies(post.topic).forEach((reply) => insertReply(post.id, reply));
    }
    insertReviewTask({ id: 101, postId: 3, label: '情绪危机', reason: '需确认是否需要人工关怀', risk: 22, status: '待处理' });
    insertSecurityEvent({ id: 201, label: 'WAF 在线', detail: 'CDN、WAF、速率限制和设备指纹策略已纳入部署方案', level: '正常' });
    insertSecurityEvent({ id: 202, label: '隐私隔离', detail: '匿名展示身份与真实账号在数据模型中分离', level: '正常' });
    db.prepare('INSERT INTO privacy_settings (id, anonymous_default, allow_peer_match, local_audit_log) VALUES (1, ?, ?, ?)')
      .run(toInt(defaultPrivacy.anonymousDefault), toInt(defaultPrivacy.allowPeerMatch), toInt(defaultPrivacy.localAuditLog));
    db.exec('COMMIT');
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
  return getState();
}

function getState() {
  const posts = db.prepare('SELECT * FROM posts ORDER BY id DESC').all().map((row) => ({
    id: row.id,
    author: row.author,
    visibility: row.visibility,
    mood: row.mood,
    text: row.text,
    topic: row.topic,
    time: row.time,
    review: row.review,
    risk: row.risk,
    likes: row.likes,
    reports: row.reports,
    aiReplies: [],
    peerReplies: [],
  }));
  const replies = db.prepare('SELECT * FROM replies ORDER BY id ASC').all();
  for (const reply of replies) {
    const post = posts.find((item) => item.id === reply.post_id);
    if (!post) continue;
    const mappedReply = { id: reply.id, author: reply.author, role: reply.role, text: reply.text };
    if (reply.role === 'AI') post.aiReplies.push(mappedReply);
    else post.peerReplies.push(mappedReply);
  }
  const reviewTasks = db.prepare('SELECT id, post_id, label, reason, risk, status FROM review_tasks ORDER BY id DESC').all()
    .map((row) => ({ id: row.id, postId: row.post_id, label: row.label, reason: row.reason, risk: row.risk, status: row.status }));
  const securityEvents = db.prepare('SELECT id, label, detail, level FROM security_events ORDER BY id DESC').all();
  const privacyRow = db.prepare('SELECT * FROM privacy_settings WHERE id = 1').get() ?? { anonymous_default: 1, allow_peer_match: 1, local_audit_log: 1 };
  return {
    posts,
    reviewTasks,
    securityEvents,
    privacy: {
      anonymousDefault: toBool(privacyRow.anonymous_default),
      allowPeerMatch: toBool(privacyRow.allow_peer_match),
      localAuditLog: toBool(privacyRow.local_audit_log),
    },
  };
}

function getAiSettings() {
  const row = db.prepare('SELECT provider, endpoint, model, api_key_masked, enabled FROM ai_settings WHERE id = 1').get();
  return { provider: row.provider, endpoint: row.endpoint, model: row.model, apiKeyMasked: row.api_key_masked, enabled: toBool(row.enabled) };
}

function publicAccount(account) {
  return { id: account.id, username: account.username, name: account.name, role: account.role, phone: account.phone };
}
async function readBody(request) {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  if (!chunks.length) return {};
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

function send(response, status, payload) {
  response.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'access-control-allow-origin': '*',
    'access-control-allow-methods': 'GET,POST,PATCH,DELETE,OPTIONS',
    'access-control-allow-headers': 'content-type, authorization',
  });
  response.end(JSON.stringify(payload));
}

function updatePostAfterReview(postId, status) {
  const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(postId);
  const privacy = getState().privacy;
  if (!post) return;

  if (status === '已通过') {
    db.prepare('UPDATE posts SET review = ?, risk = ? WHERE id = ?').run('已通过', Math.min(post.risk, 18), postId);
    db.prepare("DELETE FROM replies WHERE post_id = ? AND role = '同频用户'").run(postId);
    if (privacy.allowPeerMatch) generatePeerReplies(post.topic).forEach((reply) => insertReply(postId, reply));
    return;
  }
  if (status === '已拒绝') {
    db.prepare('UPDATE posts SET review = ?, risk = ? WHERE id = ?').run('已拦截', Math.max(post.risk, 80), postId);
    db.prepare("DELETE FROM replies WHERE post_id = ? AND role = '同频用户'").run(postId);
    return;
  }
  db.prepare('UPDATE posts SET review = ?, risk = ? WHERE id = ?').run('需复核', Math.max(post.risk, 55), postId);
}

function handleCreatePost(body) {
  const text = String(body.text ?? '').trim();
  if (!text) return { status: 400, payload: { error: '内容不能为空' } };

  const state = getState();
  const moderation = moderateText(text);
  const postId = nowId();
  const post = {
    id: postId,
    author: body.visibility === '实名' ? '我' : `匿名用户 ${Math.floor(1000 + Math.random() * 9000)}`,
    visibility: body.visibility === '实名' ? '实名' : '匿名',
    text,
    time: '刚刚',
    likes: 0,
    reports: 0,
    review: moderation.review,
    risk: moderation.risk,
    topic: moderation.topic,
    mood: moderation.mood,
  };
  insertPost(post);
  if (moderation.review !== '已拦截') generateAiReplies(text).forEach((reply) => insertReply(postId, reply));
  if (moderation.review === '已通过' && state.privacy.allowPeerMatch) generatePeerReplies(moderation.topic).forEach((reply) => insertReply(postId, reply));
  if (moderation.review !== '已通过') {
    insertReviewTask({ id: nowId(), postId, label: moderation.review === '已拦截' ? '违规拦截' : '人工复核', reason: moderation.reason, risk: moderation.risk, status: '待处理' });
    insertSecurityEvent({ id: nowId(), label: moderation.review, detail: moderation.reason, level: moderation.review === '已拦截' ? '拦截' : '警告' });
  }
  return { status: 201, payload: getState() };
}

initDb();

const server = createServer(async (request, response) => {
  if (request.method === 'OPTIONS') return send(response, 204, {});

  try {
    const url = new URL(request.url ?? '/', `http://${request.headers.host}`);

    if (request.method === 'POST' && url.pathname === '/api/auth/login') {
      const body = await readBody(request);
      const account = demoAccounts.find((item) => item.username === String(body.username ?? '').trim() && item.password === String(body.password ?? ''));
      if (!account) return send(response, 401, { error: '账号或密码错误' });
      return send(response, 200, { user: publicAccount(account), token: `demo-${account.id}-${Date.now()}` });
    }

    if (request.method === 'POST' && url.pathname === '/api/auth/register') {
      const body = await readBody(request);
      const username = String(body.username ?? '').trim();
      const phone = String(body.phone ?? '').replace(/\s/g, '');
      if (!username) return send(response, 400, { error: '请输入账号或昵称' });
      if (!/^1\d{10}$/.test(phone)) return send(response, 400, { error: '请输入有效手机号' });
      return send(response, 201, { user: { id: `local-${Date.now()}`, username, name: username, role: '用户', phone: `${phone.slice(0, 3)}****${phone.slice(-4)}` }, token: `demo-register-${Date.now()}` });
    }

    if (request.method === 'POST' && url.pathname === '/api/auth/social') {
      const body = await readBody(request);
      const phone = String(body.phone ?? '').replace(/\s/g, '');
      if (!/^1\d{10}$/.test(phone)) return send(response, 400, { error: '请输入有效手机号' });
      const provider = ['微信', 'QQ', 'Apple'].includes(body.provider) ? body.provider : '第三方';
      return send(response, 200, { user: { id: `social-${Date.now()}`, username: phone, name: `${provider}用户`, role: '用户', phone: `${phone.slice(0, 3)}****${phone.slice(-4)}` }, token: `demo-social-${Date.now()}` });
    }

    if (request.method === 'GET' && url.pathname === '/api/admin/accounts') {
      if (!requireRole(request, response, '运营管理员')) return;
      return send(response, 200, { accounts: demoAccounts.map(publicAccount) });
    }
    if (request.method === 'GET' && url.pathname === '/api/admin/ai-settings') {
      if (!requireRole(request, response, '最高管理员')) return;
      return send(response, 200, getAiSettings());
    }

    if (request.method === 'PATCH' && url.pathname === '/api/admin/ai-settings') {
      if (!requireRole(request, response, '最高管理员')) return;
      const body = await readBody(request);
      const current = getAiSettings();
      if (body.apiKey) runtimeAiApiKey = String(body.apiKey);
      const apiKeyMasked = body.apiKey ? `${String(body.apiKey).slice(0, 3)}***${String(body.apiKey).slice(-4)}` : current.apiKeyMasked;
      db.prepare('UPDATE ai_settings SET provider = ?, endpoint = ?, model = ?, api_key_masked = ?, enabled = ? WHERE id = 1')
        .run(String(body.provider ?? current.provider), String(body.endpoint ?? current.endpoint), String(body.model ?? current.model), apiKeyMasked, toInt(body.enabled ?? current.enabled));
      return send(response, 200, getAiSettings());
    }

    if (request.method === 'POST' && url.pathname === '/api/admin/ai-test') {
      if (!requireRole(request, response, '最高管理员')) return;
      const result = await testAiService(await readBody(request));
      return send(response, result.ok ? 200 : 202, result);
    }
    if (request.method === 'GET' && url.pathname === '/api/state') return send(response, 200, getState());
    if (request.method === 'DELETE' && url.pathname === '/api/state') return send(response, 200, resetStore());

    if (request.method === 'POST' && url.pathname === '/api/posts') {
      const result = handleCreatePost(await readBody(request));
      return send(response, result.status, result.payload);
    }

    if (request.method === 'PATCH' && url.pathname.startsWith('/api/review-tasks/')) {
      if (!requireRole(request, response, '内容审核员')) return;
      const taskId = Number(url.pathname.split('/').at(-1));
      const body = await readBody(request);
      const task = db.prepare('SELECT post_id FROM review_tasks WHERE id = ?').get(taskId);
      db.prepare('UPDATE review_tasks SET status = ? WHERE id = ?').run(body.status, taskId);
      if (task) updatePostAfterReview(task.post_id, body.status);
      return send(response, 200, getState());
    }

    if (request.method === 'POST' && url.pathname === '/api/reports') {
      const body = await readBody(request);
      const postId = Number(body.postId);
      db.prepare('UPDATE posts SET reports = reports + 1, review = ? WHERE id = ?').run('需复核', postId);
      insertReviewTask({ id: nowId(), postId, label: '用户举报', reason: '用户提交举报，等待人工复核', risk: 48, status: '待处理' });
      return send(response, 201, getState());
    }

    if (request.method === 'POST' && url.pathname === '/api/security/simulate') {
      if (!requireRole(request, response, '运营管理员')) return;
      insertSecurityEvent({ id: nowId(), label: 'DDoS 流量拦截', detail: '模拟 1200 次异常请求，触发 IP 限流和 WAF 挑战', level: '拦截' });
      return send(response, 201, getState());
    }

    if (request.method === 'PATCH' && url.pathname === '/api/privacy') {
      const body = await readBody(request);
      const current = getState().privacy;
      const next = { ...current, ...body };
      db.prepare('UPDATE privacy_settings SET anonymous_default = ?, allow_peer_match = ?, local_audit_log = ? WHERE id = 1')
        .run(toInt(next.anonymousDefault), toInt(next.allowPeerMatch), toInt(next.localAuditLog));
      return send(response, 200, getState());
    }

    if (request.method === 'POST' && url.pathname === '/api/likes') {
      const body = await readBody(request);
      db.prepare('UPDATE posts SET likes = likes + 1 WHERE id = ?').run(Number(body.postId));
      return send(response, 200, getState());
    }

    return send(response, 404, { error: 'Not found' });
  } catch (error) {
    return send(response, 500, { error: error instanceof Error ? error.message : 'Server error' });
  }
});

server.listen(PORT, () => {
  console.log(`Empathy Circle API running at http://localhost:${PORT}`);
});
