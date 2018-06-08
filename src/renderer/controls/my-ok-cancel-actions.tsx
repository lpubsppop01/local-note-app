import Button from '@material-ui/core/Button';
import DialogActions from '@material-ui/core/DialogActions';
import * as React from 'react';

interface Props {
  onClick: (ok: boolean) => void;
  osIsWindows: boolean;
}

const MyOkCancelActions = (props: Props) => (
  props.osIsWindows
  ? <DialogActions>
      <Button onClick={e => props.onClick(true)} color="primary" autoFocus>Ok</Button>
      <Button onClick={e => props.onClick(false)} color="primary">Cancel</Button>
    </DialogActions>
  : <DialogActions>
      <Button onClick={e => props.onClick(false)} color="primary">Cancel</Button>
      <Button onClick={e => props.onClick(true)} color="primary" autoFocus>Ok</Button>
    </DialogActions>
);

export default MyOkCancelActions;