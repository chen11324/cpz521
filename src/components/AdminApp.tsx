import { useEffect, useState } from 'react';
import {
  BadgeCheck, Bot, HeartHandshake, KeyRound, LayoutDashboard, LockKeyhole,
  LogOut, MessageCircle, Radio, RefreshCw, Settings, ShieldCheck, Sparkles, UsersRound,
} from 'lucide-react';
import type { Account, AiSettings, AiTestResult, AppState, ReviewStatus, Role, SessionUser } from '../types';
import { demoCredentials } from '../constants';
import { readCachedState } from '../utils';
import { api } from '../api';

type Props = { user: SessionUser; onLogout: () => void };

export function AdminApp({ user, onLogout }: Props) {
  const [state, setState] = useState<AppState>(() => readCachedState());
  const [section, setSection] = useState<'概述' | '内容审核' | '账号权限' | 'AI 服务'>('概述');
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [settings, setSettings] = useState<AiSettings>({
    provider: 'OpenAI Compatible', endpoint: 'https://api.openai.com/v1', model: 'gpt-5-mini', apiKeyMasked: '', enabled: false,
  });
  const [apiKey, setApiKey] = useState('');
  const [aiSample, setAiSample] = useState('今天很焦虑，担心自己的状态影响工作。');
  const [aiResult, setAiResult] = useState<AiTestResult | null>(null);
  const [notice, setNotice] = useState('管理后台已就绪');

  const canManageAccounts = user.role === '运营管理员' || user.role === '最高管理员';
  const canConfigureAi = user.role === '最高管理员';
  const canAudit = user.role === '内容审核员' || canManageAccounts;

  const healthScore = Math.max(72, 100 - state.reviewTasks.filter((task) => task.status === '待处理').length * 7 - state.posts.filter((post) => post.review === '已拦截').length * 3);

  const permissionRows = [
    { role: '用户', scope: '发布动态、匿名展示、同频互动、举报内容' },
    { role: '内容审核员', scope: '处理人工审核队列，不能查看账号权限和 AI 密钥' },
    { role: '运营管理员', scope: '审核内容、查看账号权限和安全事件，不能配置 AI 密钥' },
    { role: '最高管理员', scope: '全部后台权限，包含 DeepSeek API 配置和连通测试' },
  ];

  useEffect(() => {
    api<AppState>('/state').then(setState).catch(() => undefined);
    api<{ accounts: Account[] }>('/admin/accounts')
      .then((result) => setAccounts(result.accounts))
      .catch(() =>
        setAccounts(
          demoCredentials.map((item, index) => ({
            id: `${index}`, username: item.username, name: item.role, role: item.role as Role, phone: '138****0000',
          }))
        )
      );
    api<AiSettings>('/admin/ai-settings').then(setSettings).catch(() => undefined);
  }, []);

  async function review(taskId: number, status: ReviewStatus) {
    if (!canAudit) return setNotice('当前角色没有审核处理权限');
    try {
      setState(await api<AppState>(`/review-tasks/${taskId}`, { method: 'PATCH', body: JSON.stringify({ status }) }));
    } catch {
      setState((current) => ({
        ...current,
        reviewTasks: current.reviewTasks.map((task) => (task.id === taskId ? { ...task, status } : task)),
      }));
    }
    setNotice(`审核任务已${status}`);
  }

  async function saveAi() {
    if (!canConfigureAi) return;
    try {
      setSettings(await api<AiSettings>('/admin/ai-settings', { method: 'PATCH', body: JSON.stringify({ ...settings, apiKey }) }));
    } catch {
      setSettings((current) => ({
        ...current,
        apiKeyMasked: apiKey ? `${apiKey.slice(0, 3)}***${apiKey.slice(-4)}` : current.apiKeyMasked,
      }));
    }
    setApiKey('');
    setNotice('AI 服务配置已安全保存');
  }

  async function testAi() {
    if (!canConfigureAi) return;
    setNotice('正在测试 DeepSeek 情绪分析与审核接口...');
    try {
      const result = await api<AiTestResult>('/admin/ai-test', {
        method: 'POST',
        body: JSON.stringify({ ...settings, apiKey, sample: aiSample }),
      });
      setAiResult(result);
      setNotice(result.message);
    } catch {
      setAiResult({ ok: false, mode: 'fallback', message: 'API 不可用，使用本地规则替代' });
      setNotice('AI 连接失败，已回退本地分析');
    }
  }

  async function refreshDashboard() {
    try {
      setState(await api<AppState>('/state'));
      setNotice('后台状态已刷新，所有指标均来自当前服务端');
    } catch {
      setNotice('暂时无法刷新服务端，正在展示本地缓存');
    }
  }

  async function simulateDefense() {
    if (!canManageAccounts) return setNotice('当前角色没有发起防护演练的权限');
    try {
      setState(await api<AppState>('/security/simulate', { method: 'POST' }));
      setNotice('防护演练完成：异常流量已被网关拦截');
    } catch {
      setNotice('防护演练未连接到服务端，请稍后再试');
    }
  }

  function inspectAccount(account: Account) {
    setSelectedAccountId(account.id === selectedAccountId ? null : account.id);
    setNotice(`已选中账号 ${account.username}`);
  }

  const views = ['概述', '内容审核', '账号权限', 'AI 服务'] as const;

  return (
    <main className="admin-shell">
      <aside className="sidebar admin-sidebar" aria-label="管理导航">
        <div className="brand">
          <span className="brand-mark"><HeartHandshake size={22} /></span>
          <div><strong>同频回声</strong><small>管理后台</small></div>
        </div>
        <nav className="nav-list">
          {views.map((view) => (
            <button className={`nav-item ${section === view ? 'active' : ''}`} key={view} onClick={() => setSection(view)}>
              {view === '概述' && <LayoutDashboard size={18} />}
              {view === '内容审核' && <ShieldCheck size={18} />}
              {view === '账号权限' && <UsersRound size={18} />}
              {view === 'AI 服务' && <Bot size={18} />}
              <span>{view}</span>
            </button>
          ))}
        </nav>
        <div className="privacy-box">
          <LockKeyhole size={20} />
          <p>{user.name} · {user.role}<br />{notice}</p>
          <button className="text-action logout-action" onClick={onLogout}><LogOut size={16} />退出</button>
        </div>
      </aside>

      <section className="admin-main">
        {section === '概述' && (
          <section className="admin-panel overview">
            <div className="panel-heading admin-heading"><div><span>系统态势 · 实时同步</span><h2>安全概览</h2><p>审核、隐私隔离与网关防护正在共同守护每一次表达。</p></div><div className="overview-actions"><button type="button" onClick={refreshDashboard}><RefreshCw size={16} />刷新状态</button><button type="button" disabled={!canManageAccounts} onClick={simulateDefense}><Radio size={16} />防护演练</button></div></div>
            <section className="health-card"><div><span>系统健康度</span><strong>{healthScore}%</strong><small>内容审核、权限隔离与网关策略运行正常</small></div><div className="health-ring" style={{ background: 'conic-gradient(var(--accent) ' + healthScore + '%, #edf0eb 0)' }}><span>{healthScore}</span></div></section>
            <div className="metric-grid admin-metrics">
              <div><strong>{state.posts.length}</strong><span>动态</span></div>
              <div><strong>{state.reviewTasks.length}</strong><span>审核队列</span></div>
              <div><strong>{state.securityEvents.length}</strong><span>安全事件</span></div>
            </div>
            <section className="event-list">
              {state.securityEvents.map((event) => (
                <article key={event.id} className={`event-row ${event.level === '拦截' ? 'blocked' : event.level === '警告' ? 'warning' : ''}`}>
                  <strong>{event.label}</strong><span>{event.level}</span><p>{event.detail}</p>
                </article>
              ))}
            </section>
          </section>
        )}

        {section === '内容审核' && (
          <section className="admin-panel review-queue">
            <div className="panel-heading"><h2>审核队列</h2><span>{canAudit ? `${state.reviewTasks.length} 条任务` : '只读模式'}</span></div>
            {state.reviewTasks.map((task) => (
              <article key={task.id}>
                <div className="risk-score">{task.risk}</div>
                <div><strong>{task.label}</strong><p>{task.reason}</p><small>动态 #{task.postId} · {task.status}</small></div>
                <div className="review-actions">
                  <button disabled={!canAudit} onClick={() => review(task.id, '已通过')}>通过</button>
                  <button disabled={!canAudit} onClick={() => review(task.id, '已拒绝')}>拒绝</button>
                  <button disabled={!canAudit} onClick={() => review(task.id, '已升级')}>升级</button>
                </div>
              </article>
            ))}
          </section>
        )}

        {section === '账号权限' && (
          <section className="admin-panel account-table">
            <div className="panel-heading"><h2>分级管理员与演示账号</h2><span>{selectedAccountId ? `已选中账号 ${selectedAccountId}` : '权限按角色隔离'}</span></div>
            {accounts.map((account) => (
              <article className={selectedAccountId === account.id ? 'selected-account' : ''} key={account.id}>
                <div className="account-avatar">{account.name.slice(0, 1)}</div>
                <div><strong>{account.name}</strong><small>{account.username} · {account.phone}</small></div>
                <span className={`role-badge role-${account.role}`}>{account.role}</span>
                <button title="权限设置" disabled={user.role !== '最高管理员'} onClick={() => inspectAccount(account)}><KeyRound size={17} /></button>
              </article>
            ))}
            <div className="permission-grid">
              {permissionRows.map((item) => (
                <article className={accounts.find((account) => account.id === selectedAccountId)?.role === item.role ? 'selected-permission' : ''} key={item.role}>
                  <strong>{item.role}</strong><p>{item.scope}</p>
                </article>
              ))}
            </div>
          </section>
        )}

        {section === 'AI 服务' && (
          <section className="admin-panel ai-settings">
            <div className="panel-heading"><div><h2>DeepSeek API 接口</h2><p>密钥仅以掩码显示，测试会调用 OpenAI Compatible chat/completions 接口。</p></div><label className="switch"><input type="checkbox" checked={settings.enabled} onChange={(event) => setSettings({ ...settings, enabled: event.target.checked })} /><span /></label></div>
            <div className="settings-grid">
              <label>服务商<input value={settings.provider} onChange={(event) => setSettings({ ...settings, provider: event.target.value })} /></label>
              <label>模型<input value={settings.model} onChange={(event) => setSettings({ ...settings, model: event.target.value })} placeholder="deepseek-chat" /></label>
              <label className="wide-field">接口地址<input value={settings.endpoint} onChange={(event) => setSettings({ ...settings, endpoint: event.target.value })} placeholder="https://api.deepseek.com/v1" /></label>
              <label className="wide-field">API Key<input type="password" value={apiKey} onChange={(event) => setApiKey(event.target.value)} placeholder={settings.apiKeyMasked || '输入新的 API Key'} /></label>
              <label className="wide-field">测试文本<input value={aiSample} onChange={(event) => setAiSample(event.target.value)} /></label>
            </div>
            <div className="settings-actions">
              <button className="save-settings" onClick={saveAi}><Settings size={17} />保存配置</button>
              <button className="test-settings" onClick={testAi}><Bot size={17} />测试分析审核</button>
            </div>
            {aiResult && <div className="ai-result"><strong>{aiResult.message}</strong><p>{aiResult.content || aiResult.reply || aiResult.analysis?.reason}</p>{aiResult.analysis && <small>{aiResult.analysis.review} · 风险 {aiResult.analysis.risk} · {aiResult.analysis.mood}</small>}</div>}
          </section>
        )}
      </section>
      {notice && <div className="app-toast admin-toast" role="status"><Sparkles size={16} /><span>{notice}</span></div>}
    </main>
  );
}