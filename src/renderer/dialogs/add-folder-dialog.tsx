import Button from '@material-ui/core/Button';
import Checkbox from '@material-ui/core/Checkbox';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
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

interface Props {
  open: boolean;
  onClose: (result: AddFolderDialogResult) => void;
}

interface State {
  open: boolean;
  path: string;
  isHowmDirectory: boolean;
}

export class AddFolderDialogResult {

  path: string;
  isHowmDirectory: boolean;

  constructor(init?: Partial<AddFolderDialogResult>) {
    Object.assign(this, init);
  }

}

export default class AddFolderDialog extends React.Component<Props, State> {

  constructor(props: Props) {
    super(props);
    this.state = {
      open: props.open,
      path: "",
      isHowmDirectory: false
    };

    ipcRenderer.on(IpcChannels.DIR_PATH_TO_OPEN, (event, path: string) => {
      this.setState({ path });
    });
  }

  componentWillReceiveProps(nextProps: Props) {
    if (nextProps.open) {
      this.setState({
        open: true,
        path: "",
        isHowmDirectory: false
      });
    } else {
      this.setState({ open: false });
    }
  }

  folderOpen_onClick = (e) => {
    ipcRenderer.send(IpcChannels.SHOW_OPEN_DIR_DIALOG);
  };

  isHowmDirCheckbox_onChange = (e) => {
    this.setState({ isHowmDirectory: e.target.checked });
  };

  okButton_onClick = (e) => {
    const result = new AddFolderDialogResult({
      path: this.state.path,
      isHowmDirectory: this.state.isHowmDirectory
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
                <InputLabel htmlFor="adornment-dir-path">Path</InputLabel>
                <Input autoFocus id="adornment-dir-path" value={this.state.path} endAdornment={
                  <InputAdornment position="end">
                    <IconButton onClick={this.folderOpen_onClick}>
                      <FolderOpenIcon />
                    </IconButton>
                  </InputAdornment>
                } style={{ width: "552px" }} />
              </FormControl>
            </div>
            <div style={{ width: "552px", flex: "0 0 auto" }}>
              <FormControlLabel control={
                <Checkbox checked={this.state.isHowmDirectory} onChange={this.isHowmDirCheckbox_onChange} />
              } label="howm"/>
            </div>
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={e => this.props.onClose(null)} color="primary">
            Cancel
          </Button>
          <Button onClick={this.okButton_onClick} color="primary" autoFocus>
            Ok
          </Button>
        </DialogActions>
      </Dialog>
    );
  }

}