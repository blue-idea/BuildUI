# BuildUI

> **Código constrói tudo.** BuildUI é um espaço de trabalho desktop local-first para transformar ideias, referências e conversas em protótipos de projetos funcionais.

[English](README.md) · [中文](README.zh-CN.md) · [Español](README.es.md) · [Português](README.pt-BR.md) · [Français](README.fr.md) · [日本語](README.ja.md)

## Instalação

### macOS — Homebrew (recomendado)

O BuildUI é distribuído como um Homebrew Cask. Instale ou atualize pelo Terminal:

```bash
brew update
brew install --cask blue-idea/tap/buildui
```

Para atualizar uma instalação existente:

```bash
brew update
brew upgrade --cask buildui
```

Para desinstalar:

```bash
brew uninstall --cask buildui
```

Se o Homebrew ainda não estiver instalado, siga o [guia oficial de instalação do Homebrew](https://brew.sh/) e depois execute os comandos acima.

### macOS — download de uma versão

Baixe o [`BuildUI.dmg`](https://github.com/blue-idea/BuildUI/releases) mais recente, arraste `BuildUI.app` para `/Applications` e abra o aplicativo. Se o macOS bloquear a primeira abertura por causa da quarentena, execute:

```bash
xattr -dr com.apple.quarantine /Applications/BuildUI.app
```

Também é possível usar o instalador do repositório:

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/blue-idea/BuildUI/main/scripts/install-mac.sh)"
```

### Outras plataformas e build local

Use um pacote publicado quando disponível ou siga as instruções de [build a partir do código-fonte](#build-a-partir-do-código-fonte).

## Por que BuildUI

O BuildUI foi criado para a parte visual e rápida da criação de software: descrever uma ideia, definir a direção do produto, gerar um protótipo funcional e refiná-lo com código e preview. Ele ocupa o mesmo espaço de Google Stitch, Bolt.new e v0, mantendo o projeto e o fluxo de trabalho na sua máquina.

O BuildUI **não substitui Claude Code, Cursor nem outros agentes de programação**. Ele é uma camada complementar de prototipagem para quem precisa de um projeto local, preview ao vivo e um caminho curto da intenção visual até o código editável.

## Capturas de tela

![Página inicial do BuildUI com plataforma, estilos e modelo](assets/readme/buildui-home.png)

*Comece um protótipo Web, Desktop ou App em um único espaço de trabalho.*

![Catálogo de componentes e ferramentas do BuildUI](assets/readme/buildui-components.png)

*Conecte ferramentas reutilizáveis e recursos de componentes pelo centro de componentes.*

## Principais capacidades

| Capacidade | O que faz |
| --- | --- |
| **Fluxo local-first** | Mantém arquivos do projeto, dados SQLite, histórico de conversa, previews e snapshots de versão no espaço local. O tráfego remoto vai somente para o provedor configurado. |
| **Localização** | Oferece interface e instruções de resposta do modelo em inglês e chinês simplificado. A documentação está disponível em inglês, chinês, espanhol, português, francês e japonês. |
| **Modelos e provedores personalizados** | Inclui OpenAI, DeepSeek e Ollama local, além de qualquer endpoint compatível com OpenAI, com Base URL, API key e modelo configuráveis. |
| **Blueprint antes do código** | Esclarece funcionalidades, layout e direção visual, aguardando a aprovação do blueprint antes da implementação. |
| **Sandbox local e isolamento** | Executa o projeto em um preview local e valida builds de produção dentro de um Git Worktree temporário separado. |
| **Reparo automático de código** | Executa diagnósticos de TypeScript e builds, devolve os problemas ao ciclo de reparo e verifica o resultado novamente. |
| **Redesenho parcial e edição local** | Selecione um elemento no preview, localize o componente e a região do código, consulte o box model e envie uma alteração direcionada. |
| **Conversa em múltiplas rodadas** | Continue com instruções incrementais, respostas de esclarecimento, anexos e alterações posteriores preservando o contexto do projeto. |
| **Extração e definição de estilo** | Use nome de marca, referência ou captura para extrair paleta, tipografia, raios, tags e um prompt de estilo reutilizável. |
| **Projetos baseados em componentes** | Comece com templates e primitivas reutilizáveis, inspecione o componente por trás do preview e conecte recursos pelo centro de componentes. |
| **Preview ao vivo e snapshots** | Execute previews Web, Desktop e App, capture capas, inspecione código, exporte um ZIP e revise versões anteriores. |

## Fluxo de trabalho

1. **Descreva o produto.** Escolha Web, Desktop ou App e descreva o protótipo em linguagem natural.
2. **Esclareça a intenção.** Responda perguntas opcionais sobre funcionalidades, layout, cores e clima visual.
3. **Aprove o blueprint.** Revise a direção de design antes de iniciar a implementação.
4. **Construa no sandbox local.** O BuildUI grava o projeto, instala dependências ausentes, inicia o preview e verifica o código.
5. **Refine pela conversa.** Peça outra página, uma interação, uma nova direção visual ou uma alteração em um componente selecionado.
6. **Extraia e reutilize o estilo.** Salve a linguagem visual como preset para futuros protótipos.
7. **Revise e exporte.** Confira preview e código, capture uma capa, volte a um snapshot ou exporte o projeto.

## Configuração do modelo

Abra **Settings → Models** para configurar um provedor:

- **OpenAI** e **DeepSeek** para modelos hospedados.
- **Ollama (Local)** para um endpoint local sem API key.
- **Custom (OpenAI-compatible)** para gateways próprios e proxies compatíveis.
- **Base URL**, **API key** e **model name** por provedor, com teste de conexão antes de salvar.

O BuildUI não inclui uma chave de modelo. Use suas próprias credenciais e consulte a política de privacidade do provedor escolhido.

## Build a partir do código-fonte

Requisitos: Go `1.26+`, Node.js `20+`, pnpm `9+`, Wails CLI `2.13+` e Git `2.30+`.

```bash
go install github.com/wailsapp/wails/v2/cmd/wails@v2.13.0
wails doctor
git clone https://github.com/blue-idea/BuildUI.git
cd BuildUI/frontend
pnpm install
cd ..
wails dev
```

Para criar um pacote de produção:

```bash
wails build
```

## Verificações de qualidade

```bash
go test -v -race -cover ./...
pnpm test:readme
pnpm test:scripts
pnpm --prefix frontend test
pnpm --prefix frontend run lint
pnpm --prefix frontend exec tsc -p tsconfig.json --noEmit
pnpm --prefix frontend run build
```

Alterações de UI também devem ser verificadas com os fluxos do Playwright e manter evidências em screenshots.

## Idiomas da documentação

A documentação padrão está em inglês. Use os links no topo para alternar:

- [English](README.md)
- [中文](README.zh-CN.md)
- [Español](README.es.md)
- [Português](README.pt-BR.md)
- [Français](README.fr.md)
- [日本語](README.ja.md)

## Licença

Consulte o repositório para obter a licença e os termos de contribuição atuais.
