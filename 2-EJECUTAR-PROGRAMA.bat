@echo off
title Iniciando Proyector LBC - Iglesia Cuadrangular
color 0a

echo ========================================================
echo   INICIANDO PROYECTOR LBC - IGLESIA CUADRANGULAR
echo   Desarrollado por: LuftmandMauricio
echo ========================================================
echo.

:: Verificar si Node.js esta instalado
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [AVISO] Node.js no esta instalado en este computador.
    echo Abriendo la version ligera sin conexion en tu navegador...
    start public\index_local.html
    pause
    exit /b
)

:: Si faltan las dependencias, instalarlas automaticamente
if not exist node_modules (
    echo [CONFIGURACION INICIAL] Instalando complementos necesarios...
    echo Esto solo tomara 1 minuto la primera vez...
    echo.
    call npm install --legacy-peer-deps
    echo.
)

:: Abrir navegador y servidor local
echo.
echo ========================================================
echo   ABRIENDO PROYECTOR LBC EN TU NAVEGADOR...
echo   (No cierres esta ventanita negra mientras uses el programa)
echo ========================================================
echo.

start http://localhost:3000
call npm run dev
