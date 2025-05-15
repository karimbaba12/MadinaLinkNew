import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NewConfirmComponent } from './new-confirm.component';

describe('NewConfirmComponent', () => {
  let component: NewConfirmComponent;
  let fixture: ComponentFixture<NewConfirmComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NewConfirmComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NewConfirmComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
