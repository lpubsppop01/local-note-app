import NoteItem from "../common/note-item";

export default class IpcLoadNotesResult {

    notes: NoteItem[];
    elapsedMs: number;

    constructor(init?: Partial<IpcLoadNotesResult>) {
      Object.assign(this, init);
    }

    clone(): IpcLoadNotesResult {
      return new IpcLoadNotesResult({
        notes: this.notes ? this.notes.map(n => n.clone()) : null,
        elapsedMs: this.elapsedMs
      });
    }

  }