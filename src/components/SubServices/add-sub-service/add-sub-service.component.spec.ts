import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddSubServiceComponent } from './add-sub-service.component';

describe('AddSubServiceComponent', () => {
  let component: AddSubServiceComponent;
  let fixture: ComponentFixture<AddSubServiceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddSubServiceComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddSubServiceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
