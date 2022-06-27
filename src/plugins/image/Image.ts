import Editor from "../../Editor";
import BlockStyle from "../BlockStyle";
import Plugin from "../Plugin";

import icon from "./icon.svg";
import ImageBrowser from "./ImageBrowser";

export default class Image extends Plugin {

  browser?: ImageBrowser

  constructor(editor: Editor) {
    super(editor)

    this.initializeBrowser()
  }

  initializeBrowser() {
    if (!this.editor.config.imageBrowserUrl) return

    this.browser = new ImageBrowser(this.editor)
  }

  getKey(): string {
    return "image";
  }

  getIcon(): string {
    return icon;
  }

  getTitle(): string {
    return "Image";
  }

  onKeyDown(event: KeyboardEvent): void {
    // Nothing to do, no key bindings
  }

  execute(value: string = ''): void {
    if (!this.editor.textarea) return
    const textarea = this.editor.textarea

    if (!this.browser) {
      BlockStyle.applyStyle(textarea, { prefix: "![", suffix: "](https://)", replaceNext: "https://", scanFor: "https?://" })
    } else {

      this.browser.browse()
    }
  }

}