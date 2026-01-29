<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Saved Document</title>
  <style>body{font-family:Inter,system-ui,Segoe UI,Roboto,Arial;margin:32px;background:#f7fafc}pre{background:#fff;padding:16px;border-radius:8px;box-shadow:0 6px 20px rgba(2,6,23,.06);overflow:auto}</style>
</head>
<body>
  <h1>Saved document #{{ $item->id }}</h1>
  <p>Title: {{ $item->title ?? '—' }}</p>
  <h3>JSON</h3>
  <pre>{{ $item->content_json }}</pre>
</body>
</html>
