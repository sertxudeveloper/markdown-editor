import BlockStyle from "../BlockStyle";
import Plugin from "../Plugin";

import icon from "./icon.svg";

export default class Link extends Plugin {
  getKey(): string {
    return "link";
  }

  getIcon(): string {
    return icon;
  }

  getTitle(): string {
    return "Link (Ctrl+K)";
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.ctrlKey && event.key === "k") {
      event.preventDefault()
      this.execute()
    }
  }

  execute(): void {
    if (!this.editor.textarea) return
    const textarea = this.editor.textarea

    BlockStyle.applyStyle(textarea, { prefix: "[", suffix: "](https://)", replaceNext: "https://", scanFor: "https?://" })
  }
}