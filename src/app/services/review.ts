  import { Injectable } from '@angular/core';
  import { HttpClient, HttpErrorResponse } from '@angular/common/http';
  import { Observable, catchError, throwError } from 'rxjs';
  import { ReviewResponse, ReviewListItem } from '../interfaces/review';

  @Injectable({
    providedIn: 'root',
  })
  export class ReviewService {
    private apiUrl = 'http://localhost:3000/api/reviews';

    constructor(private http: HttpClient) {}

    private handleError(err: HttpErrorResponse): Observable<never> {
      return throwError(() => err.error || { message: 'Unknown error' });
    }

    registerReview(formData: FormData): Observable<ReviewResponse> {
      return this.http
        .post<ReviewResponse>(this.apiUrl, formData)
        .pipe(catchError(this.handleError));
    }

    getRecentReviews(serviceId?: string, limit: number = 5): Observable<ReviewListItem[]> {
      let url = `${this.apiUrl}/recent?limit=${limit}`;
      if (serviceId) {
        url += `&serviceId=${serviceId}`;
      }
      return this.http
        .get<ReviewListItem[]>(url)
        .pipe(catchError(this.handleError));
    }

    // Local helper: read reviews from local JSON (used by components that read demo data)
    getReviews(): Observable<any[]> {
      // Many templates in the project use a local JSON at assets/data/reviews.json
      // Return as any[] to be permissive with the demo data shape.
      return this.http.get<any[]>('assets/data/reviews.json').pipe(catchError(this.handleError));
    }
  }