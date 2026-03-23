import type { User } from './auth';

export type Book = {
    id: number;
    user_id: number;
    title: string;
    author: string;
    isbn: string;
    year: number;
    description: string | null;
    cover_image: string | null;
    cover_image_url: string | null;
    created_at: string;
    updated_at: string;
    user?: Pick<User, 'id' | 'name'>;
    active_loan?: Loan | null;
};

export type Loan = {
    id: number;
    user_id: number;
    book_id: number;
    borrowed_at: string;
    due_at: string;
    returned_at: string | null;
    notified: boolean;
    created_at: string;
    updated_at: string;
    user?: Pick<User, 'id' | 'name' | 'email'>;
    book?: Pick<Book, 'id' | 'title' | 'author' | 'cover_image_url'>;
};

export type PaginatedData<T> = {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: Array<{
        url: string | null;
        label: string;
        active: boolean;
    }>;
};
