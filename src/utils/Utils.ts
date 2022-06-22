import { ListStyleArgs } from "../plugins/ListStyle";

export const isMultipleLines = function (string) {
  return string.trim().split('\n').length > 1;
}

export const repeat = function (string, n) {
  return Array(n + 1).join(string);
}

export const expandSelectionToLine = function (textarea: HTMLTextAreaElement) {
  const lines = textarea.value.split('\n');
  let counter = 0;

  for (let index = 0; index < lines.length; index++) {
    const lineLength = lines[index].length + 1;
    if (textarea.selectionStart >= counter && textarea.selectionStart < counter + lineLength) {
      textarea.selectionStart = counter;
    }
    if (textarea.selectionEnd >= counter && textarea.selectionEnd < counter + lineLength) {
      textarea.selectionEnd = counter + lineLength - 1;
    }
    counter += lineLength;
  }
}

export const newlinesToSurroundSelectedText = function (textarea: HTMLTextAreaElement) {
  const beforeSelection = textarea.value.slice(0, textarea.selectionStart);
  const afterSelection = textarea.value.slice(textarea.selectionEnd);

  const breaksBefore = beforeSelection.match(/\n*$/);
  const breaksAfter = afterSelection.match(/^\n*/);

  const newlinesBeforeSelection = breaksBefore ? breaksBefore[0].length : 0;
  const newlinesAfterSelection = breaksAfter ? breaksAfter[0].length : 0;

  let newlinesToAppend;
  let newlinesToPrepend;

  if (beforeSelection.match(/\S/) && newlinesBeforeSelection < 2) {
    newlinesToAppend = repeat('\n', 2 - newlinesBeforeSelection);
  }

  if (afterSelection.match(/\S/) && newlinesAfterSelection < 2) {
    newlinesToPrepend = repeat('\n', 2 - newlinesAfterSelection);
  }

  if (newlinesToAppend == null) {
    newlinesToAppend = '';
  }

  if (newlinesToPrepend == null) {
    newlinesToPrepend = '';
  }

  return { newlinesToAppend, newlinesToPrepend };
}

export const insertText = function (textarea: HTMLTextAreaElement, { text, selectionStart, selectionEnd }): void {
  const originalSelectionStart = textarea.selectionStart;
  const before = textarea.value.slice(0, originalSelectionStart);
  const after = textarea.value.slice(textarea.selectionEnd);

  textarea.value = [before, text, after].join('');

  textarea.dispatchEvent(new InputEvent('input'));

  // Reselect the selection and focus the input.
  window.requestAnimationFrame(() => {
    textarea.focus();

    if (selectionStart != null && selectionEnd != null) {
      textarea.setSelectionRange(selectionStart, selectionEnd);
    } else {
      textarea.setSelectionRange(originalSelectionStart, textarea.selectionEnd);
    }
  })
}

export const expandSelectedText = function (textarea: HTMLTextAreaElement, prefixToUse: string, suffixToUse: string, multiline: boolean = false) {
  if (textarea.selectionStart === textarea.selectionEnd) {
    textarea.selectionStart = wordSelectionStart(textarea.value, textarea.selectionStart);
    textarea.selectionEnd = wordSelectionEnd(textarea.value, textarea.selectionEnd, multiline);
  } else {
    const expandedSelectionStart = textarea.selectionStart - prefixToUse.length;
    const expandedSelectionEnd = textarea.selectionEnd + suffixToUse.length;
    const beginsWithPrefix = textarea.value.slice(expandedSelectionStart, textarea.selectionStart) === prefixToUse;
    const endsWithSuffix = textarea.value.slice(textarea.selectionEnd, expandedSelectionEnd) === suffixToUse;

    if (beginsWithPrefix && endsWithSuffix) {
      textarea.selectionStart = expandedSelectionStart;
      textarea.selectionEnd = expandedSelectionEnd;
    }
  }

  return textarea.value.slice(textarea.selectionStart, textarea.selectionEnd);
}

export const wordSelectionEnd = function (text: string, i: number, multiline: boolean) {
  let index = i;
  const breakpoint = multiline ? /\n/ : /\s/;

  while (text[index] && !text[index].match(breakpoint)) {
    index++;
  }

  return index;
}

export const wordSelectionStart = function (text: string, i: number) {
  let index = i;

  while (text[index - 1] != null && !text[index - 1].match(/\s/)) {
    index--;
  }

  return index;
}

export type UndoResult = {
  text: string,
  processed: boolean,
}

export const clearExistingListStyle = function (style: ListStyleArgs, text: string): [UndoResult, UndoResult, string] {
  let undoResultOppositeList;
  let undoResult;
  let pristineText;

  if (style.orderedList) {
    undoResult = undoOrderedListStyle(text);
    undoResultOppositeList = undoUnorderedListStyle(undoResult.text);
    pristineText = undoResultOppositeList.text;
  } else {
    undoResult = undoUnorderedListStyle(text);
    undoResultOppositeList = undoOrderedListStyle(undoResult.text);
    pristineText = undoResultOppositeList.text;
  }

  return [undoResult, undoResultOppositeList, pristineText];
}

export const undoOrderedListStyle = function (text: string): UndoResult {
  const lines = text.split('\n');
  const orderedListRegex = /^\d+\.\s+/;
  const shouldUndoOrderedList = lines.every(line => orderedListRegex.test(line));

  let result = lines;
  if (shouldUndoOrderedList) {
    result = lines.map(line => line.replace(orderedListRegex, ''));
  }

  return {
    text: result.join('\n'),
    processed: shouldUndoOrderedList
  };
}

export const undoUnorderedListStyle = function (text: string): UndoResult {
  const lines = text.split('\n');
  const unorderedListPrefix = '- ';
  const shouldUndoUnorderedList = lines.every(line => line.startsWith(unorderedListPrefix));

  let result = lines;
  if (shouldUndoUnorderedList) {
    result = lines.map(line => line.slice(unorderedListPrefix.length, line.length));
  }

  return {
    text: result.join('\n'),
    processed: shouldUndoUnorderedList
  };
}

export const makePrefix = function (index: number, unorderedList: boolean): string {
  if (unorderedList) {
    return '- ';
  } else {
    return `${index + 1}. `;
  }
}

export const isAtCursor = function (textarea: HTMLTextAreaElement, start: number, end: number): boolean {
  return textarea.selectionEnd >= start && textarea.selectionEnd <= end;
}
