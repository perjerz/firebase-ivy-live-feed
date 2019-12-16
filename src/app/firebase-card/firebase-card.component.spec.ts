import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FirebaseCardComponent } from './firebase-card.component';

describe('FirebaseCardComponent', () => {
  let component: FirebaseCardComponent;
  let fixture: ComponentFixture<FirebaseCardComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ FirebaseCardComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FirebaseCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
