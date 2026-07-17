// 閸氬矂顣堕崶鐐诧紣 - Electron 娑撴槒绻樼粙?(鐠恒劌閽╅崣?Windows / macOS)
const { app, BrowserWindow, Menu, shell, dialog, ipcMain } = require("electron");
const path = require("path");
const fs = require("fs");
const { fork } = require("child_process");
const express = require("express");

// ---------- 鐠侯垰绶炵憴锝嗙€?----------
const isDev = !app.isPackaged;
const PROJECT_ROOT = isDev ? __dirname : process.resourcesPath;
const FRONTEND_DIR = isDev ? path.join(PROJECT_ROOT, "dist") : path.join(PROJECT_ROOT, "frontend");
const SERVER_ENTRY = path.join(PROJECT_ROOT, "server.mjs");
const REAL_DATA_DIR = isDev
  ? path.join(PROJECT_ROOT, "data")
  : path.join(app.getPath("userData"), "data");

// ---------- 閸忋劌鐪悩鑸碘偓?----------
let mainWindow = null;
let apiProcess = null;
let staticServer = null;
const API_PORT = 8787;
const STATIC_PORT = 5173;

// ---------- 閺佺増宓侀惄顔肩秿 ----------
function setupDataDir() {
  fs.mkdirSync(REAL_DATA_DIR, { recursive: true });
  if (!isDev) {
    const linkPath = path.join(PROJECT_ROOT, "data");
    try { fs.unlinkSync(linkPath); } catch {}
    try {
      if (process.platform === "win32") fs.symlinkSync(REAL_DATA_DIR, linkPath, "junction");
      else fs.symlinkSync(REAL_DATA_DIR, linkPath, "dir");
    } catch (err) {
      console.error("[Data] symlink failed:", err.message);
      fs.mkdirSync(linkPath, { recursive: true });
    }
  }
}

// ---------- 閸氼垰濮?API 閺堝秴濮熼崳?----------
function startApiServer() {
  return new Promise((resolve, reject) => {
    apiProcess = fork(SERVER_ENTRY, [], {
      env: { ...process.env, API_PORT: String(API_PORT) },
      cwd: PROJECT_ROOT,
      silent: true,
      stdio: ["pipe", "pipe", "pipe", "ipc"],
    });

    let started = false;
    apiProcess.stdout.on("data", (data) => {
      const msg = data.toString();
      console.log("[API]", msg.trim());
      if (!started && (msg.includes("running") || msg.includes("API"))) {
        started = true;
        resolve();
      }
    });
    apiProcess.stderr.on("data", (data) => console.error("[API:err]", data.toString().trim()));
    apiProcess.on("error", reject);
    apiProcess.on("exit", (code) => { console.log("[API] exited:", code); apiProcess = null; });

    setTimeout(() => { if (!started) { started = true; resolve(); } }, 8000);
  });
}

// ---------- 閸氼垰濮╅棃娆愨偓浣规瀮娴犺埖婀囬崝?----------
function startStaticServer() {
  return new Promise((resolve, reject) => {
    const indexPath = path.join(FRONTEND_DIR, "index.html");
    if (!fs.existsSync(indexPath)) {
      reject(new Error("閸撳秶顏弸鍕紦娴溠呭⒖閺堫亝澹橀崚? " + FRONTEND_DIR + "\n鐠囧嘲鍘涙潻鎰攽 npm run build"));
      return;
    }
    const server = express();
    server.use(express.static(FRONTEND_DIR));
    server.get("*", (req, res) => res.sendFile(indexPath));
    staticServer = server.listen(STATIC_PORT, "127.0.0.1", () => {
      console.log("[Static] http://127.0.0.1:" + STATIC_PORT);
      resolve();
    });
  });
}

// ---------- 閸掓稑缂撴稉鑽ょ崶閸?----------
function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 420,
    height: 860,
    minWidth: 380,
    minHeight: 600,
    title: "閸氬矂顣堕崶鐐诧紣",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
    show: false,
    backgroundColor: "#f5efe7",
  });

  const menuTemplate = [
    {
      label: "閸氬矂顣堕崶鐐诧紣",
      submenu: [
        { label: "閸忓厖绨崥宀勵暥閸ョ偛锛?, role: "about" },
        { type: "separator" },
        { label: "闁偓閸?, accelerator: "CmdOrCtrl+Q", click: () => app.quit() },
      ],
    },
    {
      label: "缂傛牞绶?,
      submenu: [
        { role: "undo" }, { role: "redo" }, { type: "separator" },
        { role: "cut" }, { role: "copy" }, { role: "paste" }, { role: "selectAll" },
      ],
    },
    {
      label: "鐟欏棗娴?,
      submenu: [
        { role: "reload" }, { role: "toggleDevTools" }, { type: "separator" },
        { role: "zoomIn" }, { role: "zoomOut" }, { role: "resetZoom" },
      ],
    },
  ];

  if (process.platform === "darwin") {
    menuTemplate.unshift({
      label: app.getName(),
      submenu: [
        { role: "about" }, { type: "separator" },
        { role: "services" }, { type: "separator" },
        { role: "hide" }, { role: "hideOthers" }, { role: "unhide" },
        { type: "separator" }, { role: "quit" },
      ],
    });
  }

  Menu.setApplicationMenu(Menu.buildFromTemplate(menuTemplate));

  mainWindow.loadURL("http://127.0.0.1:" + STATIC_PORT);

  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
    if (isDev) mainWindow.webContents.openDevTools({ mode: "detach" });
  });

  mainWindow.on("closed", () => { mainWindow = null; });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });
}

// ---------- IPC 婢跺嫮鎮?----------
ipcMain.handle("get-version", () => app.getVersion());
ipcMain.on("window-minimize", () => mainWindow?.minimize());
ipcMain.on("window-maximize", () => {
  if (mainWindow?.isMaximized()) mainWindow.unmaximize();
  else mainWindow?.maximize();
});
ipcMain.on("window-close", () => mainWindow?.close());

// ---------- 濞撳懐鎮?----------
function cleanup() {
  if (apiProcess) { try { apiProcess.kill(); } catch {}; apiProcess = null; }
  if (staticServer) { staticServer.close(); staticServer = null; }
}

// ---------- 鎼存梻鏁ら悽鐔锋嚒閸涖劍婀?----------
app.whenReady().then(async () => {
  try {
    setupDataDir();
    console.log("[Main] Data:", REAL_DATA_DIR);
    console.log("[Main] Frontend:", FRONTEND_DIR);

    await startApiServer();
    console.log("[Main] API ready");

    await startStaticServer();
    console.log("[Main] Static ready");

    createMainWindow();
    console.log("[Main] App ready");
  } catch (err) {
    console.error("[Main] Start failed:", err);
    dialog.showErrorBox("閸氼垰濮╂径杈Е", err.message);
    app.quit();
  }
});

app.on("window-all-closed", () => {
  cleanup();
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (mainWindow === null) createMainWindow();
});

app.on("before-quit", cleanup);

// 閸楁洖鐤勬笟瀣敚
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}
