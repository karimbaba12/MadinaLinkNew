import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-internet',
  imports: [],
  templateUrl: './internet.component.html',
  styleUrl: './internet.component.scss',
})
export class InternetComponent {
  @Input() tenantId!: number;
}
