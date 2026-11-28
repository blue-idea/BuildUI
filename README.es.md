# BuildUI

> **El código lo construye todo.** BuildUI es un espacio de trabajo de escritorio local-first para convertir ideas, referencias y conversaciones en prototipos de proyectos funcionales.

[English](README.md) · [中文](README.zh-CN.md) · [Español](README.es.md) · [Português](README.pt-BR.md) · [Français](README.fr.md) · [日本語](README.ja.md)

## Instalación

### macOS — Homebrew (recomendado)

BuildUI se distribuye como un Homebrew Cask. Instálalo o actualízalo desde Terminal:

```bash
brew update
brew install --cask blue-idea/tap/buildui
```

Para actualizar una instalación existente:

```bash
brew update
brew upgrade --cask buildui
```

Para desinstalarlo:

```bash
brew uninstall --cask buildui
```

Si todavía no tienes Homebrew, sigue la [guía oficial de instalación de Homebrew](https://brew.sh/) y después ejecuta los comandos anteriores.

### macOS — descarga de una versión

Descarga el último [`BuildUI.dmg`](https://github.com/blue-idea/BuildUI/releases), arrastra `BuildUI.app` a `/Applications` y ábrelo. Si macOS bloquea el primer inicio por el atributo de cuarentena, ejecuta:

```bash
xattr -dr com.apple.quarantine /Applications/BuildUI.app
```

También puedes usar el instalador del repositorio:

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/blue-idea/BuildUI/main/scripts/install-mac.sh)"
```

### Otras plataformas y compilación local

Usa una versión publicada cuando esté disponible o sigue las instrucciones de [compilación desde el código fuente](#compilar-desde-el-código-fuente).

## Por qué BuildUI

BuildUI está pensado para la parte visual y rápida de crear software: describir una idea, definir la dirección del producto, generar un prototipo funcional y refinarlo con código y vista previa. Comparte ese espacio con Google Stitch, Bolt.new y v0, pero mantiene el proyecto y el flujo de trabajo en tu equipo.

BuildUI **no sustituye a Claude Code, Cursor ni a otros agentes de programación**. Es una capa complementaria para crear prototipos con un proyecto local, una vista previa en vivo y un camino corto desde la intención visual hasta el código editable.

## Capturas

![Inicio de BuildUI con plataforma, estilos y modelo](assets/readme/buildui-home.png)

*Comienza un prototipo Web, Desktop o App desde un único espacio de trabajo.*

![Catálogo de componentes y herramientas de BuildUI](assets/readme/buildui-components.png)

*Conecta herramientas reutilizables y recursos de componentes desde el centro de componentes.*

## Capacidades principales

| Capacidad | Qué hace |
| --- | --- |
| **Flujo local-first** | Mantiene archivos del proyecto, datos SQLite, historial de conversaciones, vistas previas y snapshots de versión en el espacio local. El tráfico remoto solo llega al proveedor que configures. |
| **Localización** | Incluye interfaz y directivas de respuesta del modelo en inglés y chino simplificado. La documentación está disponible en inglés, chino, español, portugués, francés y japonés. |
| **Modelos y proveedores personalizados** | Incluye OpenAI, DeepSeek y Ollama local, además de cualquier endpoint compatible con OpenAI, con Base URL, API key y modelo configurables. |
| **Blueprint antes del código** | Aclara funciones, layout y dirección visual, y espera la aprobación del blueprint antes de implementar. |
| **Sandbox local y aislamiento** | Ejecuta el proyecto en una vista previa local y valida builds de producción dentro de un Git Worktree temporal separado. |
| **Reparación automática del código** | Ejecuta diagnósticos de TypeScript y builds, devuelve los problemas al ciclo de reparación y vuelve a verificar el resultado. |
| **Redibujado parcial y edición local** | Selecciona un elemento en la vista previa, localiza su componente y región de código, revisa el modelo de caja y envía un cambio dirigido. |
| **Conversación multivuelta** | Continúa con instrucciones incrementales, respuestas de aclaración, adjuntos y cambios posteriores manteniendo el contexto del proyecto. |
| **Extracción y definición de estilos** | Usa un nombre de marca, una referencia o una captura para extraer paleta, tipografía, radios, etiquetas y un prompt de estilo reutilizable. |
| **Proyectos basados en componentes** | Parte de plantillas y primitivas reutilizables, inspecciona el componente detrás de la vista previa y conecta recursos desde el centro de componentes. |
| **Vista previa y snapshots** | Ejecuta vistas Web, Desktop y App, captura portadas, inspecciona código, exporta un ZIP y revisa versiones anteriores. |

## Flujo de trabajo

1. **Describe el producto.** Elige Web, Desktop o App y describe el prototipo con lenguaje natural.
2. **Aclara la intención.** Responde preguntas opcionales sobre funciones, layout, colores y ambiente.
3. **Aprueba el blueprint.** Revisa la dirección de diseño antes de iniciar la implementación.
4. **Construye en el sandbox local.** BuildUI escribe el proyecto, instala dependencias faltantes, inicia la vista previa y verifica el código.
5. **Refina con conversación.** Pide otra página, una interacción, una dirección visual o un cambio en un componente seleccionado.
6. **Extrae y reutiliza el estilo.** Guarda el lenguaje visual como preset para futuros prototipos.
7. **Revisa y exporta.** Comprueba vista previa y código, captura una portada, vuelve a un snapshot o exporta el proyecto.

## Configuración del modelo

Abre **Settings → Models** para configurar un proveedor:

- **OpenAI** y **DeepSeek** para modelos alojados.
- **Ollama (Local)** para un endpoint local sin API key.
- **Custom (OpenAI-compatible)** para gateways autoalojados y proxies compatibles.
- **Base URL**, **API key** y **model name** por proveedor, con prueba de conexión antes de guardar.

BuildUI no incluye ninguna clave de modelo. Usa tus propias credenciales y revisa la política de privacidad del proveedor elegido.

## Compilar desde el código fuente

Requisitos: Go `1.26+`, Node.js `20+`, pnpm `9+`, Wails CLI `2.13+` y Git `2.30+`.

```bash
go install github.com/wailsapp/wails/v2/cmd/wails@v2.13.0
wails doctor
git clone https://github.com/blue-idea/BuildUI.git
cd BuildUI/frontend
pnpm install
cd ..
wails dev
```

Para crear un paquete de producción:

```bash
wails build
```

## Comprobaciones de calidad

```bash
go test -v -race -cover ./...
pnpm test:readme
pnpm test:scripts
pnpm --prefix frontend test
pnpm --prefix frontend run lint
pnpm --prefix frontend exec tsc -p tsconfig.json --noEmit
pnpm --prefix frontend run build
```

Los cambios de UI también deben verificarse con los flujos de Playwright y conservar evidencia de capturas.

## Idiomas de la documentación

La documentación predeterminada está en inglés. Cambia de idioma desde los enlaces superiores:

- [English](README.md)
- [中文](README.zh-CN.md)
- [Español](README.es.md)
- [Português](README.pt-BR.md)
- [Français](README.fr.md)
- [日本語](README.ja.md)

## Licencia

Consulta el repositorio para conocer la licencia y las condiciones de contribución vigentes.
