COMANDOS FINALES COBROAPP

Revisar proyecto

npm run typecheck
npx expo-doctor

Desplegar reglas de Firebase

firebase deploy --only firestore:rules,firestore:indexes --project cobroapp-keiner-35b05

Guardar en GitHub

git status
git add .
git commit -m "Actualiza seguridad y preparacion final APK"
git push

Generar APK

eas build -p android --profile preview

Si falla Expo Doctor

npx expo install --check
npm run typecheck

Si falla npm

taskkill /F /IM node.exe
npm cache clean --force
npm install
npm run typecheck