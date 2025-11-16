import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PrivacyComponent } from './privacy';

describe('PrivacyComponent', () => {
  let component: PrivacyComponent;
  let fixture: ComponentFixture<PrivacyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PrivacyComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PrivacyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and render heading', () => {
    expect(component).toBeTruthy();
    const h1 = fixture.nativeElement.querySelector('.banner h1') as HTMLElement;
    expect(h1?.textContent?.toLowerCase()).toContain('quyền riêng tư');
  });
});

