<style>
    body {
        margin: 0;
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #f4f6f8;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }

    .upload-card {
        background: #ffffff;
        padding: 32px;
        border-radius: 16px;
        width: 100%;
        max-width: 420px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
        text-align: center;
    }

    .upload-card h2 {
        margin-bottom: 8px;
        font-size: 22px;
        font-weight: 600;
    }

    .upload-card p {
        margin-bottom: 24px;
        font-size: 14px;
        color: #666;
    }

    .file-input {
        display: block;
        width: 100%;
        padding: 14px;
        border: 2px dashed #d0d7de;
        border-radius: 12px;
        background: #fafafa;
        cursor: pointer;
        margin-bottom: 24px;
        text-align: center;
    }

    .file-input:hover {
        background: #f0f4ff;
        border-color: #4f7cff;
    }

    .file-input input {
        display: none;
    }

    .upload-btn {
        width: 100%;
        border: none;
        border-radius: 12px;
        background: #2563eb;
        color: white;
        padding: 12px;
        font-size: 16px;
        font-weight: 500;
        cursor: pointer;
        transition: background 0.2s ease, transform 0.1s ease;
    }

    .upload-btn:hover {
        background: #1e4ed8;
    }

    .upload-btn:active {
        transform: scale(0.98);
    }
</style>

<form action="{{ route('post-upload-zip') }}" method="POST" enctype="multipart/form-data" class="upload-card">
    @csrf

    <h2>Upload ZIP File</h2>
    <p>Select a ZIP file from your computer</p>

    <label class="file-input">
        Click to choose file
        <input type="file" name="zip" id="zip" accept=".zip">
    </label>

    <button type="submit" class="upload-btn">
        Upload File
    </button>
</form>
