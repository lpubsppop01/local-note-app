export default class NoteLoadResult {

  content: string;
  lastModified: string;
  created: string;
  hasError: boolean;

  constructor(init?: Partial<NoteLoadResult>) {
    Object.assign(this, init);
  }

  clone(): NoteLoadResult {
    return new NoteLoadResult({
      content: this.content,
      lastModified: this.lastModified,
      created: this.created,
      hasError: this.hasError
    });
  }

}