import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UpdateSubServiceComponent } from './update-sub-service.component';

describe('UpdateSubServiceComponent', () => {
  let component: UpdateSubServiceComponent;
  let fixture: ComponentFixture<UpdateSubServiceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UpdateSubServiceComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UpdateSubServiceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
