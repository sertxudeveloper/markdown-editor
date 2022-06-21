import Plugin from "markdown-editor/src/plugins/Plugin";
import Editor from "../../Editor";
import{ debounce } from "lodash";
import getCaretCoordinates from 'textarea-caret';

import icon from "./icon.svg";
import { isAtCursor } from "../../utils/Utils";

export type FeedItem = {
  id: string;
  name: string;
  link?: string;
}

export type MentionFeed = {
  prefix: string;
  feed: [FeedItem]|Promise<[FeedItem]>;
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

  feeds: [MentionFeed];

  debouncedHandler = debounce(this.handleMentions, 100);

  mentionsListbox?: HTMLDivElement;

  constructor(editor: Editor) {
    if (Editor.config.mentions.length === 0) return;

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
    return icon;
  }

  onKeyDown(event: KeyboardEvent): void {
    this.editor.textarea.addEventListener('keyup', this.onKeyUp.bind(this), { once: true });
  }

  /** Use keyup instead of keydown event, pressed character not inserted until keyup */
  onKeyUp(event: KeyboardEvent): void {
    this.debouncedHandler(event);
  }

  execute(): void {
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
		const feedsWithPattern = Editor.config.mentions.map(feed => ({
			...feed,
			pattern: this.createRegExp(feed.prefix, feed.minimumCharacters || 0)
		}));

    this.feeds = feedsWithPattern;
  }

  createRegExp(prefix: string, minimumCharacters: number): RegExp {
    return new RegExp(`${prefix}[a-z\\d]*(?:[a-z\\d]|-(?=[a-z\\d])){${minimumCharacters},38}(?!\\w)`, 'g');
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
    if (this.mentionsListbox) this.editor.textarea.parentElement.removeChild(this.mentionsListbox);

    this.mentionsListbox = null;
  }

  createMentionsListbox(prefix: string, search: string, cursorTop: string, cursorLeft: string): void {
    if (this.mentionsListbox) return;

    this.mentionsListbox = document.createElement('div');
    this.mentionsListbox.classList.add('mentions-listbox');
    this.mentionsListbox.style.position = 'absolute';
    this.mentionsListbox.style.top = cursorTop;
    this.mentionsListbox.style.left = cursorLeft;

    this.editor.textarea.parentElement.appendChild(this.mentionsListbox);

    this.fetchMentions(prefix, search)
      .then(mentions => {
        let feed = this.feeds.find(feed => feed.prefix === prefix);

        let mentionsElements = mentions.map((item): HTMLElement => {

          if (feed.itemRenderer && typeof feed.itemRenderer === 'function') {
            return feed.itemRenderer(item);
          }

          return this.itemRenderer(item);
        })

        this.mentionsListbox.innerHTML = mentionsElements.map(e => e.outerHTML).join('');
      })
      .catch(error => {
        console.error(error);
      });


    // this.mentionsListbox.addEventListener('click', (event) => {
    //   event.preventDefault();
    //   event.stopPropagation();
    //
    //   let target = event.target as HTMLAnchorElement;
    //   let mention = target.innerText;
    //
    //   this.editor.textarea.focus();
    //
    //   this.editor.textarea.value = this.editor.textarea.value.substring(0, this.editor.textarea.selectionStart) + mention + this.editor.textarea.value.substring(this.editor.textarea.selectionEnd);
    //
    //   this.destroyMentionsListbox();
    // });
  }

  fetchMentions(prefix: string, search: string): Promise<FeedItem[]> {
    let feed = this.feeds.find(feed => feed.prefix === prefix);

    if (!feed) return Promise.reject(new Error(`No feed found for prefix: ${prefix}`));

    return Promise.resolve(feed.feed);
  }

  itemRenderer(item: FeedItem): HTMLElement {
    const itemContainer = document.createElement('div')
    itemContainer.setAttribute('role', 'button');
    itemContainer.classList.add('mentions-listbox-item');

    if (item.link) {
      const linkElement = document.createElement('a');
      linkElement.href = item.link;
      linkElement.title = item.name;
      linkElement.innerText = item.name;
      linkElement.target = '_blank';
      itemContainer.appendChild(linkElement);
    } else {
      const nameElement = document.createElement('span')
      nameElement.innerText = item.name
      nameElement.classList.add('mentions-listbox-item-name')
      itemContainer.appendChild(nameElement)

      const idElement = document.createElement('span')
      idElement.innerText = item.id
      idElement.classList.add('mentions-listbox-item-id')
      itemContainer.appendChild(idElement)
    }

    return itemContainer
  }
}
