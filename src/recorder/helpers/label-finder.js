import { contains, doSidesIntersect, distanceBetweenLeftCenterPoints } from './rect-helper';

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

export default function getLabelForElement(element) {
  try {
    if (element.tagName && (element.tagName.toLowerCase() !== 'input' ||
                            element.tagName.toLowerCase() !== 'select' ||
                            element.tagName.toLowerCase() !== 'textarea')) {
      return '';
    }

    let labelElement = document.querySelector(`label[for="${element.id}"]`);

    if (labelElement == null && element.getBoundingClientRect) {
      const labelElements = document.querySelectorAll(labelTags.join() + ',.label');

      let possibleLabels = Array.from(labelElements)
        .filter(label => label.getBoundingClientRect && possiblyRelated(element, label));

      let shortestDistance = null;

      for (const possibleLabel of possibleLabels) {
        let distance = distanceBetweenLeftCenterPoints(element, possibleLabel);

        if (shortestDistance === null || distance < shortestDistance) {
          shortestDistance = distance;
          labelElement = possibleLabel;
        }
      }
    }
    return labelElement != null ? labelElement.innerText : '';
  } catch (error) {
    return '';
  }
}
