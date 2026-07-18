import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle, Bell, BellRing, Bot, Camera, BadgeCheck, CheckCircle2, ChevronLeft,
  EyeOff, Flame, Heart, HeartHandshake, Home, ImagePlus, LockKeyhole, LogOut,
  Menu, MessageCircle, Moon, Radio, RefreshCw, Search, Send, ShieldCheck, SmilePlus,
  Sparkles, Sun, ThumbsUp, User, UserRoundCheck, UsersRound, Volume2, VolumeX, X, XCircle,
} from 'lucide-react';
import type { ActiveView, AppState, Post, PrivacySettings, Reply, ReviewStatus, SessionUser, Visibility } from '../types';
import { agentProfiles, circleProfiles, coverImages, STORAGE_KEY, themes } from '../constants';
import { generateAiReplies, generatePeerReplies, moderateText, avatarFor, imageFor, readCachedState, initialState } from '../utils';
import { ConfirmDialog } from './ConfirmDialog';
import { api } from '../api';

type Props = { user: SessionUser; onLogout: () => void };

export function SocialApp({ user, onLogout }: Props) {
  const [state, setState] = useState<AppState>(() => readCachedState());
  const [activeView, setActiveView] = useState<ActiveView>('广场');
  const [themeIndex, setThemeIndex] = useState(0);
  const [customCover, setCustomCover] = useState<string | null>(() => localStorage.getItem('empathy-circle.cover'));
  const [visibility, setVisibility] = useState<Visibility>(state.privacy.anonymousDefault ? '匿名' : '实名');
  const [draft, setDraft] = useState('');
  const [bio, setBio] = useState(() => localStorage.getItem('empathy-circle.bio') || '在这里慢慢记录真实生活，也允许自己偶尔匿名。');
  const [joinedCircles, setJoinedCircles] = useState<string[]>(() => JSON.parse(localStorage.getItem('empathy-circle.circles') || '[]'));
  const [selectedAgentName, setSelectedAgentName] = useState(agentProfiles[0].name);
  const [agentPrompt, setAgentPrompt] = useState('我今天有点累，但又说不清楚为什么。');
  const [agentDialog, setAgentDialog] = useState<Reply[]>([]);
  const [showCommentsFor, setShowCommentsFor] = useState<number | null>(null);
  const [commentDraft, setCommentDraft] = useState('');
  const [draftImageName, setDraftImageName] = useState('');
  const [draftImagePreview, setDraftImagePreview] = useState('');
  const [selectedPostId, setSelectedPostId] = useState(1);
  const [likedPostIds, setLikedPostIds] = useState<number[]>(() => JSON.parse(localStorage.getItem('empathy-circle.liked-posts') || '[]'));
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<{ id: number; type: string; icon: string; color: string; title: string; body: string; time: string; read: boolean }[]>([]);
  const [notifyOpen, setNotifyOpen] = useState(false);
  const [detailPost, setDetailPost] = useState<Post | null>(null);
  const [refreshPulling, setRefreshPulling] = useState(false);
  const [draftMood, setDraftMood] = useState('');
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('empathy-circle.dark') === '1');
  const [soundOn, setSoundOn] = useState(() => localStorage.getItem('empathy-circle.sound') !== '0');
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const moodOptions = ['被看见','有点疲惫','开心','焦虑','平静','感恩','孤独','充满希望','纠结','愤怒'];
  const unreadCount = notifications.filter((n) => !n.read).length;
  const [feedSearch, setFeedSearch] = useState('');
  const [feedMood, setFeedMood] = useState<string | null>(null);
  const [feedFilter, setFeedFilter] = useState<'全部' | '已通过' | '需复核'>('全部');
  const [confirmAction, setConfirmAction] = useState<{ title: string; message: string; action: () => void } | null>(null);
  const [notice, setNotice] = useState('正在连接本地 API 服务...');
  const [apiOnline, setApiOnline] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const draftImageRef = useRef<HTMLInputElement>(null);
  const { posts, reviewTasks, securityEvents, privacy } = state;
  const selectedPost = posts.find((post) => post.id === selectedPostId) ?? posts[0];
  const personalPosts = posts.filter((post) => post.author === '我' || post.author.startsWith('匿名用户'));
  const scopedPosts = activeView === '空间' ? personalPosts : posts;
  const visiblePosts = scopedPosts.filter((post) => feedFilter === '全部' || post.review === feedFilter);
  const selectedAgent = agentProfiles.find((agent) => agent.name === selectedAgentName) ?? agentProfiles[0];
  const visibleMoods = [...new Set(scopedPosts.map((post) => post.mood).filter(Boolean))].slice(0, 8);
  const reviewSummary = useMemo(() => ({ total: posts.length, pending: reviewTasks.filter((task) => task.status === '待处理').length, blocked: posts.filter((post) => post.review === '已拦截').length }), [posts, reviewTasks]);

  useEffect(() => { const savedDark = localStorage.getItem('empathy-circle.dark') === '1'; if (savedDark) { setDarkMode(true); document.documentElement.setAttribute('data-theme', 'dark'); } }, []);
  useEffect(() => { api<AppState>('/state').then((serverState) => { setState(serverState); setApiOnline(true); setNotice('本地 API 已连接，数据由服务端持久化'); }).catch(() => { setApiOnline(false); setNotice('API 未连接，已切换到浏览器本地模式'); }).finally(() => setTimeout(() => setLoading(false), 600)); }, []);
  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }, [state]);
  useEffect(() => { localStorage.setItem('empathy-circle.liked-posts', JSON.stringify(likedPostIds)); }, [likedPostIds]);
  useEffect(() => { document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light'); localStorage.setItem('empathy-circle.dark', darkMode ? '1' : '0'); }, [darkMode]);
  useEffect(() => { localStorage.setItem('empathy-circle.sound', soundOn ? '1' : '0'); }, [soundOn]);

  // Scroll-to-top visibility
  useEffect(() => {
    const handler = () => {
      const btn = document.querySelector('.scroll-to-top');
      if (btn) btn.classList.toggle('is-visible', window.scrollY > 400);
    };
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  // Auto-dismiss non-persistent notices after 3.5s
  useEffect(() => {
    const persistentPrefixes = ['API ???', '????', '?? API'];
    const isPersistent = persistentPrefixes.some(p => notice.startsWith(p));
    if (!notice || isPersistent) return;
    const timer = setTimeout(() => {
      const el = document.querySelector('.app-toast');
      if (el) el.classList.add('toast-out');
      setTimeout(() => setNotice(''), 300);
    }, 3500);
    return () => clearTimeout(timer);
  }, [notice]);


  function applyLocalPost(content: string) {
    const moderation = moderateText(content);
    const postId = Date.now();
    const post: Post = {
      id: postId,
      author: visibility === '匿名' ? `匿名用户 ${Math.floor(1000 + Math.random() * 9000)}` : '我',
      visibility,
      image: draftImagePreview || undefined,
      text: content,
      time: '刚刚',
      likes: 0,
      reports: 0,
      aiReplies: moderation.review === '已拦截' ? [] : generateAiReplies(content),
      peerReplies: moderation.review === '已通过' && privacy.allowPeerMatch ? generatePeerReplies(moderation.topic) : [],
      ...moderation,
    };
    const nextState = { ...state, posts: [post, ...posts] };
    if (moderation.review !== '已通过') {
      nextState.reviewTasks = [{ id: postId + 1, postId, label: moderation.review === '已拦截' ? '违规拦截' : '人工复核', reason: moderation.reason, risk: moderation.risk, status: '待处理' }, ...reviewTasks];
      nextState.securityEvents = [{ id: postId + 2, label: moderation.review, detail: moderation.reason, level: moderation.review === '已拦截' ? '拦截' : '警告' }, ...securityEvents];
    }
    setState(nextState);
    setDraftImageName(''); setDraftImagePreview(''); setSelectedPostId(postId);
    setNotice(moderation.review === '已拦截' ? '内容已被本地风控拦截' : '发布成功，本地 AI 回声已生成');
  }

  async function submitPost() {
    const content = draft.trim(); if (!content) return; playSound('post'); addNotification('post', '✏️', '#2e7c86', '发布成功', '你的动态已通过审核，同频用户和 AI 已生成回应');
    setDraft('');
    try {
      const serverState = await api<AppState>('/posts', { method: 'POST', body: JSON.stringify({ text: content, visibility }) });
      const nextPosts = draftImagePreview && serverState.posts[0] ? [{ ...serverState.posts[0], image: draftImagePreview }, ...serverState.posts.slice(1)] : serverState.posts;
      setState({ ...serverState, posts: nextPosts }); setSelectedPostId(serverState.posts[0]?.id ?? selectedPostId); setApiOnline(true);
      setNotice('发布成功，服务端已完成审核与反馈生成');
      setDraftImageName(''); setDraftImagePreview('');
    } catch { setApiOnline(false); applyLocalPost(content); }
  }

  async function handleReview(taskId: number, status: ReviewStatus) {
    try {
      setState(await api<AppState>(`/review-tasks/${taskId}`, { method: 'PATCH', body: JSON.stringify({ status }) }));
      setApiOnline(true);
    } catch {
      const task = reviewTasks.find((item) => item.id === taskId);
      if (!task) return;
      setState({ ...state, reviewTasks: reviewTasks.map((item) => (item.id === taskId ? { ...item, status } : item)),
        posts: posts.map((post) => {
          if (post.id !== task.postId) return post;
          if (status === '已通过') return { ...post, review: '已通过', risk: Math.min(post.risk, 18), peerReplies: privacy.allowPeerMatch ? generatePeerReplies(post.topic) : [] };
          if (status === '已拒绝') return { ...post, review: '已拦截', risk: Math.max(post.risk, 80), peerReplies: [] };
          return { ...post, review: '需复核', risk: Math.max(post.risk, 55) };
        }) });
    }
    setNotice(`审核任务已更新为：${status}`);
  }

  function requestReport(postId: number) {
    setConfirmAction({ title: '??????', message: '????????????????????????', action: () => reportPost(postId) });
  }

  async function reportPost(postId: number) {
    try { setState(await api<AppState>('/reports', { method: 'POST', body: JSON.stringify({ postId }) })); setApiOnline(true); }
    catch {
      setState({ ...state, posts: posts.map((post) => (post.id === postId ? { ...post, reports: post.reports + 1, review: '需复核' } : post)),
        reviewTasks: [{ id: Date.now(), postId, label: '用户举报', reason: '用户提交举报，等待人工复核', risk: 48, status: '待处理' }, ...reviewTasks] });
    }
    setNotice('举报已进入人工审核队列');
  }

  async function updatePrivacy(nextPrivacy: Partial<PrivacySettings>) {
    if (nextPrivacy.anonymousDefault !== undefined) setVisibility(nextPrivacy.anonymousDefault ? '匿名' : '实名');
    try { setState(await api<AppState>('/privacy', { method: 'PATCH', body: JSON.stringify(nextPrivacy) })); setApiOnline(true); }
    catch { setState({ ...state, privacy: { ...privacy, ...nextPrivacy } }); }
    setNotice('隐私设置已更新');
  }

  async function simulateDefense() {
    try { setState(await api<AppState>('/security/simulate', { method: 'POST' })); setApiOnline(true); }
    catch { setState({ ...state, securityEvents: [{ id: Date.now(), label: 'DDoS 流量拦截', detail: '模拟 1200 次异常请求，触发 IP 限流和 WAF 挑战', level: '拦截' }, ...securityEvents] }); }
    setNotice('安全网关已模拟拦截异常流量');
  }

  async function likePost(postId = selectedPost.id) {
    if (likedPostIds.includes(postId)) {
      setSelectedPostId(postId);
      setNotice('你已经认可过这条动态了，感谢这份回应');
      return;
    }
    try { setState(await api<AppState>('/likes', { method: 'POST', body: JSON.stringify({ postId }) })); setApiOnline(true); }
    catch { setState({ ...state, posts: posts.map((post) => (post.id === postId ? { ...post, likes: post.likes + 1 } : post)) }); }
    setLikedPostIds((current) => [...current, postId]);
    setSelectedPostId(postId);
    setNotice('已认可这条动态，你的反馈会被温柔送达');
  }

  function toggleComments(postId: number) {
    setSelectedPostId(postId);
    setShowCommentsFor((current) => (current === postId ? null : postId));
    setNotice(showCommentsFor === postId ? '已收起评论区' : '已展开评论区，可补充同频回应');
  }

  function usePrompt(prompt: string) {
    setDraft(prompt);
    setNotice('已填入一条表达灵感，可以继续修改后发布');
  }

  function clearDraftImage() {
    setDraftImageName('');
    setDraftImagePreview('');
    setNotice('已移除配图');
  }

  function addPeerComment(postId: number) {
    const content = commentDraft.trim();
    if (!content) return setNotice('请先输入评论内容');
    const reply: Reply = { id: Date.now(), author: '我', role: '同频用户', text: content };
    setState({ ...state, posts: posts.map((post) => (post.id === postId ? { ...post, peerReplies: [reply, ...post.peerReplies] } : post)) });
    setCommentDraft(''); setNotice('同频回应已发布');
    playSound('notify'); addNotification('comment', '💬', '#5f6448', '收到同频回应', '有人回复了你的动态');
  }

  function attachDraftImage(file: File | undefined) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => { setDraftImageName(file.name); setDraftImagePreview(String(reader.result)); setNotice(`已选择配图：${file.name}`); };
    reader.readAsDataURL(file);
  }

  async function clearLocalData() {
    localStorage.removeItem(STORAGE_KEY);
    try { setState(await api<AppState>('/state', { method: 'DELETE' })); setApiOnline(true); }
    catch { setState(initialState()); }
    setSelectedPostId(1); setVisibility('匿名'); setLikedPostIds([]);
    setNotice('数据已清除并恢复默认状态');
  }

  function exportAuditData() {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url; link.download = 'empathy-circle-audit-export.json';
    link.click(); URL.revokeObjectURL(url);
    setNotice('审核与风控数据已导出');
  }

  function changeCover(file: File | undefined) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const nextCover = String(reader.result);
      setCustomCover(nextCover);
      localStorage.setItem('empathy-circle.cover', nextCover);
      setNotice('个性化背景已更新');
    };
    reader.readAsDataURL(file);
  }

  function joinCircle(circleName: string) {
    setJoinedCircles((current) => {
      const next = current.includes(circleName) ? current : [...current, circleName];
      localStorage.setItem('empathy-circle.circles', JSON.stringify(next));
      return next;
    });
    setNotice(`已加入：${circleName}，后续动态会优先匹配该圈层`);
  }

  function saveBio() { localStorage.setItem('empathy-circle.bio', bio); setNotice('空间签名已保存'); }

  function addNotification(type: string, icon: string, color: string, title: string, body: string) {
    setNotifications((prev: any) => [{ id: Date.now(), type, icon, color, title, body, time: '刚刚', read: false }, ...prev].slice(0, 20));
  }
  function markAllRead() { setNotifications((prev) => prev.map((n) => ({ ...n, read: true }))); }
  function handleRefresh() { setRefreshPulling(true); setTimeout(() => { setRefreshPulling(false); setNotice('动态已刷新'); }, 900); }
  function openPostDetail(post: Post) { setDetailPost(post); setSelectedPostId(post.id); }

  const moodChart = useMemo(() => {
    const counts: Record<string, number> = {};
    moodOptions.forEach(m => { counts[m] = 0; });
    posts.forEach(p => { if (counts[p.mood] !== undefined) counts[p.mood]++; });
    const max = Math.max(1, ...Object.values(counts));
    return moodOptions.filter(m => counts[m] > 0).map(m => ({ mood: m, count: counts[m], pct: Math.round((counts[m] / max) * 100) })).sort((a, b) => b.count - a.count).slice(0, 5);
  }, [posts]);

  function playSound(type: string) {
    if (!soundOn) return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      if (type === 'click') { osc.frequency.value = 800; gain.gain.value = 0.05; osc.start(); osc.stop(ctx.currentTime + 0.04); }
      else if (type === 'like') { osc.frequency.value = 520; gain.gain.value = 0.06; osc.type = 'sine'; osc.start(); osc.frequency.linearRampToValueAtTime(780, ctx.currentTime + 0.08); osc.stop(ctx.currentTime + 0.1); }
      else if (type === 'post') { osc.frequency.value = 440; gain.gain.value = 0.04; osc.type = 'triangle'; osc.start(); osc.frequency.linearRampToValueAtTime(660, ctx.currentTime + 0.12); osc.stop(ctx.currentTime + 0.15); }
      else if (type === 'notify') { osc.frequency.value = 660; gain.gain.value = 0.05; osc.type = 'sine'; osc.start(); osc.stop(ctx.currentTime + 0.06); setTimeout(() => { const o2 = ctx.createOscillator(); const g2 = ctx.createGain(); o2.connect(g2); g2.connect(ctx.destination); o2.frequency.value = 880; g2.gain.value = 0.06; o2.type = 'sine'; o2.start(); o2.stop(ctx.currentTime + 0.08); }, 70); }
    } catch (_) { /* audio not available */ }
  }

  function askAgent() {
    const content = agentPrompt.trim();
    if (!content) return;
    const replies = generateAiReplies(content);
    const reply = replies[agentProfiles.findIndex((agent) => agent.name === selectedAgent.name)] ?? replies[0];
    const nextReply = { ...reply, id: Date.now(), author: selectedAgent.name };
    setAgentDialog((current) => [nextReply, ...current].slice(0, 6));
    setNotice(`${selectedAgent.name} 已生成一条新的情绪反馈`);
  }

  function pickTheme(index: number) {
    setThemeIndex(index);
    setNotice(`空间装扮已切换为：${themes[index].name}`);
  }



  return (
    <main className={`app-shell social-shell ${themes[themeIndex].className}`}>
      <aside className="sidebar social-sidebar" aria-label="主导航">
        <div className="brand"><span className="brand-mark"><HeartHandshake size={22} /></span><div><strong>同频回声</strong><small>Empathy Circle</small></div></div>
        <nav className="nav-list">{(['广场', '空间', '智能体', '审核'] as ActiveView[]).map((view) => <button className={`nav-item ${activeView === view ? 'active' : ''}`} key={view} onClick={() => setActiveView(view)}>{view === '广场' && <MessageCircle size={18} />}{view === '空间' && <UsersRound size={18} />}{view === '智能体' && <Bot size={18} />}{view === '审核' && <ShieldCheck size={18} />}<span>{view}</span></button>)}</nav>
        <div className="mood-chart" style={{ padding: "0 4px", marginBottom: 10 }}>
              <span style={{ color: "var(--muted)", fontSize: 12, fontWeight: 800, display: "block", marginBottom: 8 }}>心情分布</span>
              {moodChart.length === 0 ? <span style={{ color: "var(--muted)", fontSize: 12 }}>暂无数据</span> : moodChart.map(item => (
                <div className="mood-bar-row" key={item.mood}>
                  <span className="mood-bar-label">{item.mood}</span>
                  <div className="mood-bar-track"><div className="mood-bar-fill" style={{ width: item.pct + "%" }} /></div>
                  <span className="mood-bar-count">{item.count}</span>
                </div>
              ))}
            </div>
            <div className="theme-panel"><span>空间装扮</span><div>{themes.map((theme, index) => <button className={`theme-dot ${theme.className} ${themeIndex === index ? 'picked' : ''}`} key={theme.name} title={theme.name} onClick={() => pickTheme(index)} />)}</div></div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 4 }}>
              <button className="dark-mode-toggle" onClick={() => setDarkMode(!darkMode)} title={darkMode ? "切换到日间模式" : "切换到暗色模式"}>{darkMode ? <Sun size={17} /> : <Moon size={17} />}</button>
              <button className="sound-toggle" onClick={() => setSoundOn(!soundOn)} title={soundOn ? "关闭音效" : "开启音效"}>{soundOn ? <Volume2 size={16} /> : <VolumeX size={16} />}<span>{soundOn ? "音效开" : "音效关"}</span></button>
            </div>
            <div className="privacy-box"><LockKeyhole size={20} /><p>{user.name} · {user.phone}<br />匿名身份、人工复核和攻击防护已开启。</p><button className="text-action logout-action" onClick={onLogout}><LogOut size={16} />退出登录</button></div>
      </aside>

      <section className="feed-panel social-feed">
        <header className="space-hero">
          <img src={customCover ?? coverImages[themeIndex]} alt="个人空间封面" />
          <div className="space-gradient" />
          <div className="space-owner"><div className="large-avatar">{visibility === '匿名' ? '匿' : '我'}</div><div><p>{apiOnline ? 'API 在线 · ' : '本地模式 · '}{notice}</p><h1>{user.name}的回声空间</h1><span>今天想被理解的事，可以先放在这里。</span></div></div>
          <input ref={coverInputRef} className="cover-input" type="file" accept="image/*" onChange={(event) => changeCover(event.target.files?.[0])} />
          <button className="cover-tool" onClick={() => coverInputRef.current?.click()}><Camera size={17} />更换封面</button>
        </header>

        {activeView === '广场' && <>
          <section className="composer social-composer" aria-label="发布动态">
            <div className="composer-avatar">{visibility === '匿名' ? '匿' : '我'}</div>
            <div className="composer-body">
              <div className="composer-head"><div className="segmented"><button className={visibility === '匿名' ? 'selected' : ''} onClick={() => setVisibility('匿名')}><EyeOff size={16} />匿名</button><button className={visibility === '实名' ? 'selected' : ''} onClick={() => setVisibility('实名')}><UserRoundCheck size={16} />实名</button></div><span className="review-chip"><ShieldCheck size={15} />实时审核</span></div>
              <div className="prompt-chips"><span>不知道从哪里说起？</span><button type="button" onClick={() => usePrompt('今天让我想慢下来的一件小事是……')}>慢下来</button><button type="button" onClick={() => usePrompt('我想谢谢今天那个认真听我说话的人。')}>说谢谢</button><button type="button" onClick={() => usePrompt('此刻我最想被理解的是……')}>被理解</button></div>
              <textarea value={draft} maxLength={280} onChange={(event) => setDraft(event.target.value)} placeholder="这一刻想记录什么？" rows={3} />
              <div className="composer-status"><span className={draft.length > 240 ? 'text-near-limit' : ''}>{draft.length}/280</span><span>{visibility === '匿名' ? '匿名身份已隔离' : '将以实名身份发布'}</span></div>
              <input ref={draftImageRef} className="cover-input" type="file" accept="image/*" onChange={(event) => attachDraftImage(event.target.files?.[0])} />
              {draftImagePreview && <div className="draft-preview"><img src={draftImagePreview} alt="待发布配图预览" /><div><strong>{draftImageName || '已选择配图'}</strong><button type="button" onClick={clearDraftImage}><XCircle size={15} />移除</button></div></div>}
              <div className="composer-actions"><div className="hint-list"><button className="mini-action" onClick={() => draftImageRef.current?.click()}><ImagePlus size={14} />{draftImageName || '配图'}</button><span>同频可见</span><span>AI 回声</span></div><button className="primary-button" disabled={!draft.trim()} onClick={submitPost}><Send size={17} />{draft.trim() ? '发布回声' : '写点什么吧'}</button></div>
            </div>
          </section>
          <div className="feed-search-box"><Search size={15} /><input type="search" value={feedSearch} onChange={(e) => setFeedSearch(e.target.value)} placeholder="???????????" aria-label="????" />{feedSearch && <button type="button" className="feed-search-clear" onClick={() => setFeedSearch("")} aria-label="????">×</button>}</div>
          <div className={`pull-indicator${refreshPulling ? " pulling" : ""}`}>
                <RefreshCw size={15} className="spin-icon" /><span>正在刷新...</span>
              </div>
              <section className="feed-toolbar" aria-label="动态筛选"><div><span>今日回声</span><strong>{visiblePosts.length} 条正在发生</strong></div><div className="feed-filters">{(['全部', '已通过', '需复核'] as const).map((filter) => <button type="button" key={filter} className={feedFilter === filter ? 'active' : ''} onClick={() => setFeedFilter(filter)}>{filter}</button>)}</div>{visibleMoods.length > 1 && <div className="feed-mood-chips">{visibleMoods.map((mood) => <button type="button" key={mood} className={feedMood === mood ? "active" : ""} onClick={() => setFeedMood(feedMood === mood ? null : mood)}>{mood}{feedMood === mood ? " ×" : ""}</button>)}</div>}</section>
          <section className="moments-list" aria-label="朋友圈动态">
            {loading ? Array.from({ length: 3 }).map((_, i) => (
                <div className="skeleton-card" key={`sk-${i}`}>
                  <div className="skeleton skeleton-avatar" />
                  <div className="skeleton-body">
                    <div className="skeleton skeleton-line wide" />
                    <div className="skeleton skeleton-line medium" />
                    <div className="skeleton skeleton-line short" />
                  </div>
                </div>
              )) : visiblePosts.length === 0 ? (
                <div className="no-results">
                  <Search size={40} /><p>没有匹配的动态<br />试试调整筛选条件</p>
                </div>
              ) : visiblePosts.map((post) => (
              <article className={`moment-card ${post.id === selectedPostId ? 'focused' : ''}`} key={post.id} style={{ "--card-delay": visiblePosts.findIndex(p => p.id === post.id) } as React.CSSProperties} onClick={() => setSelectedPostId(post.id)}>
                <div className="moment-avatar">{avatarFor(post.author)}</div>
                <div className="moment-main">
                  <div className="moment-head"><div><strong>{post.author}</strong><span>{post.visibility} · {post.time}</span></div><span className={`state ${post.review === '已拦截' ? 'blocked' : post.review === '需复核' ? 'warning' : 'ok'}`}>{post.review}{post.risk > 40 && ` · ${post.risk}`}</span></div>
                  <p>{post.text}</p>
                  <img className="moment-image" src={imageFor(post)} alt="" loading="lazy" onClick={(e) => { e.stopPropagation(); setLightboxImage(imageFor(post)); }} />
                  <div className="moment-meta"><span>{post.mood} · {post.topic}</span><button onClick={(e) => { e.stopPropagation(); toggleComments(post.id); }}><MessageCircle size={14} />{post.peerReplies.length}</button><div className="emoji-reactions">{["👍","❤️","😊","😢","🔥"].map(emoji => (<button key={emoji} className="emoji-btn" onClick={(e) => { e.stopPropagation(); if (emoji === "👍") { likePost(post.id); playSound("like"); } else { addNotification("emoji", emoji, "#5f6448", "表情回应", emoji + " 回应了动态"); playSound("like"); } }}>{emoji}</button>))}</div></div>
                </div>
              </article>
            ))}
            {!visiblePosts.length && <p className="empty-state">暂无动态，发布第一条吧。</p>}
          </section>
          {showCommentsFor !== null && (
            <section className="comments-panel" aria-label="评论区">
              <h3>同频回应</h3>
              {(() => { const post = posts.find((p) => p.id === showCommentsFor); if (!post) return <p className="empty-state">动态已不存在</p>; return <>{post.peerReplies.map((reply) => <div className="comment-line" key={reply.id}><strong>{reply.author}</strong><span>{reply.role}</span><p>{reply.text}</p></div>)}<div className="comment-composer"><input value={commentDraft} onChange={(e) => setCommentDraft(e.target.value)} placeholder="写下你的回应..." onKeyDown={(e) => e.key === 'Enter' && addPeerComment(post.id)} /><button onClick={() => addPeerComment(post.id)}><Send size={14} /></button></div></>; })()}
            </section>
          )}
        </>}

        {activeView === '空间' && <section className="space-section"><div className="space-bio"><h3>个人签名</h3><textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} /><button className="mini-action" onClick={saveBio}>保存</button></div><div className="circle-grid"><h3>同频圈层</h3>{circleProfiles.map((circle) => <button key={circle.name} className={`circle-card ${joinedCircles.includes(circle.name) ? 'joined' : ''}`} onClick={() => joinCircle(circle.name)}><strong>{circle.name}</strong><span>{circle.members} 人</span><small>{circle.match}</small></button>)}</div></section>}

        {activeView === '智能体' && <section className="agent-section"><div className="agent-tabs">{agentProfiles.map((agent) => <button key={agent.name} className={selectedAgentName === agent.name ? 'active' : ''} onClick={() => setSelectedAgentName(agent.name)}><Bot size={16} />{agent.name} · {agent.role}</button>)}</div><div className="agent-chat"><div className="agent-context"><strong>{selectedAgent.name}</strong><small>{selectedAgent.role} · {selectedAgent.focus}</small></div>{agentDialog.map((reply) => <div key={reply.id} className="agent-bubble"><p>{reply.text}</p></div>)}<div className="agent-input"><input value={agentPrompt} onChange={(e) => setAgentPrompt(e.target.value)} placeholder="写下你的感受..." onKeyDown={(e) => e.key === 'Enter' && askAgent()} /><button onClick={askAgent}><Send size={14} /></button></div></div></section>}

        {activeView === '审核' && <section className="review-section"><h3>审核队列 ({reviewTasks.length})</h3>{reviewTasks.map((task) => <article key={task.id} className="review-task"><div className="risk-badge">{task.risk}</div><div><strong>{task.label}</strong><p>{task.reason}</p><small>动态 #{task.postId} · {task.status}</small></div><div className="review-buttons"><button onClick={() => handleReview(task.id, '已通过')}>通过</button><button onClick={() => handleReview(task.id, '已拒绝')}>拒绝</button><button onClick={() => handleReview(task.id, '已升级')}>升级</button></div></article>)}</section>}
      </section>

      <aside className="insight-panel social-insight" aria-label="反馈和审核">
        <section className="profile-card"><img src={coverImages[(themeIndex + 1) % coverImages.length]} alt="空间小封面" /><div className="profile-avatar">{visibility === '匿名' ? '匿' : '我'}</div><h2>私人情绪花园</h2><p>只给同频的人和温和的 AI 看见。</p></section>
        <section className="metric-grid"><div><strong>{reviewSummary.total}</strong><span>动态</span></div><div><strong>{reviewSummary.pending}</strong><span>待审</span></div><div><strong>{reviewSummary.blocked}</strong><span>拦截</span></div></section>
        <section className="ai-card"><div className="section-title"><Sparkles size={18} /><h2>当前回声</h2></div><p className="quote">{selectedPost?.text}</p>{selectedPost?.aiReplies?.length ? selectedPost.aiReplies.map((reply) => <div className="agent-line" key={reply.id}><span><Bot size={16} />{reply.author}</span><small>{reply.role}</small><p>{reply.text}</p></div>) : <p className="empty-state">高风险内容已暂停 AI 评论，等待人工处理。</p>}</section>
        <section className="review-card"><div className="section-title"><ShieldCheck size={18} /><h2>安全看板</h2></div>{securityEvents.map((event) => <div className={`review-row ${event.level === '拦截' ? 'blocked' : event.level === '警告' ? 'warning' : 'care'}`} key={event.id}><span>{event.label}</span><strong>{event.level}</strong></div>)}<div className="security-strip"><Flame size={17} /> WAF/CDN 抵御 DDoS、限流、设备指纹和传输加密保持不变。</div></section>
        <section className="review-card"><div className="section-title"><LockKeyhole size={18} /><h2>隐私控制</h2></div><label className="toggle-row"><input type="checkbox" checked={privacy.anonymousDefault} onChange={(event) => updatePrivacy({ anonymousDefault: event.target.checked })} /><span>默认匿名发布</span></label><label className="toggle-row"><input type="checkbox" checked={privacy.allowPeerMatch} onChange={(event) => updatePrivacy({ allowPeerMatch: event.target.checked })} /><span>允许同频推荐</span></label><label className="toggle-row"><input type="checkbox" checked={privacy.localAuditLog} onChange={(event) => updatePrivacy({ localAuditLog: event.target.checked })} /><span>保留审核记录</span></label><div className="button-row"><button className="secondary-button" onClick={exportAuditData}>导出数据</button><button className="danger-button" onClick={clearLocalData}>清除数据</button></div></section>
        <button className="floating-action" onClick={simulateDefense}><Radio size={18} />模拟防护</button><button className="secondary-button wide" onClick={() => likePost()}><ThumbsUp size={18} />认可当前动态</button>
      </aside>
      <button className="scroll-to-top" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} aria-label="????"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"/></svg></button>
      {confirmAction && <ConfirmDialog title={confirmAction.title} message={confirmAction.message} onConfirm={() => { confirmAction.action(); setConfirmAction(null); }} onCancel={() => setConfirmAction(null)} />}
      <div className="mobile-nav">
            <nav>
              <button className={activeView === '广场' ? 'active' : ''} onClick={() => setActiveView('广场')}><Home size={20} />广场</button>
              <button className={activeView === '空间' ? 'active' : ''} onClick={() => setActiveView('空间')}><User size={20} />空间</button>
              <button className={activeView === '智能体' ? 'active' : ''} onClick={() => setActiveView('智能体')}><Bot size={20} />AI</button>
              <button onClick={() => setNotifyOpen(true)}>
                <div className="notification-bell-wrap"><Bell size={20} />{unreadCount > 0 && <span className="badge">{unreadCount}</span>}</div>
              </button>
            </nav>
          </div>
          {notifyOpen && (<><div className="notify-drawer-overlay" onClick={() => setNotifyOpen(false)} /><div className="notify-drawer"><div className="notify-drawer-header"><h2>通知中心</h2>{unreadCount > 0 && <button onClick={markAllRead}>全部已读</button>}</div>{notifications.length === 0 ? (<div className="notify-drawer-empty"><Bell size={32} /><p>暂无通知</p></div>) : (<div className="notify-list">{notifications.map((n) => (<div key={n.id} className={`notify-item${n.read ? "" : " unread"}`} onClick={() => setNotifications((prev) => prev.map((nt) => nt.id === n.id ? { ...nt, read: true } : nt))}><div className="notify-dot" style={{ background: n.color }}>{n.icon}</div><div className="notify-item-body"><strong>{n.title}</strong><p>{n.body}</p><small>{n.time}</small></div></div>))}</div>)}</div></>)}
          {detailPost && (<div className="post-detail-overlay" onClick={() => setDetailPost(null)}><div className="post-detail-card" onClick={e => e.stopPropagation()}><button className="post-detail-close" onClick={() => setDetailPost(null)}><X size={18} /></button><div className="post-detail-scroll"><div className="post-detail-header"><div className="moment-avatar">{detailPost.author.slice(0, 2)}</div><div><strong>{detailPost.author}</strong><span>{detailPost.visibility} · {detailPost.time}</span></div></div><p className="post-detail-text">{detailPost.text}</p>{detailPost.image && <img className="post-detail-image" src={detailPost.image} alt="" />}<div className="post-detail-meta"><span><ThumbsUp size={14} />{detailPost.likes} 认可</span><span><MessageCircle size={14} />{detailPost.peerReplies.length} 评论</span><span>{detailPost.mood} · {detailPost.topic}</span></div><div className="comments-panel"><h3>AI 回声</h3>{detailPost.aiReplies.map((r: Reply) => (<div className="comment-line" key={r.id}><strong>{r.author} <span>AI · {r.role}</span></strong><p>{r.text}</p></div>))}<h3 style={{ marginTop: 16 }}>同频回应 ({detailPost.peerReplies.length})</h3>{detailPost.peerReplies.map((r: Reply) => (<div className="comment-line" key={r.id}><strong>{r.author} <span>{r.role}</span></strong><p>{r.text}</p></div>))}</div></div></div></div>)}
          {lightboxImage && (<div className="image-lightbox-overlay" onClick={() => setLightboxImage(null)}><button className="lightbox-close" onClick={() => setLightboxImage(null)}><X size={20} /></button><img src={lightboxImage} alt="" onClick={e => e.stopPropagation()} /></div>)}
          {notice && <div className="app-toast" role="status"><Sparkles size={16} /><span>{notice}</span></div>}
    </main>
  );
}
