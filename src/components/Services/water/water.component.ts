import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-water',
  imports: [],
  templateUrl: './water.component.html',
  styleUrl: './water.component.scss',
})
export class WaterComponent {
  @Input() tenantId!: number;
}
