function D($slug,$local,$path,$sig){
  $u="https://prod-files-secure.s3.us-west-2.amazonaws.com/a15b85eb-0e4b-4e6b-a756-5c54953216c2/$path"+"?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=$($script:cred)&X-Amz-Date=$($script:dt)&X-Amz-Expires=300&X-Amz-Security-Token=$($script:tok)&X-Amz-Signature=$sig&X-Amz-SignedHeaders=host&x-amz-checksum-mode=ENABLED&x-id=GetObject"
  $dir="images\pptp\$slug"; New-Item -ItemType Directory -Force $dir | Out-Null
  $out="$dir\$local"
  for($i=0;$i -lt 4;$i++){ curl.exe -L -sS -f -o $out $u; if($LASTEXITCODE -eq 0){break}; Start-Sleep 2 }
  if($LASTEXITCODE -eq 0 -and (Test-Path $out)){ "OK  $out  $((Get-Item $out).Length)" } else { "FAIL $out" }
}

