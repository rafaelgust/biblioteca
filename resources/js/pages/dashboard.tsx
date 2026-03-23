import { Head, Link, router } from '@inertiajs/react';
import {
    AlertTriangle,
    BookCheck,
    BookCopy,
    BookOpen,
    Clock,
    Library,
} from 'lucide-react';
import { useState } from 'react';
import { BookCover } from '@/components/book-cover';
import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { formatDate, isDueSoon, isOverdue } from '@/lib/loan-helpers';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import type { Book, BreadcrumbItem, Loan } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: dashboard() },
];

type Stats = {
    totalBooks: number;
    activeLoans: number;
    availableBooks: number;
};

function StatCard({
    title,
    value,
    icon: Icon,
    description,
}: {
    title: string;
    value: number;
    icon: React.ComponentType<{ className?: string }>;
    description?: string;
}) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                {description && (
                    <p className="text-xs text-muted-foreground">
                        {description}
                    </p>
                )}
            </CardContent>
        </Card>
    );
}

export default function Dashboard({
    stats,
    myLoans,
    myLoansCount,
    recentBooks,
}: {
    stats: Stats;
    myLoans: Loan[];
    myLoansCount: number;
    recentBooks: Book[];
}) {
    const [returningId, setReturningId] = useState<number | null>(null);
    const [confirmLoan, setConfirmLoan] = useState<Loan | null>(null);

    function handleReturn() {
        if (!confirmLoan) return;

        setReturningId(confirmLoan.id);
        setConfirmLoan(null);

        router.patch(`/loans/${confirmLoan.id}/return`, {}, {
            onFinish: () => setReturningId(null),
        });
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />

            <div className="mx-auto w-full max-w-5xl space-y-6 p-4 lg:p-8">
                <Heading
                    title="Painel"
                    description="Visão geral da biblioteca e dos seus empréstimos."
                />

                {/* Estatísticas */}
                <div className="grid gap-4 md:grid-cols-3">
                    <StatCard
                        title="Total de Livros"
                        value={stats.totalBooks}
                        icon={Library}
                        description="no acervo da biblioteca"
                    />
                    <StatCard
                        title="Empréstimos Ativos"
                        value={stats.activeLoans}
                        icon={BookCopy}
                        description="em andamento na plataforma"
                    />
                    <StatCard
                        title="Livros Disponíveis"
                        value={stats.availableBooks}
                        icon={BookOpen}
                        description="prontos para empréstimo"
                    />
                </div>

                {/* Meus Empréstimos */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>Meus Empréstimos</CardTitle>
                                <CardDescription>
                                    Seus livros emprestados no momento
                                </CardDescription>
                            </div>
                            <Badge variant="outline" className="text-sm">
                                {myLoansCount}/3
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {myLoans.length === 0 ? (
                            <div className="rounded-lg border border-dashed p-8 text-center">
                                <BookCheck className="mx-auto mb-2 h-10 w-10 text-muted-foreground/50" />
                                <p className="text-sm text-muted-foreground">
                                    Você não possui empréstimos ativos.
                                </p>
                                <Link href="/books">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="mt-3"
                                    >
                                        Explorar Acervo
                                    </Button>
                                </Link>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {myLoans.map((loan) => {
                                    const overdue = isOverdue(loan.due_at);
                                    const dueSoon = isDueSoon(loan.due_at);
                                    const isReturning =
                                        returningId === loan.id;

                                    return (
                                        <div
                                            key={loan.id}
                                            className={`flex items-center gap-4 rounded-lg border p-3 ${overdue
                                                ? 'border-red-300 bg-red-50/50 dark:border-red-800 dark:bg-red-950/30'
                                                : dueSoon
                                                    ? 'border-yellow-300 bg-yellow-50/50 dark:border-yellow-800 dark:bg-yellow-950/30'
                                                    : ''
                                                }`}
                                        >
                                            <BookCover
                                                title={
                                                    loan.book?.title ?? ''
                                                }
                                                coverUrl={
                                                    (
                                                        loan.book as
                                                        | Book
                                                        | undefined
                                                    )?.cover_image_url
                                                }
                                                size="sm"
                                            />
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate font-medium">
                                                    {loan.book?.title}
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                    {loan.book?.author}
                                                </p>
                                                <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                                                    <Clock className="h-3 w-3" />
                                                    <span>
                                                        Devolver até{' '}
                                                        {formatDate(
                                                            loan.due_at,
                                                        )}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex shrink-0 items-center gap-2">
                                                {overdue && (
                                                    <Badge variant="destructive">
                                                        <AlertTriangle className="mr-1 h-3 w-3" />
                                                        Atrasado
                                                    </Badge>
                                                )}
                                                {dueSoon && !overdue && (
                                                    <Badge
                                                        variant="secondary"
                                                        className="border-yellow-500 bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                                                    >
                                                        <Clock className="mr-1 h-3 w-3" />
                                                        Vence em breve
                                                    </Badge>
                                                )}
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    disabled={isReturning}
                                                    onClick={() =>
                                                        setConfirmLoan(loan)
                                                    }
                                                >
                                                    {isReturning
                                                        ? 'Devolvendo...'
                                                        : 'Devolver'}
                                                </Button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Adicionados Recentemente */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>Adicionados Recentemente</CardTitle>
                                <CardDescription>
                                    Últimos livros cadastrados no acervo
                                </CardDescription>
                            </div>
                            <Link href="/books">
                                <Button variant="outline" size="sm">
                                    Ver todos
                                </Button>
                            </Link>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {recentBooks.length === 0 ? (
                            <div className="rounded-lg border border-dashed p-8 text-center">
                                <BookOpen className="mx-auto mb-2 h-10 w-10 text-muted-foreground/50" />
                                <p className="text-sm text-muted-foreground">
                                    Nenhum livro cadastrado ainda.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {recentBooks.map((book) => (
                                    <Link
                                        key={book.id}
                                        href={`/books/${book.id}`}
                                        className="flex items-center gap-4 rounded-lg border p-3 transition-colors hover:bg-accent"
                                    >
                                        <BookCover
                                            title={book.title}
                                            coverUrl={book.cover_image_url}
                                            size="sm"
                                        />
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate font-medium">
                                                {book.title}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                {book.author} &middot;{' '}
                                                {book.year}
                                            </p>
                                            {book.user?.name && (
                                                <p className="text-xs text-muted-foreground">
                                                    por {book.user.name}
                                                </p>
                                            )}
                                        </div>
                                        <Badge
                                            variant={
                                                book.active_loan
                                                    ? 'destructive'
                                                    : 'default'
                                            }
                                            className="shrink-0"
                                        >
                                            {book.active_loan
                                                ? 'Emprestado'
                                                : 'Disponível'}
                                        </Badge>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Dialog de confirmação de devolução */}
            <Dialog
                open={!!confirmLoan}
                onOpenChange={(v) => !v && setConfirmLoan(null)}
            >
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Confirmar Devolução</DialogTitle>
                        <DialogDescription>
                            Deseja registrar a devolução do livro{' '}
                            <span className="font-medium text-foreground">
                                {confirmLoan?.book?.title}
                            </span>
                            ?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setConfirmLoan(null)}
                        >
                            Cancelar
                        </Button>
                        <Button onClick={handleReturn}>
                            Confirmar Devolução
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
