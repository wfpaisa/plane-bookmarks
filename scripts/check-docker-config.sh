#!/bin/bash

# Script para verificar configuración de Docker y detectar problemas

echo "🐳 Verificación de Configuración Docker - Plane Bookmark"
echo "=========================================================="
echo ""

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Funciones
pass() { echo -e "${GREEN}✅${NC} $1"; }
fail() { echo -e "${RED}❌${NC} $1"; }
warn() { echo -e "${YELLOW}⚠️${NC}  $1"; }
info() { echo -e "${BLUE}ℹ️${NC}  $1"; }

# Test 1: Verificar docker-compose.yml
echo "📄 Test 1: Verificando docker-compose.yml"
if [ -f "docker-compose.yml" ]; then
    pass "docker-compose.yml encontrado"
    
    # Verificar VITE_SOCKET_URL
    if grep -q "VITE_SOCKET_URL" docker-compose.yml; then
        fail "VITE_SOCKET_URL está configurado en docker-compose.yml"
        echo ""
        echo "   Líneas problemáticas:"
        grep -n "VITE_SOCKET_URL" docker-compose.yml | sed 's/^/   /'
        echo ""
        warn "SOLUCIÓN: Eliminar la línea VITE_SOCKET_URL del docker-compose.yml"
        echo "   Ejecuta: sed -i '/VITE_SOCKET_URL/d' docker-compose.yml"
    else
        pass "VITE_SOCKET_URL NO está configurado (correcto)"
    fi
    
    # Verificar VITE_API_URL
    if grep -q "VITE_API_URL=/api" docker-compose.yml; then
        pass "VITE_API_URL=/api configurado correctamente"
    else
        warn "VITE_API_URL no está configurado o tiene valor incorrecto"
    fi
else
    fail "docker-compose.yml no encontrado"
fi
echo ""

# Test 2: Verificar .env
echo "📝 Test 2: Verificando archivo .env"
if [ -f ".env" ]; then
    warn "Archivo .env encontrado (no debería estar en Docker)"
    info "El .env es para desarrollo local, no para contenedores"
    
    # Verificar si está en .gitignore
    if grep -q "^\.env$" .gitignore 2>/dev/null; then
        pass ".env está en .gitignore (correcto)"
    else
        fail ".env NO está en .gitignore"
    fi
    
    # Ver si tiene VITE_SOCKET_URL
    if grep -q "^VITE_SOCKET_URL=" .env; then
        fail "VITE_SOCKET_URL está activo en .env"
        grep "^VITE_SOCKET_URL=" .env | sed 's/^/   /'
    elif grep -q "^#.*VITE_SOCKET_URL=" .env; then
        pass "VITE_SOCKET_URL está comentado en .env"
    fi
else
    pass "No hay archivo .env (correcto para Docker)"
fi
echo ""

# Test 3: Verificar Dockerfile
echo "🐋 Test 3: Verificando Dockerfile"
if [ -f "Dockerfile" ]; then
    pass "Dockerfile encontrado"
    
    # Verificar puertos expuestos
    if grep -q "EXPOSE.*5173" Dockerfile && grep -q "EXPOSE.*3001" Dockerfile; then
        pass "Puertos 5173 y 3001 expuestos"
    else
        warn "Puertos no están todos expuestos"
    fi
else
    fail "Dockerfile no encontrado"
fi
echo ""

# Test 4: Verificar código fuente
echo "💻 Test 4: Verificando código fuente"
if [ -f "src/services/socket.ts" ]; then
    pass "socket.ts encontrado"
    
    # Verificar que usa detección automática
    if grep -q "window.location" src/services/socket.ts; then
        pass "Código usa detección automática de dominio"
    else
        warn "Código podría no estar usando detección automática"
    fi
    
    # Verificar que NO tiene hardcoded localhost en producción
    if grep -q "localhost:3001" src/services/socket.ts | grep -v "localhost.*||.*127.0.0.1"; then
        warn "Puede haber referencias hardcoded a localhost"
    fi
else
    fail "socket.ts no encontrado"
fi
echo ""

# Test 5: Verificar si hay contenedor corriendo
echo "🔄 Test 5: Verificando contenedor Docker"
if command -v docker &> /dev/null; then
    pass "Docker está instalado"
    
    # Buscar contenedor plane-bookmark
    if docker ps | grep -q "plane-bookmark\|5173"; then
        pass "Contenedor plane-bookmark está corriendo"
        
        CONTAINER_ID=$(docker ps | grep "plane-bookmark\|5173" | awk '{print $1}' | head -1)
        info "Container ID: $CONTAINER_ID"
        
        # Verificar variables de entorno del contenedor
        echo ""
        info "Variables de entorno del contenedor:"
        docker inspect $CONTAINER_ID | grep -A 20 "\"Env\"" | grep "VITE_" | sed 's/^/   /'
        
        if docker inspect $CONTAINER_ID | grep -q "VITE_SOCKET_URL"; then
            fail "El contenedor tiene VITE_SOCKET_URL configurado"
            docker inspect $CONTAINER_ID | grep "VITE_SOCKET_URL" | sed 's/^/   /'
            echo ""
            warn "SOLUCIÓN: Actualizar el stack en Portainer sin VITE_SOCKET_URL"
        else
            pass "El contenedor NO tiene VITE_SOCKET_URL (correcto)"
        fi
    else
        warn "No hay contenedor plane-bookmark corriendo"
        info "Inicia con: docker-compose up -d"
    fi
else
    warn "Docker no está instalado o no es accesible"
fi
echo ""

# Test 6: Generar configuración recomendada
echo "📋 Test 6: Configuración recomendada"
echo ""
echo "=== docker-compose.yml CORRECTO ==="
cat << 'EOF'
version: "3.8"

services:
  plane-bookmark:
    build: .
    ports:
      - "5173:5173"
      - "3001:3001"
    volumes:
      - bookmark-data:/usr/src/app/server/data
    environment:
      - VITE_API_URL=/api
      # ❌ NO incluir VITE_SOCKET_URL
      - NODE_ENV=production
    restart: unless-stopped

volumes:
  bookmark-data:
    driver: local
EOF
echo ""

# Resumen
echo "=========================================================="
echo "📊 DIAGNÓSTICO COMPLETADO"
echo "=========================================================="
echo ""
echo "Para corregir el problema de WebSocket:"
echo ""
echo "1. ${YELLOW}Eliminar VITE_SOCKET_URL del docker-compose.yml:${NC}"
echo "   sed -i '/VITE_SOCKET_URL/d' docker-compose.yml"
echo ""
echo "2. ${YELLOW}Hacer commit y push:${NC}"
echo "   git add docker-compose.yml"
echo "   git commit -m 'fix: remove VITE_SOCKET_URL from docker-compose'"
echo "   git push"
echo ""
echo "3. ${YELLOW}En Portainer:${NC}"
echo "   - Ir a tu stack"
echo "   - Click en 'Pull and redeploy'"
echo "   - Esperar a que termine"
echo ""
echo "4. ${YELLOW}Verificar en el navegador:${NC}"
echo "   - Abrir https://tu-dominio.com"
echo "   - Abrir consola (F12)"
echo "   - Buscar: '✅ WebSocket conectado exitosamente'"
echo ""
echo "Si el error persiste, verifica la configuración de Nginx Proxy Manager:"
echo "   Ver guía: docs/portainer-setup.md"
echo ""
