// transaction-edit-dialog.component.ts
import { Component, Inject } from '@angular/core';
import {
  FormGroup,
  FormBuilder,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogContent,
  MatDialogActions,
  MatDialogClose,
  MatDialogTitle,
} from '@angular/material/dialog';
import { TransactionDto } from '../../../Services/api/api-client.service';
import { MatError, MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { MatNativeDateModule } from '@angular/material/core';

@Component({
  selector: 'app-transaction-edit-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatDialogTitle,
    MatDialogContent,
    MatFormField,
    MatError,
    MatLabel,
    MatDialogActions,
    MatDialogClose,
    MatInputModule,
    MatButtonModule,
  ],
  templateUrl: './transaction-edit-dialog.component.html',
  styleUrl: './transaction-edit-dialog.component.scss',
  providers: [provideNativeDateAdapter()],
})
export class TransactionEditDialogComponent {
  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<TransactionEditDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: TransactionDto
  ) {
    this.form = this.fb.group({
      credit: [data.credit, [Validators.required, Validators.min(0)]],
      debit: [data.debit, [Validators.required, Validators.min(0)]],
      createdAt: [new Date(data.createdAt ?? Date.now()), Validators.required],
      transactionId: [data.transactionId, Validators.required],
      userId: [data.userId],
      tenantId: [data.tenantId],
      subscriptionId: [data.subscriptionId],
    });
  }

  save(): void {
    if (this.form.valid) {
      const result = {
        ...this.form.value,
        createdAt: new Date(this.form.value.createdAt).getTime(),
      };
      this.dialogRef.close(result);
    }
  }

  cancel(): void {
    this.dialogRef.close();
  }
}
