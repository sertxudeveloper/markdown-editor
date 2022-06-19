import BlockStyle from "../BlockStyle";
import Plugin from "../Plugin";

import icon from "./icon.svg";

export default class Italic extends Plugin {
  getKey(): string {
    return "italic";
  }

  getIcon(): string {
    return icon;
  }

  getTitle(): string {
    return "Italic (Ctrl+I)";
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.ctrlKey && event.key === "i") {
      event.preventDefault()
      this.execute()
    }
  }

  execute(): void {
    if (!this.editor.textarea) return
    const textarea = this.editor.textarea

    BlockStyle.applyStyle(textarea, { prefix: "*", suffix: "*", trimFirst: true })
  }
}
