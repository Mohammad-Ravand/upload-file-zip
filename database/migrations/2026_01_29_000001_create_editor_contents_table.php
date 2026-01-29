<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('editor_contents', function (Blueprint $table) {
            $table->id();
            $table->string('title')->nullable();
            $table->longText('content_json');
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('editor_contents');
    }
};
