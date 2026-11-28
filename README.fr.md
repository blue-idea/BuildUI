# BuildUI

> **Le code construit tout.** BuildUI est un espace de travail desktop local-first qui transforme des idées, des références et des conversations en prototypes de projets fonctionnels.

[English](README.md) · [中文](README.zh-CN.md) · [Español](README.es.md) · [Português](README.pt-BR.md) · [Français](README.fr.md) · [日本語](README.ja.md)

## Installation

### macOS — Homebrew (recommandé)

BuildUI est distribué comme Homebrew Cask. Installez-le ou mettez-le à jour depuis le Terminal :

```bash
brew update
brew install --cask blue-idea/tap/buildui
```

Pour mettre à jour une installation existante :

```bash
brew update
brew upgrade --cask buildui
```

Pour désinstaller :

```bash
brew uninstall --cask buildui
```

Si Homebrew n’est pas encore installé, suivez le [guide officiel d’installation de Homebrew](https://brew.sh/), puis exécutez les commandes ci-dessus.

### macOS — téléchargement d’une version

Téléchargez le dernier [`BuildUI.dmg`](https://github.com/blue-idea/BuildUI/releases), faites glisser `BuildUI.app` dans `/Applications`, puis lancez-le. Si macOS bloque le premier lancement à cause de la quarantaine, exécutez :

```bash
xattr -dr com.apple.quarantine /Applications/BuildUI.app
```

Vous pouvez aussi utiliser l’installateur du dépôt :

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/blue-idea/BuildUI/main/scripts/install-mac.sh)"
```

### Autres plateformes et compilation locale

Utilisez une version publiée lorsqu’elle est disponible, ou suivez les instructions de [compilation depuis les sources](#compiler-depuis-les-sources).

## Pourquoi BuildUI

BuildUI s’adresse à la partie visuelle et rapide de la création logicielle : décrire une idée, définir la direction du produit, générer un prototype fonctionnel et l’affiner avec le code et la prévisualisation. Il se situe dans le même espace que Google Stitch, Bolt.new et v0, tout en gardant le projet et le flux de travail sur votre machine.

BuildUI **ne remplace pas Claude Code, Cursor ni les autres agents de programmation**. C’est une couche complémentaire de prototypage pour celles et ceux qui veulent un projet local, une prévisualisation en direct et un chemin court de l’intention visuelle au code éditable.

## Captures d’écran

![Accueil BuildUI avec plateforme, styles et modèle](assets/readme/buildui-home.png)

*Commencez un prototype Web, Desktop ou App dans un espace de travail unique.*

![Catalogue de composants et d’outils BuildUI](assets/readme/buildui-components.png)

*Connectez des outils réutilisables et des ressources de composants depuis le centre des composants.*

## Fonctionnalités principales

| Fonctionnalité | Description |
| --- | --- |
| **Flux local-first** | Conserve les fichiers du projet, les données SQLite, l’historique des conversations, les prévisualisations et les snapshots de version dans l’espace local. Le trafic distant va uniquement au fournisseur configuré. |
| **Localisation** | Propose une interface et des instructions de réponse du modèle en anglais et en chinois simplifié. La documentation existe en anglais, chinois, espagnol, portugais, français et japonais. |
| **Modèles et fournisseurs personnalisés** | Inclut OpenAI, DeepSeek et Ollama local, ainsi que tout endpoint compatible OpenAI, avec Base URL, clé API et modèle configurables. |
| **Blueprint avant le code** | Clarifie les fonctionnalités, la mise en page et la direction visuelle, puis attend l’approbation du blueprint avant l’implémentation. |
| **Sandbox local et isolation** | Exécute le projet dans une prévisualisation locale et valide les builds de production dans un Git Worktree temporaire séparé. |
| **Réparation automatique du code** | Lance les diagnostics TypeScript et les builds, renvoie les problèmes dans la boucle de réparation, puis vérifie à nouveau le résultat. |
| **Redessin partiel et édition locale** | Sélectionnez un élément dans la prévisualisation, trouvez son composant et sa région source, inspectez son modèle de boîte et envoyez une modification ciblée. |
| **Conversation multi-tour** | Continuez avec des instructions incrémentales, des réponses de clarification, des pièces jointes et des modifications successives en gardant le contexte du projet. |
| **Extraction et définition de styles** | Utilisez un nom de marque, une référence ou une capture pour extraire palette, typographie, rayons, tags et prompt de style réutilisable. |
| **Projets orientés composants** | Commencez avec des templates et primitives réutilisables, inspectez le composant derrière la prévisualisation et connectez des ressources depuis le centre des composants. |
| **Prévisualisation et snapshots** | Lancez des prévisualisations Web, Desktop et App, capturez des couvertures, inspectez le code, exportez un ZIP et consultez les versions précédentes. |

## Flux de travail

1. **Décrivez le produit.** Choisissez Web, Desktop ou App et décrivez le prototype en langage naturel.
2. **Clarifiez l’intention.** Répondez aux questions facultatives sur les fonctionnalités, la mise en page, les couleurs et l’ambiance.
3. **Approuvez le blueprint.** Examinez la direction de conception avant de lancer l’implémentation.
4. **Construisez dans le sandbox local.** BuildUI écrit le projet, installe les dépendances manquantes, lance la prévisualisation et vérifie le code.
5. **Affinez par conversation.** Demandez une page, une interaction, une direction visuelle ou une modification d’un composant sélectionné.
6. **Extrayez et réutilisez le style.** Enregistrez le langage visuel comme preset pour les prochains prototypes.
7. **Vérifiez et exportez.** Inspectez la prévisualisation et le code, capturez une couverture, revenez à un snapshot ou exportez le projet.

## Configuration du modèle

Ouvrez **Settings → Models** pour configurer un fournisseur :

- **OpenAI** et **DeepSeek** pour les modèles hébergés.
- **Ollama (Local)** pour un endpoint local sans clé API.
- **Custom (OpenAI-compatible)** pour les gateways auto-hébergées et les proxys compatibles.
- Une **Base URL**, une **API key** et un **model name** par fournisseur, avec test de connexion avant l’enregistrement.

BuildUI ne fournit aucune clé de modèle. Utilisez vos propres identifiants et consultez la politique de confidentialité du fournisseur choisi.

## Compiler depuis les sources

Prérequis : Go `1.26+`, Node.js `20+`, pnpm `9+`, Wails CLI `2.13+` et Git `2.30+`.

```bash
go install github.com/wailsapp/wails/v2/cmd/wails@v2.13.0
wails doctor
git clone https://github.com/blue-idea/BuildUI.git
cd BuildUI/frontend
pnpm install
cd ..
wails dev
```

Pour créer un paquet de production :

```bash
wails build
```

## Vérifications qualité

```bash
go test -v -race -cover ./...
pnpm test:readme
pnpm test:scripts
pnpm --prefix frontend test
pnpm --prefix frontend run lint
pnpm --prefix frontend exec tsc -p tsconfig.json --noEmit
pnpm --prefix frontend run build
```

Les changements d’interface doivent également être vérifiés avec les parcours Playwright et conserver les captures comme preuves.

## Langues de la documentation

La documentation par défaut est en anglais. Utilisez les liens en haut de chaque README pour changer de langue :

- [English](README.md)
- [中文](README.zh-CN.md)
- [Español](README.es.md)
- [Português](README.pt-BR.md)
- [Français](README.fr.md)
- [日本語](README.ja.md)

## Licence

Consultez le dépôt pour connaître la licence et les conditions de contribution actuelles.
