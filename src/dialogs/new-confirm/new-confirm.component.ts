import { Component, Inject } from '@angular/core';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogContent,
  MatDialogTitle,
} from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { FormsModule } from '@angular/forms';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinner } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-new-confirm',
  standalone: true,
  imports: [
    MatDialogActions,
    MatDialogContent,
    MatDialogTitle,
    MatIconModule,
    CommonModule,
    MatButtonModule,
    MatCheckboxModule,
    FormsModule,
    MatProgressBarModule,
    MatProgressSpinner
  ],
  templateUrl: './new-confirm.component.html',
  styleUrls: ['./new-confirm.component.scss'],
})
export class NewConfirmComponent {
  generateReceipt = false;
  isProcessing = false;

  constructor(
    public dialogRef: MatDialogRef<NewConfirmComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  confirm(): void {
    if (this.data.isConfirmation) {
      if (this.data.isBulkPayment && this.generateReceipt) {
        this.isProcessing = true;
        // Return immediately and let parent handle the PDF generation
        this.dialogRef.close({
          confirmed: true,
          generateReceipt: true,
          bulkUsers: this.data.users,
        });
      } else {
        this.dialogRef.close({
          confirmed: true,
          generateReceipt: this.generateReceipt,
        });
      }
    } else {
      this.dialogRef.close(true);
    }
  }

  cancel(): void {
    this.dialogRef.close(false);
  }
}
