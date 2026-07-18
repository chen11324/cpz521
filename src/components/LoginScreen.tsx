import { useState } from 'react';
import QRCode from 'qrcode';
import {
  BadgeCheck,
  HeartHandshake,
  LogIn,
  MonitorSmartphone,
  QrCode,
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
  const loginCopy = mode === '登录' ? '把此刻的情绪放在这里，让真诚的回应慢慢抵达。' : '从一个昵称开始，为自己留下一处安心表达的角落。';

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
        <div className="auth-story-main">
          <div className="auth-copy">
            <span>一个更轻松的表达空间</span>
            <h1>{mode === '登录' ? '把心事，放进温柔的回响里。' : '从一句真心话，遇见同频的人。'}</h1>
            <p>{loginCopy}</p>
          </div>
          <div className="auth-echo-scene" aria-hidden="true">
            <i className="echo-ring echo-ring-one" />
            <i className="echo-ring echo-ring-two" />
            <i className="echo-dot echo-dot-one" />
            <i className="echo-dot echo-dot-two" />
            <div className="echo-core"><HeartHandshake size={34} /></div>
          </div>
        </div>
      </section>

      <section className="auth-panel">
        <div className="auth-card">
          <div className="auth-panel-header">
            <span>回声正在等你</span>
            <h2>{mode === '登录' ? '欢迎回来' : '创建你的回声身份'}</h2>
            <p>{mode === '登录' ? '继续你的同频时刻，看看今天有哪些温柔回应。' : '填写简单信息，开始记录与分享你的此刻。'}</p>
          </div>
          <div className="auth-mode-switch" role="tablist" aria-label="账号操作">
            <button type="button" role="tab" aria-selected={mode === '登录'} className={mode === '登录' ? 'active' : ''} onClick={() => setMode('登录')}>登录</button>
            <button type="button" role="tab" aria-selected={mode === '注册'} className={mode === '注册' ? 'active' : ''} onClick={() => setMode('注册')}>注册</button>
          </div>
          <div className="auth-layout">
            <article className={`auth-pane login-pane ${mode === '登录' ? 'active' : ''}`}>
              <span>账号登录</span>
              <strong>回到你的同频瞬间</strong>
              <small>支持账号密码和第三方授权，管理员会自动进入工作台。</small>
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
            <article className={`auth-pane register-pane ${mode === '注册' ? 'active' : ''}`}>
              <span>新朋友，欢迎你</span>
              <strong>留下一点属于你的标记</strong>
              <small>注册后即可使用匿名表达、同频互动和个人空间。</small>
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
            <BadgeCheck size={15} />安心连接 · 多种登录方式{forceLoginPreview ? ' · 强制预览' : ''}
          </div>
          <p className="phone-rule">
            <Smartphone size={15} />第三方登录首次使用需绑定手机号；管理员账号会自动进入工作台。
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