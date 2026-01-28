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
