import { insertText } from "../../utils/Utils";
import MultilineStyle from "../MultilineStyle";
import Plugin from "../Plugin";

import icon from "./icon.svg";

export default class Quote extends Plugin {
  getKey(): string {
    return "quote";
  }

  getIcon(): string {
    return icon;
  }

  getTitle(): string {
    return "Quote (Ctrl+Alt+.)";
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.ctrlKey && event.altKey && event.key === ".") {
      event.preventDefault()
      this.execute()
    }

    if (event.key === "Enter") {
      const textarea = this.editor.textarea
      if (!this.editor.textarea) return

      const line = textarea.value.slice(0, textarea.selectionStart).split("\n").pop()

      // If the previous line is a list item, then we want to add a list item
      if (line && line.startsWith("> ") && line.trim().length > 1) {
        event.preventDefault()
        insertText(textarea, { text: "\n> ", selectionStart: textarea.selectionStart + 3, selectionEnd: textarea.selectionStart + 3 })
      }

      // If the current line is an empty list item, then we want to remove the list item
      else if (line && line.startsWith("> ") && line.trim().length === 1) {
        event.preventDefault()

        textarea.selectionStart -= 2
        insertText(textarea, { text: "", selectionStart: textarea.selectionStart, selectionEnd: textarea.selectionStart })
      }

    }
  }

  execute(): void {
    if (!this.editor.textarea) return
    const textarea = this.editor.textarea

    MultilineStyle.applyStyle(textarea, { prefix: "> " })
  }
}
