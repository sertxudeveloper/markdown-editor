import BlockStyle from "../BlockStyle";
import Plugin from "../Plugin";

import icon from "./icon.svg";

export default class Mark extends Plugin {
  getKey(): string {
    return "mark";
  }

  getIcon(): string {
    return icon;
  }

  getTitle(): string {
    return "Mark (Ctrl+Alt+H)";
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.ctrlKey && event.altKey && event.key === "h") {
      event.preventDefault();
      this.execute();
    }
  }

  execute(value: string = ''): void {
    if (!this.editor.textarea) return;
    const textarea = this.editor.textarea;

    BlockStyle.applyStyle(textarea, { prefix: "<mark>", suffix: "</mark>", trimFirst: true });
  }
}