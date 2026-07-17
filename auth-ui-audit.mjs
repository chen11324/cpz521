import fs from 'node:fs';
import QRCode from 'qrcode';

const source = fs.readFileSync('src/components/LoginScreen.tsx', 'utf8');
const styles = fs.readFileSync('styles.css', 'utf8');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));

const requiredSource = [
  'auth-version-badge',
  'login-pane',
  'register-pane',
  'QRCode.toDataURL',
  'setQrNotice',
  "URLSearchParams(window.location.search).has('login')",
  'window.open(qrPayload.url',
];

const requiredStyles = [
  '.auth-version-badge',
  '.auth-pane.login-pane',
  '.auth-pane.register-pane',
  '.qr-card.real-qr img',
  '.qr-notice',
];

const failures = [];
for (const token of requiredSource) {
  if (!source.includes(token)) failures.push(`missing source token: ${token}`);
}
for (const token of requiredStyles) {
  if (!styles.includes(token)) failures.push(`missing style token: ${token}`);
}

const clickHandlers = (source.match(/onClick=/g) ?? []).length;
if (clickHandlers < 8) failures.push(`expected at least 8 click handlers, found ${clickHandlers}`);
if (!pkg.dependencies?.qrcode) failures.push('qrcode dependency missing');

const qr = await QRCode.toDataURL('https://open.weixin.qq.com/connect/qrconnect?appid=empathy-circle-demo', {
  margin: 1,
  width: 260,
  errorCorrectionLevel: 'M',
});
if (!qr.startsWith('data:image/png;base64,')) failures.push('qrcode did not generate PNG data URL');

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log('Auth UI audit passed');
