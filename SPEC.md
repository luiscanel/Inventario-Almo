# SPEC.md - Sistema de Inventario de Servidores Grupo Almo

## 1. Overview del Proyecto

**Nombre del Proyecto:** ServInv - Sistema de Inventario de Servidores  
**Tipo:** Aplicación Web Full-Stack  
**Descripción:** Sistema integral para gestionar el inventario de servidores físicos y virtuales con dashboard interactivo, autenticación segura, generación de informes y monitoreo SNMP.  
**Usuario Objetivo:** Equipo de IT de Grupo Almo

---

## 2. Columns del Inventario

| # | Campo | Tipo | Descripción |
|---|-------|------|-------------|
| 1 | ID | Auto | Identificador único |
| 2 | PAIS | Texto | País del servidor (Colombia, México, Perú, etc.) |
| 3 | HOST | Texto | Nombre del host físico |
| 4 | NOMBRE VM | Texto | Nombre de la máquina virtual (si aplica) |
| 5 | IP | Texto | Dirección IP (IPv4) |
| 6 | CPU | Número | Número de núcleos/vCPU |
| 7 | MEMORIA | Texto | Memoria RAM (ej: 16GB, 32GB) |
| 8 | DISCO | Texto | Almacenamiento total (ej: 500GB SSD) |
| 9 | AMBIENTE | Select | Producción, Desarrollo, Testing, Staging |
| 10 | ARQUITECTURA | Select | x86_64, ARM64, x86, PowerPC |
| 11 | O.S | Select | Sistema Operativo (Windows Server, Linux, VMware ESXi) |
| 12 | VERSION O.S | Texto | Versión específica del SO |
| 13 | ANTIVIRUS | Texto | Software antivirus instalado |
| 14 | ESTADO | Select | Activo, Inactivo, Mantenimiento, Decomisionado |
| 15 | RESPONSABLE | Texto | Persona responsable del servidor |

---

## 3. Módulos del Sistema

### 3.1 Módulo de Autenticación

**Funcionalidades:**
- Login con correo institucional (@grupoalmo.com)
- Validación de dominio obligatorio
- Sesiones seguras con JWT
- Logout y gestión de sesión
- Recuperación de contraseña (opcional)

**Validaciones:**
- Solo correos con dominio @grupoalmo.com
- Contraseña mínima 8 caracteres
- Protección contra brute-force (5 intentos)

### 3.2 Dashboard Principal

**Métricas a Mostrar:**
- Total de servidores (físicos vs virtuales)
- Servidores por país
- Distribución por ambiente (Producción/Desarrollo/etc)
- Estado de servidores (Activos/Inactivos/Mantenimiento)
- Uso promedio de recursos (CPU/Memoria/Disco)
- Servidores con antivirus vs sin antivirus
- Servidores por sistema operativo

**Visualizaciones:**
- Gráfico de barras: Servidores por país
- Gráfico circular: Distribución por ambiente
- Gráfico de dona: Estado de servidores
- Tabla de resumen: Últimos servidores agregados
- Indicadores KPI: Total, Activos, Inactivos

### 3.3 Módulo de Gestión de Inventario (CRUD)

**Operaciones:**
- **Crear:** Formulario completo con validaciones
- **Leer:** Lista filtrable y ordenable con paginación
- **Actualizar:** Edición inline o modal
- **Eliminar:** Confirmación suave (soft delete)

**Características:**
- Búsqueda global por cualquier campo
- Filtros avanzados por país, ambiente, estado, OS
- Ordenamiento por columnas
- Exportación a Excel/CSV/PDF
- Importación desde Excel
- Historial de cambios

### 3.4 Módulo de Informes

**Tipos de Informes:**
- Inventario completo
- Servidores por ambiente
- Servidores por país
- Servidores sin antivirus
- Servidores de producción
- Estado de servidores

**Formatos de Exportación:**
- PDF (con logo y formato profesional)
- Excel (.xlsx)
- CSV
- Envío por email

**Programación:**
- Informes programados (diarios/semanales/mensuales)
- Envío automático por SMTP

### 3.5 Módulo SNMP y Monitoreo

**Funcionalidades:**
- Configuración de agentes SNMP
- Consulta de métricas via SNMP (CPU, Memoria, Disco)
- Alertas por umbrales
- Logs de monitoreo

**Configuración:**
- IP del agente SNMP
- Comunidad (public/private)
- Puerto (default 161)
- Intervalo de polling

### 3.6 Módulo de Administración

**Gestión de Usuarios:**
- Lista de usuarios registrados
- Roles (Admin, Editor, Viewer)
- Activar/Desactivar usuarios
- Registro manual de usuarios

---

## 4. Stack Tecnológico

### Frontend
- **Framework:** React 18+ con TypeScript
- **Estilado:** Tailwind CSS con shadcn/ui
- **Gráficos:** Recharts
- **Estado:** React Query + Zustand
- **Tablas:** TanStack Table

### Backend
- **Framework:** Node.js + Express.js
- **ORM:** Prisma
- **Base de Datos:** PostgreSQL (o SQLite para desarrollo)
- **Auth:** JWT + bcrypt

---

## 5. UI/UX Design

### Paleta de Colores
- **Primario:** #1E3A5F (Azul oscuro corporativo)
- **Secundario:** #2E7D32 (Verde éxito)
- **Acento:** #FF6F00 (Naranja alerta)
- **Fondo:** #F8FAFC (Gris claro)
- **Texto:** #1E293B (Gris oscuro)

### Layout
- Sidebar navegable a la izquierda
- Header con usuario y notificaciones
- Contenido principal con breadcrumbs
- Diseño responsive (mobile/tablet/desktop)

### Componentes
- Cards con sombras suaves
- Tablas zebra con hover
- Botones con estados (hover, active, disabled)
- Formularios con validación en tiempo real
- Toasts para notificaciones
- Modales para confirmaciones

---

## 6. Estructura de Archivos

```
inventario-almo/
├── client/                    # Frontend React
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/           # Componentes base
│   │   │   ├── dashboard/    # Componentes del dashboard
│   │   │   ├── inventory/    # Componentes del inventario
│   │   │   └── layout/       # Layout (Sidebar, Header)
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── lib/
│   │   └── types/
│   └── package.json
├── server/                    # Backend Express
│   ├── src/
│   │   ├── routes/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── services/
│   │   └── prisma/
│   └── package.json
└── README.md
```

---

## 7. Validaciones de Datos

### Servidor
- IP: Formato IPv4 válido
- CPU: Número entero positivo (1-512)
- Memoria: Formato numérico con unidad (GB)
- Disco: Formato numérico con unidad (GB/TB)
- Host/VM Name: Alfanumérico, sin caracteres especiales

---

## 8. Próximos Pasos

1. Aprobar SPEC.md
2. Inicializar proyecto con React + Express
3. Configurar base de datos y Prisma
4. Implementar autenticación
5. Crear dashboard
6. Implementar CRUD de inventario
7. Añadir informes y exportaciones
8. Configurar SNMP
9. Testing y deployment
