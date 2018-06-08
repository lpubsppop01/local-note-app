import Checkbox from '@material-ui/core/Checkbox';
import Dialog from '@material-ui/core/Dialog';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import FormControl from '@material-ui/core/FormControl';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import IconButton from '@material-ui/core/IconButton';
import Input from '@material-ui/core/Input';
import InputAdornment from '@material-ui/core/InputAdornment';
import InputLabel from '@material-ui/core/InputLabel';
import FolderOpenIcon from '@material-ui/icons/FolderOpen';
import { ipcRenderer } from 'electron';
import * as React from 'react';
import { IpcChannels } from '../../common/ipc-channels';
import MyOkCancelActions from '../controls/my-ok-cancel-actions';

interface Props {
  open: boolean;
  onClose: (result: AddFolderDialogResult) => void;
  osIsWindows: boolean;
}

interface State {
  open: boolean;
  osIsWindows: boolean;
  directoryPath: string;
  isHowmDirectory: boolean;
  filenameFormat: string;
}

export class AddFolderDialogResult {

  path: string;
  isHowmDirectory: boolean;
  filenameFormat: string;

  constructor(init?: Partial<AddFolderDialogResult>) {
    Object.assign(this, init);
  }

}

export default class AddFolderDialog extends React.Component<Props, State> {

  constructor(props: Props) {
    super(props);
    this.state = {
      open: props.open,
      osIsWindows: props.osIsWindows,
      directoryPath: "",
      isHowmDirectory: true,
      filenameFormat: "%Y/%m/%Y-%m-%d-%H%M%S.howm"
    };

    ipcRenderer.on(IpcChannels.DIR_PATH_TO_OPEN, (event, path: string) => {
      this.setState({ directoryPath: path });
    });
  }

  componentWillReceiveProps(nextProps: Props) {
    if (nextProps.open) {
      this.setState({
        open: true,
        osIsWindows: nextProps.osIsWindows,
        directoryPath: "",
        isHowmDirectory: true,
        filenameFormat: "%Y/%m/%Y-%m-%d-%H%M%S.howm"
      });
    } else {
      this.setState({ open: false });
    }
  }

  folderOpen_onClick = (e) => {
    ipcRenderer.send(IpcChannels.SHOW_OPEN_DIR_DIALOG);
  };

  isHowmDirectoryCheckbox_onChange = (e) => {
    this.setState({ isHowmDirectory: e.target.checked });
  };

  okButton_onClick = (e) => {
    const result = new AddFolderDialogResult({
      path: this.state.directoryPath,
      isHowmDirectory: this.state.isHowmDirectory,
      filenameFormat: this.state.filenameFormat
    });
    this.props.onClose(result);
  };

  render() {
    return (
      <Dialog open={this.state.open} onClose={e => this.props.onClose(null)}>
        <DialogTitle>Add Folder</DialogTitle>
        <DialogContent>
          <div style={{ width: "552px", display: "flex", flexDirection: "column" }}>
            <div style={{ width: "552px", flex: "0 0 auto" }}>
              <FormControl>
                <InputLabel htmlFor="adornment-directory-path">Directory path</InputLabel>
                <Input autoFocus id="adornment-directory-path" value={this.state.directoryPath} endAdornment={
                  <InputAdornment position="end">
                    <IconButton onClick={this.folderOpen_onClick}>
                      <FolderOpenIcon />
                    </IconButton>
                  </InputAdornment>
                } style={{ width: "552px" }} />
              </FormControl>
            </div>
            <div style={{ width: "552px", flex: "0 0 auto", marginTop: "16px" }}>
              <FormControl>
                <InputLabel htmlFor="adornment-filename-format">New filename format</InputLabel>
                <Input id="adornment-filename-format"
                       value={this.state.filenameFormat} style={{ width: "552px" }} />
              </FormControl>
            </div>
            <div style={{ width: "552px", flex: "0 0 auto", marginTop: "16px" }}>
              <FormControlLabel control={
                <Checkbox checked={this.state.isHowmDirectory} onChange={this.isHowmDirectoryCheckbox_onChange} />
              } label="howm"/>
            </div>
          </div>
        </DialogContent>
        <MyOkCancelActions onClick={ok => ok ? this.okButton_onClick(null) : this.props.onClose(null)}
                           osIsWindows={this.props.osIsWindows} />
      </Dialog>
    );
  }

}