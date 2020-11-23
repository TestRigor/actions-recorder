import { contains, distanceBetweenLeftCenterPoints, isVisible } from './rect-helper';
import { isInput, isSwitch, LABEL_TAGS } from './html-tags';

function possiblyRelated(element, label) {
  const elementRect = element.getBoundingClientRect();
  const labelRect = label.getBoundingClientRect();

  if (contains(elementRect, labelRect) || contains(labelRect, elementRect)) {
    return isSwitch(element);
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

  return document.querySelector(`label[for="${element.id}"]`);
}

function isLabelWithHighConfidence(element, labelElement, distance) {
  if (!isInput(element)) {
    return false;
  }

  if (labelElement && distance) {
    let labelRect = labelElement.getBoundingClientRect();

    let elementRect = element.getBoundingClientRect();

    // label contains switch
    if (contains(labelRect, elementRect) && isSwitch(element) && distance <= 50) {
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

function getLabelForElement(element) {
  try {
    let relatedLabel = getRelatedLabel(element);

    if (relatedLabel) {
      return {
        label: relatedLabel,
        highConfidence: true
      };
    }

    if (element.parentElement && element.parentElement.className === 'input-group') {
      element = element.parentElement;
    }

    let labelElement;

    let shortestDistance = null;

    if (element.getBoundingClientRect) {
      const labelElements = document.querySelectorAll(LABEL_TAGS.join() + ',div,.label');

      let possibleLabels = Array.from(labelElements)
        .filter(label => isVisible(label) && possiblyRelated(element, label) && label.innerText);

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
