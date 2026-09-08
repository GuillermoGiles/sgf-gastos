# SGF Gastos — Sistema de Gestión Financiera Multi-Empresa

*Plataforma multi-tenant para la gestión centralizada de movimientos financieros de múltiples empresas.*

**NEXT.JS** · **TYPESCRIPT** · **TAILWIND CSS** · **SUPABASE** · **VERCEL**

> **Nota:** Este proyecto resuelve la necesidad de centralizar la gestión financiera de múltiples empresas de un mismo grupo económico, evitando planillas dispersas y errores de conciliación manual entre unidades de negocio.

## Descripción del Proyecto

SGF Gastos es un sistema multi-tenant que permite a un mismo grupo económico administrar las finanzas de varias empresas desde una única plataforma, manteniendo los datos de cada una completamente aislados entre sí.

El usuario Super Administrador puede alternar entre las distintas unidades del grupo (por ejemplo, Malayca, Supermercados, Guenther y otras empresas asociadas) sin perder el contexto ni mezclar información financiera entre ellas.

## Características Principales

- **Arquitectura Multi-Tenant:** Bases de datos aisladas por empresa, con enrutamiento dinámico de conexiones y credenciales según la instancia seleccionada.
- **Selector de Entorno:** Interfaz que permite cambiar entre las distintas empresas del grupo de forma ágil, sin recargar credenciales manualmente.
- **Lógica de Cómputo Inversa:** Cálculo automático de balances donde los egresos suman y los ingresos restan, adaptado a la lógica contable específica del cliente.
- **Soporte Multimoneda:** Gestión y totales de montos en ARS y USD.
- **Seguridad por Instancia:** Políticas de Row Level Security (RLS) independientes para cada base de datos, evitando fugas de información entre empresas.
- **Rol Super Administrador:** Acceso centralizado con permisos elevados y disponibilidad 24/7 desde cualquier dispositivo.

## Arquitectura y Tecnologías

El proyecto emplea una arquitectura modular basada en las siguientes tecnologías:

- **Frontend:** React / Next.js.
- **Lenguaje:** TypeScript para tipado estático y reducción de errores en tiempo de ejecución.
- **Estilos:** Tailwind CSS.
- **BBDD y Backend:** Supabase (PostgreSQL) — una instancia aislada por empresa del grupo.
- **Despliegue:** Alojado en la nube de Vercel con alta disponibilidad (24/7).

## Instalación y Desarrollo Local

Para correr este proyecto en tu entorno local, seguí estos pasos:

1. Clonar el repositorio:

```
   git clone https://github.com/GuillermoGiles/sgf-gastos.git
```

2. Instalar las dependencias:

```
   cd sgf-gastos
   npm install
```

3. Configurar las variables de entorno (`.env.local`) con tus credenciales de Supabase para cada empresa.

4. Iniciar el servidor de desarrollo:

```
   npm run dev
```

## Autor

**Guillermo German Giles**
*Estudiante de Ingeniería en Sistemas & Desarrollador Backend*
