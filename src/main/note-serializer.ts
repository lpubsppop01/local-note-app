import * as fs from "fs";
import * as moment from 'moment';
import NoteItem, { NoteKind } from "../common/note-item";
import NoteLoadResult from "../common/note-load-result";

export class SaveResult {
  lastModified: string;
}

export default class NoteSerializer {

  private static getEOL(content: string, lines: Array<string>): string {
    let lineSep = '\n';
    if (content[lines[0].length] == '\r') {
      lineSep = '\r\n';
    }
    return lineSep;
  }

  static load(note: NoteItem): NoteLoadResult {
    let content = fs.readFileSync(note.filePath, 'utf-8');
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
    const lastModified = moment(stats.mtime).format("YYYY/MM/DD HH:mm:ss");
    const created = moment(stats.birthtime).format("YYYY/MM/DD HH:mm:ss");
    return new NoteLoadResult({ content, lastModified, created });
  }

  static save(note: NoteItem, content: string): SaveResult {
    if (note.kind === NoteKind.Howm) {
      const srcFileText = fs.readFileSync(note.filePath, 'utf-8');
      const srcLines = srcFileText.split(/\n|\r\n/);
      const destLines = new Array<string>();
      for (let i = 0; i < srcLines.length;) {
        if (i < note.startLineNumber - 1 || note.endLineNumber && i >= note.endLineNumber) {
          destLines.push(srcLines[i++]);
        } else {
          const editedLines = content.split(/\n|\r\n/);
          editedLines.forEach(l => destLines.push(l));
          if (!note.endLineNumber) break;
          i += note.endLineNumber - note.startLineNumber + 1;
        }
      }
      let lineSep = NoteSerializer.getEOL(srcFileText, srcLines);
      const destFileText = destLines.join(lineSep);
      fs.writeFileSync(note.filePath, destFileText);
      const stats = fs.statSync(note.filePath);
      const result = new SaveResult();
      result.lastModified = moment(stats.mtime).format("YYYY/MM/DD HH:mm:ss");
      return result;
    } else {
      fs.writeFileSync(note.filePath, content);
      const stats = fs.statSync(note.filePath);
      const result = new SaveResult();
      result.lastModified = moment(stats.mtime).format("YYYY/MM/DD HH:mm:ss");
      return result;
    }
  }

}