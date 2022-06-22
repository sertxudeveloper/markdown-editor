import Editor from "../../Editor";

export type Image = {
  url: string;
  alt: string;
  name: string;
}

export default class ImageBrowser {
  editor: Editor;

  element?: HTMLDivElement;

  constructor(editor: Editor) {
    this.editor = editor
  }

  init() {
    this.element = document.createElement("div")
    this.element.classList.add("markdown-editor-image-browser")
  }

  browse() {
    if (!this.editor.textarea) return
    const textarea = this.editor.textarea

    this.fetchImages()
      .then((images: Image[]) => {
        // this.render(images)
        console.log(images)
      })
  }

  fetchImages(): Promise<Image[]> {
    return new Promise((resolve, reject) => {
      fetch(Editor.config.imageBrowserUrl, {
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