import { BrowserWindow, app, dialog, ipcMain } from "electron";
import * as fs from "fs";
import * as path from "path";
import FolderItem from '../common/folder-item';
import { IpcChannels } from '../common/ipc-channels';
import NoteItem, { NoteKind } from '../common/note-item';
import DateUtility from '../common/date-utility';
import DirectoryUtility from './directory-utility';
import NoteEnumerator from './note-enumerator';
import NoteSerializer from './note-serializer';
import * as os from 'os';
import IpcLoadNotesResult from "../common/ipc-load-notes-result";

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("ready", () => {
  // Load main window size and position
  const windowStateFilePath = path.join(app.getPath("userData"), "lpubsppop01/local-note-app/window-state.json");
  let windowState;
  try {
    windowState = JSON.parse(fs.readFileSync(windowStateFilePath, 'utf8'));
  } catch(e) {
    windowState = { width: 800, height: 600 };
  }
  
  // Create and open main window
  const mainWindow = new BrowserWindow(windowState);
  if (windowState.isMaximized) mainWindow.maximize();
  mainWindow.setTitle("Local Note");
  mainWindow.loadURL("file://" + __dirname + "/index.html");
  mainWindow.on("closed", () => app.quit());
  
  // Save main window size and position on closing
  mainWindow.on('close', function() {
    const dirPath = path.dirname(windowStateFilePath);
    if (!fs.existsSync(dirPath)) {
      DirectoryUtility.mkdirPSync(dirPath);
    }
    if (mainWindow.isMaximized()) {
      const toSave: any = {
        x: windowState.x, y: windowState.y,
        width: windowState.width, height: windowState.height,
        isMaximized: true
      };
      if (windowState.widthC1) toSave.widthC1 = windowState.widthC1;
      if (windowState.widthC2) toSave.widthC2 = windowState.widthC2;
      fs.writeFileSync(windowStateFilePath, JSON.stringify(toSave));
    } else if (mainWindow.isMinimized()) {
      // Not save if minimized
    } else {
      const toSave: any = mainWindow.getBounds();
      if (windowState.widthC1) toSave.widthC1 = windowState.widthC1;
      if (windowState.widthC2) toSave.widthC2 = windowState.widthC2;
      fs.writeFileSync(windowStateFilePath, JSON.stringify(toSave));
    }
  });

  // IPC
  ipcMain.on(IpcChannels.LOAD_NOTE, (event, note_) => {
    const note = new NoteItem(note_);
    const content = NoteSerializer.load(note);
    event.sender.send(IpcChannels.LOADED_NOTE, content);
  });
  ipcMain.on(IpcChannels.SAVE_NOTE, (event, note_, contentValue: string) => {
    const note = new NoteItem(note_);
    const result = NoteSerializer.save(note, contentValue);
    event.sender.send(IpcChannels.SAVED_NOTE, result);
  });
  ipcMain.on(IpcChannels.ADD_NOTE, (event, folderKey: string) => {
    const folder = currFolders.find(folder => folder.key == folderKey);
    const now = new Date();
    const filename = DateUtility.formatElispLike(folder.filenameFormat, now);
    const filePath = path.join(folder.directoryPath, filename);
    if (fs.existsSync(filePath)) return;
    DirectoryUtility.mkdirPSync(path.dirname(filePath));
    let content = "";
    let label = "";
    let subLabel = "";
    let kind = NoteKind.PlaneText;
    if (folder.isHowmDirectory) {
      content += "= New Note\r\n";
      content += DateUtility.formatElispLike("[%Y-%m-%d %H:%M] \r\n", now);
      content += "\r\n";
      label = "New Note";
      subLabel = NoteEnumerator.getSubLabel(now, filePath, folder, /* includesFilename: */ true);
      kind = NoteKind.Howm;
    }
    fs.appendFileSync(filePath, content);
    const note = new NoteItem({
      label, subLabel, kind, filePath,
      lastModifiedMs: now.getTime(), startLineNumber: 1
    });
    event.sender.send(IpcChannels.ADDED_NOTE, note);
  })
  ipcMain.on(IpcChannels.SHOW_OPEN_DIR_DIALOG, (event) => {
    // When first argument is 'this', 'openDirectory' not works
    const filePaths = dialog.showOpenDialog(null, {
      properties: ['openDirectory']
    });
    if (filePaths) {
      event.sender.send(IpcChannels.DIR_PATH_TO_OPEN, filePaths[0]);
    }
  });
  let currFolders: FolderItem[];
  ipcMain.on(IpcChannels.SAVE_FOLDERS, (event, folders_) => {
    const folders = folders_.map(f => new FolderItem(f));
    const foldersFilePath = path.join(app.getPath("userData"), "lpubsppop01/local-note-app/folders.json");
    const dirPath = path.dirname(foldersFilePath);
    if (!fs.existsSync(dirPath)) {
      DirectoryUtility.mkdirPSync(dirPath);
    }
    fs.writeFileSync(foldersFilePath, JSON.stringify(folders, null, "  "));
    currFolders = folders;
  });
  ipcMain.on(IpcChannels.LOAD_FOLDERS, (event) => {
    const filePath = path.join(app.getPath("userData"), "lpubsppop01/local-note-app/folders.json");
    if (fs.existsSync(filePath)) {
      const str = fs.readFileSync(filePath).toString();
      const data = JSON.parse(str, null);
      currFolders = data;
      event.sender.send(IpcChannels.LOADED_FOLDERS, data);
    } else {
      currFolders = [];
      event.sender.send(IpcChannels.LOADED_FOLDERS, []);
    }
  });
  ipcMain.on(IpcChannels.LOAD_NOTES, (event, folderKey: string, word: string) => {
    const matchedFolder = currFolders.find(folder => folder.key == folderKey);
    const startMs = Date.now();
    NoteEnumerator.enumerate(matchedFolder, word, notes => {
      const endMs = Date.now();
      const result = new IpcLoadNotesResult({
        notes,
        elapsedMs: endMs - startMs
      });
      event.sender.send(IpcChannels.LOADED_NOTES, result);
    });
  });
  ipcMain.on(IpcChannels.SAVE_WIDTH_C1, (event, widthC1: number) => {
    windowState.widthC1 = widthC1;
  });
  ipcMain.on(IpcChannels.SAVE_WIDTH_C2, (event, widthC2: number) => {
    windowState.widthC2 = widthC2;
  });
  ipcMain.on(IpcChannels.LOAD_WIDTH_C1, (event) => {
    if (windowState.widthC1) {
      event.sender.send(IpcChannels.LOADED_WIDTH_C1, windowState.widthC1);
    }
  });
  ipcMain.on(IpcChannels.LOAD_WIDTH_C2, (event) => {
    if (windowState.widthC2) {
      event.sender.send(IpcChannels.LOADED_WIDTH_C2, windowState.widthC2);
    }
  });
  ipcMain.on(IpcChannels.CHECK_ENV, (event) => {
    const osIsWindows = os.type().match('Windows') !== null;
    event.sender.send(IpcChannels.OS_IS_WINDOWS, osIsWindows);
  });
});