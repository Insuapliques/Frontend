#!/bin/bash

# Script de despliegue automático para Firebase Hosting
# Uso: ./deploy.sh

set -e  # Detener si hay errores

echo ""
echo "🚀 =================================="
echo "   DESPLIEGUE A FIREBASE HOSTING"
echo "   Proyecto: chat-bot-7ffe3"
echo "=================================="
echo ""

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
  echo "❌ Error: package.json no encontrado"
  echo "   Asegúrate de ejecutar este script desde el directorio Frontend/"
  exit 1
fi

# 1. Instalar dependencias
echo "📦 Paso 1/5: Instalando dependencias..."
npm install

# 2. Limpiar build anterior
echo ""
echo "🧹 Paso 2/5: Limpiando build anterior..."
rm -rf build/

# 3. Crear build de producción
echo ""
echo "🔨 Paso 3/5: Creando build de producción..."
echo "   (Esto puede tardar un minuto...)"
npm run build

# 4. Verificar que build existe
if [ ! -d "build" ]; then
  echo ""
  echo "❌ Error: La carpeta build/ no fue creada"
  echo "   Revisa los errores anteriores"
  exit 1
fi

echo ""
echo "✅ Build creado exitosamente en build/"
echo "   Tamaño: $(du -sh build/ | cut -f1)"

# 5. Desplegar a Firebase
echo ""
echo "☁️ Paso 4/5: Desplegando a Firebase Hosting..."
echo ""

firebase deploy --only hosting

# 6. Finalización
echo ""
echo "✅ =================================="
echo "   ¡DESPLIEGUE COMPLETADO!"
echo "=================================="
echo ""
echo "🌐 Tu sitio está disponible en:"
echo "   https://chat-bot-7ffe3.web.app"
echo "   https://chat-bot-7ffe3.firebaseapp.com"
echo ""
echo "📊 Ver estadísticas:"
echo "   https://console.firebase.google.com/project/chat-bot-7ffe3/hosting"
echo ""
echo "💡 Tip: Presiona Ctrl+Shift+R en tu navegador para forzar recarga"
echo ""
