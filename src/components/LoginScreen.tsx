import { useState } from 'react';
import QRCode from 'qrcode';
import {
  BadgeCheck,
  Bot,
  HeartHandshake,
  LockKeyhole,
  LogIn,
  MonitorSmartphone,
  QrCode,
  ShieldCheck,
  Smartphone,
  UserPlus,
} from 'lucide-react';
import type { QRCodePayload, SessionUser, SocialProvider, SocialStage } from '../types';
import { demoCredentials, socialFlows, STORAGE_KEY } from '../constants';
import { api } from '../api';

type Props = { onLogin: (user: SessionUser) => void };

export function LoginScreen({ onLogin }: Props) {
  const [mode, setMode] = useState<'登录' | '注册'>('登录');
  const [username, setUsername] = useState('user');
  const [password, setPassword] = useState('User@123');
  const [phone, setPhone] = useState('');
  const [nickname, setNickname] = useState('');
  const [socialProvider, setSocialProvider] = useState<SocialProvider | null>(null);
  const [socialStage, setSocialStage] = useState<SocialStage>('扫码确认');
  const [qrPayload, setQrPayload] = useState<QRCodePayload | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [qrNotice, setQrNotice] = useState('');

  const forceLoginPreview = new URLSearchParams(window.location.search).has('login');
  const loginCopy = mode === '登录' ? '分享生活，获得同频回响。' : '创建你的回声身份，开启同频世界。';

  async function accountSubmit() {
    if (mode === '注册') {
      if (!/^1\d{10}$/.test(phone)) return setMessage('注册需要填写有效手机号');
      try {
        const result = await api<{ user: SessionUser; token: string }>('/auth/register', {
          method: 'POST',
          body: JSON.stringify({ username: username || phone, name: nickname || username || phone, phone }),
        });
        localStorage.setItem('empathy-circle.session', result.token);
      onLogin(result.user);
      } catch {
        onLogin({
          id: `local-${Date.now()}`,
          username: username || phone,
          name: nickname || username || '新用户',
          role: '用户',
          phone: `${phone.slice(0, 3)}****${phone.slice(-4)}`,
        });
      }
      return;
    }
    try {
      const result = await api<{ user: SessionUser; token: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      });
      localStorage.setItem('empathy-circle.session', result.token);
      onLogin(result.user);
    } catch {
      const local = demoCredentials.find(
        (item) => item.username === username && item.password === password
      );
      if (!local) return setMessage('账号或密码错误，请使用下方演示账号');
      onLogin({
        id: username,
        username,
        name: local.role === '用户' ? '林屿' : local.role,
        role: local.role,
        phone: '138****2210',
      });
    }
  }

  async function socialSubmit() {
    if (!socialProvider) return;
    if (!/^1\d{10}$/.test(phone)) return setMessage('第三方登录必须绑定有效手机号');
    try {
      const result = await api<{ user: SessionUser; token: string }>('/auth/social', {
        method: 'POST',
        body: JSON.stringify({ provider: socialProvider, phone }),
      });
      localStorage.setItem('empathy-circle.session', result.token);
      onLogin(result.user);
    } catch {
      onLogin({
        id: `social-${Date.now()}`,
        username: phone,
        name: `${socialProvider}用户`,
        role: '用户',
        phone: `${phone.slice(0, 3)}****${phone.slice(-4)}`,
      });
    }
  }

  function openSocial(provider: SocialProvider) {
    const flow = socialFlows[provider];
    setSocialProvider(provider);
    setSocialStage(flow.stage);
    setQrNotice(
      provider === 'Apple'
        ? '请使用 Apple ID 完成 Face ID / Touch ID 授权'
        : '请用手机扫描二维码继续登录'
    );
    setMessage(`${flow.title} 已就绪，授权后请绑定手机号`);
    void (async () => {
      const url =
        provider === '微信'
          ? 'https://open.weixin.qq.com/connect/qrconnect?appid=empathy-circle-demo&redirect_uri=https%3A%2F%2Fexample.com%2Fwechat&response_type=code&scope=snsapi_login&state=empathy-circle'
          : provider === 'QQ'
            ? 'https://graph.qq.com/oauth2.0/show?client_id=empathy-circle-demo&redirect_uri=https%3A%2F%2Fexample.com%2Fqq&response_type=code&scope=get_user_info&state=empathy-circle'
            : 'https://appleid.apple.com/auth/authorize?client_id=empathy.circle.demo&redirect_uri=https%3A%2F%2Fexample.com%2Fapple&response_type=code&scope=name%20email&response_mode=form_post&state=empathy-circle';
      const image = await QRCode.toDataURL(url, { margin: 1, width: 260, errorCorrectionLevel: 'M' });
      setQrPayload({ label: provider, url, image });
    })().catch(() => setQrPayload(null));
  }

  const socialFlow = socialProvider ? socialFlows[socialProvider] : null;

  return (
    <main className={`auth-shell auth-${mode === '登录' ? 'login' : 'register'}`}>
      <section className="auth-story">
        <div className="auth-brand">
          <span className="brand-mark"><HeartHandshake size={24} /></span>
          <strong>同频回声</strong>
        </div>
        <div className="auth-copy">
          <span>{mode === '登录' ? '登录 / 授权' : '注册 / 绑定'}</span>
          <h1>{mode === '登录' ? '欢迎回来' : '加入同频'}</h1>
          <p>{loginCopy}</p>
        </div>
        <div className="auth-proof">
          <div><ShieldCheck size={20} /><span>实时内容审核</span></div>
          <div><Bot size={20} /><span>多智能体情绪反馈</span></div>
          <div><LockKeyhole size={20} /><span>匿名身份隔离</span></div>
        </div>
        <div className="auth-flow-strip">
          <article className={mode === '登录' ? 'active' : ''}>
            <strong>登录</strong><span>旧账号直接进入</span>
          </article>
          <article className={mode === '注册' ? 'active' : ''}>
            <strong>注册</strong><span>新账号先绑定</span>
          </article>
        </div>
      </section>

      <section className="auth-panel">
        <div className="auth-card">
          <div className="auth-layout">
            <article className={`auth-pane login-pane ${mode === '登录' ? 'active' : ''}`} onClick={() => setMode('登录')}>
              <span>登录入口</span>
              <strong>微信 / QQ / Apple / 密码</strong>
              <small>已有账号直接进入；后台账号也从这里登录。</small>
              <label className="field-label">
                账号或昵称
                <input value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" />
              </label>
              <label className="field-label">
                密码
                <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" />
              </label>
              <button className="auth-primary login-button" onClick={accountSubmit}>
                <LogIn size={18} />登录并进入
              </button>
            </article>
            <article className={`auth-pane register-pane ${mode === '注册' ? 'active' : ''}`} onClick={() => setMode('注册')}>
              <span>注册入口</span>
              <strong>昵称 + 手机号 + 授权</strong>
              <small>新用户先注册，再进入同频内容区和个人空间。</small>
              <label className="field-label">
                显示昵称
                <input value={nickname} onChange={(event) => setNickname(event.target.value)} placeholder="例如：林屿" />
              </label>
              <label className="field-label">
                绑定手机号
                <input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="11 位手机号" inputMode="tel" />
              </label>
              <button className="auth-primary register-button" onClick={accountSubmit}>
                <UserPlus size={18} />注册并绑定
              </button>
            </article>
          </div>
          <div className="auth-version-badge">
            <BadgeCheck size={15} />登录页 v5 · 真二维码 · 双入口{forceLoginPreview ? ' · 强制预览' : ''}
          </div>
          <div className="auth-banner">
            <span>{mode === '登录' ? '已有账号' : '新用户'}</span>
            <strong>{mode === '登录' ? '直接进入内容与后台' : '先完成绑定，再开始表达'}</strong>
          </div>
          <p className="phone-rule">
            <Smartphone size={15} />账号、微信、QQ、Apple 登录均需完成手机号绑定；管理员登录成功后直接进入后台。
          </p>
          <button
            className="reset-session"
            onClick={() => {
              localStorage.removeItem('empathy-circle.session');
              localStorage.removeItem(STORAGE_KEY);
              setMessage('已清除旧会话和缓存数据，请重新登录体验');
            }}
          >
            清除旧会话缓存
          </button>
          <div className="auth-divider"><span>其他登录方式</span></div>
          <div className="social-login">
            <button onClick={() => openSocial('微信')}><QrCode size={16} />微信扫码</button>
            <button onClick={() => openSocial('QQ')}><QrCode size={16} />QQ 扫码</button>
            <button onClick={() => openSocial('Apple')}><BadgeCheck size={16} />Apple 授权</button>
          </div>
          {socialProvider && socialFlow && (
            <div className="phone-bind">
              <div className="social-bind-head">
                <strong>{socialFlow.title}</strong>
                <button
                  onClick={() => {
                    setSocialStage(
                      socialProvider === 'Apple' ? 'Apple 授权' : socialStage === '扫码确认' ? 'App 授权' : '扫码确认'
                    );
                    setQrNotice('二维码已刷新，可重新扫码');
                  }}
                >
                  {socialProvider === 'Apple' ? '重新授权' : socialStage === '扫码确认' ? '切换 App 授权' : '返回扫码'}
                </button>
              </div>
              <p>{socialFlow.detail}</p>
              {qrNotice && <p className="qr-notice">{qrNotice}</p>}
              {qrPayload ? (
                socialStage === '扫码确认' ? (
                  <div className="qr-card real-qr">
                    <h3>{qrPayload.label} 扫码确认</h3>
                    <img src={qrPayload.image} alt={`${qrPayload.label} 二维码`} />
                    <button type="button" className="tiny-link" onClick={() => {
                      setQrNotice('二维码已重新生成');
                      setSocialProvider(socialProvider);
                      setSocialStage('扫码确认');
                    }}>
                      刷新二维码
                    </button>
                    <button type="button" className="tiny-link" onClick={() => window.open(qrPayload.url, '_blank', 'noopener,noreferrer')}>
                      打开授权地址
                    </button>
                  </div>
                ) : (
                  <div className="app-auth-card">
                    <MonitorSmartphone size={28} />
                    <strong>{socialStage}</strong>
                    <small>{socialFlow.detail}</small>
                    <button onClick={() => {
                      setMessage(`${socialProvider} 已完成授权确认，请绑定手机号`);
                      setQrNotice('扫码成功，继续绑定手机号');
                    }}>
                      {socialFlow.action}
                    </button>
                  </div>
                )
              ) : null}
              <input
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="输入手机号完成绑定"
                inputMode="tel"
              />
              <button onClick={socialSubmit}><Smartphone size={17} />绑定手机号并进入</button>
            </div>
          )}
          {message && <div className="auth-message">{message}</div>}
          <details className="demo-accounts">
            <summary>查看演示账号</summary>
            {demoCredentials.map((item) => (
              <button
                key={item.username}
                onClick={() => {
                  setMode('登录');
                  setUsername(item.username);
                  setPassword(item.password);
                  setMessage(`已填入${item.role}账号`);
                }}
              >
                <span>{item.role}</span>
                <code>{item.username} / {item.password}</code>
              </button>
            ))}
          </details>
        </div>
      </section>
    </main>
  );
}