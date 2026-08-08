param(
    [string]$Password = 'VirpoSCA2025!',
    [string]$InputFile = '.env.local',
    [string]$OutputFile = '.env.enc'
)

$pass = $Password
$salt = New-Object byte[] 16
[System.Security.Cryptography.RNGCryptoServiceProvider]::Create().GetBytes($salt)

$kdf = New-Object System.Security.Cryptography.Rfc2898DeriveBytes($pass, $salt, 100000, [System.Security.Cryptography.HashAlgorithmName]::SHA256)
$aes = [System.Security.Cryptography.Aes]::Create()
$aes.Key = $kdf.GetBytes(32)
$aes.IV  = $kdf.GetBytes(16)
$aes.Mode    = [System.Security.Cryptography.CipherMode]::CBC
$aes.Padding = [System.Security.Cryptography.PaddingMode]::PKCS7

$plaintext  = [System.IO.File]::ReadAllBytes($InputFile)
$encryptor  = $aes.CreateEncryptor()
$ms         = New-Object System.IO.MemoryStream
$ms.Write($salt, 0, $salt.Length)     # prepend 16-byte salt
$cs = New-Object System.Security.Cryptography.CryptoStream($ms, $encryptor, [System.Security.Cryptography.CryptoStreamMode]::Write)
$cs.Write($plaintext, 0, $plaintext.Length)
$cs.FlushFinalBlock()
$cs.Close()

[System.IO.File]::WriteAllBytes($OutputFile, $ms.ToArray())
Write-Host "SUCCESS: $OutputFile created ($($ms.Length) bytes, AES-256-CBC, PBKDF2 salt-prefixed)"
