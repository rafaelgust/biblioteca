<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('books', function (Blueprint $table) {
            $table->renameColumn('cover_url', 'cover_image');
        });
    }

    public function down(): void
    {
        Schema::table('books', function (Blueprint $table) {
            $table->renameColumn('cover_image', 'cover_url');
        });
    }
};
