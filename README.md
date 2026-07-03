# Calculadora Cabral — Mobile

## Pré-requisitos
- Node.js instalado (https://nodejs.org)
- Conta no Expo (https://expo.dev) — gratuita

## Setup inicial (apenas uma vez)

```bash
# 1. Instalar dependências
cd mobile
npm install

# 2. Instalar EAS CLI globalmente
npm install -g eas-cli

# 3. Login na conta Expo
eas login
```

## Testar no celular (sem build)
```bash
npx expo start
# Escaneia o QR code com o app Expo Go no celular
```

## Gerar APK
```bash
# APK de preview (instalar direto no Android)
eas build --platform android --profile preview
```
O link para download do APK aparece no terminal ao finalizar (~10 min na nuvem).

## Instalar no Android
Baixe o `.apk` gerado e transfira para o celular.
No Android: Configurações → Segurança → Fontes desconhecidas → Instalar.
