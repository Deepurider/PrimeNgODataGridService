import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OdataGridServiceComponent } from './odata-grid-service.component';

describe('OdataGridServiceComponent', () => {
  let component: OdataGridServiceComponent;
  let fixture: ComponentFixture<OdataGridServiceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OdataGridServiceComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OdataGridServiceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
