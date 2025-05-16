import { Component, viewChild } from '@angular/core';
import { LineChartComponent } from '../../layout/line-chart/line-chart.component';
import { BrowserModule } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { PieChartComponent } from '../../layout/pie-chart/pie-chart.component';
import { MatMenuTrigger, MatMenu } from '@angular/material/menu';
import { MatProgressBar } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ChartComponent } from 'chart.js';
import { CardComponent } from '../../layout/card/card.component';
import { ApexOptions, NgApexchartsModule } from 'ng-apexcharts';
import { MatTabsModule } from '@angular/material/tabs';
import { ChartDB } from '../../data/chartDB';
@Component({
  selector: 'app-dashboard',
  imports: [
    LineChartComponent,
    CommonModule,
    PieChartComponent,
    CommonModule,
    NgApexchartsModule,
    CardComponent,
    MatProgressBar,
    MatMenuTrigger,
    MatMenu,
    MatTabsModule,
    MatTooltipModule,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent {
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

  // eslint-disable-next-line
  chartDB: any;

  // graph color change with theme color mode change
  preset = ['#4680FF'];
  monthlyColor = ['#4680FF', '#8996a4'];
  incomeColors = ['#4680FF', '#E58A00', '#2CA87F', '#b5ccff'];

  // constructor
  constructor() {
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

  income_card = [
    {
      background: 'bg-primary-500',
      item: 'Income',
      value: '$23,876',
      number: '+$763,43',
    },
    {
      background: 'bg-warning-500',
      item: 'Rent',
      value: '$23,876',
      number: '+$763,43',
    },
    {
      background: 'bg-success-500',
      item: 'Download',
      value: '$23,876',
      number: '+$763,43',
    },
    {
      background: 'bg-primary-200',
      item: 'Views',
      value: '$23,876',
      number: '+$763,43',
    },
  ];
}
