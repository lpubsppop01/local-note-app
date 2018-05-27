export enum NoteKind {
  PlaneText, Howm
}

export default class NoteItem {

  label: string;
  kind: NoteKind;
  filePath: string;
  lastModifiedMs: number;
  startLineNumber: number;
  endLineNumber: number;

  constructor(init?: Partial<NoteItem>) {
    Object.assign(this, init);
  }

  clone(): NoteItem {
    return new NoteItem({
      label: this.label,
      kind: this.kind,
      filePath: this.filePath,
      lastModifiedMs: this.lastModifiedMs,
      startLineNumber: this.startLineNumber,
      endLineNumber: this.endLineNumber
    });
  }

  get key(): string {
    return `${this.filePath}:${this.startLineNumber.toString()}`;
  }

}