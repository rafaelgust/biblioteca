<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreBookRequest;
use App\Http\Requests\UpdateBookRequest;
use App\Models\Book;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Controller responsável pelo CRUD de livros.
 *
 * A listagem e visualização são públicas.
 * Criação requer autenticação.
 * Edição e exclusão requerem ser o dono do livro (via BookPolicy).
 */
class BookController extends Controller
{
    /**
     * Lista todos os livros com busca e paginação.
     * Acesso público — não requer autenticação.
     */
    public function index(Request $request): Response
    {
        $books = Book::query()
            ->with('user:id,name')
            ->with('activeLoan')
            ->when($request->search, fn ($query, $search) => $query
                ->where(fn ($q) => $q
                    ->where('title', 'like', "%{$search}%")
                    ->orWhere('author', 'like', "%{$search}%")
                )
            )
            ->when($request->ownership === 'mine' && $request->user(), fn ($query) => $query
                ->where('user_id', $request->user()->id)
            )
            ->when($request->ownership === 'others' && $request->user(), fn ($query) => $query
                ->where('user_id', '!=', $request->user()->id)
            )
            ->latest()
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('books/index', [
            'books' => $books,
            'filters' => [
                'search' => $request->search,
                'ownership' => $request->ownership,
            ],
        ]);
    }

    /**
     * Formulário de cadastro de novo livro.
     */
    public function create(): Response
    {
        return Inertia::render('books/create');
    }

    /**
     * Persiste um novo livro no banco de dados.
     */
    public function store(StoreBookRequest $request): RedirectResponse
    {
        $data = $request->safe()->except('cover_image');

        if ($request->hasFile('cover_image')) {
            $data['cover_image'] = $request->file('cover_image')->store('covers', 'public');
        }

        $request->user()->books()->create($data);

        return redirect()->route('books.index')
            ->with('success', 'Livro cadastrado com sucesso.');
    }

    /**
     * Exibe os detalhes de um livro.
     * Acesso público — não requer autenticação.
     */
    public function show(Request $request, Book $book): Response
    {
        $book->load(['user:id,name', 'activeLoan.user:id,name']);

        $activeLoansCount = $request->user()
            ? $request->user()->activeLoans()->count()
            : 0;

        return Inertia::render('books/show', [
            'book' => $book,
            'activeLoansCount' => $activeLoansCount,
        ]);
    }

    /**
     * Formulário de edição de um livro.
     */
    public function edit(Book $book): Response
    {
        Gate::authorize('update', $book);

        return Inertia::render('books/edit', [
            'book' => $book,
        ]);
    }

    /**
     * Atualiza um livro existente.
     */
    public function update(UpdateBookRequest $request, Book $book): RedirectResponse
    {
        Gate::authorize('update', $book);

        $data = $request->safe()->except('cover_image');

        if ($request->hasFile('cover_image')) {
            if ($book->cover_image) {
                Storage::disk('public')->delete($book->cover_image);
            }

            $data['cover_image'] = $request->file('cover_image')->store('covers', 'public');
        }

        $book->update($data);

        return redirect()->route('books.show', $book)
            ->with('success', 'Livro atualizado com sucesso.');
    }

    /**
     * Remove um livro do acervo.
     */
    public function destroy(Book $book): RedirectResponse
    {
        Gate::authorize('delete', $book);

        if (! $book->isAvailable()) {
            return back()->with('error', 'Não é possível excluir um livro que está emprestado.');
        }

        if ($book->cover_image) {
            Storage::disk('public')->delete($book->cover_image);
        }

        $book->delete();

        return redirect()->route('books.index')
            ->with('success', 'Livro removido com sucesso.');
    }
}
