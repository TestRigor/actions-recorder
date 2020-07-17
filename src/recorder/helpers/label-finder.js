import { contains, doSidesIntersect, distanceBetweenLeftCenterPoints, isVisible } from './rect-helper';

const labelTags = ['b', 'big', 'i', 'small', 'tt', 'abbr', 'acronym', 'cite', 'code', 'dfn', 'em', 'kbd', 'bdo', 'map',
  'q', 'span', 'sub', 'sup', 'label', 'text'];

function possiblyRelated(element, label) {
  const elementRect = element.getBoundingClientRect();
  const labelRect = label.getBoundingClientRect();

  if (contains(elementRect, labelRect) || contains(labelRect, elementRect)) {
    return true;
  }

  if (!(labelRect.x < elementRect.x || labelRect.y < elementRect.y)) {
    return false;
  }

  return doSidesIntersect(elementRect, labelRect);
}

function isInput(element) {
  return element.tagName && (element.tagName.toLowerCase() === 'input' ||
    element.tagName.toLowerCase() === 'select' ||
    element.tagName.toLowerCase() === 'textarea');
}

function getRelatedLabel(element) {
  if (!isInput(element) || !element.id) {
    return '';
  }

  return document.querySelector(`label[for="${element.id}"]`);
}

function getLabelForElement(element) {
  try {
    if (!isInput(element)) {
      return null;
    }

    let relatedLabel = getRelatedLabel(element);

    if (relatedLabel) {
      return relatedLabel;
    }

    let labelElement;

    if (element.getBoundingClientRect) {
      const labelElements = document.querySelectorAll(labelTags.join() + ',.label');

      let possibleLabels = Array.from(labelElements)
        .filter(label => isVisible(label) && possiblyRelated(element, label));

      let shortestDistance = null;

      for (const possibleLabel of possibleLabels) {
        let distance = distanceBetweenLeftCenterPoints(element, possibleLabel);

        if (shortestDistance === null || distance < shortestDistance) {
          shortestDistance = distance;
          labelElement = possibleLabel;
        }
      }
    }
    return labelElement;
  } catch (error) {
    return null;
  }
}

export { getRelatedLabel, getLabelForElement };
