import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PasswordSecurity } from './password-security';

describe('PasswordSecurity', () => {
  let component: PasswordSecurity;
  let fixture: ComponentFixture<PasswordSecurity>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PasswordSecurity]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PasswordSecurity);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
