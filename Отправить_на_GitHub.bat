@echo off
chcp 65001 >nul
cd /d "%~dp0"

set "PATH=C:\Users\marym\AppData\Local\Programs\Git\cmd;%PATH%"
set "HTTP_PROXY="
set "HTTPS_PROXY="
set "ALL_PROXY="
set "http_proxy="
set "https_proxy="
set "all_proxy="
set "NO_PROXY=github.com,*.github.com,api.github.com,localhost,127.0.0.1"

echo ========================================================
echo   Отправка проекта «СтихоУм» на GitHub...
echo ========================================================
echo.

git add .
git commit -m "feat: СтихоУм — веб-приложение для изучения стихов наизусть"
git push -u origin main

echo.
if %ERRORLEVEL% EQU 0 (
    echo ========================================================
    echo  [УСПЕХ!] Проект успешно отправлен на GitHub!
    echo ========================================================
) else (
    echo ========================================================
    echo  [ИНФОРМАЦИЯ / ОШИБКА]
    echo  Если репозиторий еще не создан на GitHub,
    echo  создайте пустой репозиторий https://github.com/new
    echo  с именем "stikhi" (не создавая README) и запустите снова.
    echo ========================================================
)
echo.
pause
