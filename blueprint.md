# Gestor de Gastos: Blueprint del Proyecto

## Propósito y Capacidades

"Gestor de Gastos" es una aplicación móvil multiplataforma para gestionar gastos personales o de negocio de forma organizada por "Ambientes" dinámicos. Permite a los usuarios registrar, visualizar y analizar sus gastos dentro de contextos específicos (ej. "Casa", "Negocio", "Vacaciones"), con soporte para diferentes monedas y sincronización opcional en la nube. La aplicación sigue los principios de Material Design 3, está completamente localizada en español y soporta modo offline.

## Estado Actual y Características Implementadas

(Este sección se actualizará a medida que se implementen las características)

*   Estructura básica del proyecto creada.
*   `pubspec.yaml` configurado con dependencias iniciales.
*   Archivos principales (`main.dart`, `app.dart`, `router.dart`) creados.

## Plan de Acción Actual

Este plan detalla los próximos pasos para el desarrollo del proyecto.

1.  Configurar `pubspec.yaml` con todas las dependencias necesarias.
2.  Crear archivos principales (`lib/main.dart`, `lib/app.dart`, `lib/router.dart`).
3.  Inicializar Firebase y configurar autenticación anónima opcional.
4.  Definir modelos de datos `Ambient` y `Expense` con `freezed` y `json_serializable`.
5.  Configurar base de datos local con Drift y sqlcipher.
6.  Integrar Firebase Firestore para la sincronización en la nube.

(El plan se actualizará a medida que se completen los pasos)