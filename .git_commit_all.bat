@echo off
cd /d C:\Users\Wellington Martins\Documents\Portifolio\SunMap
echo Running: git add -A
git add -A
echo Running: git status --porcelain -uall
git status --porcelain -uall
echo Running: git commit -m "chore(backend): restore source files and Dockerfile"
git commit -m "chore(backend): restore source files and Dockerfile"
echo Commit exit %ERRORLEVEL%
