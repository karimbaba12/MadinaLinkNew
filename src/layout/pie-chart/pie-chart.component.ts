import { Component, ChangeDetectorRef } from '@angular/core';
import { ChartOptions, ChartType, ChartData } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { UsersClient } from '../../../Services/api/api-client.service';
import { firstValueFrom, Observable } from 'rxjs';

@Component({
  selector: 'app-pie-chart',
  standalone: true,
  imports: [BaseChartDirective],
  templateUrl: './pie-chart.component.html',
  styleUrls: ['./pie-chart.component.scss'],
})
export class PieChartComponent {
  public isLoading = true;
  public errorMessage = '';

  public pieChartOptions: ChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          font: {
            size: 14,
          },
          padding: 20,
        },
      },
      tooltip: {
        callbacks: {
          label: function (tooltipItem: any) {
            const value = tooltipItem.raw;
            return ` ${value} users`;
          },
        },
      },
    },
  };

  public pieChartLabels = ['Electricity', 'Water', 'Internet'];

  public pieChartData: ChartData<'pie'> = {
    labels: this.pieChartLabels,
    datasets: [
      {
        data: [1, 1, 1],
        backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56'],
        label: 'Service Usage',
      },
    ],
  };

  public pieChartType: ChartType = 'pie';
  public pieChartLegend = true;
  public pieChartPlugins = [];

  constructor(
    private userClient: UsersClient,
    private cdr: ChangeDetectorRef
  ) {}

  async ngOnInit(): Promise<void> {
    console.log('Initializing pie chart component');
    this.isLoading = true;

    try {
      const [elec, water, internet] = await Promise.all([
        this.getServiceCount(1),
        this.getServiceCount(2),
        this.getServiceCount(3),
      ]);

      console.log('Received counts:', { elec, water, internet });

      this.updateChartData([elec, water, internet]);
    } catch (error) {
      console.error('Error loading chart data:', error);
      this.errorMessage = 'Failed to load data. Using sample values.';
      this.updateChartData([5, 10, 15]);
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
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
      return 1; // fallback
    }
  }

  private updateChartData(values: number[]): void {
    this.pieChartData = {
      labels: this.pieChartLabels,
      datasets: [
        {
          ...this.pieChartData.datasets[0],
          data: values,
        },
      ],
    };
    console.log('Updated chart data:', this.pieChartData);
  }
}
