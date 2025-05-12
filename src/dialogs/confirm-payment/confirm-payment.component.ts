import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-confirm-payment',
  imports: [CommonModule, MatIconModule, MatButtonModule, MatCardModule , MatCheckboxModule,FormsModule],
  templateUrl: './confirm-payment.component.html',
  styleUrl: './confirm-payment.component.scss',
})
export class ConfirmPaymentComponent {
  generateReceipt = true;

  constructor(
    public dialogRef: MatDialogRef<ConfirmPaymentComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  getPaymentMethodName(method: string): string {
    const methods: { [key: string]: string } = {
      cash: 'Cash',
      credit_card: 'Credit Card',
      bank_transfer: 'Bank Transfer',
      mobile_payment: 'Mobile Payment',
    };
    return methods[method] || method;
  }

  onConfirm(): void {
    this.dialogRef.close({
      confirmed: true,
      generateReceipt: this.generateReceipt,
    });
  }

  onCancel(): void {
    this.dialogRef.close({ confirmed: false });
  }
}
