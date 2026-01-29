<?php

namespace App\Http\Controllers;

use App\Models\EditorContent;
use Illuminate\Http\Request;

class EditorWebSocketController extends Controller
{
    /**
     * Handle document updates via API
     */
    public function updateDocument(Request $request, $id)
    {
        $data = $request->validate([
            'content_json' => 'required|string',
            'title' => 'nullable|string'
        ]);

        $item = EditorContent::findOrFail($id);
        $item->update([
            'title' => $data['title'] ?? $item->title,
            'content_json' => $data['content_json']
        ]);

        // Broadcast update to other clients (can use event broadcasting)
        return response()->json([
            'success' => true,
            'id' => $item->id,
            'updated_at' => $item->updated_at->timestamp
        ]);
    }

    /**
     * Get document for sync check
     */
    public function getDocument($id)
    {
        $item = EditorContent::findOrFail($id);
        return response()->json([
            'id' => $item->id,
            'title' => $item->title,
            'content_json' => $item->content_json,
            'updated_at' => $item->updated_at->timestamp,
            'updated_at_human' => $item->updated_at->diffForHumans()
        ]);
    }
}
