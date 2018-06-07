export default class IpcLoadNoteResult {

  content: string;
  lastModified: string;
  created: string;
  hasError: boolean;

  constructor(init?: Partial<IpcLoadNoteResult>) {
    Object.assign(this, init);
  }

  clone(): IpcLoadNoteResult {
    return new IpcLoadNoteResult({
      content: this.content,
      lastModified: this.lastModified,
      created: this.created,
      hasError: this.hasError
    });
  }

}