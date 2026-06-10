@echo off
echo Starting GuessFunc Game Environment...
echo.

if not exist node_modules (
    echo node_modules not found. Installing dependencies...
    call npm install
)

echo Starting development server...
call npm run dev -- --open
pause