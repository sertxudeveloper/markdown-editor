import {
    insertText,
    newlinesToSurroundSelectedText,
    expandSelectionToLine,
    clearExistingListStyle,
    makePrefix,
} from '../utils/Utils';

export type ListStyleArgs = {
    prefix?: string;
    suffix?: string;
    orderedList?: boolean;
    unorderedList?: boolean;
    surroundWithNewlines?: boolean;
};

const defaultBlockStyleArgs: ListStyleArgs = {
    prefix: '',
    suffix: '',
    orderedList: false,
    unorderedList: false,
    surroundWithNewlines: false,
};

export default class ListStyle {
    static applyStyle(textarea: HTMLTextAreaElement, args: ListStyleArgs): void {
        const { prefix, suffix, unorderedList } = { ...defaultBlockStyleArgs, ...args };

        const noInitialSelection = textarea.selectionStart === textarea.selectionEnd;
        let selectionStart = textarea.selectionStart;
        let selectionEnd = textarea.selectionEnd;

        expandSelectionToLine(textarea);

        const selectedText = textarea.value.slice(textarea.selectionStart, textarea.selectionEnd);
        const [undoResult, undoResultOppositeList, pristineText] = clearExistingListStyle(
            args,
            selectedText
        );

        const prefixedLines = pristineText.split('\n').map((value, index) => {
            return `${makePrefix(index, unorderedList)}${value}`;
        });

        const totalPrefixLength = prefixedLines.reduce(
            (previousValue, _currentValue, currentIndex) => {
                return previousValue + makePrefix(currentIndex, unorderedList).length;
            },
            0
        );

        const totalPrefixLengthOppositeList = prefixedLines.reduce(
            (previousValue, _currentValue, currentIndex) => {
                return previousValue + makePrefix(currentIndex, !unorderedList).length;
            },
            0
        );

        if (undoResult.processed) {
            if (noInitialSelection) {
                selectionStart = Math.max(selectionStart - makePrefix(0, unorderedList).length, 0);
                selectionEnd = selectionStart;
            } else {
                selectionStart = textarea.selectionStart;
                selectionEnd = textarea.selectionEnd - totalPrefixLength;

                textarea.setSelectionRange(selectionStart, selectionEnd);
            }

            return insertText(textarea, { text: pristineText, selectionStart, selectionEnd });
        }

        const { newlinesToAppend, newlinesToPrepend } = newlinesToSurroundSelectedText(textarea);
        const text = newlinesToAppend + prefixedLines.join('\n') + newlinesToPrepend;

        if (noInitialSelection) {
            selectionStart = Math.max(
                selectionStart + makePrefix(0, unorderedList).length + newlinesToAppend.length,
                0
            );
            selectionEnd = selectionStart;
        } else {
            if (undoResultOppositeList.processed) {
                selectionStart = Math.max(textarea.selectionStart + newlinesToAppend.length, 0);
                selectionEnd =
                    textarea.selectionEnd +
                    newlinesToAppend.length +
                    totalPrefixLength -
                    totalPrefixLengthOppositeList;
            } else {
                selectionStart = Math.max(textarea.selectionStart + newlinesToAppend.length, 0);
                selectionEnd = textarea.selectionEnd + newlinesToAppend.length + totalPrefixLength;
            }
        }

        return insertText(textarea, { text, selectionStart, selectionEnd });
    }
}
