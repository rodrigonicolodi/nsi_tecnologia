@echo off
echo ========================================
echo    BACKUP BANCO DE DADOS NSI TECNOLOGIA
echo ========================================
echo.

REM Configurações do banco
set "DB_HOST=sistema.nsitecnologia.com.br"
set "DB_USER=rodri6000_nsi_tecnologia"
set "DB_PASS=RRn@285879"
set "DB_NAME=rodri6000_nsi_tecnologia"

REM Criar pasta de backup
if not exist "backups" mkdir backups

REM Gerar data e hora
for /f "tokens=1-3 delims=/" %%a in ('date /t') do set "data=%%c%%b%%a"
for /f "tokens=1-2 delims=:" %%a in ('time /t') do set "hora=%%a%%b"
set "timestamp=%data%_%hora%"

REM Nome do arquivo
set "BACKUP_FILE=backups\nsi_backup_%timestamp%.sql"

echo 🔄 Criando backup...
echo 📁 Arquivo: %BACKUP_FILE%
echo.

REM Verificar se mysqldump existe
where mysqldump >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ ERRO: mysqldump não encontrado!
    echo.
    echo 💡 SOLUÇÕES:
    echo    1. Instalar MySQL Server
    echo    2. Instalar XAMPP
    echo    3. Adicionar MySQL ao PATH
    echo.
    echo 📥 Downloads:
    echo    MySQL: https://dev.mysql.com/downloads/mysql/
    echo    XAMPP: https://www.apachefriends.org/
    echo.
    pause
    exit /b 1
)

REM Executar backup
echo 🗄️ Executando mysqldump...
mysqldump -h%DB_HOST% -u%DB_USER% -p%DB_PASS% %DB_NAME% > "%BACKUP_FILE%"

if %errorlevel% equ 0 (
    echo ✅ Backup criado com sucesso!
    echo 📁 Local: %BACKUP_FILE%
    
    REM Verificar tamanho do arquivo
    for %%A in ("%BACKUP_FILE%") do set "size=%%~zA"
    set /a "sizeMB=%size%/1024/1024"
    echo 📊 Tamanho: %sizeMB% MB
    
    echo.
    echo 🎉 BACKUP CONCLUÍDO!
    echo 📅 Data: %date% %time%
    
) else (
    echo ❌ ERRO ao criar backup!
    echo 💡 Verifique as credenciais do banco
)

echo.
pause
