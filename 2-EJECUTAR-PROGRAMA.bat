@echo off
title Iniciando Proyector LBC
color 0a
echo ========================================================
echo   INICIANDO PROYECTOR LBC - IGLESIA CUADRANGULAR
echo ========================================================
echo.
echo Iniciando aplicacion...
call npx electron .
if %errorlevel% neq 0 (
    echo.
    echo Abriendo mediante servidor local...
    start http://localhost:3000
    call npm run dev
)
