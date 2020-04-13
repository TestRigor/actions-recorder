import getLabelForElement from '../helpers/label-finder';
import { HTML_TAGS, INLINE_TAGS, CONSIDER_INNER_TEXT_TAGS } from '../helpers/html-tags';
import { isVisible } from '../helpers/rect-helper';

export default class Event {
  constructor(event, options) {
    const element = event['srcElement'];

    if (!element) {
      return;
    }
    if (!this.isHtmlOrBody(element)) {
      this.innerText = element.innerText;
    }
    let rect = element.getBoundingClientRect ? element.getBoundingClientRect() || {} : {};

    this.clientHeight = rect.height || element.clientHeight;
    this.clientWidth = rect.width || element.clientWidth;
    this.clientTop = rect.top || element.clientTop;
    this.clientLeft = rect.left || element.clientLeft;
    this.className = (typeof element.className === 'string') ? element.className : '';
    this.resourceId = element.id;
    this.offsetHeight = element.offsetHeight;
    this.offsetWidth = element.offsetWidth;
    this.offsetLeft = element.offsetLeft;
    this.offsetTop = element.offsetTop;
    this.scrollHeight = element.scrollHeight;
    this.scrollWidth = element.scrollWidth;
    this.scrollTop = element.scrollTop;
    this.scrollLeft = element.scrollLeft;
    this.disabled = element.disabled;
    this.hidden = element.hidden;
    this.tagName = element.tagName;
    this.elementType = element.type;
    this.xpath = this.getXPathForElement(element);
    this.hint = element.hint;
    this.windowScrollY = window.scrollY;
    this.windowScrollX = window.scrollX;
    this.windowHeight = window.innerHeight;
    this.windowWidth = window.innerWidth;
    this.url = location.href;
    this.label = getLabelForElement(element);
    if (this.shouldCheckForCustomTag()) {
      this.customTag = this.getNearestCustomTag(element);
    }
    if (this.shouldCalculateContext(options)) {
      try {
        this.setContext(this, element);
      } catch (error) {
        this.index = -1;
      }
    }
  }

  isHtmlOrBody(element) {
    return element.nodeName === 'HTML' || element.nodeName === 'BODY';
  }

  getXPathForElement(element) {
    if (!element) {
      return '';
    }
    return this.segment(element).join('/');
  }

  index(sibling, name) {
    if (sibling) {
      return this.index(sibling.previousElementSibling, name || sibling.localName) + (sibling.localName === name);
    }
    return 1;
  }

  segment(element) {
    if (!element || element.nodeType !== 1) {
      return [''];
    }
    return [...this.segment(element.parentNode), `${element.localName.toLowerCase()}[${this.index(element)}]`];
  }

  shouldCheckForCustomTag() {
    return window.angular !== undefined ||
      window.ng !== undefined ||
      window.React !== undefined;
  }

  shouldCalculateContext(options) {
    return !!(options && !options.token);
  }

  getNearestCustomTag(element) {
    let customElement = this.getNearestCustomElement(element);

    return customElement ? customElement.localName : '';
  }

  getNearestCustomElement(element) {
    if (element) {
      return this.isCustomElement(element) ? element : this.getNearestCustomElement(element.parentNode);
    }
    return undefined;
  }

  isCustomElement(element) {
    return !HTML_TAGS.includes(element.localName);
  }

  getDescriptor(srcElement, useClassAndId) {
    if (!srcElement) {
      return '';
    }

    let label = getLabelForElement(srcElement);

    if (label) {
      return label;
    }
    if (!this.isHtmlOrBody(srcElement) && this.considerInnerText(srcElement) && srcElement.innerText) {
      return srcElement.innerText;
    }
    if (srcElement.placeholder) {
      return srcElement.placeholder;
    }
    if (srcElement.name) {
      return srcElement.name;
    }
    if (useClassAndId) {
      if (srcElement.resourceId || srcElement.id) {
        return srcElement.resourceId || srcElement.id;
      }
      if (srcElement.className && typeof srcElement.className === 'string' &&
        this.isClassUnique(srcElement.className)) {
        return srcElement.className;
      }
    }
    return '';
  }

  considerInnerText(srcElement) {
    return (srcElement.tagName && INLINE_TAGS.indexOf(srcElement.tagName.toLowerCase()) !== -1) ||
      (srcElement.tagName && CONSIDER_INNER_TEXT_TAGS.indexOf(srcElement.tagName.toLowerCase()) !== -1);
  }

  isClassUnique(cssClass) {
    return document.getElementsByClassName(cssClass).length === 1;
  }

  isContainedByOrContains(element, other) {
    return element !== other && (element.contains(other) || other.contains(element));
  }

  setContext(element, srcElement) {
    let elementDescriptor = this.getDescriptor(element, true);

    element.index = -1;
    if (!elementDescriptor) {
      return;
    }
    let parent = this.getIdentifiableParent(srcElement, elementDescriptor, 100),
      query = this.elementQuery(elementDescriptor),
      similarNodeArray = [],
      similarNodes = document.evaluate(query, document, null, XPathResult.ANY_TYPE, null),
      similarNode = similarNodes.iterateNext();

    while (similarNode) {
      if (isVisible(similarNode) &&
        this.getDescriptor(similarNode, true) === elementDescriptor &&
        !this.isContainedByOrContains(srcElement, similarNode) &&
        !similarNodeArray.find(current => this.isContainedByOrContains(current.node, similarNode))) {
        similarNodeArray.push({
          node: similarNode,
          parent: this.getIdentifiableParent(similarNode, elementDescriptor, 100)
        });
      }
      similarNode = similarNodes.iterateNext();
    }

    if (similarNodeArray.length > 1) {
      let siblings = similarNodeArray.filter(sibling => sibling.parent === parent);

      element.index = siblings.length > 1 ? siblings.map(sibling => sibling.node).indexOf(srcElement) : -1;
      element.contextElement = parent ? this.getDescriptor(parent, false) : '';
    }
  }

  elementQuery(descriptor) {
    const queryableAttrs = ['text', 'hint', 'title', 'label', 'aria-label', 'name', 'id', 'data-test-id', 'class',
      'placeholder', 'alternative', 'source'];

    return `//*[contains(normalize-space(), "${descriptor}")] | ` +
      queryableAttrs.map(attr => `//*[@${attr}="${descriptor}"]`).join(' | ');
  }

  getIdentifiableParent(srcElement, childIdentifier, maxDepth) {
    let parent = srcElement.parentNode,
      keepGoing = parent && maxDepth > 0,
      isDescriptiveParent = parent && this.getDescriptor(parent, false) &&
        this.getDescriptor(parent, false) !== childIdentifier;

    return isDescriptiveParent ? parent :
      (keepGoing ? this.getIdentifiableParent(parent, childIdentifier, --maxDepth) : null);
  }

};
