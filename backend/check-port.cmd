@echo off
REM Usage: check-port.cmd [port]
SET PORT=%1
IF "%PORT%"=="" SET PORT=3001

netstat -aon | findstr ":%PORT%" >nul
IF %ERRORLEVEL%==0 (
  echo Port %PORT% is in use.
  exit /b 1
) ELSE (
  echo Port %PORT% free.
  exit /b 0
)
