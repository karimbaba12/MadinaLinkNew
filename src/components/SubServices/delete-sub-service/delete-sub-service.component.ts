import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-delete-sub-service',
  imports: [],
  templateUrl: './delete-sub-service.component.html',
  styleUrl: './delete-sub-service.component.scss',
})
export class DeleteSubServiceComponent {
  constructor(
    public dialogRef: MatDialogRef<DeleteSubServiceComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data: { subServiceId: number; username: string }
  ) {}

  onCancel(): void {
    this.dialogRef.close(false);
  }

  onConfirm(): void {
    this.dialogRef.close(true);
  }
}
