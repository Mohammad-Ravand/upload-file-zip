<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Storage as FacadesStorage;
use Illuminate\Http\Request;

Route::get('/', function () {
    return view('welcome');
});

// upload  zip file
Route::get('upload-zip', function () {
    return view('upload-source/upload');
});

Route::post('upload-zip', function (Request $request) {
    try {
        $file = $request->file('zip');

        $result = FacadesStorage::disk('public')->put('upload-zip/', $file);

        return redirect('upload-success');
    } catch (\Throwable $th) {
        // throw $th;
        return redirect('upload-error')->with('message', $th->getMessage());
    }
})->name('post-upload-zip');

Route::get('upload-success',function(){
    return view('upload-source/upload-success');
});

Route::get('upload-error',function(){
    return view('upload-source/upload-error');
});

use App\Models\EditorContent;
use App\Events\EditorUpdated;

Route::get('editor', function () {
    return view('editor');
});

// list documents
Route::get('editors', function () {
    $items = EditorContent::orderBy('updated_at', 'desc')->get();
    return view('editors_index', ['items' => $items]);
});

// edit existing document
Route::get('editor/{id}/edit', function ($id) {
    $item = EditorContent::findOrFail($id);
    return view('editor', ['initial' => $item]);
});

Route::post('editor', function (Request $request) {
    $data = $request->validate([
        'content_json' => 'required|string',
        'title' => 'nullable|string'
    ]);

    $model = EditorContent::create([
        'title' => $data['title'] ?? null,
        'content_json' => $data['content_json']
    ]);

    return redirect('/editor/' . $model->id);
});

// update existing document
Route::patch('editor/{id}', function (Request $request, $id) {
    $data = $request->validate([
        'content_json' => 'required|string',
        'title' => 'nullable|string'
    ]);

    $item = EditorContent::findOrFail($id);
    $item->update([
        'title' => $data['title'] ?? $item->title,
        'content_json' => $data['content_json']
    ]);

    // Broadcast update to other users
    broadcast(new EditorUpdated(
        $item->id,
        $item->title,
        $item->content_json,
        null
    ))->toOthers();

    return response()->json([
        'success' => true,
        'id' => $item->id,
        'title' => $item->title,
        'updated_at' => $item->updated_at
    ]);
});

// image upload for editor
Route::post('editor/upload-image', function (Request $request) {
    if (! $request->hasFile('image')) {
        return response()->json(['error' => 'No file'], 422);
    }

    $file = $request->file('image');
    $path = $file->store('editor_images', 'public');
    $url = asset('storage/' . $path);
    return response()->json(['url' => $url]);
});

// view saved document (read-only)
Route::get('editor/{id}', function ($id) {
    $item = EditorContent::findOrFail($id);
    return view('editor_show', ['item' => $item]);
});

// poll for content updates (live collaboration)
Route::get('editor/{id}/poll', function ($id) {
    $item = EditorContent::findOrFail($id);
    return response()->json([
        'id' => $item->id,
        'title' => $item->title,
        'content_json' => $item->content_json,
        'updated_at' => $item->updated_at->timestamp,
        'updated_at_human' => $item->updated_at->diffForHumans()
    ]);
});
