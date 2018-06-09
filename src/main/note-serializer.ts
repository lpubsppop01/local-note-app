import * as fs from "fs";
import DateUtility from "../common/date-utility";
import IpcLoadNoteResult from "../common/ipc-load-note-result";
import IpcSaveNoteResult from "../common/ipc-save-note-result";
import NoteItem, { NoteKind } from "../common/note-item";

export default class NoteSerializer {

  private static getEOL(content: string, lines: Array<string>): string {
    let lineSep = '\n';
    if (content[lines[0].length] == '\r') {
      lineSep = '\r\n';
    }
    return lineSep;
  }

  static load(note: NoteItem): IpcLoadNoteResult {
    let content;
    let hasError = false;
    try {
      content = fs.readFileSync(note.filePath, 'utf-8');
    } catch (e) {
      content = e.toString();
      hasError = true;
    }
    if (note.kind == NoteKind.Howm) {
      const lines = content.split(/\n|\r\n/);
      const partLines = lines.slice(note.startLineNumber - 1, note.endLineNumber);
      if (partLines.length > 1) {
        let lineSep = NoteSerializer.getEOL(content, lines);
        content = partLines.join(lineSep);
      } else {
        content = partLines[0];
      }
    }
    const stats = fs.statSync(note.filePath);
    const lastModified = DateUtility.formatLikeElisp("%Y/%m/%d %H:%M:%S", stats.mtime);
    const created = DateUtility.formatLikeElisp("%Y/%m/%d %H:%M:%S", stats.birthtime);
    return new IpcLoadNoteResult({ content, lastModified, created, hasError });
  }

  static save(note: NoteItem, content: string, keepsMTime: boolean): IpcSaveNoteResult {
    if (note.kind === NoteKind.Howm) {
      const editedLines = content.split(/\n|\r\n/);
      const srcFileText = fs.readFileSync(note.filePath, 'utf-8');
      const srcLines = srcFileText.split(/\n|\r\n/);
      const destLines = new Array<string>();
      for (let i = 0; i < srcLines.length;) {
        if (i < note.startLineNumber - 1 || note.endLineNumber && i >= note.endLineNumber) {
          destLines.push(srcLines[i++]);
        } else {
          editedLines.forEach(l => destLines.push(l));
          if (!note.endLineNumber) break;
          i += note.endLineNumber - note.startLineNumber + 1;
        }
      }
      let lineSep = NoteSerializer.getEOL(srcFileText, srcLines);
      const destFileText = destLines.join(lineSep);
      const oldStats = fs.statSync(note.filePath);
      fs.writeFileSync(note.filePath, destFileText);
      if (keepsMTime) {
        fs.utimesSync(note.filePath, oldStats.atime, oldStats.mtime);
      }
      const newStats = fs.statSync(note.filePath);
      const resultNote = note.clone();
      const titleMatch = destFileText.match(/^= (.*)/);
      if (titleMatch) {
        resultNote.label = titleMatch[1];
      }
      resultNote.endLineNumber = note.endLineNumber ? note.startLineNumber + editedLines.length - 1 : null;
      resultNote.lastModifiedMs = newStats.mtime.getTime();
      const result = new IpcSaveNoteResult({ note: resultNote });
      return result;
    } else {
      const oldStats = fs.statSync(note.filePath);
      fs.writeFileSync(note.filePath, content);
      if (keepsMTime) {
        fs.utimesSync(note.filePath, oldStats.atime, oldStats.mtime);
      }
      const newStats = fs.statSync(note.filePath);
      const resultNote = note.clone();
      resultNote.lastModifiedMs = newStats.mtime.getTime();
      const result = new IpcSaveNoteResult({ note: resultNote });
      return result;
    }
  }

}