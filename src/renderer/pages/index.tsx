import { FormControl, Input, InputAdornment, InputLabel } from '@material-ui/core';
import CircularProgress from '@material-ui/core/CircularProgress';
import IconButton from '@material-ui/core/IconButton';
import ListItem from '@material-ui/core/ListItem';
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction';
import ListItemText from '@material-ui/core/ListItemText';
import TextField from '@material-ui/core/TextField';
import Typography from '@material-ui/core/Typography';
import withStyles, { StyleRulesCallback, WithStyles } from '@material-ui/core/styles/withStyles';
import CreateNewFolderIcon from '@material-ui/icons/CreateNewFolder';
import DeleteIcon from '@material-ui/icons/Delete';
import InfoIcon from '@material-ui/icons/Info';
import LockIcon from '@material-ui/icons/Lock';
import LockOpenIcon from '@material-ui/icons/LockOpen';
import NoteAddIcon from '@material-ui/icons/NoteAdd';
import SaveIcon from '@material-ui/icons/Save';
import { ipcRenderer } from 'electron';
import * as React from 'react';
import MonacoEditor from 'react-monaco-editor';
import DateUtility from '../../common/date-utility';
import FolderItem from '../../common/folder-item';
import { IpcChannels } from '../../common/ipc-channels';
import IpcLoadNoteResult from '../../common/ipc-load-note-result';
import IpcLoadNotesResult from '../../common/ipc-load-notes-result';
import IpcSaveNoteResult from '../../common/ipc-save-note-result';
import NoteItem from '../../common/note-item';
import MyListView from '../controls/my-list-view';
import { MyYesNoCancel } from '../controls/my-yes-no-cancel-actions';
import AddFolderDialog, { AddFolderDialogResult } from '../dialogs/add-folder-dialog';
import ConfirmSaveNoteDialog from '../dialogs/confirm-save-note-dialog';
import DeleteFolderDialog from '../dialogs/delete-folder-dialog';
import PathUtility from '../utilities/path-utility';
import withRoot from '../withRoot';

type ClassNames = 'root' | 'content';

const styles: StyleRulesCallback<ClassNames> = theme => ({
  root: {
    height: '100%',
    display: "flex",
    flexDirection: "row"
  },
  content: {
  }
});

type State = {
  addFolderDialogIsOpen: boolean;
  deleteFolderDialogIsOpen: boolean;
  deleteNoteDialogIsOpen: boolean;
  confirmSaveNoteDialogIsOpen: boolean;
  delayedAction: () => void,
  editorValue: string;
  folders: FolderItem[];
  selectedFolder: FolderItem;
  targetFolder: FolderItem;
  notes: NoteItem[];
  elapsedMs: number;
  selectedNote: NoteItem;
  targetNote: NoteItem;
  searchWord: string;
  isLoadingNotes: boolean;
  noteIsEdited: boolean,
  lastModified: string,
  keepsMTime: boolean,
  created: string,
  widthC1: number,
  widthC2: number,
  osIsWindows: boolean
};

class Index extends React.Component<WithStyles<ClassNames>, State> {

  private editor: MonacoEditor;
  private searchInput: HTMLInputElement;

  constructor(props: WithStyles<ClassNames>) {
    super(props);
    this.state = {
      addFolderDialogIsOpen: false,
      deleteFolderDialogIsOpen: false,
      deleteNoteDialogIsOpen: false,
      confirmSaveNoteDialogIsOpen: false,
      delayedAction: null,
      editorValue: "",
      folders: new Array<FolderItem>(),
      selectedFolder: null,
      targetFolder: null,
      notes: new Array<NoteItem>(),
      elapsedMs: 0,
      selectedNote: null,
      targetNote: null,
      searchWord: "",
      isLoadingNotes: false,
      noteIsEdited: false,
      lastModified: "",
      keepsMTime: false,
      created: "",
      widthC1: 200,
      widthC2: 300,
      osIsWindows: false
    };

    ipcRenderer.on(IpcChannels.LOADED_FOLDERS, (event, folders_) => {
      const folders = folders_.map(f => new FolderItem(f));
      this.setState({ folders });
    });
    ipcRenderer.on(IpcChannels.LOADED_NOTES, (event, result_) => {
      const result = new IpcLoadNotesResult(result_);
      const notes = result.notes.map(n => new NoteItem(n));
      this.setState({ notes, elapsedMs: result.elapsedMs, isLoadingNotes: false });
    });
    ipcRenderer.on(IpcChannels.LOADED_NOTE, (event, result_) => {
      const result = new IpcLoadNoteResult(result_);
      this.editor_onChange(result.content, false);
      this.setState({
        editorValue: result.content,
        noteIsEdited: false,
        lastModified: result.lastModified,
        created: result.created
      });
      this.editor.updateOptions({ readOnly: result.hasError });
      if (this.state.searchWord) {
        const match = this.editor.getModel().findNextMatch(this.state.searchWord, this.editor.getModel().getPositionAt(0), false, false, null, false);
        if (match) {
          this.editor.setSelection(match.range);
          this.editor.revealLine(match.range.startLineNumber);
          this.editor.getAction('actions.find').run();
        }
      }
    });
    ipcRenderer.on(IpcChannels.SAVED_NOTE, (event, result_: IpcSaveNoteResult) => {
      const result = new IpcSaveNoteResult(result_);
      if (!result.note) return;
      let editedNote: NoteItem = null;
      if (this.state.selectedNote && this.state.selectedNote.key === result.note.key) {
        editedNote = this.state.selectedNote;
      } else {
        editedNote = this.state.notes.find(note => note.key === result.note.key);
      }
      editedNote.label = result.note.label;
      editedNote.lastModifiedMs = result.note.lastModifiedMs;
      if (result.note.endLineNumber) {
        const lineNumberOffset = result.note.endLineNumber - editedNote.endLineNumber;
        editedNote.endLineNumber += lineNumberOffset;
        for (let i = 0; i < this.state.notes.length; ++i) {
          const note = this.state.notes[i];
          if (note.filePath !== result.note.filePath) continue;
          if (note.startLineNumber > result.note.startLineNumber) {
            note.startLineNumber += lineNumberOffset;
            if (note.endLineNumber) {
              note.endLineNumber += lineNumberOffset;
            }
          }
        }
      }
      this.setState({
        notes: this.state.notes,
        selectedNote: this.state.selectedNote,
        targetNote: this.state.targetNote,
        lastModified: DateUtility.formatLikeElisp("%Y/%m/%d %H:%M:%S", result.note.lastModifiedMs)
      });
      this.doDelayedActionIfExists();
    });
    ipcRenderer.on(IpcChannels.ADDED_NOTE, (event, note_) => {
      const note = new NoteItem(note_);
      const notes = new Array<NoteItem>();
      notes.push(note);
      this.state.notes.forEach(n => notes.push(n));
      this.setState({ notes });
    });
    ipcRenderer.on(IpcChannels.LOADED_WIDTH_C1, (event, widthC1: number) => {
      this.setState({ widthC1 });
    });
    ipcRenderer.on(IpcChannels.LOADED_WIDTH_C2, (event, widthC2: number) => {
      this.setState({ widthC2 });
    });
    ipcRenderer.on(IpcChannels.OS_IS_WINDOWS, (event, osIsWindows: boolean) => {
      this.setState({ osIsWindows });
    });
  }

  addFolderButton_onClick = (e) => {
    this.setState({ addFolderDialogIsOpen: true });
    e.preventDefault();
  };

  addFolderDialog_onClose = (result: AddFolderDialogResult) => {
    if (result) {
      const newFolderItem = new FolderItem({
        key: result.path,
        label: PathUtility.getFilename(result.path),
        directoryPath: result.path,
        isHowmDirectory: result.isHowmDirectory,
        filenameFormat: result.filenameFormat
      });
      const folders = this.state.folders.concat(newFolderItem);
      this.setState({
        folders,
        addFolderDialogIsOpen: false
      });
      ipcRenderer.send(IpcChannels.SAVE_FOLDERS, folders);
    } else {
      this.setState({
        addFolderDialogIsOpen: false
      });
    }
  };

  deleteFolderButton_onClick = (clickedFolder: FolderItem) => {
    this.setState({
      deleteFolderDialogIsOpen: true,
      targetFolder: clickedFolder
    });
  };

  deleteFolderDialog_onClose = (dialogResult: boolean) => {
    if (dialogResult) {
      const iTarget = this.state.folders.findIndex(f => f.key === this.state.targetFolder.key);
      let newFolders = this.state.folders.map(f => f.clone());
      newFolders.splice(iTarget, 1);
      if (this.state.selectedFolder && this.state.selectedFolder.key === this.state.targetFolder.key) {
        this.setState({
          deleteFolderDialogIsOpen: false,
          folders: newFolders,
          targetFolder: null,
          selectedFolder: null,
          notes: new Array<NoteItem>(),
          selectedNote: null,
          editorValue: "",
          noteIsEdited: false,
          lastModified: "",
          created: ""
        });
        this.editor.updateOptions({ readOnly: true });
      } else {
        this.setState({
          deleteFolderDialogIsOpen: false,
          folders: newFolders,
          targetFolder: null
        });
      }
      ipcRenderer.send(IpcChannels.SAVE_FOLDERS, newFolders);
    } else {
      this.setState({
        deleteFolderDialogIsOpen: false,
        targetFolder: null
      });
    }
  };

  folderListItem_onClick = (clickedFolder: FolderItem) => {
    this.doAfterConfirmSaveNote(() => {
      this.setState({
        notes: new Array<NoteItem>(),
        selectedFolder: clickedFolder,
        isLoadingNotes: true,
        selectedNote: null,
        editorValue: "",
        noteIsEdited: false,
        lastModified: "",
        created: ""
      });
      this.editor.updateOptions({ readOnly: true });
      ipcRenderer.send(IpcChannels.LOAD_NOTES, clickedFolder.key, this.state.searchWord);
    });
  };

  addNoteButton_onClick = (e) => {
    ipcRenderer.send(IpcChannels.ADD_NOTE, this.state.selectedFolder.key);
  };

  deleteNoteButton_onClick = (clickedNote: NoteItem) => {
    this.doAfterConfirmSaveNote(() => {
      this.setState({
        deleteNoteDialogIsOpen: true,
        targetNote: clickedNote
      });
    });
  };

  noteListItem_onClick = (clickedNote: NoteItem) => {
    this.doAfterConfirmSaveNote(() => {
      this.setState({
        editorValue: "",
        selectedNote: clickedNote
      });
      ipcRenderer.send(IpcChannels.LOAD_NOTE, clickedNote);
    });
  };

  searchInput_onsearch = (e: any) => {
    if (this.state.searchWord !== this.searchInput.value) {
      this.setState({ notes: new Array<NoteItem>(), searchWord: this.searchInput.value, isLoadingNotes: true });
      ipcRenderer.send(IpcChannels.LOAD_NOTES, this.state.selectedFolder.key, this.searchInput.value);
    }
  }

  keepsMTimeButton_onClick = () => {
    this.setState({ keepsMTime: !this.state.keepsMTime });
  }

  saveButton_onClick = () => {
    this.saveNote();
  }

  saveNote = () => {
    if (!this.state.selectedNote) return;
    if (!this.state.selectedNote.filePath) return;
    ipcRenderer.send(IpcChannels.SAVE_NOTE, this.state.selectedNote, this.state.editorValue, this.state.keepsMTime);
    this.setState({ noteIsEdited: false });
  }

  noteInfoButton_onClick = () => {
    if (!this.state.selectedNote) return;
    alert(this.state.selectedNote.infoMessage);
  }

  editor_onChange(value: string, edited: boolean) {
    this.setState({
      editorValue: value,
      noteIsEdited: edited
    });
  }

  editor_editorDidMount(editor, monaco) {
    editor.focus();
    editor.layout();
    editor.updateOptions({ readOnly: true });
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_S, this.saveNote);
    ipcRenderer.send(IpcChannels.LOAD_FOLDERS);
    ipcRenderer.send(IpcChannels.LOAD_WIDTH_C1);
    ipcRenderer.send(IpcChannels.LOAD_WIDTH_C2);
    ipcRenderer.send(IpcChannels.CHECK_ENV);
    this.editor = editor;
  }

  doAfterConfirmSaveNote = (action: () => void) => {
    if (this.state.noteIsEdited) {
      this.setState({
        confirmSaveNoteDialogIsOpen: true,
        delayedAction: action
      });
    } else {
      action();
    }
  }

  confirmSaveNoteDialog_onClose = (result: MyYesNoCancel) => {
    this.setState({ confirmSaveNoteDialogIsOpen: false });
    if (result === MyYesNoCancel.Yes) {
      this.saveNote();
    } else if (result === MyYesNoCancel.No) {
      this.doDelayedActionIfExists();
    }
  };

  doDelayedActionIfExists() {
    if (!this.state.delayedAction) return;
    const action = this.state.delayedAction;
    this.setState({ delayedAction: null });
    action();
  }

  private resizeTarget: string;
  private static readonly ResizeTarget_WidthC1: string = "C1";
  private static readonly ResizeTarget_WidthC2: string = "C2";  
  private widthOnDragStart: number;
  private screenXOnDragStart: number;

  widthResizerC1_onMouseDown(e: React.MouseEvent<HTMLDivElement>) {
    this.resizeTarget = Index.ResizeTarget_WidthC1;
    this.widthOnDragStart = this.state.widthC1;
    this.screenXOnDragStart = e.screenX;
  }

  widthResizerC2_onMouseDown(e: React.MouseEvent<HTMLDivElement>) {
    this.resizeTarget = Index.ResizeTarget_WidthC2;
    this.widthOnDragStart = this.state.widthC2;
    this.screenXOnDragStart = e.screenX;
  }

  root_onMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (this.resizeTarget === Index.ResizeTarget_WidthC1) {
      const newWidth = Math.max(this.widthOnDragStart + e.screenX - this.screenXOnDragStart, 200);
      this.setState({ widthC1: newWidth });
    } else if (this.resizeTarget === Index.ResizeTarget_WidthC2) {
      const newWidth = Math.max(this.widthOnDragStart + e.screenX - this.screenXOnDragStart, 300);
      this.setState({ widthC2: newWidth });
    }
  }

  root_onMouseUp(e: React.MouseEvent<HTMLDivElement>) {
    if (this.resizeTarget === Index.ResizeTarget_WidthC1) {
      ipcRenderer.send(IpcChannels.SAVE_WIDTH_C1, this.state.widthC1);
    } else if (this.resizeTarget === Index.ResizeTarget_WidthC2) {
      ipcRenderer.send(IpcChannels.SAVE_WIDTH_C2, this.state.widthC2);
    }
    this.resizeTarget = null;
  }

  renderFolder(index): any {
    const folder = this.state.folders[index];
    const folderIsSelected = this.state.selectedFolder && this.state.selectedFolder.key === folder.key;
    return (
      <ListItem button onClick={e => this.folderListItem_onClick(folder)}
                style={folderIsSelected ? { backgroundColor: "lightgray" } : {}}>
        <ListItemText disableTypography
                      primary={<Typography variant="subheading" noWrap={true}>{folder.label}</Typography>} />
        <ListItemSecondaryAction>
          <IconButton aria-label="Delete Folder" onClick={e => this.deleteFolderButton_onClick(folder)}>
            <DeleteIcon />
          </IconButton>
        </ListItemSecondaryAction>
      </ListItem>
    );
  }

  renderNoteListItem(index): any {
    const note = this.state.notes[index];
    const noteIsSelected = this.state.selectedNote && this.state.selectedNote.key === note.key;
    return (
      <ListItem button onClick={e => this.noteListItem_onClick(note)}
                style={noteIsSelected ? { backgroundColor: "lightgray" } : {}}>
        <ListItemText disableTypography
                      primary={<Typography variant="subheading" noWrap={true}>{note.label}</Typography>}
                      secondary={<Typography variant="caption" noWrap={true}>{note.subLabel}</Typography>} />
        <ListItemSecondaryAction>
          <IconButton aria-label="Delete Note" onClick={e => this.deleteNoteButton_onClick(note)}><DeleteIcon /></IconButton>
        </ListItemSecondaryAction>
      </ListItem>
    );
  }

  render() {
    return (
      <div className={this.props.classes.root}
           onMouseMoveCapture={e => this.root_onMouseMove(e)}
           onMouseUpCapture={e => this.root_onMouseUp(e)}>
        <div style={{ flex: "0 0 auto", width: `${this.state.widthC1}px` }}>
          <div style={{ height: "32px", display: "flex", flexDirection: "row", justifyContent: "flex-end" }}>
            <IconButton onClick={this.addFolderButton_onClick}><CreateNewFolderIcon /></IconButton>
          </div>
          <MyListView style={{ overflowY: "auto", height: "calc(100% - 64px)", marginTop: "16px" }}
                      renderItem={(index) => this.renderFolder(index)} itemHeight={48}
                      itemCount={this.state.folders ? this.state.folders.length : 0}/>
        </div>
        <div style={{ width: "16px", cursor: "col-resize" }}
             onMouseDownCapture={e => this.widthResizerC1_onMouseDown(e)} />
        <div style={{ flex: "0 0 auto", width: `${this.state.widthC2}px` }}>
          <div style={{ height: "68px", display: "flex", flexDirection: "row", alignItems: "top" }}>
            <TextField label="Search" type="search" style={{ flex: "1 1 auto" }}
                       inputRef={(input) => {
                         this.searchInput = input;
                         (input||{}).onsearch = this.searchInput_onsearch;
                       }}
                       helperText={
                         this.state.selectedFolder && !this.state.isLoadingNotes
                         ? `${this.state.notes.length} notes (${this.state.elapsedMs} milliseconds)`
                         : null
                       }/>
            <IconButton aria-label="Add Note" style={{ flex: "0 0 auto" }}
                        onClick={this.addNoteButton_onClick}>
              <NoteAddIcon />
            </IconButton>
          </div>
          {
            this.state.isLoadingNotes
            ? <div style={{ display: "flex", flexDirection: "column", alignItems: "center",
                            marginTop: "8px", paddingTop: "0" }}>
                <CircularProgress size={64} />
              </div>
            : <MyListView style={{ overflowY: "auto", height: "calc(100% - 76px)",
                                   marginTop: "8px", paddingTop: "0" }}
                          renderItem={(index) => this.renderNoteListItem(index)} itemHeight={64}
                          itemCount={this.state.notes ? this.state.notes.length : 0} />
          }
        </div>
        <div style={{ width: "16px", cursor: "col-resize" }}
             onMouseDownCapture={e => this.widthResizerC2_onMouseDown(e)} />
        <div style={{ flex: "1 1 auto", height: "100%", overflow: "hidden" }}>
          <div style={{ height: "48px", display: "flex", flexDirection: "row", alignItems: "flex-end" }}>
            <FormControl style={{ flex: "0 0 auto", width: "210px" }}>
              <InputLabel htmlFor="adornment-password">Last modified</InputLabel>
              <Input id="adornment-password" value={this.state.lastModified}
                     inputProps={{ readOnly: true, disabled: true }}
                     endAdornment={
                <InputAdornment position="end">
                  <IconButton aria-label="Toggle password visibility"
                              onClick={this.keepsMTimeButton_onClick}>
                    {this.state.keepsMTime ? <LockIcon /> : <LockOpenIcon />}
                  </IconButton>
                </InputAdornment>
              }/>
            </FormControl>
            <TextField label="Created" style={{ flex: "0 0 auto", width: "165px", marginLeft: "8px" }}
                       inputProps={{ readOnly: true, disabled: true }}
                       value={this.state.created} />
            <IconButton aria-label="Save Note" style={{ flex: "0 0 auto" }} disabled={!this.state.noteIsEdited}
                        onClick={e => this.saveButton_onClick()}>
              <SaveIcon />
            </IconButton>
            <IconButton aria-label="Note Info" style={{ flex: "0 0 auto" }} disabled={!this.state.selectedNote}
                        onClick={e => this.noteInfoButton_onClick()}>
              <InfoIcon />
            </IconButton>
          </div>
          <div style={{ height: "calc(100% - 64px)", marginTop: "16px" }}>
            <MonacoEditor height="100%"
                          language="plaintext"
                          theme="vs-light"
                          value={this.state.editorValue}
                          options={{ automaticLayout: true, lineNumbers: "off", minimap: { enabled: false }}}
                          requireConfig={{ url: "./vs/loader.js", baseUrl: document.baseURI }}
                          onChange={v => this.editor_onChange(v, true)}
                          editorDidMount={this.editor_editorDidMount.bind(this)} />
          </div>
        </div>

        <AddFolderDialog open={this.state.addFolderDialogIsOpen}
                         onClose={result => this.addFolderDialog_onClose(result)}
                         osIsWindows={this.state.osIsWindows} />

        <DeleteFolderDialog open={this.state.deleteFolderDialogIsOpen}
                            onClose={ok => this.deleteFolderDialog_onClose(ok)}
                            osIsWindows={this.state.osIsWindows} />

        <ConfirmSaveNoteDialog open={this.state.confirmSaveNoteDialogIsOpen}
                               onClose={result => this.confirmSaveNoteDialog_onClose(result)}
                               osIsWindows={this.state.osIsWindows} />
      </div>
    );
  }
}

export default withRoot(withStyles(styles)<{}>(Index));
