if (window.parent !== window) {
  let parentOrigin = "";

  window.addEventListener("message", (event: MessageEvent) => {
    if (event.source !== window.parent || event.data?.type !== "buildui:inspect-mode") return;
    parentOrigin = event.data.active ? event.origin : "";
    document.documentElement.style.cursor = parentOrigin ? "crosshair" : "";
  });

  // Vite 开发插件给 JSX 写入路径和行号，预览与工作台通过消息交换相对路径。
  document.addEventListener("click", (event) => {
    if (!parentOrigin || !(event.target instanceof Element)) return;
    event.preventDefault();
    event.stopImmediatePropagation();

    const source = event.target.closest("[data-dyad-id]")?.getAttribute("data-dyad-id");
    const path = source?.replace(/:\d+:\d+$/, "").replace(/\\/g, "/") ?? "";
    window.parent.postMessage({ type: "buildui:source-selected", path }, parentOrigin);
  }, true);
}

export {};
