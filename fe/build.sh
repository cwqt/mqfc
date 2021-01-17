
ESCAPED_REPLACE=$(printf '%s\n' "$API_URL" | sed -e 's/[\/&]/\\&/g')
sed -i -e "s/API_URL/$ESCAPED_REPLACE/g" ./netlify.toml

cat netlify.toml
npm install
npm run build
cp netlify.toml dist/fe
exit 0