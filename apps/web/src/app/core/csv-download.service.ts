import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class CsvDownloadService {
  save(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url));
  }
}
