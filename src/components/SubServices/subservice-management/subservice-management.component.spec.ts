import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SubserviceManagementComponent } from './subservice-management.component';

describe('SubserviceManagementComponent', () => {
  let component: SubserviceManagementComponent;
  let fixture: ComponentFixture<SubserviceManagementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SubserviceManagementComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SubserviceManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
