<?php

namespace App\Http\Controllers;

use App\Models\Book;
use App\Models\Loan;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Controller responsável pela gestão de empréstimos.
 *
 * Regras de negócio:
 * - Máximo de 3 empréstimos ativos por usuário.
 * - Prazo de 2 dias para devolução.
 * - Livro deve estar disponível para empréstimo.
 * - Usuário não pode emprestar o próprio livro.
 * - Apenas o usuário que realizou o empréstimo pode devolvê-lo.
 */
class LoanController extends Controller
{
    /**
     * Painel de controle de empréstimos.
     * Exibe todos os empréstimos ativos com informações de usuário e livro.
     */
    public function index(Request $request): Response
    {
        $userId = $request->user()?->id;

        // Livros que o usuário pegou emprestado
        $borrowedLoans = Loan::query()
            ->with(['user:id,name,email', 'book:id,title,author,user_id', 'book.user:id,name'])
            ->whereNull('returned_at')
            ->where('user_id', $userId)
            ->latest('borrowed_at')
            ->paginate(10, ['*'], 'borrowed_page');

        // Livros que o usuário emprestou para outros (é dono do livro)
        $lentLoans = Loan::query()
            ->with(['user:id,name,email', 'book:id,title,author,user_id'])
            ->whereNull('returned_at')
            ->whereHas('book', fn ($q) => $q->where('user_id', $userId))
            ->latest('borrowed_at')
            ->paginate(10, ['*'], 'lent_page');

        // Contagem de empréstimos ativos do usuário logado para controle de limite
        $activeLoansCount = $request->user()
            ? $request->user()->activeLoans()->count()
            : 0;

        return Inertia::render('loans/index', [
            'borrowedLoans' => $borrowedLoans,
            'lentLoans' => $lentLoans,
            'activeLoansCount' => $activeLoansCount,
        ]);
    }

    /**
     * Retorna usuários elegíveis para empréstimo de um livro.
     *
     * Elegíveis: usuários com menos de 3 empréstimos ativos,
     * excluindo o dono do livro.
     * Apenas o dono do livro pode consultar esta lista.
     */
    public function eligibleBorrowers(Request $request, Book $book): JsonResponse
    {
        if ($book->user_id !== $request->user()->id) {
            abort(403);
        }

        // IDs de usuários que já atingiram o limite de 3 empréstimos ativos
        $maxedOutUserIds = Loan::query()
            ->whereNull('returned_at')
            ->groupBy('user_id')
            ->havingRaw('count(*) >= 3')
            ->pluck('user_id');

        $users = User::query()
            ->where('id', '!=', $book->user_id)
            ->whereNotIn('id', $maxedOutUserIds)
            ->orderBy('name')
            ->get(['id', 'name', 'email']);

        return response()->json($users);
    }

    /**
     * Registra um novo empréstimo.
     *
     * Dois fluxos possíveis:
     * 1. Usuário pega emprestado para si (sem user_id).
     * 2. Dono empresta para outro usuário (com user_id).
     *
     * Valida as regras de negócio:
     * - Livro deve estar disponível (sem empréstimo ativo).
     * - Quem pega emprestado não pode ser o dono do livro.
     * - Usuário alvo não pode ter mais de 3 empréstimos ativos.
     *
     * Usa transação com lock pessimista para evitar race conditions
     * onde dois usuários tentam emprestar o mesmo livro simultaneamente.
     */
    public function store(Request $request, Book $book): RedirectResponse
    {
        $authUser = $request->user();

        // Fluxo: dono empresta para outro usuário
        if ($request->has('user_id')) {
            if ($book->user_id !== $authUser->id) {
                return back()->with('error', 'Apenas o dono do livro pode emprestá-lo para outro usuário.');
            }

            $borrower = User::query()->find($request->integer('user_id'));

            if (! $borrower || $borrower->id === $authUser->id) {
                return back()->with('error', 'Usuário inválido para empréstimo.');
            }
        } else {
            // Fluxo: usuário pega emprestado para si
            if ($book->user_id === $authUser->id) {
                return back()->with('error', 'Você não pode pegar emprestado um livro que você mesmo cadastrou.');
            }

            $borrower = $authUser;
        }

        // Verifica o limite de 3 empréstimos ativos
        if ($borrower->activeLoans()->count() >= 3) {
            $message = $borrower->id === $authUser->id
                ? 'Você já possui 3 livros emprestados. Devolva um livro antes de realizar um novo empréstimo.'
                : "O usuário {$borrower->name} já possui 3 livros emprestados.";

            return back()->with('error', $message);
        }

        // Transação com lock para evitar race condition
        try {
            DB::transaction(function () use ($book, $borrower) {
                $lockedBook = Book::query()->lockForUpdate()->find($book->id);

                if (! $lockedBook->isAvailable()) {
                    throw new \RuntimeException('indisponível');
                }

                $now = now();

                Loan::query()->create([
                    'user_id' => $borrower->id,
                    'book_id' => $lockedBook->id,
                    'borrowed_at' => $now,
                    'due_at' => $now->copy()->addDays(2),
                ]);
            });
        } catch (\RuntimeException) {
            return back()->with('error', 'Este livro não está disponível para empréstimo.');
        }

        // Dono que empresta volta para a página do livro; quem pega emprestado vai para seus empréstimos
        $isOwnerLending = $request->has('user_id');

        return redirect()->route($isOwnerLending ? 'books.show' : 'loans.index', $isOwnerLending ? $book : [])
            ->with('success', $isOwnerLending
                ? "Livro \"{$book->title}\" emprestado para {$borrower->name} com sucesso."
                : "Empréstimo do livro \"{$book->title}\" realizado com sucesso."
            );
    }

    /**
     * Registra a devolução de um empréstimo.
     * Apenas o usuário que realizou o empréstimo pode devolvê-lo.
     */
    public function returnBook(Request $request, Loan $loan): RedirectResponse
    {
        // Apenas o próprio usuário pode devolver seu empréstimo
        if ($loan->user_id !== $request->user()->id) {
            return back()->with('error', 'Você só pode devolver seus próprios empréstimos.');
        }

        if ($loan->isReturned()) {
            return back()->with('error', 'Este empréstimo já foi devolvido.');
        }

        $loan->update(['returned_at' => now()]);

        return redirect()->route('loans.index')
            ->with('success', "Livro \"{$loan->book->title}\" devolvido com sucesso.");
    }
}
