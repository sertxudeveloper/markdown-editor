import DOMPurify from 'dompurify';
import { marked } from 'marked';

const renderer = new marked.Renderer();
renderer.link = function (href: string, title: string = '', text: string) {
  // If the href is an image, we want to add the image to the DOM
  if (href === text && href.match(/\.(jpeg|jpg|gif|png)$/)) {
    return `<img src="${href}" alt="${title}" />`;
  }

  return `<a target="_blank" title="${title}" href="${href}">${text || href}` + '</a>';
}

marked.setOptions({
  gfm: true,
});

marked.use({ renderer })

export default class Preview {

  static renderMarkdown(markdown: string): string {
    // return DOMPurify.sanitize(marked(markdown, { renderer: renderer }));
    return DOMPurify.sanitize(marked.parse(markdown), { ADD_ATTR: ['target'] });
  }

}
