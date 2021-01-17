touch _redirects
echo '/api/*' $API_URL >> _redirects
npm install
npm run build
cp _redirects dist/fe
exit 0