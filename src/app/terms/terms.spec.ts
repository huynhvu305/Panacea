import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TermsComponent } from './terms';

describe('TermsComponent', () => {
  let component: TermsComponent;
  let fixture: ComponentFixture<TermsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TermsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TermsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and render heading', () => {
    expect(component).toBeTruthy();
    const h1 = fixture.nativeElement.querySelector('.banner h1') as HTMLElement;
    expect(h1?.textContent?.toLowerCase()).toContain('điều khoản');
  });
});
