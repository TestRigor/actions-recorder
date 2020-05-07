import { getRelatedLabel, getLabelForElement } from '../helpers/label-finder';
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

    let identifyingData = this.getIdentifier(element, false, this.shouldCalculateContext(options));

    if (!identifyingData.identifier) {
      identifyingData = this.getIdentifier(element, true, this.shouldCalculateContext(options));
    }

    this.identifier = identifyingData.identifier;
    this.index = identifyingData.index;
    this.contextElement = identifyingData.contextElement;
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

  getIdentifier(element, useClass, calculateContext) {
    let identifier = this.getDescriptor(element, useClass),
      identifiedElement = element;

    if (!identifier) {
      identifiedElement = this.getIdentifiableParent(element, '', 10, useClass);
      identifier = this.getDescriptor(identifiedElement, useClass);
    }
    let context = calculateContext ? this.getContext(identifiedElement, identifier) : { index: -1, contextElement: '' };

    context.identifier = identifier;
    return context;
  }

  getDescriptor(srcElement, useClass) {
    if (!srcElement) {
      return '';
    }

    let relatedLabel = getRelatedLabel(srcElement);

    if (relatedLabel) {
      return relatedLabel;
    }
    if (srcElement.ariaLabel) {
      return srcElement.ariaLabel;
    }
    if (srcElement.placeholder) {
      return srcElement.placeholder;
    }
    if (srcElement.name) {
      return srcElement.name;
    }
    if (srcElement.hint) {
      return srcElement.hint;
    }
    if (srcElement.alt) {
      return srcElement.alt;
    }
    if (srcElement.dataTestId) {
      return srcElement.dataTestId;
    }
    if (!this.isHtmlOrBody(srcElement) && this.considerInnerText(srcElement) &&
      srcElement.innerText && srcElement.innerText.trim()) {
      return srcElement.innerText.split('\n')[0];
    }
    if (srcElement.resourceId || srcElement.id) {
      return srcElement.resourceId || srcElement.id;
    }
    let label = getLabelForElement(srcElement);

    if (label) {
      return label;
    }
    if (useClass && srcElement.className && typeof srcElement.className === 'string') {
      return srcElement.className;
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

  getContext(srcElement, elementDescriptor) {
    if (!srcElement || !elementDescriptor) {
      return { index: -1, contextElement: '' };
    }
    let parent = this.getIdentifiableParent(srcElement, elementDescriptor, 25, false),
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
          parent: this.getIdentifiableParent(similarNode, elementDescriptor, 25, false)
        });
      }
      similarNode = similarNodes.iterateNext();
    }

    if (similarNodeArray.length > 1) {
      let useContext = parent && this.isUniqueDescriptor(parent),
        siblings = useContext ? similarNodeArray.filter(sibling => sibling.parent === parent) : similarNodeArray;

      return {
        index: siblings.length > 1 ? siblings.map(sibling => sibling.node).indexOf(srcElement) : -1,
        contextElement: useContext ? this.getDescriptor(parent, false) : ''
      };
    }
    return { index: -1, contextElement: '' };
  }

  elementQuery(descriptor) {
    const queryableAttrs = ['text', 'hint', 'title', 'label', 'aria-label', 'name', 'id', 'data-test-id', 'class',
      'placeholder', 'alternative', 'source'];

    return `//*[contains(normalize-space(), "${descriptor}")] | ` +
      queryableAttrs.map(attr => `//*[@${attr}="${descriptor}"]`).join(' | ');
  }

  getIdentifiableParent(srcElement, childIdentifier, maxDepth, useClass) {
    let parent = srcElement.parentNode,
      keepGoing = parent && maxDepth > 0,
      isDescriptiveParent = parent && this.getDescriptor(parent, useClass) &&
        this.getDescriptor(parent, useClass) !== childIdentifier;

    return isDescriptiveParent ? parent :
      (keepGoing ? this.getIdentifiableParent(parent, childIdentifier, --maxDepth, useClass) : null);
  }

  isUniqueDescriptor(element, useClass) {
    let descriptor = this.getDescriptor(element, useClass),
      similarNodes = document.evaluate(this.elementQuery(descriptor), document, null, XPathResult.ANY_TYPE, null),
      currentNode = similarNodes.iterateNext();

    while (currentNode) {
      if (element !== currentNode && !this.isContainedByOrContains(element, currentNode) && isVisible(currentNode)) {
        return false;
      }
      currentNode = similarNodes.iterateNext();
    }
    return true;
  }

};
