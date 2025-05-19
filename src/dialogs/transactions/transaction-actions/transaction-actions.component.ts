import { Component, EventEmitter, Input, Output } from '@angular/core';
import { TransactionDto } from '../../../../Services/api/api-client.service';
import { MatIcon } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { provideNativeDateAdapter } from '@angular/material/core';
import { AuthService } from '../../../../Services/Auth/auth.service';
@Component({
  standalone: true,
  selector: 'app-transaction-actions',
  imports: [MatIcon, MatDatepickerModule, MatNativeDateModule],
  templateUrl: './transaction-actions.component.html',
  styleUrl: './transaction-actions.component.scss',
  providers: [provideNativeDateAdapter()],
})
export class TransactionActionsComponent {
  @Input({ required: true }) transaction!: TransactionDto;
  @Output() onEdit = new EventEmitter<TransactionDto>();
  @Output() onDelete = new EventEmitter<number>();
  @Output() onPrint = new EventEmitter<number>();

  isDeleteDisabled = false;

  constructor(private authService: AuthService) {}

  async ngOnInit() {
    const role = await this.authService.getUserRoleName();
    this.isDeleteDisabled = role === 'user';
  }
}
