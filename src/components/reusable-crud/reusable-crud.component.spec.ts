import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReusableCrudComponent } from './reusable-crud.component';

describe('ReusableCrudComponent', () => {
  let component: ReusableCrudComponent;
  let fixture: ComponentFixture<ReusableCrudComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReusableCrudComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReusableCrudComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
