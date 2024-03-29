import { contains, distanceBetweenLeftCenterPoints, isVisible } from './rect-helper';
import { isDiv, isInput, isLabel, LABEL_TAGS } from './html-tags';

function possiblyRelated(element, label) {
  const elementRect = element.getBoundingClientRect();
  const labelRect = label.getBoundingClientRect();

  if (contains(elementRect, labelRect) || contains(labelRect, elementRect)) {
    return !isDiv(label);
  }

  if (!isInput(element)) {
    return true;
  }

  return labelRect.left <= (elementRect.left + (elementRect.width * 0.1)) && labelRect.top <= elementRect.bottom;
}

function getRelatedLabel(element) {
  if (!isInput(element) || !element.id) {
    return '';
  }

  let relatedLabel = document.evaluate(`//label[@for='${element.id}']`, document,
    null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);

  return relatedLabel.singleNodeValue;
}

function getLabelledByLabels(element) {
  let labelledBy = element.getAttribute('aria-labelledby');

  if (labelledBy) {
    return labelledBy.split(' ').map(id => document.getElementById(id));
  }
  return [];
}

function isLabelWithHighConfidence(element, labelElement, distance) {
  if (!isInput(element)) {
    return false;
  }

  if (labelElement && distance) {
    if (labelElement.htmlFor && labelElement.htmlFor !== element.id) {
      return false;
    }

    if ((labelElement.tagName !== 'LABEL') && labelElement.innerText.trim().includes('\n')) {
      return false;
    }

    let labelRect = labelElement.getBoundingClientRect();

    let elementRect = element.getBoundingClientRect();

    // label contains element
    if (contains(labelRect, elementRect) && distance <= 50) {
      return true;
    }
    // label is visually inside the input or it contains the input
    if (!isDiv(labelElement) && distance <= 50 && contains(elementRect, labelRect)) {
      return true;
    }
    // label on top of the element
    if ((labelRect.bottom <= (elementRect.bottom - (elementRect.height / 2))) && distance <= 75) {
      return true;
    }
    if ((labelRect.right <= (elementRect.left + (elementRect.width / 4))) && distance <= 150) {
      return true;
    }
  }
  return false;
}

function getNearestCell(element) {
  let current = element;

  while (current.parentElement) {
    current = current.parentElement;

    if (current && current.tagName && current.tagName.toLowerCase() === 'td') {
      return current;
    }
  }
  return null;
}

function allChildrenAreLabels(element) {
  for (let i = 0; i < element.children.length; i++) {
    if (!isLabel(element.children[i])) {
      return false;
    }
  }

  return true;
}

function getLabelForElement(element) {
  try {
    let relatedLabel = getRelatedLabel(element);

    if (relatedLabel) {
      return {
        label: relatedLabel,
        highConfidence: true
      };
    }

    let labelledByLabels = getLabelledByLabels(element);

    if (labelledByLabels.length === 1) {
      return {
        label: labelledByLabels[0],
        highConfidence: true
      };
    }

    if (element.parentElement && element.parentElement.className === 'input-group') {
      element = element.parentElement;
    }

    let labelElement;

    let shortestDistance = null,
      labelElements = null;

    if (element.getBoundingClientRect) {
      if (labelledByLabels.length > 1) {
        labelElements = labelledByLabels;
      } else {
        let nearestCell = getNearestCell(element),
          queryRoot = nearestCell ? nearestCell : document;

        labelElements = queryRoot.querySelectorAll(LABEL_TAGS.join() + ',div,.label');
      }

      let possibleLabels = Array.from(labelElements)
        .filter(label => isVisible(label) && possiblyRelated(element, label) &&
            label.innerText && (!isDiv(label) || allChildrenAreLabels(label)));

      if (possibleLabels.length) {
        for (const possibleLabel of possibleLabels) {
          let distance = distanceBetweenLeftCenterPoints(element, possibleLabel);

          if (shortestDistance === null || distance < shortestDistance) {
            shortestDistance = distance;
            labelElement = possibleLabel;
          }
        }
      } else {
        return {
          label: null,
          highConfidence: false
        };
      }
    }
    return {
      label: labelElement,
      highConfidence: isLabelWithHighConfidence(element, labelElement, shortestDistance)
    };
  } catch (error) {
    return {
      label: null,
      highConfidence: false
    };
  }
}

export { getRelatedLabel, getLabelForElement };
