import { Component, Input } from '@angular/core';
import {
  SubscriptionClient,
  SubscriptionDto,
  SubscriptionTypeClient,
  SubServiceClient,
  SubServiceDto,
  UserDto,
} from '../../../../Services/api/api-client.service';
import { CommonModule, DatePipe } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  MatCardActions,
  MatCardContent,
  MatCardTitle,
  MatCard,
} from '@angular/material/card';
import {
  MatError,
  MatFormField,
  MatFormFieldModule,
} from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatList, MatListItem } from '@angular/material/list';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-internet',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    CommonModule,
    MatCardActions,
    MatIcon,
    MatError,
    MatFormField,
    MatFormFieldModule,
    MatCardContent,
    MatList,
    MatCardTitle,
    MatListItem,
    MatCard,
    MatSelectModule,
  ],
  templateUrl: './internet.component.html',
  styleUrl: './internet.component.scss',
  providers: [DatePipe],
})
export class InternetComponent {
  isEditing = false;
  subscriptionForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  subServices: SubServiceDto[] = [];
  subscriptions: SubscriptionDto[] = [];
  selectedSubscriptionId: number | null = null;
  subServiceNames: { [key: number]: string } = {};

  @Input() tenantId!: number;
  @Input() selectedUser!: UserDto;

  constructor(
    private fb: FormBuilder,
    private subscriptionClient: SubscriptionClient,
    private subServiceClient: SubServiceClient,
    private snackBar: MatSnackBar,
    private datePipe: DatePipe
  ) {
    this.subscriptionForm = this.fb.group({
      subscriptionId: [0],
      subServiceId: [null, Validators.required],
      startDate: [0],
      endDate: [0],
      discount: [0, [Validators.min(0), Validators.max(100)]],
      isActive: [true],
      tenantId: [1],
    });
  }

  async ngOnInit() {
    try {
      this.isLoading = true;
      await this.loadSubServices();
      await this.loadUserSubscriptions();
      const currentDate = Math.floor(Date.now() / 1000);
      const endDate = currentDate + 30 * 24 * 60 * 60;
      this.subscriptionForm.patchValue({ startDate: currentDate, endDate });

      this.subscriptionForm
        .get('subServiceId')
        ?.valueChanges.subscribe(async (id) => {
          if (id) {
            const price = await this.getPrice(id);
            // Optional: update a field or state with price if needed
            console.log('Base Price:', price);
          }
        });

      // Disable form if there are existing subscriptions
      if (this.subscriptions.length > 0) {
        this.subscriptionForm.disable();
      }
    } catch (error) {
      this.errorMessage = 'Failed to initialize form.';
      this.snackBar.open(this.errorMessage, 'Close', { duration: 3000 });
    } finally {
      this.isLoading = false;
    }
  }

  private async loadSubServices() {
    try {
      const response = await this.subServiceClient.getAll().toPromise();
      this.subServices = (response?.data || []).filter(
        (s: any) => s.serviceId === 3
      );
      // Cache subservice names
      this.subServices.forEach((service) => {
        this.subServiceNames[service.subServiceId!] =
          service.subServiceName || 'Unknown';
      });
    } catch (error) {
      console.error('Error loading subservices:', error);
    }
  }

  private async loadUserSubscriptions() {
    try {
      const response = await this.subscriptionClient.getAll().toPromise();
      this.subscriptions = (response?.data || []).filter(
        (s: SubscriptionDto) => s.userId === this.selectedUser.userId
      );
    } catch (error) {
      console.error('Error loading subscriptions:', error);
    }
  }

  selectSubscriptionToEdit(subscription: SubscriptionDto) {
    this.selectedSubscriptionId = subscription.subscriptionId ?? null;
    this.subscriptionForm.patchValue(subscription);
    this.subscriptionForm.enable();
    this.isEditing = true;
  }

  async submit() {
    if (this.subscriptionForm.invalid) {
      this.snackBar.open('Please fix form errors.', 'Close', {
        duration: 3000,
      });
      return;
    }

    this.isLoading = true;
    try {
      const data = new SubscriptionDto();
      Object.assign(data, this.subscriptionForm.value);
      data.userId = this.selectedUser.userId;

      if (this.selectedSubscriptionId) {
        data.subscriptionId = this.selectedSubscriptionId;
        await this.subscriptionClient.update(data).toPromise();
        this.snackBar.open('Subscription updated successfully!', 'Close', {
          duration: 3000,
        });
      } else {
        data.subscriptionId = 0;
        await this.subscriptionClient.add(data).toPromise();
        this.snackBar.open('Subscription created successfully!', 'Close', {
          duration: 3000,
        });
      }

      await this.loadUserSubscriptions();
      this.resetForm();
    } catch (error) {
      this.snackBar.open('Error saving subscription.', 'Close', {
        duration: 3000,
      });
    } finally {
      this.isLoading = false;
    }
  }

  async deleteSubscription() {
    if (!this.selectedSubscriptionId) return;
    this.isLoading = true;
    try {
      await this.subscriptionClient
        .delete({
          subscriptionId: this.selectedSubscriptionId,
        } as SubscriptionDto)
        .toPromise();
      this.snackBar.open('Subscription deleted successfully!', 'Close', {
        duration: 3000,
      });
      await this.loadUserSubscriptions();
      this.resetForm();
    } catch (error) {
      this.snackBar.open('Error deleting subscription.', 'Close', {
        duration: 3000,
      });
    } finally {
      this.isLoading = false;
    }
  }

  resetForm() {
    this.selectedSubscriptionId = null;
    this.isEditing = false;
    const currentDate = Math.floor(Date.now() / 1000);
    const endDate = currentDate + 30 * 24 * 60 * 60;
    this.subscriptionForm.reset({
      subServiceId: null,
      discount: 0,
      startDate: currentDate,
      endDate,
      isActive: true,
      tenantId: this.tenantId,
    });

    // Disable form if there are existing subscriptions
    if (this.subscriptions.length > 0) {
      this.subscriptionForm.disable();
    } else {
      this.subscriptionForm.enable();
    }
  }

  getFormattedDate(timestamp: number): string {
    return (
      this.datePipe.transform(new Date(timestamp * 1000), 'mediumDate') || ''
    );
  }

  get hasSubscriptions(): boolean {
    return this.subscriptions.length > 0;
  }

  getSubServiceName(subServiceId: number): string {
    return this.subServiceNames[subServiceId] || 'Unknown';
  }
  private async getPrice(subServiceId: number): Promise<number> {
    try {
      const subService = await firstValueFrom(
        this.subServiceClient.getById(subServiceId)
      );
      return subService?.data?.price ?? 0;
    } catch (error) {
      console.error('Failed to fetch price for subservice:', error);
      return 0;
    }
  }
  get calculatedPrice(): number {
    const subServiceId = this.subscriptionForm.get('subServiceId')?.value;
    const discount = this.subscriptionForm.get('discount')?.value || 0;
    const subService = this.subServices.find(
      (s) => s.subServiceId === subServiceId
    );
    const basePrice = subService?.price || 0;
    return basePrice - (basePrice * discount) / 100;
  }
}
