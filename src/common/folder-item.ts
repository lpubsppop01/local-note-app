export default class FolderItem {

  key: string;
  label: string;
  directoryPath: string;
  isHowmDirectory: boolean;

  constructor(init?: Partial<FolderItem>) {
    Object.assign(this, init);
  }

  clone(): FolderItem {
    return new FolderItem({
      key: this.key,
      label: this.label,
      directoryPath: this.directoryPath,
      isHowmDirectory: this.isHowmDirectory
    });
  }

}