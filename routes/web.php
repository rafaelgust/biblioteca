<?php

use App\Http\Controllers\BookController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\LoanController;
use Illuminate\Support\Facades\Route;
use Laravel\Fortify\Features;

Route::get('/', function () {
    $totalBooks = \App\Models\Book::query()->count();
    $totalUsers = \App\Models\User::query()->count();
    $totalLoans = \App\Models\Loan::query()->count();

    $books = \App\Models\Book::query()
        ->with('user:id,name')
        ->with('activeLoan')
        ->latest()
        ->take(8)
        ->get();

    return \Inertia\Inertia::render('welcome', [
        'canRegister' => Features::enabled(Features::registration()),
        'books' => $books,
        'stats' => [
            'totalBooks' => $totalBooks,
            'totalUsers' => $totalUsers,
            'totalLoans' => $totalLoans,
        ],
    ]);
})->name('home');

// Rotas públicas de livros (listagem e detalhes)
Route::get('books', [BookController::class, 'index'])->name('books.index');

// Rotas protegidas (criação, edição, exclusão de livros + empréstimos)
Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', DashboardController::class)->name('dashboard');

    // Livros — criação antes da rota com parâmetro {book}
    Route::get('books/create', [BookController::class, 'create'])->name('books.create');
    Route::post('books', [BookController::class, 'store'])->name('books.store');
    Route::get('books/{book}/edit', [BookController::class, 'edit'])->name('books.edit');
    Route::put('books/{book}', [BookController::class, 'update'])->name('books.update');
    Route::delete('books/{book}', [BookController::class, 'destroy'])->name('books.destroy');

    // Empréstimos
    Route::get('loans', [LoanController::class, 'index'])->name('loans.index');
    Route::get('loans/{book}/eligible-borrowers', [LoanController::class, 'eligibleBorrowers'])->name('loans.eligible-borrowers');
    Route::post('loans/{book}', [LoanController::class, 'store'])->name('loans.store');
    Route::patch('loans/{loan}/return', [LoanController::class, 'returnBook'])->name('loans.return');
});

// Rota pública de detalhes (após as rotas auth para evitar conflito com "create")
Route::get('books/{book}', [BookController::class, 'show'])->name('books.show');

require __DIR__.'/settings.php';
