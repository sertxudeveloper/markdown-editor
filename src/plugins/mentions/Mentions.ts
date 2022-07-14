import Plugin from "../Plugin";
import Editor from "../../Editor";
import { debounce } from "lodash";
import getCaretCoordinates from 'textarea-caret';

import { expandSelectedText, insertText, isAtCursor } from "../../utils/Utils";

export type FeedItem = {
  id: string;
  name: string;
}

export type MentionFeed = {
  prefix: string;
  feed: [FeedItem] | Function;
  minimumCharacters?: number;
  pattern?: RegExp;
  itemRenderer?: Function;
}

export type Mention = {
  mention: string;
  start: number;
  end: number;
}

export default class Mentions extends Plugin {

  feeds: MentionFeed[];

  debouncedHandler = debounce(this.handleMentions, 100);

  mentionsListbox?: HTMLDivElement;

  constructor(editor: Editor) {
    if (editor.config.mentions.length === 0) return;

    super(editor);

    this.initializeFeeds();
  }

  getKey(): string {
    return "mentions";
  }

  getTitle(): string {
    return "Mentions";
  }

  getIcon(): string {
    return '';
  }

  onKeyDown(event: KeyboardEvent): void {
    this.editor.textarea.addEventListener('keyup', this.onKeyUp.bind(this), { once: true });
  }

  /** Use keyup instead of keydown event, pressed character not inserted until keyup */
  onKeyUp(event: KeyboardEvent): void {
    this.debouncedHandler(event);
  }

  execute(value: string = ''): void {
    // throw new Error("Method not implemented.");
  }

  extractMentions(text: string): Mention[] {
    let mention;
    let mentions = [];

    // Get the mentions from each feed
    for (const feed of this.feeds) {
      while ((mention = feed.pattern.exec(text)) !== null) {
        mentions.push({
          mention: mention[0],
          start: mention.index,
          end: mention.index + mention[0].length,
        });
      }
    }

    return mentions;
  }

  initializeFeeds() {
    const feedsWithPattern = this.editor.config.mentions.map(feed => ({
      ...feed,
      pattern: this.createRegExp(feed.prefix, feed.minimumCharacters || 0)
    }));

    this.feeds = feedsWithPattern;
  }

  createRegExp(prefix: string, minimumCharacters: number): RegExp {
    return new RegExp(`${prefix}[a-z\\d]*(?:[a-z\\d.]|-(?=[a-z\\d.])){${minimumCharacters},38}(?!\\w)`, 'g');
  }

  handleMentions(event: KeyboardEvent): void {
    const textarea = this.editor.textarea;

    let mentions = this.extractMentions(textarea.value);

    if (!mentions.length) return this.destroyMentionsListbox();

    const shouldSearch = mentions.some(({ mention, start, end }) => {
      if (isAtCursor(textarea, start, end)) {
        let [cursorTop, cursorLeft] = this.updateListboxPosition(textarea, start);

        // Split the prefix and the search term
        let prefix = mention.substring(0, 1);
        let search = mention.substring(1);

        this.createMentionsListbox(prefix, search, cursorTop, cursorLeft);

        return true;
      }

      return false;
    })

    if (!shouldSearch) return this.destroyMentionsListbox();
  }

  updateListboxPosition(textarea: HTMLTextAreaElement, position: number): [string, string] {
    const coordinates = getCaretCoordinates(textarea, position);
    let cursorTop = coordinates.top + 25 + 'px';
    let cursorLeft = coordinates.left + 'px';

    return [cursorTop, cursorLeft];
  }

  destroyMentionsListbox(): void {
    if (this.mentionsListbox) this.mentionsListbox.remove();

    this.mentionsListbox = null;
  }

  createMentionsListbox(prefix: string, search: string, cursorTop: string, cursorLeft: string): void {
    if (this.mentionsListbox) this.destroyMentionsListbox();

    let feed = this.feeds.find(feed => feed.prefix === prefix);
    if (!feed) return;

    if (feed.minimumCharacters && search.length < feed.minimumCharacters) return;

    this.mentionsListbox = document.createElement('div');
    this.mentionsListbox.classList.add('mentions-listbox');
    this.mentionsListbox.style.position = 'absolute';
    this.mentionsListbox.style.top = cursorTop;
    this.mentionsListbox.style.left = cursorLeft;

    // Fetch the mentions, render them, add the click event handler and append them to the listbox
    this.fetchMentions(prefix, search)
      .then(mentions => {
        this.mentionsListbox.innerHTML = '';

        let mentionsElements = mentions.map((item): HTMLElement => {
          let element

          if (feed.itemRenderer && typeof feed.itemRenderer === 'function') {
            element = feed.itemRenderer(item);
          } else {
            element = this.itemRenderer(item);
          }

          // Add the click event handler
          element.addEventListener('click', this.onMentionClick.bind(this, item));

          return element
        })

        if (!mentionsElements.length) return;

        this.mentionsListbox.append(...mentionsElements);

        this.editor.textarea.parentElement.appendChild(this.mentionsListbox);
      })
  }

  fetchMentions(prefix: string, search: string): Promise<FeedItem[]> {
    let feed = this.feeds.find(feed => feed.prefix === prefix);

    if (!feed) return Promise.reject(new Error(`No feed found for prefix: ${prefix}`));

    if (feed.feed instanceof Array) {
      // Search the feed for the search term and return the results

      return Promise.resolve(feed.feed.filter(item => item.name.toLowerCase().includes(search.toLowerCase()) || item.id.toLowerCase().includes(search.toLowerCase())));
    }

    let promise = feed.feed(search);

    return Promise.resolve(promise);
  }

  itemRenderer(item: FeedItem): HTMLElement {
    const itemContainer = document.createElement('div')
    itemContainer.setAttribute('role', 'button');
    itemContainer.classList.add('mentions-listbox-item');

    const nameElement = document.createElement('span')
    nameElement.innerText = item.name
    nameElement.classList.add('mentions-listbox-item-name')
    itemContainer.appendChild(nameElement)

    const idElement = document.createElement('span')
    idElement.innerText = item.id
    idElement.classList.add('mentions-listbox-item-id')
    itemContainer.appendChild(idElement)

    return itemContainer
  }

  onMentionClick(item: FeedItem, event: Event): void {
    event.preventDefault();
    event.stopPropagation();

    expandSelectedText(this.editor.textarea, '', '');

    let position = this.editor.textarea.selectionStart + item.id.length + 1;
    insertText(this.editor.textarea, {text: item.id + ' ', selectionStart: position, selectionEnd: position});

    this.destroyMentionsListbox();
  }
}
