import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { ChartTypeRegistry } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';

@Component({
  standalone: true,
  imports: [BaseChartDirective],
  selector: 'app-line-charts',
  templateUrl: './line-chart.component.html',
  styleUrl: './line-chart.component.scss',
})
export class LineChartComponent {
  public SystemName: string = 'MF1';
  firstCopy = false;
  ChartType: keyof ChartTypeRegistry = 'bar';
  // public ChartType = 'bar';
  public lineChartData: Array<number> = [1, 8, 49];

  public labelMFL: Array<any> = [
    { data: this.lineChartData, label: this.SystemName },
  ];
  // labels
  public lineChartLabels: Array<any> = [
    '2018-01-29 10:00:00',
    '2018-01-29 10:27:00',
    '2018-01-29 10:28:00',
  ];

  constructor() {}

  public lineChartOptions: any = {
    responsive: true,
    scales: {
      yAxes: [
        {
          ticks: {
            max: 60,
            min: 0,
          },
        },
      ],
      xAxes: [{}],
    },
    plugins: {
      datalabels: {
        display: true,
        align: 'top',
        anchor: 'end',
        color: '#2756B3',
        // color: '#222',

        font: {
          family: 'FontAwesome',
          size: 14,
        },
      },
      deferred: false,
    },
  };

  _lineChartColors: Array<any> = [
    {
      backgroundColor: 'red',
      borderColor: 'red',
      pointBackgroundColor: 'red',
      pointBorderColor: 'red',
      pointHoverBackgroundColor: 'red',
      pointHoverBorderColor: 'red',
    },
  ];

  public chartClicked(e: any): void {
    // console.log(e);
  }
  public chartHovered(e: any): void {
    // console.log(e);
  }
}
