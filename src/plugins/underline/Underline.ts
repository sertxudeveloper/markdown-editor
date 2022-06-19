import BlockStyle from "../BlockStyle";
import Plugin from "../Plugin";

import icon from "./icon.svg";

export default class Underline extends Plugin {
  getKey(): string {
    return "underline";
  }

  getIcon(): string {
    return icon;
  }

  getTitle(): string {
    return "Underline (Ctrl+U)";
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.ctrlKey && event.key === "u") {
      event.preventDefault();
      this.execute();
    }
  }

  execute(): void {
    if (!this.editor.textarea) return;
    const textarea = this.editor.textarea;

    BlockStyle.applyStyle(textarea, { prefix: "<ins>", suffix: "</ins>", trimFirst: true });
  }
}