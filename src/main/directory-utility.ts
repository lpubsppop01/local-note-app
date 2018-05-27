import * as fs from "fs";
import * as path from "path";

export default class DirectoryUtility {

  static mkdirPSync(dirPath: string) {
    const tokens = dirPath.split(/\/|\\/);
    const buf = []
    for (let i = 0; i < tokens.length; ++i) {
      buf.push(tokens[i]);
      const bufPath = buf.join("/");
      if (!fs.existsSync(bufPath)) {
        fs.mkdirSync(bufPath);
      }
    }
  }

}