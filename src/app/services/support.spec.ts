import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { SupportService } from './support';
import { CreateTicketDto, FAQ, Ticket } from '../interfaces/support';

describe('SupportService', () => {
  let service: SupportService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });
    service = TestBed.inject(SupportService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('getFaqs should GET faqs', (done) => {
    const mockFaqs: FAQ[] = [{ question: 'Q1', answer: 'A1', category: 'Khác' }];
    service.getFaqs().subscribe((faqs) => {
      expect(faqs.length).toBe(1);
      expect(faqs[0].question).toBe('Q1');
      done();
    });
    const req = httpMock.expectOne('assets/data/support-faqs.json');
    expect(req.request.method).toBe('GET');
    req.flush(mockFaqs);
  });

  it('getTickets should GET then stream', (done) => {
    const mockTickets: Ticket[] = [
      { id: 'T1', name: 'N', email: 'e', category: 'Khác', subject: 'S', message: 'M', status: 'Open', createdAt: new Date().toISOString() }
    ];
    service.getTickets().subscribe((tickets) => {
      expect(tickets.length).toBe(1);
      done();
    });
    const req = httpMock.expectOne('assets/data/support-tickets.json');
    expect(req.request.method).toBe('GET');
    req.flush(mockTickets);
  });

  it('createTicket should return ticket with delay and push to subject', (done) => {
    // prime list
    service.getTickets().subscribe();
    httpMock.expectOne('assets/data/support-tickets.json').flush([]);

    const dto: CreateTicketDto = { name: 'A', email: 'a@x.com', category: 'Khác', subject: 'S', message: '0123456789' };
    const start = Date.now();

    service.createTicket(dto).subscribe((ticket) => {
      expect(ticket.id).toContain('T-');
      expect(ticket.status).toBe('Open');
      expect(Date.now() - start).toBeGreaterThanOrEqual(700);
      done();
    });
  });
});