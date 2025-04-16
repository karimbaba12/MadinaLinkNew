import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RightToolbarComponent } from './right-toolbar.component';

describe('RightToolbarComponent', () => {
  let component: RightToolbarComponent;
  let fixture: ComponentFixture<RightToolbarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RightToolbarComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RightToolbarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
