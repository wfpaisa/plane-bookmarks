#!/bin/bash

# Script de diagnóstico para Plane Bookmark
# Verifica que todos los servicios estén configurados correctamente

echo "🔍 Plane Bookmark - Diagnóstico de Sistema"
echo "=========================================="
echo ""

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Contadores
PASS=0
FAIL=0
WARN=0

# Funciones de ayuda
pass() {
    echo -e "${GREEN}✅ PASS${NC} - $1"
    ((PASS++))
}

fail() {
    echo -e "${RED}❌ FAIL${NC} - $1"
    ((FAIL++))
}

warn() {
    echo -e "${YELLOW}⚠️  WARN${NC} - $1"
    ((WARN++))
}

info() {
    echo -e "ℹ️  $1"
}

# Test 1: Verificar que Node.js está instalado
echo "📦 Test 1: Node.js"
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    pass "Node.js instalado: $NODE_VERSION"
else
    fail "Node.js no está instalado"
fi
echo ""

# Test 2: Verificar que el proyecto existe
echo "📁 Test 2: Estructura del proyecto"
if [ -f "package.json" ]; then
    pass "package.json encontrado"
    PROJECT_VERSION=$(node -p "require('./package.json').version")
    info "Versión del proyecto: $PROJECT_VERSION"
else
    fail "package.json no encontrado. ¿Estás en el directorio correcto?"
fi

if [ -d "server" ]; then
    pass "Directorio server/ encontrado"
else
    fail "Directorio server/ no encontrado"
fi

if [ -d "src" ]; then
    pass "Directorio src/ encontrado"
else
    fail "Directorio src/ no encontrado"
fi
echo ""

# Test 3: Verificar dependencias instaladas
echo "📚 Test 3: Dependencias"
if [ -d "node_modules" ]; then
    pass "node_modules/ existe"
else
    warn "node_modules/ no existe. Ejecuta: npm install"
fi
echo ""

# Test 4: Verificar puertos
echo "🔌 Test 4: Puertos"

# Puerto 5173 (Frontend)
if lsof -Pi :5173 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    pass "Puerto 5173 (Frontend) está en uso"
    FRONTEND_PID=$(lsof -Pi :5173 -sTCP:LISTEN -t)
    info "PID: $FRONTEND_PID"
else
    warn "Puerto 5173 (Frontend) no está en uso. Ejecuta: npm run dev:client"
fi

# Puerto 3001 (Backend)
if lsof -Pi :3001 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    pass "Puerto 3001 (Backend) está en uso"
    BACKEND_PID=$(lsof -Pi :3001 -sTCP:LISTEN -t)
    info "PID: $BACKEND_PID"
else
    warn "Puerto 3001 (Backend) no está en uso. Ejecuta: npm run server"
fi
echo ""

# Test 5: Verificar conectividad del backend
echo "🌐 Test 5: Conectividad del Backend"
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/api/health | grep -q "200"; then
    pass "Backend responde en http://localhost:3001/api/health"
    HEALTH_RESPONSE=$(curl -s http://localhost:3001/api/health)
    info "Respuesta: $HEALTH_RESPONSE"
else
    fail "Backend no responde en http://localhost:3001/api/health"
fi
echo ""

# Test 6: Verificar archivo de datos
echo "💾 Test 6: Almacenamiento de datos"
if [ -f "server/data/bookmarks.json" ]; then
    pass "Archivo bookmarks.json existe"
    BOOKMARKS_SIZE=$(wc -c < "server/data/bookmarks.json")
    info "Tamaño: $BOOKMARKS_SIZE bytes"
    
    # Verificar que es JSON válido
    if jq empty server/data/bookmarks.json 2>/dev/null; then
        pass "bookmarks.json es JSON válido"
    else
        fail "bookmarks.json no es JSON válido"
    fi
else
    warn "Archivo bookmarks.json no existe (se creará al iniciar el servidor)"
fi
echo ""

# Test 7: Verificar configuración .env
echo "⚙️  Test 7: Variables de entorno"
if [ -f ".env" ]; then
    pass "Archivo .env existe"
    
    # Verificar VITE_SOCKET_URL
    if grep -q "^VITE_SOCKET_URL=" .env 2>/dev/null; then
        SOCKET_URL=$(grep "^VITE_SOCKET_URL=" .env | cut -d '=' -f 2)
        warn "VITE_SOCKET_URL está configurado: $SOCKET_URL"
        warn "Esto puede causar problemas en producción"
        info "Recomendación: Comenta esta línea para detección automática"
    else
        pass "VITE_SOCKET_URL no está configurado (detección automática)"
    fi
    
    # Verificar VITE_API_URL
    if grep -q "^VITE_API_URL=" .env 2>/dev/null; then
        API_URL=$(grep "^VITE_API_URL=" .env | cut -d '=' -f 2)
        info "VITE_API_URL: $API_URL"
    fi
else
    warn "Archivo .env no existe. Usando valores por defecto"
    info "Puedes crear uno con: cp .env.example .env"
fi
echo ""

# Test 8: Verificar archivos críticos
echo "📄 Test 8: Archivos críticos"
CRITICAL_FILES=(
    "src/main.tsx"
    "src/App.tsx"
    "src/services/socket.ts"
    "src/services/bookmarkAPI.ts"
    "server/server.ts"
    "vite.config.ts"
)

for file in "${CRITICAL_FILES[@]}"; do
    if [ -f "$file" ]; then
        pass "$file existe"
    else
        fail "$file no encontrado"
    fi
done
echo ""

# Test 9: Verificar Git
echo "🔄 Test 9: Control de versiones"
if [ -d ".git" ]; then
    pass "Repositorio Git inicializado"
    
    CURRENT_BRANCH=$(git branch --show-current 2>/dev/null)
    if [ ! -z "$CURRENT_BRANCH" ]; then
        info "Rama actual: $CURRENT_BRANCH"
    fi
    
    # Verificar si hay cambios sin commit
    if git diff-index --quiet HEAD -- 2>/dev/null; then
        pass "No hay cambios sin commit"
    else
        warn "Hay cambios sin commit"
    fi
else
    warn "No es un repositorio Git"
fi
echo ""

# Test 10: Verificar build
echo "🏗️  Test 10: Build"
if [ -d "dist" ]; then
    pass "Directorio dist/ existe"
    DIST_SIZE=$(du -sh dist 2>/dev/null | cut -f1)
    info "Tamaño del build: $DIST_SIZE"
else
    warn "Directorio dist/ no existe. Ejecuta: npm run build"
fi
echo ""

# Resumen
echo "=========================================="
echo "📊 RESUMEN"
echo "=========================================="
echo -e "${GREEN}✅ Pasó:     $PASS${NC}"
echo -e "${YELLOW}⚠️  Warnings: $WARN${NC}"
echo -e "${RED}❌ Falló:    $FAIL${NC}"
echo ""

# Recomendaciones
if [ $FAIL -gt 0 ]; then
    echo "🔧 ACCIONES REQUERIDAS:"
    echo "   1. Corregir los errores marcados como FAIL"
    echo "   2. Asegurarse de que las dependencias estén instaladas: npm install"
    echo "   3. Verificar que los servidores estén corriendo"
    echo ""
fi

if [ $WARN -gt 0 ]; then
    echo "💡 RECOMENDACIONES:"
    echo "   1. Revisar los warnings para optimizar la configuración"
    echo "   2. Comentar VITE_SOCKET_URL en .env si no se usa localhost"
    echo ""
fi

if [ $FAIL -eq 0 ] && [ $WARN -eq 0 ]; then
    echo "🎉 ¡Todo está configurado correctamente!"
    echo ""
    echo "Para iniciar la aplicación:"
    echo "   npm run dev         # Frontend + Backend"
    echo "   npm run dev:client  # Solo Frontend"
    echo "   npm run server      # Solo Backend"
fi

# Test extra: Si se proporciona un dominio
if [ ! -z "$1" ]; then
    echo ""
    echo "=========================================="
    echo "🌍 Test de Dominio: $1"
    echo "=========================================="
    
    # Test HTTPS
    if curl -s -o /dev/null -w "%{http_code}" "https://$1/api/health" | grep -q "200"; then
        pass "API accesible en https://$1/api/health"
    else
        fail "API no accesible en https://$1/api/health"
    fi
    
    # Test HTTP (redirect)
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "http://$1/api/health")
    if [ "$HTTP_CODE" = "301" ] || [ "$HTTP_CODE" = "302" ]; then
        pass "HTTP redirige a HTTPS (código $HTTP_CODE)"
    elif [ "$HTTP_CODE" = "200" ]; then
        warn "HTTP no redirige a HTTPS"
    else
        fail "Dominio no responde (código $HTTP_CODE)"
    fi
    
    echo ""
    echo "Para verificar WebSocket:"
    echo "   1. Abre https://$1 en el navegador"
    echo "   2. Abre la consola (F12)"
    echo "   3. Busca: '✅ WebSocket conectado exitosamente'"
fi

echo ""
