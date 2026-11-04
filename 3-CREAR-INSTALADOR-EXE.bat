@echo off
title Creando Instalador .EXE - Proyector LBC
color 0e
echo ========================================================
echo   GENERANDO INSTALADOR .EXE PARA WINDOWS
echo ========================================================
echo.
echo 1. Compilando aplicacion web optimizada...
call npm run build
echo.
echo 2. Creando el archivo ejecutable instalador .exe de Windows...
call npx electron-builder --win
echo.
echo ========================================================
echo   EXITO! Tu archivo .exe ha sido generado.
echo   Lo encontraras dentro de la carpeta:
echo   dist-electron
echo ========================================================
echo.
pause
