<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Upload Failed</title>
    <style>
        body {
            margin: 0;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #fef2f2;
            font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }

        .card {
            background: #ffffff;
            padding: 36px;
            border-radius: 16px;
            max-width: 420px;
            width: 100%;
            text-align: center;
            box-shadow: 0 10px 30px rgba(0,0,0,0.08);
        }

        .icon {
            font-size: 48px;
            color: #dc2626;
            margin-bottom: 12px;
        }

        h2 {
            margin-bottom: 8px;
            font-size: 22px;
        }

        p {
            color: #555;
            font-size: 14px;
            margin-bottom: 24px;
        }

        a {
            display: inline-block;
            padding: 10px 16px;
            background: #dc2626;
            color: #fff;
            border-radius: 10px;
            text-decoration: none;
            font-size: 14px;
        }

        a:hover {
            background: #b91c1c;
        }
    </style>
</head>
<body>

<div class="card">
    <div class="icon">❌</div>
    <h2>Upload Failed</h2>
    <p>
        {{ $message ?? 'Something went wrong while uploading your file.' }}
    </p>

    <a href="{{ url()->previous() }}">Try again</a>
</div>

</body>
</html>
