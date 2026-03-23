import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    AlertTriangle,
    ArrowLeft,
    BookOpen,
    Calendar,
    Edit,
    Fingerprint,
    HandHelping,
    Loader2,
    Trash2,
    User as UserIcon,
} from 'lucide-react';
import { useState } from 'react';
import { BookCover } from '@/components/book-cover';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem, Book, User } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Livros', href: '/books' },
    { title: 'Detalhes', href: '#' },
];

function InfoItem({
    icon: Icon,
    label,
    value,
    mono,
}: {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    value: string;
    mono?: boolean;
}) {
    return (
        <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                <Icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="min-w-0">
                <p className="text-xs font-medium text-muted-foreground">{label}</p>
                <p className={`text-sm ${mono ? 'font-mono' : ''}`}>{value}</p>
            </div>
        </div>
    );
}

/**
 * Página de detalhes de um livro.
 * Acesso público. Exibe botões de ação apenas para o dono do livro.
 */
export default function BookShow({ book, activeLoansCount }: { book: Book; activeLoansCount: number }) {
    const { auth } = usePage().props;
    const isOwner = auth.user?.id === book.user_id;
    const reachedLimit = activeLoansCount >= 3;
    const flash = usePage().props as { success?: string; error?: string };
    const [borrowing, setBorrowing] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [showLendDialog, setShowLendDialog] = useState(false);
    const [eligibleUsers, setEligibleUsers] = useState<User[]>([]);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [lending, setLending] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

    function handleDelete() {
        setDeleting(true);
        setShowDeleteDialog(false);
        router.delete(`/books/${book.id}`, {
            onFinish: () => setDeleting(false),
        });
    }

    function handleBorrow() {
        setBorrowing(true);
        router.post(`/loans/${book.id}`, {}, {
            onFinish: () => setBorrowing(false),
        });
    }

    function handleOpenLendDialog() {
        setShowLendDialog(true);
        setLoadingUsers(true);
        setSelectedUserId(null);

        fetch(`/loans/${book.id}/eligible-borrowers`, {
            headers: { 'Accept': 'application/json' },
        })
            .then((res) => res.json())
            .then((users: User[]) => setEligibleUsers(users))
            .finally(() => setLoadingUsers(false));
    }

    function handleLend() {
        if (!selectedUserId) return;

        setLending(true);
        setShowLendDialog(false);

        router.post(`/loans/${book.id}`, { user_id: selectedUserId }, {
            onFinish: () => {
                setLending(false);
                setSelectedUserId(null);
            },
        });
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={book.title} />

            <div className="mx-auto w-full max-w-4xl space-y-6 p-4 lg:p-8">
                {/* Voltar */}
                <Link
                    href="/books"
                    className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Voltar ao acervo
                </Link>

                {/* Flash messages */}
                {flash.success && (
                    <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200">
                        {flash.success}
                    </div>
                )}
                {flash.error && (
                    <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200">
                        {flash.error}
                    </div>
                )}

                {/* Conteúdo principal */}
                <div className="flex flex-col gap-8 md:flex-row">
                    {/* Capa */}
                    <div className="flex flex-col items-center gap-4 md:items-start">
                        <BookCover
                            title={book.title}
                            coverUrl={book.cover_image_url}
                            size="xl"
                            className="shadow-lg"
                        />
                        <Badge
                            variant={book.active_loan ? 'destructive' : 'default'}
                            className="text-sm"
                        >
                            {book.active_loan ? 'Emprestado' : 'Disponível'}
                        </Badge>
                    </div>

                    {/* Detalhes */}
                    <div className="min-w-0 flex-1 space-y-6">
                        {/* Título e autor */}
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">
                                {book.title}
                            </h1>
                            <p className="mt-1 text-lg text-muted-foreground">
                                {book.author}
                            </p>
                        </div>

                        {/* Descrição */}
                        {book.description && (
                            <p className="leading-relaxed text-muted-foreground">
                                {book.description}
                            </p>
                        )}

                        <Separator />

                        {/* Informações */}
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <InfoItem
                                icon={Calendar}
                                label="Ano de Publicação"
                                value={String(book.year)}
                            />
                            <InfoItem
                                icon={Fingerprint}
                                label="ISBN"
                                value={book.isbn}
                                mono
                            />
                            <InfoItem
                                icon={UserIcon}
                                label="Cadastrado por"
                                value={book.user?.name ?? '—'}
                            />
                            {book.active_loan?.user && (
                                <InfoItem
                                    icon={BookOpen}
                                    label="Emprestado para"
                                    value={book.active_loan.user.name}
                                />
                            )}
                        </div>

                        {/* Alerta de limite */}
                        {auth.user && !isOwner && !book.active_loan && reachedLimit && (
                            <Card className="border-yellow-300 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950">
                                <CardContent className="flex items-center gap-3 p-4">
                                    <AlertTriangle className="h-5 w-5 shrink-0 text-yellow-600 dark:text-yellow-400" />
                                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                                        Você atingiu o limite de 3 empréstimos simultâneos.
                                        Devolva um livro para poder pegar outro emprestado.
                                    </p>
                                </CardContent>
                            </Card>
                        )}

                        {/* Ações */}
                        <div className="flex flex-wrap gap-3">
                            {auth.user && !isOwner && !book.active_loan && !reachedLimit && (
                                <Button
                                    size="lg"
                                    onClick={handleBorrow}
                                    disabled={borrowing}
                                >
                                    <BookOpen className="mr-2 h-4 w-4" />
                                    {borrowing
                                        ? 'Processando...'
                                        : 'Pegar Emprestado'}
                                </Button>
                            )}

                            {isOwner && !book.active_loan && (
                                <Button
                                    size="lg"
                                    onClick={handleOpenLendDialog}
                                    disabled={lending}
                                >
                                    <HandHelping className="mr-2 h-4 w-4" />
                                    {lending ? 'Processando...' : 'Emprestar Livro'}
                                </Button>
                            )}

                            {isOwner && (
                                <>
                                    <Link href={`/books/${book.id}/edit`}>
                                        <Button variant="outline" size="lg">
                                            <Edit className="mr-2 h-4 w-4" />
                                            Editar
                                        </Button>
                                    </Link>
                                    <Button
                                        variant="destructive"
                                        size="lg"
                                        disabled={deleting}
                                        onClick={() => setShowDeleteDialog(true)}
                                    >
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        {deleting ? 'Excluindo...' : 'Excluir'}
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Dialog de confirmação de exclusão */}
            <Dialog
                open={showDeleteDialog}
                onOpenChange={(v) => !v && setShowDeleteDialog(false)}
            >
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Excluir Livro</DialogTitle>
                        <DialogDescription>
                            Tem certeza que deseja remover o livro{' '}
                            <span className="font-medium text-foreground">
                                {book.title}
                            </span>
                            ? Esta ação não pode ser desfeita.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setShowDeleteDialog(false)}
                        >
                            Cancelar
                        </Button>
                        <Button variant="destructive" onClick={handleDelete}>
                            Excluir
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Dialog de empréstimo pelo dono */}
            <Dialog
                open={showLendDialog}
                onOpenChange={(v) => !v && setShowLendDialog(false)}
            >
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Emprestar Livro</DialogTitle>
                        <DialogDescription>
                            Selecione o usuário que receberá o livro{' '}
                            <span className="font-medium text-foreground">
                                {book.title}
                            </span>
                            .
                        </DialogDescription>
                    </DialogHeader>

                    {loadingUsers ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : eligibleUsers.length === 0 ? (
                        <div className="py-6 text-center text-sm text-muted-foreground">
                            Nenhum usuário elegível para empréstimo no momento.
                        </div>
                    ) : (
                        <div className="max-h-64 space-y-1 overflow-y-auto">
                            {eligibleUsers.map((user) => (
                                <button
                                    key={user.id}
                                    type="button"
                                    onClick={() => setSelectedUserId(user.id)}
                                    className={`w-full rounded-lg border p-3 text-left transition-colors ${
                                        selectedUserId === user.id
                                            ? 'border-primary bg-primary/5'
                                            : 'hover:bg-accent'
                                    }`}
                                >
                                    <p className="font-medium">{user.name}</p>
                                    <p className="text-sm text-muted-foreground">
                                        {user.email}
                                    </p>
                                </button>
                            ))}
                        </div>
                    )}

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setShowLendDialog(false)}
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleLend}
                            disabled={!selectedUserId}
                        >
                            Emprestar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
