export default class DateUtility {

  static formatElispLike(format: string, date: Date) {
    return format
      .replace(/%Y/g, this.zeroPadding(date.getFullYear(), 4))
      .replace(/%m/g, this.zeroPadding(date.getMonth(), 2))
      .replace(/%d/g, this.zeroPadding(date.getDate(), 2))
      .replace(/%H/g, this.zeroPadding(date.getHours(), 2))
      .replace(/%M/g, this.zeroPadding(date.getMinutes(), 2))
      .replace(/%S/g, this.zeroPadding(date.getSeconds(), 2));
  }

  static zeroPadding(number: number, digits: number): string {
    return ('0'.repeat(digits - 1) + number).slice(-digits);
  }

}