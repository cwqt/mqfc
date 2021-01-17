touch _redirects
echo /api $API_URL >> _redirects
npm run build
cp _redirects dist/fe