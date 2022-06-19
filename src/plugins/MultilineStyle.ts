import { insertText, newlinesToSurroundSelectedText, expandSelectionToLine } from "../utils/Utils"

export type MultilineStyleArgs = {
  prefix?: string
  suffix?: string
  surroundWithNewlines?: boolean
}

const defaultBlockStyleArgs: MultilineStyleArgs = {
  prefix: '',
  suffix: '',
  surroundWithNewlines: false,
}

export default class MultilineStyle {

  static applyStyle(textarea: HTMLTextAreaElement, args: MultilineStyleArgs): void {
    const { prefix, suffix, surroundWithNewlines } = { ...defaultBlockStyleArgs, ...args }

    expandSelectionToLine(textarea);

    let text = textarea.value.slice(textarea.selectionStart, textarea.selectionEnd);
    let selectionStart = textarea.selectionStart;
    let selectionEnd = textarea.selectionEnd;

    const lines = text.split('\n');
    const undoStyle = lines.every(line => line.startsWith(prefix) && line.endsWith(suffix));

    if (undoStyle) {
      text = lines.map(line => line.slice(prefix.length, line.length - suffix.length)).join('\n');
      selectionEnd = selectionStart + text.length;
    } else {
      text = lines.map(line => prefix + line + suffix).join('\n');

      if (surroundWithNewlines) {
        const { newlinesToAppend, newlinesToPrepend } = newlinesToSurroundSelectedText(textarea);
        selectionStart += newlinesToAppend.length;
        selectionEnd = selectionStart + text.length;
        text = newlinesToAppend + text + newlinesToPrepend;
      }
    }

    return insertText(textarea, { text, selectionStart: selectionEnd + prefix.length, selectionEnd: selectionEnd + prefix.length })
  }
}