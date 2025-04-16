import { Component } from '@angular/core';
import { ElectricityComponent } from "../Services/electricity/electricity.component";

@Component({
  selector: 'app-dashboard',
  imports: [ElectricityComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent {

}
