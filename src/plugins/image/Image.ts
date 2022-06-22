import BlockStyle from "../BlockStyle";
import Plugin from "../Plugin";

import icon from "./icon.svg";

export default class Image extends Plugin {
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
    //
  }

  execute(value: string = ''): void {
    if (!this.editor.textarea) return
    const textarea = this.editor.textarea

    BlockStyle.applyStyle(textarea, { prefix: "![", suffix: "](https://)", replaceNext: "https://", scanFor: "https?://" })
  }

}