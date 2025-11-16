export interface Ticket {
  id: string;
  name: string;
  email: string;
  category: string;
  subject: string;
  message: string;
  attachmentUrl?: string;
  status: 'Open' | 'In Progress' | 'Closed';
  createdAt: string;
}

export interface FAQ {
  question: string;
  answer: string;
  category: string;
}

export interface CreateTicketDto {
  name: string;
  email: string;
  category: string;
  subject: string;
  message: string;
  attachmentUrl?: string;
}