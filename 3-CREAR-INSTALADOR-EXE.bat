@echo off
title Creando Instalador .EXE - Proyector LBC
color 0e

echo ========================================================
echo   GENERANDO ARCHIVO EJECUTABLE .EXE PARA WINDOWS
echo   Proyector LBC - Iglesia Cuadrangular Las Brisas
echo ========================================================
echo.

echo [PASO 1/3] Instalando complementos y compilador de Windows...
call npm install --legacy-peer-deps
if %errorlevel% neq 0 (
    echo [ERROR] No se pudieron instalar las dependencias. Verifica tu conexion.
    pause
    exit /b
)

echo.
echo [PASO 2/3] Compilando la aplicacion web optimizada...
call npm run build
if %errorlevel% neq 0 (
    echo [ERROR] Error al compilar los archivos.
    pause
    exit /b
)

echo.
echo [PASO 3/3] Creando el archivo ejecutable .exe de Windows...
echo (Esto descargara el nucleo de Electron para Windows y creara el .exe...)
echo.
call npx electron-builder --win portable
if %errorlevel% neq 0 (
    echo Reintentando en modo directorio...
    call npx electron-builder --win --dir
)

echo.
if exist "dist-electron\win-unpacked" (
    echo ========================================================
    echo   EXITO TOTAL! Tu programa para Windows ha sido generado.
    echo.
    echo   UBICACION DEL EJECUTABLE:
    echo   dist-electron\win-unpacked\Proyector LBC.exe
    echo.
    echo   (Abriendo directamente la carpeta win-unpacked donde
    echo    esta tu archivo Proyector LBC.exe listo para usar...)
    echo ========================================================
    start explorer "dist-electron\win-unpacked"
) else if exist dist-electron (
    echo ========================================================
    echo   EXITO TOTAL! Tu archivo ejecutable ha sido generado.
    echo   Abriendo la carpeta dist-electron donde esta tu archivo...
    echo ========================================================
    start explorer dist-electron
) else (
    echo [ATENCION] No se encontro la carpeta dist-electron. Revisa los mensajes de arriba.
)

echo.
pause
