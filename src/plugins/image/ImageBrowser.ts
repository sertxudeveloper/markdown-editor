import Editor from "../../Editor";
import { insertText } from "../../utils/Utils";
import BlockStyle from "../BlockStyle";

export type Image = {
  url: string;
  alt: string;
  name: string;
}

export default class ImageBrowser {
  editor: Editor;

  element?: HTMLDivElement;

  container?: HTMLDivElement;

  images: Image[] = [];

  constructor(editor: Editor) {
    this.editor = editor
  }

  /**
   * Initialize the image browser
   *
   * @returns void
   */
  init() {
    this.element = document.createElement("div")
    this.element.classList.add("markdown-image-browser")

    this.element.addEventListener("click", (e) => {
      if (e.target === this.element) this.onClose()
    })

    window.addEventListener("keydown", (e) => {
      if (!this.element) return

      if (e.key === "Escape") this.onClose()
    })

    this.container = document.createElement("div")
    this.container.classList.add("browser-container")
  }

  /**
   * Fetch the images from the endpoint and render the image browser
   *
   * @returns void
   */
  browse() {
    if (!this.editor.textarea) return
    const textarea = this.editor.textarea

    if (!this.element || !this.container) this.init()
    this.container.innerHTML = ""

    this.initHeader()

    const grid = document.createElement("div")
    grid.classList.add("browser-grid")

    this.fetchImages()
      .then((images: Image[]) => {
        this.images = images

        this.render(grid)
      })

    this.element.appendChild(this.container)

    document.body.appendChild(this.element)
  }

  /**
   * Render the image browser
   *
   * @returns void
   */
  render(grid: HTMLDivElement): void {
    for (const image of this.images) {
      let imageElement = this.renderImage(image)
      grid.appendChild(imageElement)
    }

    this.container.appendChild(grid)
  }

  /**
   * Initialize the header
   *
   * @returns void
   */
  initHeader() {
    const header = document.createElement("div")
    header.classList.add("browser-header")

    const title = document.createElement("span")
    title.innerText = "Select an image"

    const close = document.createElement("button")
    close.innerHTML = "&times;"
    close.addEventListener("click", this.onClose.bind(this))

    header.appendChild(title)
    header.appendChild(close)

    this.container.appendChild(header)
  }

  onClose() {
    this.element.remove()
  }

  /**
   * Render the provided image
   *
   * @param image Image to render
   * @returns HTMLDivElement
   */
  renderImage(image: Image): HTMLDivElement {
    const container = document.createElement("div")
    container.classList.add("browser-grid-item")
    container.setAttribute('role', 'button')

    const img = document.createElement("img")
    img.src = image.url
    img.alt = image.alt

    const name = document.createElement("div")
    name.innerText = image.name

    container.addEventListener("click", this.insertImage.bind(this, image))

    container.appendChild(img)
    container.appendChild(name)

    return container
  }

  /**
   * Insert the selected image into the textarea
   *
   * @param image Image to insert
   * @returns void
   */
  insertImage(image: Image): void {
    if (!this.editor.textarea) return
    const textarea = this.editor.textarea

    BlockStyle.applyStyle(textarea, { prefix: `![${image.alt}](${image.url})`, suffix: "", replaceNext: "", scanFor: "https?://", surroundWithNewlines: true })
    insertText(textarea, { text: "\n", selectionStart: textarea.selectionStart + 1, selectionEnd: textarea.selectionStart + 1 })

    this.element.remove()
  }

  /**
   * Get all the images from the provided endpoint
   *
   * @returns Promise<Image[]>
   */
  fetchImages(): Promise<Image[]> {
    return new Promise((resolve, reject) => {
      fetch(this.editor.config.imageBrowserUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "X-Requested-With": "XMLHttpRequest",
          "Referer": window.location.href,
        },
      })
        .then(response => response.json())
        .then(json => {
          resolve(json)
        })
        .catch(error => {
          reject(error)
        })

    })
  }
}