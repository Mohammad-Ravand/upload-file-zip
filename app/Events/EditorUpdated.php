<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class EditorUpdated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $documentId;
    public $title;
    public $content;
    public $userId;

    public function __construct($documentId, $title, $content, $userId = null)
    {
        $this->documentId = $documentId;
        $this->title = $title;
        $this->content = $content;
        $this->userId = $userId;
    }

    public function broadcastOn(): array
    {
        return [
            new Channel('editor-' . $this->documentId),
        ];
    }

    public function broadcastAs()
    {
        return 'editor.updated';
    }

    public function broadcastWith()
    {
        return [
            'document_id' => $this->documentId,
            'title' => $this->title,
            'content' => $this->content,
            'user_id' => $this->userId,
            'timestamp' => now()->timestamp,
        ];
    }
}
