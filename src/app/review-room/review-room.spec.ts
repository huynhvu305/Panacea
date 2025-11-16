import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';
import Swal from 'sweetalert2';

import { ReviewRoom } from './review-room';
import { ReviewService } from '../services/review';
import { UserService } from '../services/user';
import { AuthService } from '../services/auth';
import { ReviewListItem } from '../interfaces/review';

describe('ReviewRoom', () => {
  let component: ReviewRoom;
  let fixture: ComponentFixture<ReviewRoom>;
  let reviewService: jasmine.SpyObj<ReviewService>;
  let userService: jasmine.SpyObj<UserService>;
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;
  let activatedRoute: any;

  beforeEach(async () => {
    const reviewServiceSpy = jasmine.createSpyObj('ReviewService', ['registerReview', 'getRecentReviews']);
    const userServiceSpy = jasmine.createSpyObj('UserService', ['addPoints']);
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['isLoggedIn']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    activatedRoute = {
      queryParams: of({})
    };

    await TestBed.configureTestingModule({
      imports: [ReviewRoom, ReactiveFormsModule],
      providers: [
        { provide: ReviewService, useValue: reviewServiceSpy },
        { provide: UserService, useValue: userServiceSpy },
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: ActivatedRoute, useValue: activatedRoute },
      ],
    }).compileComponents();

    reviewService = TestBed.inject(ReviewService) as jasmine.SpyObj<ReviewService>;
    userService = TestBed.inject(UserService) as jasmine.SpyObj<UserService>;
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;

    // Mock isLoggedIn to return true by default
    authService.isLoggedIn.and.returnValue(true);
    
    // Mock localStorage
    spyOn(localStorage, 'getItem').and.callFake((key: string) => {
      if (key === 'CURRENT_USER_ID') return '1';
      return null;
    });
    spyOn(localStorage, 'setItem');
    spyOn(localStorage, 'removeItem');

    fixture = TestBed.createComponent(ReviewRoom);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form with default values', () => {
    component.initForm();
    expect(component.reviewForm).toBeDefined();
    expect(component.reviewForm.get('rating')?.value).toBe(0);
    expect(component.reviewForm.get('content')?.value).toBe('');
    expect(component.reviewForm.get('isPublic')?.value).toBe(true);
  });

  it('should redirect to login if not logged in on init', () => {
    authService.isLoggedIn.and.returnValue(false);
    component.ngOnInit();
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('should load reviews on init', () => {
    const mockReviews: ReviewListItem[] = [
      {
        id: '1',
        userId: 'user1',
        userName: 'Test User',
        rating: 5,
        content: 'Great room!',
        createdAt: new Date(),
      },
    ];
    reviewService.getRecentReviews.and.returnValue(of(mockReviews));
    
    component.ngOnInit();
    
    expect(reviewService.getRecentReviews).toHaveBeenCalled();
    expect(component.recentReviews.length).toBe(1);
  });

  it('should validate rating is required', () => {
    component.initForm();
    const ratingControl = component.reviewForm.get('rating');
    
    expect(ratingControl?.hasError('required')).toBeTruthy();
    
    ratingControl?.setValue(3);
    expect(ratingControl?.hasError('required')).toBeFalsy();
  });

  it('should validate content minimum length', () => {
    component.initForm();
    const contentControl = component.reviewForm.get('content');
    
    // Less than 20 characters
    contentControl?.setValue('Short');
    expect(contentControl?.hasError('minlength')).toBeTruthy();
    
    // Exactly 20 characters
    contentControl?.setValue('This is 20 chars long!');
    expect(contentControl?.hasError('minlength')).toBeFalsy();
    
    // More than 20 characters
    contentControl?.setValue('This is more than 20 characters long');
    expect(contentControl?.hasError('minlength')).toBeFalsy();
  });

  it('should set rating when setRating is called', () => {
    component.initForm();
    component.setRating(4);
    expect(component.reviewForm.get('rating')?.value).toBe(4);
    expect(component.reviewForm.get('rating')?.touched).toBeTruthy();
  });

  it('should mark all as touched and return if form is invalid on submit', () => {
    component.initForm();
    spyOn(component.reviewForm, 'markAllAsTouched');
    
    component.submitReview();
    
    expect(component.reviewForm.markAllAsTouched).toHaveBeenCalled();
    expect(reviewService.registerReview).not.toHaveBeenCalled();
  });

  it('should call registerReview when form is valid', () => {
    component.initForm();
    component.reviewForm.patchValue({
      rating: 5,
      content: 'This is a valid review content with more than 20 characters',
      isPublic: true,
    });
    
    const mockResponse = { success: true, pointsAdded: 10 };
    reviewService.registerReview.and.returnValue(of(mockResponse));
    // make addPoints return numeric total (service returns Observable<number>)
    userService.addPoints.and.returnValue(of(10));
    
    component.submitReview();
    
    expect(reviewService.registerReview).toHaveBeenCalled();
  });

  it('should handle successful review submission', (done) => {
    component.initForm();
    component.reviewForm.patchValue({
      rating: 5,
      content: 'This is a valid review content with more than 20 characters',
      isPublic: true,
    });
    
    const mockResponse = { success: true, pointsAdded: 10 };
    reviewService.registerReview.and.returnValue(of(mockResponse));
    userService.addPoints.and.returnValue(of(10));
    
    spyOn<any>(Swal, 'fire').and.returnValue(Promise.resolve({ isConfirmed: true }));
    
    component.submitReview();
    
    setTimeout(() => {
      expect(reviewService.registerReview).toHaveBeenCalled();
      expect(userService.addPoints).toHaveBeenCalledWith(10);
      done();
    }, 150);
  });

  it('should handle error on review submission', (done) => {
    component.initForm();
    component.reviewForm.patchValue({
      rating: 5,
      content: 'This is a valid review content with more than 20 characters',
      isPublic: true,
    });
    
    const mockError = { error: { message: 'Network error' } };
    reviewService.registerReview.and.returnValue(throwError(() => mockError));
    
    spyOn<any>(Swal, 'fire').and.returnValue(Promise.resolve({ isConfirmed: true }));
    
    component.submitReview();
    
    setTimeout(() => {
      expect(reviewService.registerReview).toHaveBeenCalled();
      expect(userService.addPoints).not.toHaveBeenCalled();
      done();
    }, 150);
  });

  it('should handle duplicate review error', (done) => {
    component.initForm();
    component.reviewForm.patchValue({
      rating: 5,
      content: 'This is a valid review content with more than 20 characters',
      isPublic: true,
    });
    
    const mockError = { error: { message: 'Duplicate review' } };
    reviewService.registerReview.and.returnValue(throwError(() => mockError));
    
    spyOn<any>(Swal, 'fire').and.returnValue(Promise.resolve({ isConfirmed: true }));
    
    component.submitReview();
    
    setTimeout(() => {
      expect(reviewService.registerReview).toHaveBeenCalled();
      done();
    }, 150);
  });

  it('should limit image uploads to 3 files', () => {
    component.initForm();
    const files: File[] = [];
    for (let i = 0; i < 5; i++) {
      const file = new File([''], `test${i}.webp`, { type: 'image/jpeg' });
      Object.defineProperty(file, 'size', { value: 1024 * 1024 }); // 1MB
      files.push(file);
    }
    
    spyOn<any>(Swal, 'fire').and.returnValue(Promise.resolve({ isConfirmed: true }));
    
    component.handleFiles(files);
    
    expect(component.selectedFiles.length).toBeLessThanOrEqual(3);
  });

  it('should validate image file size', () => {
    component.initForm();
    const largeFile = new File([''], 'large.webp', { type: 'image/jpeg' });
    Object.defineProperty(largeFile, 'size', { value: 3 * 1024 * 1024 }); // 3MB
    
    spyOn<any>(Swal, 'fire').and.returnValue(Promise.resolve({ isConfirmed: true }));
    component.handleFiles([largeFile]);
    
    expect(component.selectedFiles.length).toBe(0);
  });

  it('should save and load draft from localStorage', () => {
    component.initForm();
    component.reviewForm.patchValue({
      rating: 4,
      content: 'Draft content',
      isPublic: false,
    });
    
    component.saveDraft();
    expect(localStorage.setItem).toHaveBeenCalled();
    
    component.reviewForm.patchValue({ content: '' });
    component.loadDraft();
    
    expect(component.reviewForm.get('content')?.value).toBe('Draft content');
  });
});