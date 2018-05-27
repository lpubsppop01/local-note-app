import * as React from 'react';

interface Props {
  renderItem: (index: number) => any,
  itemCount: number,
  itemHeight: number,
  style?: React.CSSProperties
}

interface State {
  iStart: number,
  iEnd: number,
  itemCount: number,
  itemCountPerPage: number
}

export default class MyListView extends React.Component<Props, State> {

  private rootDiv: HTMLDivElement;

  constructor(props: Props) {
    super(props);
    const itemCountPerPage = this.getItemCountPerPage(props);
    this.state = {
      iStart: 0,
      iEnd: Math.min(itemCountPerPage, props.itemCount),
      itemCount: props.itemCount,
      itemCountPerPage: itemCountPerPage
    }
  }

  static readonly INITIAL_PAGE_COUNT: number = 50;

  getItemCountPerPage(props: Props): number {
    if (this.rootDiv) {
      return Math.ceil(this.rootDiv.clientHeight / props.itemHeight);
    } else {
      return MyListView.INITIAL_PAGE_COUNT;
    }
  }

  componentWillReceiveProps(nextProps: Props) {
    const itemCountPerPage = this.getItemCountPerPage(nextProps);
    const iEnd = Math.min(this.state.iStart + itemCountPerPage, nextProps.itemCount);
    this.setState({ iEnd, itemCount: nextProps.itemCount, itemCountPerPage });
  }

  root_onScrollCapture(e: React.UIEvent<HTMLDivElement>) {
    const itemCountPerPage = Math.ceil(this.rootDiv.clientHeight / this.props.itemHeight);
    const childDiv = e.target as HTMLDivElement;
    const iStart = Math.floor(childDiv.scrollTop / this.props.itemHeight);
    const iEnd = Math.min(iStart + itemCountPerPage, this.state.itemCount);
    this.setState({ iStart, iEnd, itemCountPerPage });
  }

  renderItems(): any {
    const items = [];
    for (let i = this.state.iStart; i < this.state.iEnd; ++i) {
      items.push(this.props.renderItem(i));
    }
    return items;
  }

  render() {
    const rootDivStyle: React.CSSProperties = {
      listStyleType: "None", paddingBottom: "8px", paddingTop: "8px"
    };
    if (this.props.style) {
      Object.assign(rootDivStyle, this.props.style);
    }
    const childDivStyle: React.CSSProperties = {
      paddingTop: `${this.props.itemHeight * this.state.iStart}px`,
      height: `${this.props.itemHeight * this.props.itemCount}px`
    };
    return (
      <div style={rootDivStyle} ref={(div) => this.rootDiv = div}
           onScrollCapture={e => this.root_onScrollCapture(e)}>
        <div style={childDivStyle}>{this.renderItems()}</div>
      </div>
    );
  }

}
