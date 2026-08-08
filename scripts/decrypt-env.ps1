param(
    [string]$Password = 'VirpoSCA2025!',
    [string]$InputFile = '.env.enc',
    [string]$OutputFile = '.env.local'
)

$cipherBytes = [System.IO.File]::ReadAllBytes($InputFile)

# Extract 16-byte salt from prefix
$salt       = $cipherBytes[0..15]
$encrypted  = $cipherBytes[16..($cipherBytes.Length - 1)]

$kdf = New-Object System.Security.Cryptography.Rfc2898DeriveBytes($Password, $salt, 100000, [System.Security.Cryptography.HashAlgorithmName]::SHA256)
$aes = [System.Security.Cryptography.Aes]::Create()
$aes.Key     = $kdf.GetBytes(32)
$aes.IV      = $kdf.GetBytes(16)
$aes.Mode    = [System.Security.Cryptography.CipherMode]::CBC
$aes.Padding = [System.Security.Cryptography.PaddingMode]::PKCS7

$decryptor  = $aes.CreateDecryptor()
$ms         = New-Object System.IO.MemoryStream($encrypted, $false)
$cs         = New-Object System.Security.Cryptography.CryptoStream($ms, $decryptor, [System.Security.Cryptography.CryptoStreamMode]::Read)
$out        = New-Object System.IO.MemoryStream
$cs.CopyTo($out)

[System.IO.File]::WriteAllBytes($OutputFile, $out.ToArray())
Write-Host "SUCCESS: $OutputFile decrypted from $InputFile"
