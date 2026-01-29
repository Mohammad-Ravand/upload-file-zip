<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>Rich Editor</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        :root {
            --bg-light: #ffffff;
            --bg-dark: #1e1e1e;
            --text-light: #000000;
            --text-dark: #e0e0e0;
            --card-light: #f5f5f5;
            --card-dark: #2d2d2d;
            --border-light: #e0e0e0;
            --border-dark: #404040;
        }

        body {
            background-color: var(--bg-light);
            color: var(--text-light);
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            transition: background-color 0.3s, color 0.3s;
        }

        body.dark-mode {
            background-color: var(--bg-dark);
            color: var(--text-dark);
        }

        header {
            background-color: var(--card-light);
            border-bottom: 1px solid var(--border-light);
            padding: 1rem 2rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
            transition: background-color 0.3s, border-color 0.3s;
        }

        body.dark-mode header {
            background-color: var(--card-dark);
            border-bottom-color: var(--border-dark);
        }

        .header-left {
            display: flex;
            align-items: center;
            gap: 1rem;
        }

        .header-left input {
            font-size: 1.5rem;
            font-weight: bold;
            border: none;
            background: transparent;
            color: inherit;
            padding: 0.5rem;
            border-radius: 0.25rem;
            width: 300px;
        }

        .header-left input:focus {
            outline: 2px solid #4a90e2;
            background-color: var(--card-light);
        }

        body.dark-mode .header-left input:focus {
            background-color: var(--card-dark);
        }

        .header-right {
            display: flex;
            gap: 0.5rem;
            align-items: center;
        }

        .header-right button, .header-right input[type="checkbox"] {
            padding: 0.5rem 1rem;
            border: 1px solid var(--border-light);
            background-color: var(--card-light);
            color: inherit;
            border-radius: 0.25rem;
            cursor: pointer;
            transition: background-color 0.2s;
        }

        body.dark-mode .header-right button,
        body.dark-mode .header-right input[type="checkbox"] {
            border-color: var(--border-dark);
            background-color: var(--card-dark);
        }

        .header-right button:hover {
            background-color: var(--border-light);
        }

        body.dark-mode .header-right button:hover {
            background-color: var(--border-dark);
        }

        .container {
            max-width: 900px;
            margin: 0 auto;
            padding: 2rem;
        }

        .toolbar {
            background-color: var(--card-light);
            border: 1px solid var(--border-light);
            border-bottom: none;
            padding: 0.75rem;
            display: flex;
            gap: 0.5rem;
            flex-wrap: wrap;
            border-radius: 0.5rem 0.5rem 0 0;
            transition: background-color 0.3s, border-color 0.3s;
        }

        body.dark-mode .toolbar {
            background-color: var(--card-dark);
            border-color: var(--border-dark);
        }

        .toolbar button {
            padding: 0.5rem 1rem;
            border: 1px solid var(--border-light);
            background-color: var(--bg-light);
            color: inherit;
            border-radius: 0.25rem;
            cursor: pointer;
            font-size: 0.875rem;
            font-weight: 500;
            transition: background-color 0.2s, border-color 0.2s;
        }

        body.dark-mode .toolbar button {
            background-color: var(--bg-dark);
            border-color: var(--border-dark);
        }

        .toolbar button:hover {
            background-color: #e0e0e0;
            border-color: #999;
        }

        body.dark-mode .toolbar button:hover {
            background-color: #3d3d3d;
            border-color: #666;
        }

        .toolbar button.is-active {
            background-color: #4a90e2;
            color: white;
            border-color: #357abd;
        }

        body.dark-mode .toolbar button.is-active {
            background-color: #4a90e2;
        }

        #editor {
            background-color: var(--bg-light);
            border: 1px solid var(--border-light);
            border-top: none;
            padding: 1.5rem;
            min-height: 500px;
            border-radius: 0 0 0.5rem 0.5rem;
            transition: background-color 0.3s, border-color 0.3s;
            overflow: auto;
        }

        body.dark-mode #editor {
            background-color: var(--bg-dark);
            border-color: var(--border-dark);
        }

        .ProseMirror {
            outline: none;
        }

        .ProseMirror > * + * {
            margin-top: 0.75em;
        }

        .ProseMirror ul,
        .ProseMirror ol {
            padding: 0 1rem;
        }

        .ProseMirror pre {
            background: #282c34;
            border: 1px solid #3e4451;
            border-radius: 0.5rem;
            padding: 1.2rem;
            overflow: auto;
            font-size: 0.875rem;
            color: #abb2bf;
            line-height: 1.5;
            font-family: 'Monaco', 'Courier New', 'Fira Code', monospace;
        }

        body.dark-mode .ProseMirror pre {
            background: #282c34;
            border-color: #3e4451;
            color: #abb2bf;
        }

        .ProseMirror pre code {
            background: transparent;
            padding: 0;
            color: inherit;
            font-family: inherit;
        }

        /* Syntax highlighting colors from atom-one-dark theme */
        .hljs-attr { color: #e06c75; }
        .hljs-string { color: #98c379; }
        .hljs-number { color: #d19a66; }
        .hljs-literal { color: #56b6c2; }
        .hljs-type { color: #61afef; }
        .hljs-title { color: #61afef; }
        .hljs-function { color: #61afef; }
        .hljs-keyword { color: #c678dd; }
        .hljs-tag { color: #e06c75; }
        .hljs-name { color: #e06c75; }
        .hljs-comment { color: #5c6370; }
        .hljs-meta { color: #5c6370; }

        .ProseMirror code {
            background-color: var(--card-light);
            padding: 0.2em 0.4em;
            border-radius: 0.25rem;
            font-family: 'Monaco', 'Courier New', monospace;
            font-size: 0.875em;
        }

        body.dark-mode .ProseMirror code {
            background-color: var(--card-dark);
        }

        .ProseMirror blockquote {
            border-left: 4px solid #4a90e2;
            padding-left: 1rem;
            margin-left: 0;
            color: #666;
            font-style: italic;
        }

        body.dark-mode .ProseMirror blockquote {
            border-left-color: #6ba3ff;
            color: #aaa;
        }

        .editor-controls {
            margin-top: 1rem;
            display: flex;
            gap: 0.5rem;
        }

        .editor-controls button {
            padding: 0.75rem 1.5rem;
            background-color: #4a90e2;
            color: white;
            border: none;
            border-radius: 0.25rem;
            cursor: pointer;
            font-size: 1rem;
            font-weight: 500;
            transition: background-color 0.2s;
        }

        .editor-controls button:hover {
            background-color: #357abd;
        }

        #image_input {
            display: none;
        }

        .divider {
            border-left: 1px solid var(--border-light);
            margin: 0 0.25rem;
        }

        body.dark-mode .divider {
            border-left-color: var(--border-dark);
        }

        .live-indicator {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            font-size: 0.875rem;
            color: #22c55e;
            padding: 0.5rem 1rem;
            background-color: rgba(34, 197, 94, 0.1);
            border-radius: 0.25rem;
            border: 1px solid rgba(34, 197, 94, 0.3);
        }

        body.dark-mode .live-indicator {
            background-color: rgba(34, 197, 94, 0.1);
            border-color: rgba(34, 197, 94, 0.3);
        }

        .live-dot {
            width: 8px;
            height: 8px;
            background-color: #22c55e;
            border-radius: 50%;
            animation: pulse 2s infinite;
        }

        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }

        .editor-controls {
            display: none; /* Hidden - using auto-save instead */
        }

        .auto-save-status {
            position: fixed;
            bottom: 20px;
            left: 20px;
            font-size: 0.875rem;
            color: #666;
            background: rgba(0, 0, 0, 0.05);
            padding: 8px 12px;
            border-radius: 0.25rem;
            display: none;
        }

        body.dark-mode .auto-save-status {
            color: #aaa;
            background: rgba(255, 255, 255, 0.05);
        }

        .auto-save-status.saving {
            display: flex;
            align-items: center;
            gap: 6px;
            color: #4a90e2;
        }

        .auto-save-status.saved {
            display: flex;
            align-items: center;
            gap: 6px;
            color: #22c55e;
        }

        .saving-dot {
            width: 6px;
            height: 6px;
            background: #4a90e2;
            border-radius: 50%;
            animation: blink 1s infinite;
        }

        @keyframes blink {
            0%, 100% { opacity: 0.3; }
            50% { opacity: 1; }
        }

        @keyframes fadeInOut {
            0%, 100% { opacity: 0; }
            50% { opacity: 1; }
        }
    </style>
</head>
<body>
    <div class="container">
        <form id="editor_form" method="POST" action="/editor">
            @csrf
            @if(isset($initial))
                @method('PATCH')
            @endif

            <header>
                <div class="header-left">
                    <input type="text" id="editor_title" name="title" placeholder="Untitled document">
                    @if(isset($initial))
                        <div class="live-indicator">
                            <div class="live-dot"></div>
                            <span>Live Sync Active</span>
                        </div>
                    @endif
                </div>
                <div class="header-right">
                    <button type="button" id="upload_btn">📷 Upload Image</button>
                    <div class="divider"></div>
                    <input type="checkbox" id="dark_toggle">
                    <label for="dark_toggle" style="margin: 0; cursor: pointer;">🌙</label>
                </div>
            </header>

            <div class="toolbar">
                <button type="button" id="btn_bold" title="Bold (Ctrl+B)">Bold</button>
                <button type="button" id="btn_italic" title="Italic (Ctrl+I)">Italic</button>
                <button type="button" id="btn_underline" title="Underline (Ctrl+U)">Underline</button>
                <div class="divider"></div>
                <button type="button" id="btn_bullet_list" title="Bullet List">• List</button>
                <button type="button" id="btn_ordered_list" title="Ordered List">1. List</button>
                <div class="divider"></div>
                <button type="button" id="btn_code_block" title="Code Block">{ } Code</button>
                <button type="button" id="btn_blockquote" title="Blockquote">" Quote</button>
                <button type="button" id="btn_heading" title="Heading">H1</button>
            </div>

            <div id="editor"></div>

            <input type="hidden" id="editor_json" name="content_json">

            <div class="editor-controls">
                <button type="submit" id="submit_btn">Save Document</button>
            </div>
        </form>

        <!-- Auto-save status indicator -->
        <div class="auto-save-status" id="auto-save-status">
            <span class="saving-dot"></span>
            <span id="save-text">Auto-saving...</span>
        </div>
    </div>

    <input type="file" id="image_input" accept="image/*">

    @vite('resources/js/app.js')

    <script>
        // Pass initial content if editing
        @if(isset($initial))
            window.__INITIAL_EDITOR_JSON__ = {!! $initial->content_json !!};
            document.getElementById('editor_title').value = '{!! addslashes($initial->title ?? '') !!}';
            document.getElementById('submit_btn').textContent = 'Update Document';
            document.getElementById('editor_form').action = '/editor/{{ $initial->id }}';
        @endif

        // Restore dark mode preference
        if (localStorage.getItem('editor-dark-mode') === 'true') {
            document.body.classList.add('dark-mode');
            document.getElementById('dark_toggle').checked = true;
        }

        document.getElementById('dark_toggle').addEventListener('change', function () {
            if (this.checked) {
                document.body.classList.add('dark-mode');
                localStorage.setItem('editor-dark-mode', 'true');
            } else {
                document.body.classList.remove('dark-mode');
                localStorage.setItem('editor-dark-mode', 'false');
            }
        });

        // Image upload is handled by editor.js
    </script>
</body>
</html>
