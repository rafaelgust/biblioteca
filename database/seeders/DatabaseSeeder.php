<?php

namespace Database\Seeders;

use App\Models\Book;
use App\Models\Loan;
use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Popula o banco com dados de exemplo para desenvolvimento.
     *
     * Cria:
     * - 1 usuário principal para testes (test@example.com / password)
     * - 5 usuários adicionais
     * - 20 livros distribuídos entre os usuários
     * - Empréstimos variados (ativos, vencendo em breve, atrasados e devolvidos)
     */
    public function run(): void
    {
        // Usuário principal para login rápido em desenvolvimento
        $mainUser = User::factory()->create([
            'name' => 'Rafael Soares',
            'email' => 'test@example.com',
        ]);

        $users = User::factory(5)->create();
        $allUsers = $users->push($mainUser);

        // Clássicos da literatura brasileira com dados reais e capas
        $seederBooks = [
            [
                'title' => 'Dom Casmurro',
                'author' => 'Machado de Assis',
                'year' => 1899,
                'isbn' => '9788525406835',
                'description' => 'Narrado em primeira pessoa por Bento Santiago, o romance investiga a suposta traição de sua esposa Capitu com seu melhor amigo Escobar. Considerado uma das maiores obras da literatura brasileira, o livro explora ciúme, memória e a ambiguidade da verdade.',
                'cover_image' => 'covers/dom-casmurro.jpg',
            ],
            [
                'title' => 'Memórias Póstumas de Brás Cubas',
                'author' => 'Machado de Assis',
                'year' => 1881,
                'isbn' => '9788525410665',
                'description' => 'Um defunto autor narra suas memórias com ironia e pessimismo. Marco do Realismo brasileiro, o romance rompe com as convenções narrativas da época ao apresentar digressões filosóficas, capítulos curtos e um narrador não confiável.',
                'cover_image' => 'covers/memorias-postumas.jpg',
            ],
            [
                'title' => 'Grande Sertão: Veredas',
                'author' => 'Guimarães Rosa',
                'year' => 1956,
                'isbn' => '9788520923252',
                'description' => 'Riobaldo, ex-jagunço, narra sua travessia pelo sertão mineiro em um longo monólogo. A obra-prima de Guimarães Rosa reinventa a língua portuguesa ao misturar erudição e fala sertaneja, explorando temas como o bem e o mal, o amor e o pacto com o diabo.',
                'cover_image' => 'covers/grande-sertao.jpg',
            ],
            [
                'title' => 'Capitães da Areia',
                'author' => 'Jorge Amado',
                'year' => 1937,
                'isbn' => '9788535914061',
                'description' => 'Retrata a vida de um grupo de meninos de rua que vivem em um trapiche abandonado em Salvador. Liderados por Pedro Bala, os Capitães da Areia sobrevivem de furtos e enfrentam a miséria, a violência e o preconceito da sociedade baiana dos anos 1930.',
                'cover_image' => 'covers/capitaes-da-areia.jpg',
            ],
            [
                'title' => 'O Cortiço',
                'author' => 'Aluísio Azevedo',
                'year' => 1890,
                'isbn' => '9788525409300',
                'description' => 'Romance naturalista que retrata a vida coletiva de um cortiço no Rio de Janeiro do século XIX. Através de personagens como João Romão, Bertoleza e Rita Baiana, a obra expõe as condições de vida das classes populares e as tensões raciais e sociais da época.',
                'cover_image' => 'covers/o-cortico.jpg',
            ],
            [
                'title' => 'Vidas Secas',
                'author' => 'Graciliano Ramos',
                'year' => 1938,
                'isbn' => '9788501005816',
                'description' => 'Narra a saga de Fabiano, sua esposa Sinhá Vitória, seus dois filhos e a cachorra Baleia pelo sertão nordestino. Com linguagem seca e direta, o romance denuncia a miséria e a desumanização causadas pela seca e pela exploração social.',
                'cover_image' => 'covers/vidas-secas.jpg',
            ],
            [
                'title' => 'A Hora da Estrela',
                'author' => 'Clarice Lispector',
                'year' => 1977,
                'isbn' => '9788532511454',
                'description' => 'Último romance de Clarice Lispector, conta a história de Macabéa, uma jovem nordestina semianalfabeta que sobrevive no Rio de Janeiro. A narrativa entrelaça a voz do narrador Rodrigo S.M. com a existência apagada da protagonista em uma reflexão sobre identidade e solidão.',
                'cover_image' => 'covers/a-hora-da-estrela.jpg',
            ],
            [
                'title' => 'Iracema',
                'author' => 'José de Alencar',
                'year' => 1865,
                'isbn' => '9788525406798',
                'description' => 'Romance indianista que narra o amor entre Iracema, índia tabajara, e Martim, colonizador português, no Ceará do século XVI. Escrito em prosa poética, o livro é uma alegoria da formação do povo brasileiro através do encontro entre culturas.',
                'cover_image' => 'covers/iracema.jpg',
            ],
            [
                'title' => 'O Alienista',
                'author' => 'Machado de Assis',
                'year' => 1882,
                'isbn' => '9788525411846',
                'description' => 'O Dr. Simão Bacamarte, médico renomado, funda um manicômio em Itaguaí e começa a internar os habitantes da cidade sob critérios cada vez mais amplos. A novela satírica questiona os limites entre razão e loucura, ciência e poder.',
                'cover_image' => 'covers/o-alienista.jpg',
            ],
            [
                'title' => 'Macunaíma',
                'author' => 'Mário de Andrade',
                'year' => 1928,
                'isbn' => '9788503009058',
                'description' => 'O "herói sem nenhum caráter" nasce índio na Amazônia, transforma-se em príncipe branco e viaja a São Paulo para recuperar um amuleto sagrado. Rapsódia modernista que mistura mitos indígenas, folclore brasileiro e crítica social em uma linguagem inventiva.',
                'cover_image' => 'covers/macunaima.jpg',
            ],
        ];

        // Cria livros brasileiros atribuídos ao usuário principal (com capas reais)
        foreach ($seederBooks as $bookData) {
            Book::factory()->create([
                'user_id' => $mainUser->id,
                ...$bookData,
            ]);
        }

        // Cria mais 10 livros aleatórios atribuídos a outros usuários
        foreach ($users as $user) {
            Book::factory(2)->create(['user_id' => $user->id]);
        }

        // Livros do mainUser (brasileiros) — outros usuários podem emprestá-los
        $mainUserBooks = Book::query()->where('user_id', $mainUser->id)->get();

        // Livros de outros usuários — mainUser pode emprestá-los
        $otherUsersBooks = Book::query()->whereNot('user_id', $mainUser->id)->get();

        // Empréstimo ativo do usuário principal (no prazo) — livro de outro usuário
        Loan::factory()->create([
            'user_id' => $mainUser->id,
            'book_id' => $otherUsersBooks[0]->id,
        ]);

        // Empréstimo prestes a vencer (dentro de 12h) — livro de outro usuário
        Loan::factory()->dueSoon()->create([
            'user_id' => $mainUser->id,
            'book_id' => $otherUsersBooks[1]->id,
        ]);

        // Empréstimo atrasado de outro usuário — livro do mainUser
        Loan::factory()->overdue()->create([
            'user_id' => $users[0]->id,
            'book_id' => $mainUserBooks[0]->id,
        ]);

        // Empréstimos ativos de outros usuários — livros do mainUser
        Loan::factory()->create([
            'user_id' => $users[1]->id,
            'book_id' => $mainUserBooks[1]->id,
        ]);

        Loan::factory()->create([
            'user_id' => $users[2]->id,
            'book_id' => $mainUserBooks[2]->id,
        ]);

        // Empréstimos já devolvidos (histórico)
        Loan::factory()->returned()->create([
            'user_id' => $mainUser->id,
            'book_id' => $otherUsersBooks[2]->id,
        ]);

        Loan::factory()->returned()->create([
            'user_id' => $users[0]->id,
            'book_id' => $mainUserBooks[3]->id,
        ]);
    }
}
