<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Documents</title>
  <style>body{font-family:Inter,system-ui;margin:32px;background:#f7fafc}a{color:#2563eb}</style>
</head>
<body>
  <h1>Documents</h1>
  <p><a href="/editor">+ New Document</a></p>
  <ul>
    @foreach($items as $item)
      <li style="margin-bottom:12px">
        <a href="/editor/{{ $item->id }}/edit">{{ $item->title ?? 'Untitled' }}</a>
        <span style="color:#666;padding-left:8px">{{ $item->updated_at->diffForHumans() }}</span>
        <a href="/editor/{{ $item->id }}" style="margin-left:10px;color:#444">(view)</a>
      </li>
    @endforeach
  </ul>
</body>
</html>
