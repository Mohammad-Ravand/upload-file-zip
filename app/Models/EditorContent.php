<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EditorContent extends Model
{
    protected $table = 'editor_contents';
    protected $fillable = ['title', 'content_json'];
}
