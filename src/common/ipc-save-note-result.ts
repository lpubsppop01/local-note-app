export default class IpcSaveNoteResult {

  key: string;
  filePath: string;
  startLineNumber: number;
  endLineNumber?: number;
  lastModified: string;

  constructor(init?: Partial<IpcSaveNoteResult>) {
    Object.assign(this, init);
  }

  clone(): IpcSaveNoteResult {
    return new IpcSaveNoteResult({
      filePath: this.filePath,
      startLineNumber: this.startLineNumber,
      endLineNumber: this.endLineNumber,
      lastModified: this.lastModified
    });
  }

}