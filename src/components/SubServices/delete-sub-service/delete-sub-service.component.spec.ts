import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeleteSubServiceComponent } from './delete-sub-service.component';

describe('DeleteSubServiceComponent', () => {
  let component: DeleteSubServiceComponent;
  let fixture: ComponentFixture<DeleteSubServiceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DeleteSubServiceComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DeleteSubServiceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
