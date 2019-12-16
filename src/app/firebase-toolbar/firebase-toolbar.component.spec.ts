import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FirebaseToolbarComponent } from './firebase-toolbar.component';

describe('FirebaseToolbarComponent', () => {
  let component: FirebaseToolbarComponent;
  let fixture: ComponentFixture<FirebaseToolbarComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ FirebaseToolbarComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FirebaseToolbarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
