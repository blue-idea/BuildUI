> [!IMPORTANT]
> ### 🍎 Recommended Installation for macOS
> Due to the lack of Apple code signing, opening the `.dmg` directly will trigger macOS Gatekeeper warnings (e.g. *"BuildUI is damaged and can't be opened"*).
>
> **We strongly recommend installing via Homebrew:**
> ```bash
> brew install blue-idea/tap/buildui
> ```
> <details>
> <summary><b>Manual DMG Installation Workaround</b></summary>
>
> If installing via DMG, drag `BuildUI.app` to `/Applications` and run:
> ```bash
> xattr -cr /Applications/BuildUI.app
> ```
> </details>
