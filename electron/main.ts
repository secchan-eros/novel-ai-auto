import path from 'node:path'
import fs from 'node:fs'
import { app, BrowserWindow, ipcMain, dialog } from 'electron'
import Store from 'electron-store'

let win

app.whenReady().then(() => {
  win = new BrowserWindow({
    webPreferences: {
      contextIsolation: false,
      webSecurity: false,
      nodeIntegration: true,
      sandbox: false,
    },
  })

  Store.initRenderer()

  if (process.env.VITE_DEV_SERVER_URL) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL)
    win.webContents.openDevTools()
  } else {
    win.loadFile(path.join(process.env.VITE_PUBLIC!, 'index.html'))
    win.webContents.openDevTools()
  }

  win.on('closed', () => {
    win = null
    app.quit()
  })

  ipcMain.handle(
    'save-blob',
    async (_, filePath: string, arrayBuffer: ArrayBuffer) => {
      const fs = await import('node:fs')
      const path = await import('node:path')
      const nodeBuffer = Buffer.from(arrayBuffer)
      if (!fs.existsSync(path.dirname(filePath))) {
        fs.mkdirSync(path.dirname(filePath), { recursive: true })
      }
      fs.writeFileSync(filePath, nodeBuffer)
    }
  )

  ipcMain.handle('load-file', (_) => {
    // 場所とファイル名を選択
    const path = dialog.showOpenDialogSync(win, {
      buttonLabel: 'import', // ボタンのラベル
      filters: [{ name: 'JSON', extensions: ['json'] }],
      properties: [
        'createDirectory', // ディレクトリの作成を許可 (macOS)
      ],
    })

    // キャンセルで閉じた場合
    if (path === undefined) {
      return { status: undefined }
    }

    // ファイルの内容を返却
    try {
      const json = fs.readFileSync(path[0], 'utf-8')

      return {
        status: true,
        json,
      }
    } catch (error: any) {
      return { status: false, message: error.message }
    }
  })

  ipcMain.handle('save-file', (_, json: any) => {
    // 場所とファイル名を選択
    const path = dialog.showSaveDialogSync(win, {
      buttonLabel: 'export', // ボタンのラベル
      filters: [{ name: 'JSON', extensions: ['json'] }],
      properties: [
        'createDirectory', // ディレクトリの作成を許可 (macOS)
      ],
    })

    // キャンセルで閉じた場合
    if (path === undefined) {
      return { status: undefined }
    }

    // ファイルの内容を返却
    try {
      fs.writeFileSync(path, json)

      return {
        status: true,
      }
    } catch (error: any) {
      return { status: false, message: error.message }
    }
  })
})
