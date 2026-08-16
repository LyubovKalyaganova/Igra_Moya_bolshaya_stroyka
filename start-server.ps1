$root = $PSScriptRoot
$port = 8080
$prefix = "http://127.0.0.1:$port/"
$mime = @{
  '.html' = 'text/html; charset=utf-8'
  '.js'   = 'text/javascript; charset=utf-8'
  '.css'  = 'text/css; charset=utf-8'
  '.md'   = 'text/markdown; charset=utf-8'
  '.png'  = 'image/png'
  '.jpg'  = 'image/jpeg'
  '.svg'  = 'image/svg+xml'
  '.json' = 'application/json'
}

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add($prefix)
$listener.Start()
Write-Host "Игра открыта: $prefix"
Start-Process $prefix

while ($listener.IsListening) {
  $context = $listener.GetContext()
  $path = [Uri]::UnescapeDataString($context.Request.Url.LocalPath.TrimStart('/'))
  if ([string]::IsNullOrWhiteSpace($path)) {
    $path = 'index.html'
  }
  $full = Join-Path $root $path
  $response = $context.Response
  if (Test-Path -LiteralPath $full -PathType Leaf) {
    $ext = [IO.Path]::GetExtension($full).ToLowerInvariant()
    $bytes = [IO.File]::ReadAllBytes($full)
    $response.ContentType = if ($mime.ContainsKey($ext)) { $mime[$ext] } else { 'application/octet-stream' }
    $response.ContentLength64 = $bytes.Length
    $response.OutputStream.Write($bytes, 0, $bytes.Length)
  } else {
    $response.StatusCode = 404
    $msg = [Text.Encoding]::UTF8.GetBytes('Not found')
    $response.OutputStream.Write($msg, 0, $msg.Length)
  }
  $response.OutputStream.Close()
}
