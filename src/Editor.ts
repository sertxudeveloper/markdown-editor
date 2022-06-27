import Bold from "./plugins/bold/Bold"
import Italic from "./plugins/italic/Italic"
import Quote from "./plugins/quote/Quote"
import Plugin from "./plugins/Plugin"
import Preview from "./Preview"
import Link from "./plugins/link/Link"
import Image from "./plugins/image/Image"
import OrderedList from "./plugins/ordered-list/OrderedList"
import UnorderedList from "./plugins/unordered-list/UnorderedList"
import Strike from "./plugins/strike/Strike"
import Underline from "./plugins/underline/Underline"
import Mark from "./plugins/mark/Mark"
import Mentions, { MentionFeed } from "./plugins/mentions/Mentions"

export type EditorConfig = {
  key?: string
  plugins?: Object[]
  placeholder?: string
  mentions?: MentionFeed[]
  imageBrowserUrl?: string
}

type EditorDefaultConfig = {
  key?: string
  plugins?: Object[]
  builtinPlugins?: Object[]
  placeholder?: string
  mentions?: MentionFeed[]
  imageBrowserUrl?: string
}

const defaultConfig: EditorDefaultConfig = {
  key: 'editor',

  placeholder: 'Start writing...',

  builtinPlugins: [
    Bold,
    Italic,
    Strike,
    Underline,
    Quote,
    Link,
    Image,
    UnorderedList,
    OrderedList,
    Mark,

    Mentions,
  ],

  mentions: [],

  plugins: [],

  imageBrowserUrl: '',
}

/**
 * Markdown Editor class
 */
export default class Editor {

  sourceElement?: HTMLElement | undefined

  config: any = {}

  private eventCallbacks: object[] = []

  private plugins: Plugin[] = []

  textarea?: HTMLTextAreaElement | undefined

  preview?: HTMLDivElement | undefined

  /** Get an HTMLElement or an element query selector */
  constructor(element: string | HTMLElement, config: any = {}) {
    if (typeof element === 'string') {
      this.sourceElement = document.querySelector(element)
    } else {
      this.sourceElement = element
    }

    if (!this.sourceElement) {
      throw new Error('[MarkdownEditor]: No element found')
    }

    /** Merge config */
    this.config = Object.assign(defaultConfig, config)

    this.init()

    this.changeMode('write')
  }

  /** Initialize plugins */
  initPlugins() {
    const plugins = [...this.config.builtinPlugins, ...this.config.plugins]

    for (const plugin in plugins) {
      this.plugins.push(new plugins[plugin](this))
    }
  }

  /** Initialize the editor */
  private init() {
    this.sourceElement.classList.add('markdown-editor-container')

    let initialValue = this.sourceElement.innerHTML
      .replace(/&gt;/g, '>')
      .replace(/&lt;/g, '<')
      .replace(/<br>/g, '\n')

    this.sourceElement.innerHTML = ''

    let editor = document.createElement('div')
    editor.classList.add('markdown-editor')

    this.textarea = document.createElement('textarea')
    this.textarea.classList.add('markdown-editor-write')
    this.textarea.name = this.config.key
    this.textarea.id = this.config.key
    this.textarea.value = initialValue
    this.textarea.placeholder = this.config.placeholder

    this.textarea.addEventListener('input', this.autoresize.bind(this))
    this.textarea.addEventListener('input', this.updatePreview.bind(this))
    this.textarea.addEventListener('input', this.onValueChange.bind(this))

    editor.appendChild(this.textarea)

    this.preview = document.createElement('div')
    this.preview.classList.add('markdown-editor-preview')
    editor.appendChild(this.preview)

    this.initPlugins()

    let toolbar = this.initToolbar()
    this.sourceElement.appendChild(toolbar)

    this.sourceElement.appendChild(editor)

    this.autoresize()
    this.updatePreview()
  }

  /** Autorezise the textarea */
  private autoresize() {
    this.textarea.style.height = 'auto'
    this.textarea.style.height = this.textarea.scrollHeight + 'px'
  }

  private updatePreview() {
    this.preview.innerHTML = Preview.renderMarkdown(this.textarea.value)
  }

  /** Initialize the toolbar */
  private initToolbar(): HTMLElement {
    let toolbar = document.createElement('div')
    toolbar.classList.add('toolbar')

    // Add mode buttons container
    let modeButtons = document.createElement('div')
    modeButtons.classList.add('mode-buttons')

    // Add write and preview buttons
    for (const mode of ['write', 'preview']) {
      let button = document.createElement('div')
      button.setAttribute('role', 'button')
      button.classList.add(mode)
      button.onclick = () => this.changeMode(mode)
      button.innerText = mode

      modeButtons.appendChild(button)
    }

    toolbar.appendChild(modeButtons)

    // Add style buttons container
    let styleButtons = document.createElement('div')
    styleButtons.classList.add('style-buttons')

    // Add style buttons
    for (const plugin of this.plugins) {
      let icon = plugin.getIcon()
      if (!icon) continue

      let button = document.createElement('div')
      button.setAttribute('role', 'button')
      button.addEventListener('click', plugin.execute.bind(plugin))
      button.innerHTML = icon
      styleButtons.appendChild(button)
    }

    toolbar.appendChild(styleButtons)

    return toolbar
  }

  /** Change the editor mode */
  private changeMode(mode: string) {
    if (mode === 'write') {
      this.sourceElement.classList.add('markdown-editor-write')
      this.sourceElement.classList.remove('markdown-editor-preview')
    } else {
      this.sourceElement.classList.add('markdown-editor-preview')
      this.sourceElement.classList.remove('markdown-editor-write')
    }
  }

  /** Custom event listener */
  on(command: string, callback: Function) {
    this.eventCallbacks[command] = callback
  }

  /** Execute a command */
  execute(command: string, value: string = '') {
    // Find the plugin with the given command
    let plugin = this.plugins.find(plugin => plugin.getKey() === command)
    if (!plugin) return

    plugin.execute(value)
  }

  onValueChange() {
    if (this.eventCallbacks['change'] && typeof this.eventCallbacks['change'] === 'function') {
      this.eventCallbacks['change']()
    }
  }

  getValue() {
    return this.textarea?.value || ''
  }

  setValue(value: string) {
    if (this.textarea) {
      this.textarea.value = value
      this.textarea.dispatchEvent(new InputEvent('input'));
    }
  }
}