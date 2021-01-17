sed -i -e "s/API_URL/$API_URL/g" ./netlify.toml
cat netlify.toml
npm install
npm run build
cp netlify.toml dist/fe
exit 0