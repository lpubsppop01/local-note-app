import { DialogContentText } from '@material-ui/core';
import Dialog from '@material-ui/core/Dialog';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import * as React from 'react';
import MyOkCancelActions from '../controls/my-ok-cancel-actions';

interface Props {
  open: boolean;
  onClose: (ok: boolean) => void;
  osIsWindows: boolean;
}

interface State {
  open: boolean;
  osIsWindows: boolean;
}

export default class DeleteFolderDialog extends React.Component<Props, State> {

  constructor(props: Props) {
    super(props);
    this.state = {
      open: props.open,
      osIsWindows: props.osIsWindows
    };
  }

  componentWillReceiveProps(nextProps: Props) {
    if (nextProps.open) {
      this.setState({
        open: true,
        osIsWindows: nextProps.osIsWindows
      });
    } else {
      this.setState({ open: false });
    }
  }

  render() {
    return (
      <Dialog open={this.state.open}
              onClose={e => this.props.onClose(false)}
              aria-labelledby="alert-dialog-title"
              aria-describedby="alert-dialog-description">
        <DialogTitle id="alert-dialog-title">Unregister Folder</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Are you sure you want to unregister this folder?
          </DialogContentText>
        </DialogContent>
        <MyOkCancelActions onClick={ok => this.props.onClose(ok)}
                           osIsWindows={this.props.osIsWindows} />
      </Dialog>
    );
  }
}