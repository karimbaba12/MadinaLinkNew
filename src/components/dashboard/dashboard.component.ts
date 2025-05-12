import { Component } from '@angular/core';
import { LineChartComponent } from '../../layout/line-chart/line-chart.component';
import { BrowserModule } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { PieChartComponent } from '../../layout/pie-chart/pie-chart.component';


@Component({
  selector: 'app-dashboard',
  imports: [LineChartComponent , CommonModule , PieChartComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent {}
