import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AllUsersWithServiceComponent } from './all-users-with-service.component';

describe('AllUsersWithServiceComponent', () => {
  let component: AllUsersWithServiceComponent;
  let fixture: ComponentFixture<AllUsersWithServiceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AllUsersWithServiceComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AllUsersWithServiceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
