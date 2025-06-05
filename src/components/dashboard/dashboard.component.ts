import { Component, ViewChild, viewChild } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { MatMenuTrigger, MatMenu } from '@angular/material/menu';
import { MatProgressBar } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ChartComponent } from 'chart.js';
import { CardComponent } from '../../layout/card/card.component';
import { ApexOptions, NgApexchartsModule } from 'ng-apexcharts';
import { MatTabsModule } from '@angular/material/tabs';
import { ChartDB } from '../../data/chartDB';
import { MatButtonModule } from '@angular/material/button';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import {
  TaskClient,
  TaskDto,
  TransactionClient,
  UsersClient,
} from '../../../Services/api/api-client.service';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { forkJoin, catchError, of, firstValueFrom } from 'rxjs';
import {
  MatError,
  MatFormField,
  MatFormFieldModule,
  MatLabel,
} from '@angular/material/form-field';
import { MatCheckbox, MatCheckboxModule } from '@angular/material/checkbox';
import { MatIcon } from '@angular/material/icon';
import {
  MatSlideToggle,
  MatSlideToggleModule,
} from '@angular/material/slide-toggle';
import { MatInputModule } from '@angular/material/input';
import { AuthService } from '../../../Services/Auth/auth.service';
@Component({
  selector: 'app-dashboard',
  imports: [
    MatIcon,
    MatError,
    CommonModule,
    CommonModule,
    NgApexchartsModule,
    CardComponent,
    MatMenuTrigger,
    MatMenu,
    MatTabsModule,
    MatTooltipModule,
    MatButtonModule,
    MatFormField,
    ReactiveFormsModule,
    MatLabel,
    MatCheckbox,
    MatPaginator,
    MatSort,
    MatTableModule,
    MatSlideToggle,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule,
    MatSlideToggleModule,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  taskForm: FormGroup;
  displayedColumns: string[] = [
    'taskId',
    'taskDescription',
    'roleId',
    'createdAt',
    'isCompleted',
    'actions',
  ];
  dataSource = new MatTableDataSource<TaskDto>();
  allTasks: TaskDto[] = [];
  selectedTabIndex = 0;
  roles = [
    { id: 1, name: 'User' },
    { id: 4, name: 'Client' },
  ];
  selectedRoles: number[] = [];
  completedTasks: TaskDto[] = [];
  pendingTasks: TaskDto[] = [];
  isAdmin = true;
  electricityNumber = 0;
  [x: string]: any;
  // public props
  chart = viewChild<ChartComponent>('chart');
  earningChart: Partial<ApexOptions>;
  pageViewChart: Partial<ApexOptions>;
  totalTaskChart: Partial<ApexOptions>;
  downloadChart: Partial<ApexOptions>;
  monthlyRevenueChart: Partial<ApexOptions>;
  totalTasksChart: Partial<ApexOptions>;
  pendingTasksChart: Partial<ApexOptions>;
  totalIncomeChart: Partial<ApexOptions>;
  totalTasks = 0;
  transactionNumber = 0;
  Electricity = 0;
  Water = 0;
  Internet = 0;
  // eslint-disable-next-line
  chartDB: any;

  // graph color change with theme color mode change
  preset = ['#4680FF'];
  monthlyColor = ['red', '#4680FF', '#2CA87F'];
  incomeColors = ['#4680FF', '#E58A00', '#2CA87F', '#b5ccff'];

  // constructor
  constructor(
    private fb: FormBuilder,
    private taskService: TaskClient,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private authService: AuthService,
    private taskClient: TaskClient,
    private transactionClient: TransactionClient,
    private userClient: UsersClient
  ) {
    this.chartDB = ChartDB;
    const {
      earningChart,
      totalTaskChart,
      downloadChart,
      totalTasksChart,
      pageViewChart,
      monthlyRevenueChart,
      pendingTasksChart,
      totalIncomeChart,
    } = this.chartDB;
    this.earningChart = earningChart;
    this.pageViewChart = pageViewChart;
    this.totalTaskChart = totalTaskChart;
    this.downloadChart = downloadChart;
    this.monthlyRevenueChart = monthlyRevenueChart;
    this.totalTasksChart = totalTasksChart;
    this.pendingTasksChart = pendingTasksChart;
    this.totalIncomeChart = totalIncomeChart;
    this.taskForm = this.fb.group({
      taskDescription: ['', Validators.required],
      roleIds: [[]],
    });

    this.loadTasks();
    this.fetchRole();
    this.fetchTaskNumbers();
    this.getMonthlyDebit();
  }
  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }
  loadTasks() {
    this.taskService.getAll().subscribe({
      next: (response) => {
        if (response.success) {
          this.allTasks = response.data ?? [];
          this.completedTasks = this.allTasks.filter(
            (task) => task.isCompleted
          );
          this.pendingTasks = this.allTasks.filter((task) => !task.isCompleted);
          this.filterTasks();
        }
      },
      error: (err) => {
        this.snackBar.open('Error loading tasks', 'Close', { duration: 3000 });
      },
    });
  }

  filterTasks() {
    switch (this.selectedTabIndex) {
      case 0:
        this.dataSource.data = [...this.allTasks];
        break;
      case 1:
        this.dataSource.data = [...this.completedTasks];
        break;
      case 2:
        this.dataSource.data = [...this.pendingTasks];
        break;
    }
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  onTabChange(index: number) {
    this.selectedTabIndex = index;
    this.filterTasks();
  }
  async fetchRole() {
    const roleName = await this.authService.getUserRoleName();
    console.log(roleName);

    if (roleName === 'Admin') {
      this.isAdmin = false;
    } else {
      this.isAdmin = true;
    }
  }
  private async getServiceCount(serviceId: number): Promise<number> {
    try {
      const result = await firstValueFrom(
        this.userClient.getUsersHasService(serviceId)
      );
      const userCount = result?.data?.userCount ?? 0;
      console.log(`Service ${serviceId} user count:`, userCount);
      return userCount;
    } catch (error) {
      console.error(`Error fetching service ${serviceId}:`, error);
      return 1;
    }
  }
  async fetchAllServiceCounts() {
    this.Electricity = await this.getServiceCount(1);
    this.Water = await this.getServiceCount(2);
    this.Internet = await this.getServiceCount(3);
  }
  fetchTaskNumbers() {
    this.taskClient.getAll().subscribe((response) => {
      this.totalTasks = response.data ? response.data.length : 0;
      console.log(this.totalTasks);
    });
  }
  getMonthlyDebit() {
    this.transactionClient.getMonthlyDebit().subscribe((response) => {
      this.transactionNumber = response.data ? response.data : 0;
      console.log(this.transactionNumber);
    });
  }
  createTask() {
    if (this.taskForm.invalid || this.selectedRoles.length === 0) {
      this.snackBar.open('Please fill all required fields', 'Close', {
        duration: 3000,
        panelClass: ['error-snackbar'],
      });
      return;
    }

    const tasksToCreate = this.selectedRoles.map((roleId) => {
      const task = new TaskDto({
        taskDescription: this.taskForm.value.taskDescription,
        roleId: roleId,
        isCompleted: false,
        tenantId: 0,
        userId: 0, // Assuming userId is not required for creation
        createdAt: 0, // Set current date as createdAt
        taskId: 0,
      });
      return this.taskService.add(task).pipe(
        catchError((err) => {
          console.error('Error creating task:', err);
          return of(null);
        })
      );
    });

    forkJoin(tasksToCreate).subscribe({
      next: (responses) => {
        const success = responses.every((r) => r?.success);
        if (success) {
          this.snackBar.open('Tasks created successfully', 'Close', {
            duration: 3000,
            panelClass: ['success-snackbar'],
          });
          this.resetForm();
          this.loadTasks();
        }
      },
      error: (err) => {
        this.snackBar.open('Error creating tasks', 'Close', {
          duration: 3000,
          panelClass: ['error-snackbar'],
        });
      },
    });
  }

  resetForm() {
    this.taskForm.reset();
    this.selectedRoles = [];
    this.taskForm.markAsUntouched();
    this.taskForm.markAsPristine();
  }

  toggleTaskCompletion(task: TaskDto) {
    const updatedTask = new TaskDto();
    updatedTask.taskId = task.taskId;
    updatedTask.taskDescription = task.taskDescription;
    updatedTask.roleId = task.roleId;
    updatedTask.userId = task.userId;
    updatedTask.tenantId = task.tenantId;
    updatedTask.createdAt = task.createdAt;
    updatedTask.isCompleted = !task.isCompleted;

    // const updatedTask: TaskDto = {
    //   ...task,
    //   isCompleted: !task.isCompleted
    // };
    this.taskService.update(updatedTask).subscribe({
      next: (response) => {
        if (response.success) {
          this.loadTasks();
        }
      },
      error: (err) => {
        this.snackBar.open('Error updating task', 'Close', {
          duration: 3000,
        });
      },
    });
  }

  deleteTask(taskId: number) {
    if (confirm('Are you sure you want to delete this task?')) {
      this.taskService.deleteById(taskId).subscribe({
        next: (response) => {
          if (response.success) {
            this.snackBar.open('Task deleted successfully', 'Close', {
              duration: 3000,
            });
            this.loadTasks();
          }
        },
        error: (err) => {
          this.snackBar.open('Error deleting task', 'Close', {
            duration: 3000,
          });
        },
      });
    }
  }
  getRoleName(roleId: number): string {
    const role = this.roles.find((r) => r.id === roleId);
    return role ? role.name : 'Unknown';
  }
  toggleRoleSelection(roleId: number) {
    const index = this.selectedRoles.indexOf(roleId);
    if (index === -1) {
      this.selectedRoles.push(roleId);
    } else {
      this.selectedRoles.splice(index, 1);
    }
  }

  
  // public method
  project = [
    {
      title: 'Invoice Generator',
    },
    {
      title: 'Package Upgrades',
    },
    {
      title: 'Figma Auto Layout',
    },
  ];

  List_transaction = [
    {
      icon: 'AI',
      name: 'Apple Inc.',
      time: '#ABLE-PRO-T00232',
      amount: '$210,000',
      amount_position: 'ti ti-arrow-down-left',
      percentage: '10.6%',
      amount_type: 'text-warn-500',
    },
    {
      icon: 'SM',
      tooltip: '10,000 Tracks',
      name: 'Spotify Music',
      time: '#ABLE-PRO-T10232',
      amount: '- 10,000',
      amount_position: 'ti ti-arrow-up-right',
      percentage: '30.6%',
      amount_type: 'text-success-500',
    },
    {
      icon: 'MD',
      bg: 'text-primary-500 bg-primary-50',
      tooltip: '143 Posts',
      name: 'Medium',
      time: '06:30 pm',
      amount: '-26',
      amount_position: 'ti ti-arrows-left-right',
      percentage: '5%',
      amount_type: 'text-warning-500',
    },
    {
      icon: 'U',
      tooltip: '143 Posts',
      name: 'Uber',
      time: '08:40 pm',
      amount: '+210,000',
      amount_position: 'ti ti-arrow-up-right',
      percentage: '10.6%',
      amount_type: 'text-success-500',
    },
    {
      icon: 'OC',
      bg: 'text-warning-500 bg-warning-50',
      tooltip: '143 Posts',
      name: 'Ola Cabs',
      time: '07:40 pm',
      amount: '+210,000',
      amount_position: 'ti ti-arrow-up-right',
      percentage: '10.6%',
      amount_type: 'text-success-500',
    },
  ];
}
