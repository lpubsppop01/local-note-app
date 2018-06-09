import { DialogContentText } from '@material-ui/core';
import Dialog from '@material-ui/core/Dialog';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import * as React from 'react';
import MyYesNoCancelActions, { MyYesNoCancel } from '../controls/my-yes-no-cancel-actions';

interface Props {
  open: boolean;
  onClose: (result: MyYesNoCancel) => void;
  osIsWindows: boolean;
}

interface State {
  open: boolean;
  osIsWindows: boolean;
}

export default class ConfirmSaveNoteDialog extends React.Component<Props, State> {

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
              onClose={e => this.props.onClose(MyYesNoCancel.Cancel)}
              aria-labelledby="alert-dialog-title"
              aria-describedby="alert-dialog-description">
        <DialogTitle id="alert-dialog-title">Save Note</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Do you want to save note?
          </DialogContentText>
        </DialogContent>
        <MyYesNoCancelActions onClick={result => this.props.onClose(result)}
                              osIsWindows={this.props.osIsWindows} />
      </Dialog>
    );
  }
}