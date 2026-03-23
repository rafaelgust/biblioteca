import { Head, Link, router, usePage } from '@inertiajs/react';
import { BookOpen, BookPlus, Search, X } from 'lucide-react';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { BookCover } from '@/components/book-cover';
import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem, Book, PaginatedData } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Livros', href: '/books' }];

type OwnershipFilter = 'all' | 'mine' | 'others';

const ownershipOptions: { value: OwnershipFilter; label: string }[] = [
    { value: 'all', label: 'Todos os Livros' },
    { value: 'others', label: 'Livros de Outros' },
    { value: 'mine', label: 'Meus Livros' },
];

/**
 * Página de listagem de livros com busca, filtro e paginação.
 * Acesso público — usuários não autenticados podem visualizar.
 */
export default function BooksIndex({
    books,
    filters,
}: {
    books: PaginatedData<Book>;
    filters: { search?: string; ownership?: string };
}) {
    const { auth } = usePage().props;
    const [search, setSearch] = useState(filters.search ?? '');
    const currentOwnership = (filters.ownership as OwnershipFilter) || 'all';

    function handleSearch(e: FormEvent) {
        e.preventDefault();
        router.get(
            '/books',
            {
                search: search || undefined,
                ownership: currentOwnership !== 'all' ? currentOwnership : undefined,
            },
            { preserveState: true },
        );
    }

    function handleOwnershipChange(value: OwnershipFilter) {
        router.get(
            '/books',
            {
                search: filters.search || undefined,
                ownership: value !== 'all' ? value : undefined,
            },
            { preserveState: true },
        );
    }

    function handleClear() {
        setSearch('');
        router.get('/books');
    }

    const hasActiveFilters = filters.search || (filters.ownership && filters.ownership !== 'all');

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Livros" />

            <div className="mx-auto w-full max-w-5xl space-y-6 p-4 lg:p-8">
                <div className="flex items-center justify-between">
                    <Heading
                        title="Acervo de Livros"
                        description="Explore os livros disponíveis na biblioteca."
                    />

                    {auth.user && (
                        <Link href="/books/create">
                            <Button>
                                <BookPlus className="mr-2 h-4 w-4" />
                                Novo Livro
                            </Button>
                        </Link>
                    )}
                </div>

                {/* Busca e filtros */}
                <div className="space-y-3">
                    <form onSubmit={handleSearch} className="flex gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                type="text"
                                placeholder="Buscar por título ou autor..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                        <Button type="submit" variant="secondary">
                            Buscar
                        </Button>
                        {hasActiveFilters && (
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={handleClear}
                            >
                                <X className="mr-1 h-4 w-4" />
                                Limpar
                            </Button>
                        )}
                    </form>

                    {/* Filtro de propriedade — apenas para usuários logados */}
                    {auth.user && (
                        <div className="flex gap-1 rounded-lg border bg-muted/50 p-1">
                            {ownershipOptions.map((option) => (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => handleOwnershipChange(option.value)}
                                    className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                                        currentOwnership === option.value
                                            ? 'bg-background text-foreground shadow-sm'
                                            : 'text-muted-foreground hover:text-foreground'
                                    }`}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Resultado e contagem */}
                <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                        {books.total === 0
                            ? 'Nenhum livro encontrado'
                            : books.total === 1
                              ? '1 livro encontrado'
                              : `${books.total} livros encontrados`}
                    </p>
                    {books.last_page > 1 && (
                        <p className="text-sm text-muted-foreground">
                            Página {books.current_page} de {books.last_page}
                        </p>
                    )}
                </div>

                {/* Grid de livros */}
                {books.data.length === 0 ? (
                    <div className="rounded-lg border border-dashed p-12 text-center">
                        <BookOpen className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
                        <p className="text-muted-foreground">
                            {filters.search
                                ? 'Nenhum livro encontrado para esta busca.'
                                : currentOwnership === 'mine'
                                  ? 'Você ainda não cadastrou nenhum livro.'
                                  : 'Nenhum livro cadastrado ainda.'}
                        </p>
                        {auth.user && !filters.search && (
                            <Link href="/books/create">
                                <Button variant="outline" size="sm" className="mt-4">
                                    <BookPlus className="mr-2 h-4 w-4" />
                                    Cadastrar Livro
                                </Button>
                            </Link>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {books.data.map((book) => (
                            <Link
                                key={book.id}
                                href={`/books/${book.id}`}
                                className="group"
                            >
                                <Card className="h-full transition-shadow hover:shadow-md">
                                    <CardContent className="flex gap-4 p-4">
                                        <BookCover
                                            title={book.title}
                                            coverUrl={book.cover_image_url}
                                            size="md"
                                        />
                                        <div className="min-w-0 flex-1 space-y-1.5">
                                            <div className="flex items-start justify-between gap-2">
                                                <h3 className="line-clamp-2 font-semibold leading-tight group-hover:text-primary">
                                                    {book.title}
                                                </h3>
                                            </div>
                                            <p className="text-sm text-muted-foreground">
                                                {book.author}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {book.year}
                                                {book.user?.name && (
                                                    <> &middot; por {book.user.name}</>
                                                )}
                                            </p>
                                            {book.description && (
                                                <p className="line-clamp-2 text-xs text-muted-foreground/80">
                                                    {book.description}
                                                </p>
                                            )}
                                            <Badge
                                                variant={
                                                    book.active_loan
                                                        ? 'destructive'
                                                        : 'default'
                                                }
                                                className="mt-1"
                                            >
                                                {book.active_loan
                                                    ? 'Emprestado'
                                                    : 'Disponível'}
                                            </Badge>
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        ))}
                    </div>
                )}

                {/* Paginação */}
                {books.last_page > 1 && (
                    <nav className="flex items-center justify-center gap-1">
                        {books.links.map((link, index) => (
                            <Button
                                key={index}
                                variant={link.active ? 'default' : 'ghost'}
                                size="sm"
                                disabled={!link.url}
                                onClick={() =>
                                    link.url &&
                                    router.get(
                                        link.url,
                                        {},
                                        { preserveState: true },
                                    )
                                }
                            >
                                <span
                                    dangerouslySetInnerHTML={{
                                        __html: link.label,
                                    }}
                                />
                            </Button>
                        ))}
                    </nav>
                )}
            </div>
        </AppLayout>
    );
}
