<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\File\UploadedFile;

class LogUploadedFiles
{
    public function handle(Request $request, Closure $next)
    {
        $response = $next($request);

        if ($request->files->count() === 0) {
            return $response;
        }

        foreach ($request->files->all() as $file) {
            // Handle multiple file inputs safely
            if (is_array($file)) {
                foreach ($file as $singleFile) {
                    $this->logFile($singleFile, $request);
                }
            } else {
                $this->logFile($file, $request);
            }
        }

        return $response;
    }


protected function logFile(UploadedFile $file, Request $request): void
{
    if (!$file->isValid()) {
        return;
    }

    $extension = $file->getClientOriginalExtension();
    $storedName = sprintf(
        '%s.%s',
        bin2hex(random_bytes(16)),
        $extension
    );

    DB::table('uploaded_files_log')->insert([
        'original_name' => $file->getClientOriginalName(),
        'stored_name'   => $storedName,
        'mime_type'     => $file->getClientMimeType(),
        'size'          => (int) $file->getSize(),
        'disk'          => config('filesystems.default'),
        'path'          => $file->getPathname(), // temp path (correct in middleware)
        'route'         => $request->route()?->uri(),
        'ip'            => $request->ip(),
        'created_at'    => now(),
        'updated_at'    => now(),
    ]);
}

}
