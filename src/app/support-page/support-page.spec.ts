import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SupportPageComponent } from './support-page';
import { of } from 'rxjs';
import { SupportService } from '../services/support';
import { ActivatedRoute } from '@angular/router';

describe('SupportPageComponent', () => {
  let component: SupportPageComponent;
  let fixture: ComponentFixture<SupportPageComponent>;

  const supportServiceSpy = {
    getFaqs: jasmine.createSpy('getFaqs').and.returnValue(of([{ question: 'Q', answer: 'A' }])),
    getTickets: jasmine.createSpy('getTickets').and.returnValue(of([])),
    createTicket: jasmine.createSpy('createTicket').and.returnValue(of({
      id: 'T-1', name: 'N', email: 'e@x.com', category: 'Khác', subject: 'S', message: 'M', status: 'Open', createdAt: new Date().toISOString()
    }))
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SupportPageComponent],
      providers: [
        { provide: SupportService, useValue: supportServiceSpy },
        { provide: ActivatedRoute, useValue: { queryParamMap: of(new Map()) } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SupportPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('form invalid when empty', () => {
    expect(component.supportForm.valid).toBeFalse();
  });

  it('validates and submits', () => {
    component.supportForm.setValue({
      name: 'U',
      email: 'u@example.com',
      category: 'Khác',
      subject: 'S',
      message: '0123456789',
      attachment: null
    });
    component.submit();
    expect(supportServiceSpy.createTicket).toHaveBeenCalled();
  });
});