// 同频回声 - Electron Preload 脚本
// 安全地在渲染进程和主进程之间桥接

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('desktopAPI', {
  // 平台信息
  platform: process.platform,

  // 获取应用版本
  getVersion: () => ipcRenderer.invoke('get-version'),

  // 窗口控制
  minimizeWindow: () => ipcRenderer.send('window-minimize'),
  maximizeWindow: () => ipcRenderer.send('window-maximize'),
  closeWindow: () => ipcRenderer.send('window-close'),

  // 检测是否在桌面端运行
  isDesktop: true,
});
