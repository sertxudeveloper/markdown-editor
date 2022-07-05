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
  plugins?: any[]
  placeholder?: string
  mentions?: MentionFeed[]
  imageBrowserUrl?: string
  uploadAccept?: string
  hasAttachments?: boolean
}

type EditorDefaultConfig =  EditorConfig & {
  builtinPlugins?: any[]
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

  uploadAccept: '.gif,.jpeg,.jpg,.mov,.mp4,.png,.svg,.webm,.csv,.docx,.fodg,.fodp,.fods,.fodt,.gz,.log,.md,.odf,.odg,.odp,.ods,.odt,.pdf,.pptx,.tgz,.txt,.xls,.xlsx,.zip',
}

/**
 * Markdown Editor class
 */
export default class Editor {

  sourceElement?: HTMLElement | undefined

  config: EditorDefaultConfig = {}

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

    if (this.config.hasAttachments) {
      editor.addEventListener('drop', (e) => {
        e.preventDefault()
        e.stopPropagation()

        const files = e.dataTransfer.files
        if (files.length === 0) return;

        this.onAttachmentsChange(...files)
      })

      editor.addEventListener('dragover', (e) => {
        e.preventDefault()
        e.stopPropagation()
      })
    }

    let writeContainer = document.createElement('div')
    writeContainer.classList.add('markdown-editor-write')

    this.textarea = document.createElement('textarea')
    this.textarea.name = this.config.key
    this.textarea.id = this.config.key
    this.textarea.value = initialValue
    this.textarea.placeholder = this.config.placeholder

    this.textarea.addEventListener('input', this.autoresize.bind(this))
    this.textarea.addEventListener('input', this.updatePreview.bind(this))
    this.textarea.addEventListener('input', this.onValueChange.bind(this))

    if (this.config.hasAttachments) {
      this.textarea.addEventListener('paste', this.onPaste.bind(this))
    }

    writeContainer.appendChild(this.textarea)

    if (this.config.hasAttachments) {
      let fileInputContainer = document.createElement('label')
      fileInputContainer.classList.add('markdown-editor-file-input')

      let labelContent = document.createElement('span')
      labelContent.id = this.config.key + '-label-content'
      labelContent.innerHTML = 'Attach files by dragging & dropping, selecting or pasting them.'
      fileInputContainer.appendChild(labelContent)

      let fileInput = document.createElement('input')
      fileInput.type = 'file'
      fileInput.multiple = true
      fileInput.accept = this.config.uploadAccept

      fileInput.addEventListener('change', (e: any) => {
        const files = e.target.files
        if (files.length === 0) return;

        this.onAttachmentsChange(...files)
      })

      fileInputContainer.appendChild(fileInput)

      writeContainer.appendChild(fileInputContainer)
    }

    editor.appendChild(writeContainer)

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
      button.classList.add(`${mode}-mode-button`)
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
      this.sourceElement.classList.add('markdown-write-mode')
      this.sourceElement.classList.remove('markdown-preview-mode')
    } else {
      this.sourceElement.classList.add('markdown-preview-mode')
      this.sourceElement.classList.remove('markdown-write-mode')
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

  onPaste(event: ClipboardEvent) {
    const items = event.clipboardData.items;
    if (items.length === 0) return;

    for (const item of items) {
      if (item.kind !== 'file') continue;

      const file = item.getAsFile();
      if (!file) continue;

      this.onAttachmentsChange(file)
    }
  }

  onAttachmentsChange(...files: File[]) {
    if (this.eventCallbacks['attachments'] && typeof this.eventCallbacks['attachments'] === 'function') {
      this.eventCallbacks['attachments'](files)
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