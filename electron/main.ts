import path from 'path'
import { app, BrowserWindow, ipcMain } from 'electron'
let win

app.whenReady().then(() => {
  win = new BrowserWindow({
    webPreferences: {
      contextIsolation: false,
      webSecurity: false,
      nodeIntegration: true,
    },
  })

  if (process.env.VITE_DEV_SERVER_URL) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL)
    win.webContents.openDevTools()
  } else {
    win.loadFile(path.join(process.env.VITE_PUBLIC!, 'index.html'))
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
})
