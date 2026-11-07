@echo off
title Instalando complementos de Proyector LBC
color 0b
echo ========================================================
echo   INSTALANDO COMPLEMENTOS DE PROYECTOR LBC
echo   (Solo necesitas hacer esto una sola vez)
echo ========================================================
echo.
echo Verificando si tienes Node.js en tu computadora...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo.
    echo [ATENCION] No se encontro Node.js instalado en tu computadora.
    echo.
    echo Para ejecutar aplicaciones de escritorio y crear archivos .exe,
    echo necesitas instalar Node.js (es 100%% gratis y seguro).
    echo.
    echo 1. Ve a: https://nodejs.org
    echo 2. Descarga la version que dice "LTS (Recomendada)".
    echo 3. Abre el archivo descargado e instalalo haciendo clic en "Next, Next, Install".
    echo 4. Una vez instalado, vuelve a hacer doble clic en este archivo.
    echo.
    pause
    exit /b
)
echo Node.js detectado correctamente.
echo Instalando complementos de la aplicacion (esto puede tardar 1 o 2 minutos)...
echo.
call npm install --legacy-peer-deps
echo.
echo ========================================================
echo   LISTO! Todo ha quedado configurado e instalado.
echo   Ahora haz doble clic en "2-EJECUTAR-PROGRAMA.bat"
echo ========================================================
echo.
pause
