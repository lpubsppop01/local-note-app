import NoteItem from "./note-item";

export default class IpcSaveNoteResult {

  note: NoteItem;

  constructor(init?: Partial<IpcSaveNoteResult>) {
    Object.assign(this, init);
    this.note = new NoteItem(this.note);
  }

  clone(): IpcSaveNoteResult {
    return new IpcSaveNoteResult({
      note: this.note ? this.note.clone() : null
    });
  }

}