import BlockStyle from "../BlockStyle";
import Plugin from "../Plugin";

import icon from "./icon.svg";

export default class Strike extends Plugin {
  getKey(): string {
    return "strike";
  }

  getIcon(): string {
    return icon;
  }

  getTitle(): string {
    return "Strike (Ctrl+S)";
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.ctrlKey && event.key === "s") {
      event.preventDefault()
      this.execute()
    }
  }

  execute(value: string = ''): void {
    if (!this.editor.textarea) return
    const textarea = this.editor.textarea

    BlockStyle.applyStyle(textarea, { prefix: "<s>", suffix: "</s>", trimFirst: true })
  }

}