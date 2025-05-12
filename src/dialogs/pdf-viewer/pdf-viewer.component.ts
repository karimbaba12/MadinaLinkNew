import { Component, Inject } from '@angular/core';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogContent,
  MatDialogActions,
} from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import saveAs from 'file-saver';

@Component({
  selector: 'app-pdf-viewer',
  imports: [MatDialogContent, MatDialogActions, MatIcon],
  templateUrl: './pdf-viewer.component.html',
  styleUrl: './pdf-viewer.component.scss',
})
export class PdfViewerComponent {
  constructor(
    public dialogRef: MatDialogRef<PdfViewerComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data: { pdfUrl: string; transactionId: string }
  ) {}

  download(): void {
    saveAs(this.data.pdfUrl, `Receipt_${this.data.transactionId}.pdf`);
  }

  print(): void {
    const printWindow = window.open(this.data.pdfUrl, '_blank');
    if (printWindow) {
      printWindow.onload = () => {
        printWindow.print();
      };
    }
  }
}
