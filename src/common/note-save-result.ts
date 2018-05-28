export default class NoteSaveResult {

  key: string;
  filePath: string;
  startLineNumber: number;
  endLineNumber?: number;
  lastModified: string;

  constructor(init?: Partial<NoteSaveResult>) {
    Object.assign(this, init);
  }

  clone(): NoteSaveResult {
    return new NoteSaveResult({
      filePath: this.filePath,
      startLineNumber: this.startLineNumber,
      endLineNumber: this.endLineNumber,
      lastModified: this.lastModified
    });
  }

}