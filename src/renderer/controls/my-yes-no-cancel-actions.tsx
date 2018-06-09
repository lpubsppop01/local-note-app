import Button from '@material-ui/core/Button';
import DialogActions from '@material-ui/core/DialogActions';
import * as React from 'react';

interface Props {
  onClick: (result: MyYesNoCancel) => void;
  osIsWindows: boolean;
}

export enum MyYesNoCancel {
  Yes, No, Cancel
}

const MyOkCancelActions = (props: Props) => (
  props.osIsWindows
  ? <DialogActions>
      <Button onClick={e => props.onClick(MyYesNoCancel.Yes)} color="primary" autoFocus>Yes</Button>
      <Button onClick={e => props.onClick(MyYesNoCancel.No)} color="primary">No</Button>
      <Button onClick={e => props.onClick(MyYesNoCancel.Cancel)} color="primary">Cancel</Button>
    </DialogActions>
  : <DialogActions>
      <Button onClick={e => props.onClick(MyYesNoCancel.No)} color="primary">No</Button>
      <Button onClick={e => props.onClick(MyYesNoCancel.Cancel)} color="primary">Cancel</Button>
      <Button onClick={e => props.onClick(MyYesNoCancel.Yes)} color="primary" autoFocus>Yes</Button>
    </DialogActions>
);

export default MyOkCancelActions;