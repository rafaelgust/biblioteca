import { Head, Link, usePage } from '@inertiajs/react';
import {
    ArrowRight,
    BookCopy,
    BookOpen,
    Library,
    LayoutDashboard,
    LogIn,
    Search,
    Users,
} from 'lucide-react';
import { useState } from 'react';
import { BookCover } from '@/components/book-cover';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { dashboard, login, register } from '@/routes';
import type { Book } from '@/types';

function BookModal({
    book,
    open,
    onClose,
}: {
    book: Book;
    open: boolean;
    onClose: () => void;
}) {
    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader className="sr-only">
                    <DialogTitle>{book.title}</DialogTitle>
                    <DialogDescription>
                        Detalhes do livro {book.title}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
                    <BookCover
                        title={book.title}
                        coverUrl={book.cover_image_url}
                        size="lg"
                    />
                    <div className="min-w-0 flex-1 space-y-3">
                        <div>
                            <h2 className="text-xl font-bold leading-tight">
                                {book.title}
                            </h2>
                            <p className="mt-1 text-sm text-muted-foreground">
                                {book.author} &middot; {book.year}
                            </p>
                        </div>

                        <Badge
                            variant={
                                book.active_loan ? 'destructive' : 'default'
                            }
                        >
                            {book.active_loan ? 'Emprestado' : 'Disponível'}
                        </Badge>

                        {book.description && (
                            <>
                                <Separator />
                                <p className="text-sm leading-relaxed text-muted-foreground">
                                    {book.description}
                                </p>
                            </>
                        )}

                        {book.isbn && (
                            <p className="text-xs text-muted-foreground">
                                ISBN:{' '}
                                <span className="font-mono">{book.isbn}</span>
                            </p>
                        )}

                        {book.user?.name && (
                            <p className="text-xs text-muted-foreground">
                                Cadastrado por{' '}
                                <span className="font-medium">
                                    {book.user.name}
                                </span>
                            </p>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

type Stats = {
    totalBooks: number;
    totalUsers: number;
    totalLoans: number;
};

export default function Welcome({
    canRegister = true,
    books = [],
    stats,
}: {
    canRegister?: boolean;
    books?: Book[];
    stats: Stats;
}) {
    const { auth } = usePage().props;
    const [selectedBook, setSelectedBook] = useState<Book | null>(null);

    return (
        <>
            <Head title="Biblioteca" />

            <div className="min-h-screen bg-background text-foreground">
                {/* Header */}
                <header className="fixed top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md">
                    <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 lg:px-8">
                        <Link href="/" className="flex items-center gap-2.5">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                                <Library className="h-4 w-4 text-primary-foreground" />
                            </div>
                            <span className="text-lg font-bold tracking-tight">
                                Biblioteca
                            </span>
                        </Link>

                        <nav className="flex items-center gap-2">
                            {auth.user ? (
                                <Link href={dashboard()}>
                                    <Button size="sm">
                                        <LayoutDashboard className="mr-2 h-4 w-4" />
                                        Painel
                                    </Button>
                                </Link>
                            ) : (
                                <>
                                    <Link href={login()}>
                                        <Button variant="ghost" size="sm">
                                            <LogIn className="mr-2 h-4 w-4" />
                                            Entrar
                                        </Button>
                                    </Link>
                                    {canRegister && (
                                        <Link href={register()}>
                                            <Button size="sm">
                                                Cadastrar
                                            </Button>
                                        </Link>
                                    )}
                                </>
                            )}
                        </nav>
                    </div>
                </header>

                {/* Hero Section */}
                <section className="relative overflow-hidden pt-16">
                    <div className="absolute inset-0 -z-10 bg-gradient-to-b from-primary/5 via-primary/3 to-transparent" />
                    <div className="absolute top-20 -left-20 -z-10 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
                    <div className="absolute top-40 -right-20 -z-10 h-72 w-72 rounded-full bg-primary/5 blur-3xl" />

                    <div className="mx-auto max-w-6xl px-4 py-20 lg:px-8 lg:py-28">
                        <div className="mx-auto max-w-3xl text-center">
                            <div className="mb-6 inline-flex items-center gap-2 rounded-full border bg-background px-4 py-1.5 text-sm text-muted-foreground shadow-sm">
                                <BookOpen className="h-4 w-4 text-primary" />
                                Sistema de Gerenciamento de Biblioteca
                            </div>

                            <h1 className="mb-6 text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
                                Explore, empreste e gerencie seu acervo
                            </h1>

                            <p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground">
                                Navegue pelo catálogo de livros, realize
                                empréstimos com controle de prazos e receba
                                alertas automáticos de devolução. Tudo em um só
                                lugar.
                            </p>

                            <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
                                <Link href="/books">
                                    <Button size="lg" className="gap-2">
                                        <Search className="h-4 w-4" />
                                        Explorar Acervo
                                    </Button>
                                </Link>
                                {!auth.user && canRegister && (
                                    <Link href={register()}>
                                        <Button
                                            variant="outline"
                                            size="lg"
                                            className="gap-2"
                                        >
                                            Criar Conta Gratuita
                                            <ArrowRight className="h-4 w-4" />
                                        </Button>
                                    </Link>
                                )}
                            </div>
                        </div>

                        {/* Stats */}
                        <div className="mx-auto mt-16 grid max-w-xl grid-cols-3 gap-8">
                            <div className="text-center">
                                <div className="text-3xl font-bold text-primary">
                                    {stats.totalBooks}
                                </div>
                                <div className="mt-1 text-sm text-muted-foreground">
                                    Livros no acervo
                                </div>
                            </div>
                            <div className="text-center">
                                <div className="text-3xl font-bold text-primary">
                                    {stats.totalUsers}
                                </div>
                                <div className="mt-1 text-sm text-muted-foreground">
                                    Usuários cadastrados
                                </div>
                            </div>
                            <div className="text-center">
                                <div className="text-3xl font-bold text-primary">
                                    {stats.totalLoans}
                                </div>
                                <div className="mt-1 text-sm text-muted-foreground">
                                    Empréstimos realizados
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Livros recentes */}
                <section className="border-t bg-muted/30">
                    <div className="mx-auto max-w-6xl px-4 py-16 lg:px-8">
                        <div className="mb-8 flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-bold">
                                    Adicionados Recentemente
                                </h2>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    Últimos livros cadastrados no acervo
                                </p>
                            </div>
                            <Link href="/books">
                                <Button variant="outline" size="sm">
                                    Ver todos
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </Link>
                        </div>

                        {books.length === 0 ? (
                            <div className="rounded-xl border border-dashed p-16 text-center">
                                <BookOpen className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
                                <p className="text-lg font-medium text-muted-foreground">
                                    Nenhum livro cadastrado ainda
                                </p>
                                <p className="mt-1 text-sm text-muted-foreground/70">
                                    Cadastre-se e seja o primeiro a adicionar um
                                    livro ao acervo.
                                </p>
                            </div>
                        ) : (
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                {books.map((book) => (
                                    <button
                                        key={book.id}
                                        type="button"
                                        onClick={() => setSelectedBook(book)}
                                        className="group relative flex flex-col overflow-hidden rounded-xl border bg-card text-left shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
                                    >
                                        <div className="flex items-center gap-3 p-4">
                                            <BookCover
                                                title={book.title}
                                                coverUrl={
                                                    book.cover_image_url
                                                }
                                                size="sm"
                                            />
                                            <div className="min-w-0 flex-1">
                                                <h3 className="truncate text-sm font-semibold leading-tight group-hover:text-primary">
                                                    {book.title}
                                                </h3>
                                                <p className="mt-1 truncate text-xs text-muted-foreground">
                                                    {book.author}
                                                </p>
                                                <p className="mt-0.5 text-xs text-muted-foreground/70">
                                                    {book.year}
                                                </p>
                                                <Badge
                                                    variant={
                                                        book.active_loan
                                                            ? 'destructive'
                                                            : 'default'
                                                    }
                                                    className="mt-2 text-[10px]"
                                                >
                                                    {book.active_loan
                                                        ? 'Emprestado'
                                                        : 'Disponível'}
                                                </Badge>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </section>

                {/* Como funciona */}
                <section className="border-t">
                    <div className="mx-auto max-w-6xl px-4 py-16 lg:px-8">
                        <div className="mb-12 text-center">
                            <h2 className="text-2xl font-bold">
                                Como Funciona
                            </h2>
                            <p className="mt-2 text-muted-foreground">
                                Simples, rápido e organizado
                            </p>
                        </div>

                        <div className="grid gap-8 sm:grid-cols-3">
                            <div className="group text-center">
                                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 transition-colors group-hover:bg-primary/20">
                                    <Search className="h-6 w-6 text-primary" />
                                </div>
                                <h3 className="mb-2 font-semibold">
                                    1. Explore o Acervo
                                </h3>
                                <p className="text-sm leading-relaxed text-muted-foreground">
                                    Navegue pela coleção de livros, pesquise por
                                    título e veja os detalhes de cada obra sem
                                    precisar de cadastro.
                                </p>
                            </div>

                            <div className="group text-center">
                                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 transition-colors group-hover:bg-primary/20">
                                    <BookCopy className="h-6 w-6 text-primary" />
                                </div>
                                <h3 className="mb-2 font-semibold">
                                    2. Faça seu Empréstimo
                                </h3>
                                <p className="text-sm leading-relaxed text-muted-foreground">
                                    Com sua conta criada, empreste até 3 livros
                                    simultaneamente, com prazo de 2 dias para
                                    devolução.
                                </p>
                            </div>

                            <div className="group text-center">
                                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 transition-colors group-hover:bg-primary/20">
                                    <Users className="h-6 w-6 text-primary" />
                                </div>
                                <h3 className="mb-2 font-semibold">
                                    3. Acompanhe Tudo
                                </h3>
                                <p className="text-sm leading-relaxed text-muted-foreground">
                                    Veja seus empréstimos no painel, receba
                                    alertas por e-mail antes do vencimento e
                                    registre devoluções facilmente.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* CTA */}
                {!auth.user && (
                    <section className="border-t">
                        <div className="mx-auto max-w-6xl px-4 py-16 lg:px-8">
                            <div className="relative overflow-hidden rounded-2xl bg-primary px-8 py-12 text-center text-primary-foreground sm:px-16">
                                <div className="absolute top-0 -left-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
                                <div className="absolute -right-10 bottom-0 h-40 w-40 rounded-full bg-white/10 blur-2xl" />

                                <h2 className="relative mb-3 text-2xl font-bold sm:text-3xl">
                                    Pronto para começar?
                                </h2>
                                <p className="relative mb-6 text-primary-foreground/80">
                                    Crie sua conta gratuita e tenha acesso
                                    completo ao sistema de empréstimos.
                                </p>
                                <div className="relative flex flex-col items-center justify-center gap-3 sm:flex-row">
                                    {canRegister && (
                                        <Link href={register()}>
                                            <Button
                                                size="lg"
                                                variant="secondary"
                                                className="gap-2"
                                            >
                                                Criar Conta
                                                <ArrowRight className="h-4 w-4" />
                                            </Button>
                                        </Link>
                                    )}
                                    <Link href={login()}>
                                        <Button
                                            size="lg"
                                            variant="ghost"
                                            className="text-primary-foreground hover:bg-white/10 hover:text-primary-foreground"
                                        >
                                            Já tenho conta
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </section>
                )}

                {/* Footer */}
                <footer className="border-t py-8">
                    <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 sm:flex-row lg:px-8">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Library className="h-4 w-4" />
                            <span>
                                Biblioteca &copy;{' '}
                                {new Date().getFullYear()}
                            </span>
                        </div>
                        <div className="flex gap-6 text-sm text-muted-foreground">
                            <Link
                                href="/books"
                                className="transition-colors hover:text-foreground"
                            >
                                Acervo
                            </Link>
                            <Link
                                href={login()}
                                className="transition-colors hover:text-foreground"
                            >
                                Entrar
                            </Link>
                        </div>
                    </div>
                </footer>
            </div>

            {selectedBook && (
                <BookModal
                    book={selectedBook}
                    open={!!selectedBook}
                    onClose={() => setSelectedBook(null)}
                />
            )}
        </>
    );
}
