import { Component, Inject } from '@angular/core';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogContent,
  MatDialogClose,
} from '@angular/material/dialog';

@Component({
  selector: 'app-delete-transaction',
  imports: [MatDialogActions, MatDialogClose],
  templateUrl: './delete-transaction.component.html',
  styleUrl: './delete-transaction.component.scss',
})
export class DeleteTransactionComponent {
  constructor(
    public dialogRef: MatDialogRef<DeleteTransactionComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { title?: string; message?: string }
  ) {}
}
