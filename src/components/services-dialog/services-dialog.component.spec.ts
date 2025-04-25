import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ServicesDialogComponent } from './services-dialog.component';

describe('ServicesDialogComponent', () => {
  let component: ServicesDialogComponent;
  let fixture: ComponentFixture<ServicesDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ServicesDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ServicesDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
