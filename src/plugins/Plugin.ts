import Editor from "../Editor"

export default abstract class Plugin {
  editor: Editor

  constructor(editor: Editor) {
    this.editor = editor

    this.startListening()
  }

  destroy() {
    this.stopListening()
  }

  abstract getKey(): string

  abstract getTitle(): string

  private startListening() {
    this.editor.sourceElement.addEventListener('keydown', this.onKeyDown.bind(this))
  }

  private stopListening() {
    this.editor.sourceElement.removeEventListener('keydown', this.onKeyDown.bind(this))
  }

  abstract getIcon(): string

  abstract onKeyDown(event: KeyboardEvent): void

  abstract execute(): void
}