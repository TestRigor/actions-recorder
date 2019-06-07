export default class Event {
  constructor(event) {
    const element = event['srcElement'];

    if (!element) {
      return;
    }
    this.className = element.className;
    this.innerText = element.innerText;
    this.resourceId = element.id;

    if (this.shouldAddHtml(element)) {
      this.html = element.outerHTML;
    }
  }

  shouldAddHtml(element) {
    return element.nodeName !== 'HTML' && element.nodeName !== 'BODY';
  }
};
