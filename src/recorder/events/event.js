import { getLabelForElement } from '../helpers/label-finder';
import { HTML_TAGS, INLINE_TAGS, CONSIDER_INNER_TEXT_TAGS,
  isInput, isButtonOrLink, isButton, LOG_OUT_IDENTIFIERS,
  LOG_IN_IDENTIFIERS, isLabel } from '../helpers/html-tags';
import { isVisible, visualDistance, getRelation } from '../helpers/rect-helper';
import {
  leafContainsLowercaseNormalizedMultiple, attrMatch,
  attrMatchMultiple, attrNonMatch
} from '../helpers/query-helper';

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
      element.labelElement = getLabelForElement(element).label;

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
      this.anchor = identifyingData.anchor;
      this.anchorRelation = identifyingData.anchorRelation;
      this.index = identifyingData.index;
      this.contextElement = identifyingData.contextElement;
    }
    this.logOutDetected = this.detectLogOut();
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
    let identifyingData = { index: -1, contextElement: '', anchor: '', relation: ''};

    if (identifier && calculateContext && !this.isUniqueIdentifier(element, identifier)) {

      let anchor = this.getAnchorElement(identifiedElement, identifier);

      if (anchor) {
        identifyingData.anchor = this.getDescriptor(anchor, false, true);
        identifyingData.anchorRelation = getRelation(element, anchor);
      } else {
        let foundContext = this.getContext(identifiedElement, identifier);

        identifyingData.contextElement = foundContext.contextElement;
        identifyingData.index = foundContext.index;
      }
    }
    identifyingData.identifier = identifier;
    return identifyingData;
  }

  getDescriptor(srcElement, useClass, useInnerText) {
    if (!srcElement) {
      return '';
    }
    if (isButton(srcElement) && srcElement.value) {
      return srcElement.value;
    }
    if (srcElement.placeholder) {
      return srcElement.placeholder;
    }

    let relatedLabel = getLabelForElement(srcElement);

    if (relatedLabel.highConfidence) {
      return relatedLabel.label.innerText;
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

    if (relatedLabel.label) {
      return relatedLabel.label.innerText;
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
      let parentIdentifier = this.getDescriptor(parent, false, false),
        useContext = parentIdentifier && this.isUniqueIdentifier(parent, parentIdentifier),
        siblings = useContext ? similarNodeArray.filter(sibling => sibling.parent === parent) : similarNodeArray;

      return {
        index: siblings.length > 1 ? siblings.map(sibling => sibling.node).indexOf(srcElement) : -1,
        contextElement: useContext ? parentIdentifier : ''
      };
    }
    return { index: -1, contextElement: '' };
  }

  elementQuery(descriptor) {
    return `//*[contains(normalize-space(), "${descriptor}")] | ` + attrMatch(descriptor);
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

  isUniqueIdentifier(element, identifier) {
    let similarNodes = document.evaluate(this.elementQuery(identifier), document, null, XPathResult.ANY_TYPE, null),
      currentNode = similarNodes.iterateNext();

    while (currentNode) {
      if (element !== currentNode && !this.isContainedByOrContains(element, currentNode) &&
        this.getIdentifier(currentNode, false, true, false).identifier === identifier) {
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

  detectLogOut() {
    const lookForLogOutQry = leafContainsLowercaseNormalizedMultiple(LOG_OUT_IDENTIFIERS) +
      ' | ' + attrMatchMultiple(LOG_OUT_IDENTIFIERS);

    const logOutResults = document.evaluate(lookForLogOutQry,
      document, null, XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null);

    if (logOutResults.snapshotLength) {
      const lookForLogInQry = leafContainsLowercaseNormalizedMultiple(LOG_IN_IDENTIFIERS) +
        ' | ' + attrMatchMultiple(LOG_IN_IDENTIFIERS);

      const logInResults = document.evaluate(lookForLogInQry,
        document, null, XPathResult.UNORDERED_NODE_ITERATOR_TYPE, null);

      let logInFound = false,
        currentLogin = logInResults.iterateNext();

      while (currentLogin) {
        if (isVisible(currentLogin)) {
          logInFound = true;
          break;
        }
        currentLogin = logInResults.iterateNext();
      }

      return !logInFound;
    }

    return false;
  }

  get10thAncestor(element) {
    let current = element,
      traveled = 0;

    while (current.parentNode && (traveled < 10)) {
      current = current.parentNode;
      traveled++;
    }
    return current;
  }

  getAnchorElement(element, identifier) {
    // find elements with different identifiers
    let queryRoot = this.getXPathForElement(this.get10thAncestor(element)) || '/body',
      query = `${queryRoot}//*[not(contains(normalize-space(), "${identifier}"))] | ` +
        attrNonMatch(identifier, queryRoot),
      differentIdNodes = document.evaluate(query, document, null, XPathResult.ANY_TYPE, null),
      currentDiffNode = differentIdNodes.iterateNext(),
      shortestDistance = null,
      anchorElement = null;

    while (currentDiffNode) {
      if (isVisible(currentDiffNode) && isLabel(currentDiffNode) && currentDiffNode !== element &&
        !this.isContainedByOrContains(currentDiffNode, element) &&
        identifier !== this.getIdentifier(currentDiffNode, false, true, false).identifier) {
        let distance = visualDistance(element, currentDiffNode);

        if (shortestDistance === null || distance < shortestDistance) {
          shortestDistance = distance;
          anchorElement = currentDiffNode;
        }
      }
      currentDiffNode = differentIdNodes.iterateNext();
    }
    return anchorElement;
  }
};
