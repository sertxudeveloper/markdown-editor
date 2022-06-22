import BlockStyle from "../BlockStyle";
import Plugin from "../Plugin";

import icon from "./icon.svg";

export default class Bold extends Plugin {
  getIcon(): string {
    return icon
  }

  getKey(): string {
    return "bold"
  }

  getTitle(): string {
    return "Bold (Ctrl+B)"
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.ctrlKey && event.key === "b") {
      event.preventDefault()
      this.execute()
    }
  }

  execute(value: string = ''): void {
    if (!this.editor.textarea) return
    const textarea = this.editor.textarea

    BlockStyle.applyStyle(textarea, { prefix: "**", suffix: "**", trimFirst: true })
  }
}
