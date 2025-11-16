import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BlogListPage } from './blog-list-page';

describe('BlogListPage', () => {
  let component: BlogListPage;
  let fixture: ComponentFixture<BlogListPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BlogListPage]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BlogListPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});