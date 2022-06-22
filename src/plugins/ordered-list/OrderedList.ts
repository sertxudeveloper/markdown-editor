import { insertText } from "../../utils/Utils";
import ListStyle from "../ListStyle";
import Plugin from "../Plugin"

import icon from "./icon.svg"

export default class OrderedList extends Plugin {
  getKey(): string {
    return "ordered-list";
  }

  getIcon(): string {
    return icon;
  }

  getTitle(): string {
    return "Ordered List (Ctrl+Alt+7)";
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.ctrlKey && event.altKey && event.key === "7") {
      event.preventDefault()
      this.execute()
    }

    if (event.key === "Enter") {
      // Check if previous line is a list item
      const textarea = this.editor.textarea
      if (!this.editor.textarea) return

      const line = textarea.value.slice(0, textarea.selectionStart).split("\n").pop()
      // If the previous line is a list item, then we want to add a list item
      if (line && line.match(/^\d+\. /g)?.length && line.trim().length > line.match(/^\d+\. /g).pop().length) {
        event.preventDefault()
        let lastNumber = line.match(/^\d+\. /g).pop()

        let text = `\n${parseInt(lastNumber) + 1}. `

        insertText(textarea, { text, selectionStart: textarea.selectionStart + text.length, selectionEnd: textarea.selectionStart + text.length })
      }

      // If the current line is an empty list item, then we want to remove the list item
      else if (line && line.match(/^\d+\. /g)?.length && line.trim().length === line.match(/^\d+\. /g).pop().trim().length) {
        event.preventDefault()

        textarea.selectionStart -= line.match(/^\d+\. /g).pop().length
        insertText(textarea, { text: "", selectionStart: textarea.selectionStart, selectionEnd: textarea.selectionStart })
      }

    }
  }

  execute(value: string = ''): void {
    if (!this.editor.textarea) return
    const textarea = this.editor.textarea

    ListStyle.applyStyle(textarea, { prefix: "1. ", orderedList: true })
  }
}