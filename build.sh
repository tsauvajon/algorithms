rm -rf dist/*

tsc
cp sort/*.js tests/*.js tests/test.html dist
