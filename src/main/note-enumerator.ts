import * as child_process from "child_process";
import * as fs from "fs";
import * as path from "path";
import FolderItem from "../common/folder-item";
import NoteItem, { NoteKind } from "../common/note-item";

export default class NoteEnumerator {

  static enumerate(folder: FolderItem, word: string, callback: (notes: NoteItem[]) => void) {
    if (!folder || !folder.directoryPath || !fs.existsSync(folder.directoryPath)) return;
    if (folder.isHowmDirectory) {
      NoteEnumerator.enumerateHowmNotes(word, folder, callback);
    } else {
      NoteEnumerator.enumeratePlaneTextNotes(word, folder, callback);
    }
  }

  private static enumeratePlaneTextNotes(word: string, folder: FolderItem, callback: (notes: NoteItem[]) => void) {
    let command;
    if (word) {
      command = `rg -l "${word}" "${folder.directoryPath}"`;
    } else {
      command = `rg --files "${folder.directoryPath}"`;
    }
    child_process.exec(command, (error, stdout, stderr) => {
      const filePaths = stdout.split(/\n|\r\n/);
      const notes = new Array<NoteItem>();
      for (let i = 0; i < filePaths.length; ++i) {
        if (!filePaths[i]) continue;
        const label = path.basename(filePaths[i]);
        const stats = fs.statSync(filePaths[i]);
        const lastModifiedMs = stats.mtime.getTime();
        notes.push(new NoteItem({
          label,
          kind: NoteKind.PlaneText,
          filePath: filePaths[i],
          lastModifiedMs,
          startLineNumber: 1
        }));
      }
      if (notes) {
        notes.sort((a, b) => a.lastModifiedMs - b.lastModifiedMs).reverse();
        callback(notes);
      }
    });
  }

  private static enumerateHowmNotes(word: string, folder: FolderItem, callback: (notes: NoteItem[]) => void) {
    let command;
    if (word) {
      command = `rg -n "^= |${word}" "${folder.directoryPath}"`;
    } else {
      command = `rg -n "^= " "${folder.directoryPath}"`;
    }
    child_process.exec(command, (error, stdout, stderr) => {
      const allNotes = new Array<NoteItem>();
      const hitNotes = new Array<NoteItem>();
      const lines = stdout.split(/\n|\r\n/);
      for (let i = 0; i < lines.length; ++i) {
        if (!lines[i]) continue;
        const titleMatch = lines[i].match(`\(.+\):\([0-9]+\):= \(.*\)`);
        if (titleMatch) {
          const filePath = titleMatch[1];
          const lineNumber = +titleMatch[2];
          const title = titleMatch[3];
          const stats = fs.statSync(filePath);
          const lastModifiedMs = stats.mtime.getTime();
          const currNote = new NoteItem({
            label: title,
            kind: NoteKind.Howm,
            filePath,
            lastModifiedMs,
            startLineNumber: lineNumber
          });
          if (allNotes.length > 0) {
            const lastNote = allNotes[allNotes.length - 1];
            if (lastNote.filePath === currNote.filePath) {
              lastNote.endLineNumber = currNote.startLineNumber - 1;
            }
          }
          allNotes.push(currNote);
          continue;
        }
        if (hitNotes.length == 0 || hitNotes[hitNotes.length - 1] !== allNotes[allNotes.length - 1]) {
          const wordMatch = lines[i].match(`\(.+\):\([0-9]+\):\(.*\)`);
          if (wordMatch) {
            hitNotes.push(allNotes[allNotes.length - 1]);
          }
        }
      }
      if (word) {
        hitNotes.sort((a, b) => a.lastModifiedMs - b.lastModifiedMs).reverse();
        callback(hitNotes);
      } else {
        allNotes.sort((a, b) => a.lastModifiedMs - b.lastModifiedMs).reverse();
        callback(allNotes);
      }
    });
  }

}