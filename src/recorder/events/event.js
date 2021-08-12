import { getLabelForElement } from '../helpers/label-finder';
import {
  HTML_TAGS, INLINE_TAGS, CONSIDER_INNER_TEXT_TAGS,
  isInput, isButtonOrLink, LOG_OUT_IDENTIFIERS,
  LOG_IN_IDENTIFIERS, isLabel, hasChildren, isInputButton
} from '../helpers/html-tags';
import {
  isVisible, visualDistance, getRelation, isPossiblyVisible,
  containsOrOverlaps, getRect, hasBody
} from '../helpers/rect-helper';
import {
  leafContainsLowercaseNormalizedMultiple,
  attrMatchMultiple,
  elementQuery,
  nonContainsQuery
} from '../helpers/query-helper';

export default class Event {
  constructor(event, init) {
    if (!init) {
      return;
    }

    let element = this.getTarget(event);

    this.init(element);
  }

  init(element) {
    element = this.skipSVGInternals(element);

    if (!element) {
      this.skipEvent = true;
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
  }

  getTarget(event) {
    let native = event.toElement || event.target || event.srcElement;

    if ((event.type !== 'change') || (native && isInput(native))) {
      return native;
    }

    let path = event.composedPath && event.composedPath();

    let first = (path && path[0]) ? path[0] : null;

    if (first) {
      if (isInput(first)) {
        return first;
      }
      let inputChild = first.shadowRoot ?
        first.shadowRoot.querySelector('input') : first.querySelector('input');

      if (inputChild) {
        return inputChild;
      }
    }
    return null;
  }

  calcAdditionalData(event, calculateContext) {
    if (event.type !== 'popstate') {
      let element = this.getTarget(event),
        isClick = event.type === 'click';

      element = this.skipSVGInternals(element);

      if (!element) {
        return;
      }

      let labelElement = getLabelForElement(element).label;

      if (labelElement) {
        this.label = this.stripAsteriskAndTrim(labelElement.innerText);
      }

      if (this.shouldCheckForCustomTag()) {
        this.customTag = this.getNearestCustomTag(element);
      }

      let isNotClickOfInput = isClick && !isInput(element),
        isHover = event.type === 'mouseout',
        isScroll = event.type === 'scroll';

      let identifyingData = this.getIdentifier(element, false, isNotClickOfInput,
        !isHover && calculateContext, !isScroll, labelElement);

      if (!identifyingData.identifier &&
          (identifyingData.index === -1 || !identifyingData.anchor || !identifyingData.anchorRelation)) {
        identifyingData = this.getIdentifier(element, true, isNotClickOfInput,
          !isHover && calculateContext, !isScroll, labelElement);
      }

      this.identifier = identifyingData.identifier;
      this.anchor = identifyingData.anchor;
      this.anchorRelation = identifyingData.anchorRelation;
      this.roughly = identifyingData.roughly;
      this.index = identifyingData.index;
      this.contextElement = identifyingData.contextElement;
      this.logOutDetected = this.detectLogOut();
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

  getIdentifier(element, useClass, isNotClickOfInput, calculateContext, useInnerText, labelElement = {}) {
    let descriptor = this.getDescriptor(element, useClass, useInnerText),
      identifierText = descriptor.value.trim(),
      isVisibleText = descriptor.visibleText,
      identifiedElement = element;

    if (!identifierText && !isInput(element)) {
      identifiedElement = this.getIdentifiableParent(element, '', 10,
        useClass, isNotClickOfInput, this.hasPointerCursor(element), useInnerText);
      descriptor = this.getDescriptor(identifiedElement, useClass, useInnerText);
      identifierText = descriptor.value.trim();
      isVisibleText = descriptor.visibleText;
    }
    let identifyingData = { index: -1, contextElement: '', anchor: '', relation: ''};

    if (calculateContext) {
      if (identifierText) {
        if (!this.isUniqueIdentifier(element, labelElement, identifierText, isVisibleText, useClass)) {
          let anchor = this.getAnchorElement(identifiedElement, identifierText, false, []),
            anchorDescriptor = this.getDescriptor(anchor, false, true).value,
            excludedText = Array.of(anchorDescriptor.toLowerCase()),
            attempts = 1;

          while ((attempts <= 3) && anchor && anchorDescriptor &&
          !this.isUniqueIdentifier(anchor, null, anchorDescriptor, true, false)) {
            anchor = this.getAnchorElement(identifiedElement, identifierText, false, excludedText);
            anchorDescriptor = this.getDescriptor(anchor, false, true).value;
            excludedText.push(anchorDescriptor.toLowerCase());
            attempts++;
          }
          if (anchor) {
            identifyingData.anchor = anchorDescriptor;
            let relation = getRelation(element, anchor);

            identifyingData.anchorRelation = relation.relation;
            identifyingData.roughly = relation.roughly;
          } else {
            let foundContext = this.getContext(identifiedElement, labelElement, identifierText, isVisibleText);

            identifyingData.contextElement = foundContext.contextElement;
            identifyingData.index = foundContext.index;
          }
        }
      } else {
        let genericReference = this.getGenericAnchorReference(element, useClass);

        if (genericReference) {
          identifyingData.index = genericReference.index;
          identifyingData.anchor = genericReference.anchor;
          identifyingData.anchorRelation = genericReference.anchorRelation;
          identifyingData.roughly = genericReference.roughly;
        }
      }
    }

    identifyingData.identifier = identifierText;
    return identifyingData;
  }

  stripAsteriskAndTrim(label) {
    if (!label) {
      return '';
    }
    return label.replace(/^\s*\**\s*|\s*\**\s*$/g, '');
  }

  getLabelText(label) {
    let textNodes = [];

    if (label.nodeType !== 3) {
      for (let i = 0; i < label.childNodes.length; ++i) {
        textNodes = textNodes.concat(this.getLabelText(label.childNodes[i]));
      }
    } else {
      textNodes.push(label.data);
    }
    return textNodes.map(t => t.trim()).filter(t => t).join(' ');
  }

  getDescriptor(srcElement, useClass, useInnerText) {
    if (!srcElement) {
      return {
        value: '',
        visibleText: false
      };
    }
    if (srcElement.placeholder && srcElement.placeholder.trim()) {
      return {
        value: srcElement.placeholder,
        visibleText: false
      };
    }
    let relatedLabel =
      srcElement.closest('a, button, .dx-treeview-toggle-item-visibility, .dx-scrollable-container') != null ?
        { label: null } : getLabelForElement(srcElement);

    if (relatedLabel.highConfidence) {
      return {
        value: this.stripAsteriskAndTrim(this.getLabelText(relatedLabel.label)),
        visibleText: true
      };
    }
    if (isInputButton(srcElement) && srcElement.value) {
      return {
        value: srcElement.value,
        visibleText: true
      };
    }
    if (useInnerText && !isInput(srcElement) && srcElement.innerText && srcElement.innerText.trim()) {
      return {
        value: srcElement.innerText,
        visibleText: true
      };
    }
    if (srcElement.ariaLabel) {
      return {
        value: srcElement.ariaLabel,
        visibleText: false
      };
    }
    if (srcElement.name) {
      return {
        value: srcElement.name,
        visibleText: false
      };
    }
    if (srcElement.hint) {
      return {
        value: srcElement.hint,
        visibleText: false
      };
    }
    if (srcElement.alt) {
      return {
        value: srcElement.alt,
        visibleText: false
      };
    }
    if (srcElement.dataTestId) {
      return {
        value: srcElement.dataTestId,
        visibleText: false
      };
    }
    if (srcElement.resourceId || srcElement.id) {
      return {
        value: srcElement.resourceId || srcElement.id,
        visibleText: false
      };
    }
    if (useClass && srcElement.className && typeof srcElement.className === 'string') {
      return {
        value: srcElement.className,
        visibleText: false
      };
    }
    return {
      value: '',
      visibleText: false
    };
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

  getContext(srcElement, labelElement, elementDescriptor, visibleTextOnly, useClass) {
    if (!srcElement || !elementDescriptor) {
      return { index: -1, contextElement: '' };
    }
    let parent = this.getIdentifiableParent(srcElement, elementDescriptor, 25, false, false, false, false),
      query = elementQuery(elementDescriptor, visibleTextOnly),
      similarNodeArray = [],
      similarNodes = document.evaluate(query, document, null, XPathResult.ANY_TYPE, null),
      similarNode = similarNodes.iterateNext();

    while (similarNode) {
      if (isVisible(similarNode) &&
        !this.isContainedByOrContains(srcElement, similarNode) &&
        similarNode !== labelElement &&
        this.getDescriptor(similarNode, true, false).value.toLowerCase() === elementDescriptor.toLowerCase() &&
        !similarNodeArray.find(current => this.isContainedByOrContains(current.node, similarNode))) {
        similarNodeArray.push({
          node: similarNode,
          parent: this.getIdentifiableParent(similarNode, elementDescriptor, 25, false, false, false)
        });
      }
      similarNode = similarNodes.iterateNext();
    }

    if (similarNodeArray.length > 1) {
      let parentIdentifier = this.getDescriptor(parent, false, false).value,
        useContext = parentIdentifier &&
        this.isUniqueIdentifier(parent, labelElement, parentIdentifier, visibleTextOnly, useClass),
        siblings = useContext ? similarNodeArray.filter(sibling => sibling.parent === parent) : similarNodeArray;

      return {
        index: siblings.length > 1 ? siblings.map(sibling => sibling.node).indexOf(srcElement) : -1,
        contextElement: useContext ? parentIdentifier : ''
      };
    }
    return { index: -1, contextElement: '' };
  }

  getIdentifiableParent(srcElement, childIdentifier, maxDepth, useClass, stopAtButton, stopAtLastPointer,
    useInnerText) {
    let parent = srcElement.parentNode;

    if (!parent || (parent === document.body)) {
      return null;
    }

    let parentDescriptor = this.getDescriptor(parent, useClass, useInnerText).value,
      isDescriptiveParent = parentDescriptor && parentDescriptor !== childIdentifier;

    if (isDescriptiveParent) {
      return parent;
    }

    let keepGoing = (maxDepth > 0) && !(stopAtButton && isButtonOrLink(srcElement)) &&
      (!stopAtLastPointer || this.hasPointerCursor(parent));

    return keepGoing ?
      this.getIdentifiableParent(parent, childIdentifier, --maxDepth, useClass, stopAtButton, stopAtLastPointer) : null;
  }

  isUniqueIdentifier(element, labelElement, identifier, isVisibleTextIdentifier, useClass) {
    let query = elementQuery(identifier, isVisibleTextIdentifier),
      similarNodes = document.evaluate(query,
        document, null, XPathResult.UNORDERED_NODE_ITERATOR_TYPE, null),
      currentNode = similarNodes.iterateNext(),
      isButton = isButtonOrLink(element);

    while (currentNode) {
      if ((element !== currentNode) &&
          (labelElement !== currentNode) &&
          !this.isContainedByOrContains(element, currentNode) &&
          (isButton || !labelElement || !this.isContainedByOrContains(labelElement, currentNode)) &&
          ((isVisibleTextIdentifier && isVisible(currentNode)) || isPossiblyVisible(currentNode)) &&
          (this.getIdentifier(currentNode, useClass, true, false, true)
            .identifier.toLowerCase() === identifier.toLowerCase())) {
        return false;
      }
      currentNode = similarNodes.iterateNext();
    }
    return true;
  }

  hasPointerCursor(element) {
    if (element !== null && element.nodeType === 1) {
      let style = window.getComputedStyle(element);

      return style && style.getPropertyValue('cursor') === 'pointer';
    }
    return null;
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

    while (current.parentNode && (traveled < 15) && (current !== document.body)) {
      current = current.parentNode;
      traveled++;
    }
    return current;
  }

  getAnchorElement(element, identifier, useClass, excludedText = []) {
    // find elements with different identifiers
    let tenthAncestor = this.get10thAncestor(element),
      queryRoot = this.getXPathForElement(tenthAncestor) || '',
      query = nonContainsQuery(identifier, queryRoot),
      differentIdNodes = document.evaluate(query, queryRoot ? tenthAncestor : document,
        null, XPathResult.ANY_TYPE, null),
      currentDiffNode = differentIdNodes.iterateNext(),
      shortestDistance = null,
      anchorElement = null;

    while (currentDiffNode) {
      if ((isLabel(currentDiffNode) || isButtonOrLink(currentDiffNode)) && !hasChildren(currentDiffNode) &&
        isVisible(currentDiffNode) && currentDiffNode !== element &&
        !this.isContainedByOrContains(currentDiffNode, element)) {
        let descriptor = this.getDescriptor(currentDiffNode, useClass, true).value.toLowerCase();

        if (!!descriptor && (descriptor !== identifier.toLowerCase()) && (excludedText.indexOf(descriptor) === -1)) {
          let distance = visualDistance(element, currentDiffNode);

          if ((shortestDistance === null) || (distance < shortestDistance)) {
            shortestDistance = distance;
            anchorElement = currentDiffNode;
          }
        }
      }
      currentDiffNode = differentIdNodes.iterateNext();
    }
    return anchorElement;
  }

  getGenericAnchorReference(element, useClass) {
    let query = '//*/body//*[not(*)]', // only leaf elements
      possibleAnchors = document.evaluate(query, document, null, XPathResult.ANY_TYPE, null),
      current = possibleAnchors.iterateNext(),
      currentDistance,
      currentIdentifier,
      anchor,
      anchorIdentifier;

    while (current) {
      if (isVisible(current) && !this.isContainedByOrContains(current, element)) {
        let distance = visualDistance(element, current);

        if ((!currentDistance || distance < currentDistance)) {
          currentIdentifier = this.getIdentifier(current, useClass, true, false, true).identifier;
          if (currentIdentifier && this.isUniqueIdentifier(current, null, currentIdentifier, true, useClass)) {
            currentDistance = distance;
            anchor = current;
            anchorIdentifier = currentIdentifier;
          }
        }
      }
      current = possibleAnchors.iterateNext();
    }

    if (anchor) {
      let anchorRelation = getRelation(element, anchor),
        remainingElements = document.evaluate(query, document, null, XPathResult.ANY_TYPE, null),
        remaining = remainingElements.iterateNext(),
        index = 0,
        elementIndex = -1;

      while (remaining) {
        if ((isButtonOrLink(element) && !isButtonOrLink(remaining)) ||
            (isInput(element) && !isInput(remaining)) ||
            remaining === anchor ||
            !hasBody(remaining)) {
          remaining = remainingElements.iterateNext();
          continue;
        }
        if (containsOrOverlaps(anchorRelation.lookupArea, getRect(remaining))) {
          if (remaining === element) {
            elementIndex = index;
          }
          index++;
        }
        remaining = remainingElements.iterateNext();
      }
      if (anchorIdentifier && anchorRelation.relation && (elementIndex > -1)) {
        return {
          index: elementIndex,
          anchor: anchorIdentifier,
          anchorRelation: anchorRelation.relation,
          roughly: anchorRelation.roughly
        };
      }
    }
    return {};
  }
};
