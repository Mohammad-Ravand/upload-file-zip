<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('uploaded_files_log', function (Blueprint $table) {
            $table->id();
            $table->string('original_name');
            $table->string('stored_name')->nullable();
            $table->string('mime_type')->nullable();
            $table->unsignedBigInteger('size');
            $table->string('disk')->nullable();
            $table->string('path')->nullable();
            $table->string('route')->nullable();
            $table->string('ip')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('uploaded_files_log');
    }
};
