import { expandSelectedText, insertText, isMultipleLines, newlinesToSurroundSelectedText } from "../utils/Utils"

export type BlockStyleArgs = {
  prefix?: string
  suffix?: string
  blockPrefix?: string
  blockSuffix?: string
  replaceNext?: string
  prefixSpace?: boolean
  scanFor?: string
  surroundWithNewlines?: boolean
  trimFirst?: boolean
  multiline?: boolean
}

const defaultBlockStyleArgs: BlockStyleArgs = {
  prefix: '',
  suffix: '',
  blockPrefix: '',
  blockSuffix: '',
  replaceNext: '',
  prefixSpace: false,
  scanFor: '',
  surroundWithNewlines: false,
  trimFirst: false,
  multiline: false
}

export default class BlockStyle {

  static applyStyle(textarea: HTMLTextAreaElement, args: BlockStyleArgs): void {

    const { prefix, suffix, blockPrefix, blockSuffix, replaceNext, prefixSpace, scanFor, surroundWithNewlines, trimFirst, multiline } = { ...defaultBlockStyleArgs, ...args }

    const originalSelectionStart = textarea.selectionStart;
    const originalSelectionEnd = textarea.selectionEnd;

    let selectedText = textarea.value.slice(textarea.selectionStart, textarea.selectionEnd);

    let prefixToUse = isMultipleLines(selectedText) && blockPrefix.length > 0 ? `${blockPrefix}\n` : prefix;
    let suffixToUse = isMultipleLines(selectedText) && blockSuffix.length > 0 ? `\n${blockSuffix}` : suffix;

    if (prefixSpace) {
      const beforeSelection = textarea.value[textarea.selectionStart - 1];

      if (textarea.selectionStart !== 0 && beforeSelection != null && !beforeSelection.match(/\s/)) {
        prefixToUse = ` ${prefixToUse}`;
      }
    }

    selectedText = expandSelectedText(textarea, prefixToUse, suffixToUse, multiline);

    let selectionStart = textarea.selectionStart;
    let selectionEnd = textarea.selectionEnd;
    const hasReplaceNext = replaceNext.length > 0 && suffixToUse.indexOf(replaceNext) > -1 && selectedText.length > 0;

    let newlinesToAppend;
    let newlinesToPrepend;
    if (surroundWithNewlines) {
      const ref = newlinesToSurroundSelectedText(textarea);
      newlinesToAppend = ref.newlinesToAppend;
      newlinesToPrepend = ref.newlinesToPrepend;
      prefixToUse = newlinesToAppend + prefix;
      suffixToUse += newlinesToPrepend;
    }

    if (selectedText.startsWith(prefixToUse) && selectedText.endsWith(suffixToUse)) {
      const replacementText = selectedText.slice(prefixToUse.length, selectedText.length - suffixToUse.length);

      if (originalSelectionStart === originalSelectionEnd) {
        let position = originalSelectionStart - prefixToUse.length;
        position = Math.max(position, selectionStart);
        position = Math.min(position, selectionStart + replacementText.length);
        selectionStart = selectionEnd = position;
      } else {
        selectionEnd = selectionStart + replacementText.length;
      }

      return insertText(textarea, { text: replacementText, selectionStart, selectionEnd })

    } else if (!hasReplaceNext) {
      let replacementText = prefixToUse + selectedText + suffixToUse;
      selectionStart = originalSelectionStart + prefixToUse.length;
      selectionEnd = originalSelectionEnd + prefixToUse.length;
      const whitespaceEdges = selectedText.match(/^\s*|\s*$/g);

      if (trimFirst && whitespaceEdges) {
        const leadingWhitespace = whitespaceEdges[0] || '';
        const trailingWhitespace = whitespaceEdges[1] || '';
        replacementText = leadingWhitespace + prefixToUse + selectedText.trim() + suffixToUse + trailingWhitespace;
        selectionStart += leadingWhitespace.length;
        selectionEnd -= trailingWhitespace.length;
      }

      return insertText(textarea, { text: replacementText, selectionStart, selectionEnd })

    } else if (scanFor.length > 0 && selectedText.match(scanFor)) {
      suffixToUse = suffixToUse.replace(replaceNext, selectedText);
      const replacementText = prefixToUse + suffixToUse;
      selectionStart = selectionEnd = selectionStart + prefixToUse.length;

      return insertText(textarea, { text: replacementText, selectionStart, selectionEnd })

    } else {
      const replacementText = prefixToUse + selectedText + suffixToUse;
      selectionStart = selectionStart + prefixToUse.length + selectedText.length + suffixToUse.indexOf(replaceNext);
      selectionEnd = selectionStart + replaceNext.length;

      return insertText(textarea, { text: replacementText, selectionStart, selectionEnd })

    }
  }
}