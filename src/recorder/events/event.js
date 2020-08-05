import { getRelatedLabel, getLabelForElement } from '../helpers/label-finder';
import { HTML_TAGS, INLINE_TAGS, CONSIDER_INNER_TEXT_TAGS,
  isInput, isButtonOrLink, isButton } from '../helpers/html-tags';
import { isVisible } from '../helpers/rect-helper';

export default class Event {
  constructor(event, options) {
    let element = event.target || event.toElement || event.srcElement;

    element = this.skipSVGInternals(element);

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

    if (event.type !== 'popstate') {
      element.labelElement = getLabelForElement(element);

      if (element.labelElement) {
        this.label = element.labelElement.innerText;
      }

      if (this.shouldCheckForCustomTag()) {
        this.customTag = this.getNearestCustomTag(element);
      }

      let isNotClickOfInput = event.type === 'click' && !isInput(element);

      let identifyingData = this.getIdentifier(element, false, isNotClickOfInput, this.shouldCalculateContext(options));

      if (!identifyingData.identifier) {
        identifyingData = this.getIdentifier(element, true, isNotClickOfInput, this.shouldCalculateContext(options));
      }

      this.identifier = identifyingData.identifier;
      this.index = identifyingData.index;
      this.contextElement = identifyingData.contextElement;
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

  getIdentifier(element, useClass, isNotClickOfInput, calculateContext) {
    let identifier = this.getDescriptor(element, useClass, true),
      identifiedElement = element;

    if (!identifier && !isInput(element)) {
      identifiedElement = this.getIdentifiableParent(element, '', 10,
        useClass, isNotClickOfInput, this.hasPointerCursor(element), true);
      identifier = this.getDescriptor(identifiedElement, useClass, true);
    }
    let context = calculateContext ? this.getContext(identifiedElement, identifier) : { index: -1, contextElement: '' };

    context.identifier = identifier;
    return context;
  }

  getDescriptor(srcElement, useClass, useInnerText) {
    if (!srcElement) {
      return '';
    }
    if (isButton(srcElement) && srcElement.value) {
      return srcElement.value;
    }

    let relatedLabel = getRelatedLabel(srcElement);

    if (relatedLabel) {
      return relatedLabel.innerText;
    }
    if (srcElement.placeholder) {
      return srcElement.placeholder;
    }
    if (srcElement.name) {
      return srcElement.name;
    }
    if (useInnerText && !isInput(srcElement) && srcElement.innerText) {
      return srcElement.innerText;
    }
    if (srcElement.ariaLabel) {
      return srcElement.ariaLabel;
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
    if (srcElement.resourceId || srcElement.id) {
      return srcElement.resourceId || srcElement.id;
    }
    let labelElement = getLabelForElement(srcElement);

    if (labelElement) {
      return labelElement.innerText;
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
    let parent = this.getIdentifiableParent(srcElement, elementDescriptor, 25, false, false, false, false),
      query = this.elementQuery(elementDescriptor),
      similarNodeArray = [],
      similarNodes = document.evaluate(query, document, null, XPathResult.ANY_TYPE, null),
      similarNode = similarNodes.iterateNext();

    while (similarNode) {
      if (isVisible(similarNode) &&
        this.getDescriptor(similarNode, true, false) === elementDescriptor &&
        !this.isContainedByOrContains(srcElement, similarNode) &&
        similarNode !== srcElement.labelElement &&
        !similarNodeArray.find(current => this.isContainedByOrContains(current.node, similarNode))) {
        similarNodeArray.push({
          node: similarNode,
          parent: this.getIdentifiableParent(similarNode, elementDescriptor, 25, false, false, false)
        });
      }
      similarNode = similarNodes.iterateNext();
    }

    if (similarNodeArray.length > 1) {
      let useContext = parent && this.isUniqueDescriptor(parent),
        siblings = useContext ? similarNodeArray.filter(sibling => sibling.parent === parent) : similarNodeArray;

      return {
        index: siblings.length > 1 ? siblings.map(sibling => sibling.node).indexOf(srcElement) : -1,
        contextElement: useContext ? this.getDescriptor(parent, false, false) : ''
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

  getIdentifiableParent(srcElement, childIdentifier, maxDepth, useClass, stopAtButton, stopAtLastPointer,
    useInnerText) {
    let parent = srcElement.parentNode;

    if (!parent) {
      return null;
    }

    let isDescriptiveParent = this.getDescriptor(parent, useClass, useInnerText) &&
      this.getDescriptor(parent, useClass, useInnerText) !== childIdentifier;

    if (isDescriptiveParent) {
      return parent;
    }

    let keepGoing = (maxDepth > 0) && !(stopAtButton && isButtonOrLink(srcElement)) &&
      (!stopAtLastPointer || this.hasPointerCursor(parent));

    return keepGoing ?
      this.getIdentifiableParent(parent, childIdentifier, --maxDepth, useClass, stopAtButton, stopAtLastPointer) : null;
  }

  isUniqueDescriptor(element, useClass) {
    let descriptor = this.getDescriptor(element, useClass, false),
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

  hasPointerCursor(element) {
    let style = window.getComputedStyle(element);

    return style && style.getPropertyValue('cursor') === 'pointer';
  }

  skipSVGInternals(element) {
    return element && element.ownerSVGElement ? this.skipSVGInternals(element.ownerSVGElement) : element;
  }
};
