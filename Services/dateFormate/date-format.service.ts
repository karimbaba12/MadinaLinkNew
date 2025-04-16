import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class DateFormatService {
  constructor() {}

  unixToDateString(unixTimestamp: number): string {
    if (!unixTimestamp) return '';
    const date = new Date(unixTimestamp * 1000);

    // Validate the date
    if (isNaN(date.getTime())) {
      console.error('Invalid date from timestamp:', unixTimestamp);
      return 'Invalid date';
    }

    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
  }

  dateStringToUnix(dateString: string): number {
    if (!dateString) return 0;

    const [day, month, year] = dateString.split('/');
    const date = new Date(+year, +month - 1, +day);
    return Math.floor(date.getTime() / 1000);
  }

  // Helper method to debug timestamps
  debugTimestamp(timestamp: number): void {
    console.log('Original timestamp:', timestamp);
    console.log('As milliseconds:', timestamp * 1000);
    console.log('As date:', new Date(timestamp * 1000));
  }
}
