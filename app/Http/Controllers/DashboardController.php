<?php

namespace App\Http\Controllers;

use App\Models\Book;
use App\Models\Loan;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $user = $request->user();

        $totalBooks = Book::query()->count();
        $activeLoans = Loan::query()->whereNull('returned_at')->count();
        $availableBooks = $totalBooks - $activeLoans;

        $myLoans = $user->activeLoans()
            ->with('book:id,title,author,cover_image')
            ->latest('borrowed_at')
            ->get();

        $recentBooks = Book::query()
            ->with('user:id,name')
            ->with('activeLoan')
            ->latest()
            ->take(5)
            ->get();

        return Inertia::render('dashboard', [
            'stats' => [
                'totalBooks' => $totalBooks,
                'activeLoans' => $activeLoans,
                'availableBooks' => $availableBooks,
            ],
            'myLoans' => $myLoans,
            'myLoansCount' => $myLoans->count(),
            'recentBooks' => $recentBooks,
        ]);
    }
}
