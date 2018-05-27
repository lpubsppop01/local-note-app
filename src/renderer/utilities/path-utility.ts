export default class PathUtility {

  static getFilename(path: string): string {
    const tokens = path.split(/(\/|\\)/);
    if (tokens.length == 0) return "";
    return tokens[tokens.length - 1];
  }

}
