import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AccountInformation } from './account-information';

describe('AccountInformation', () => {
  let component: AccountInformation;
  let fixture: ComponentFixture<AccountInformation>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AccountInformation]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AccountInformation);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
