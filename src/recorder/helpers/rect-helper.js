function valueInRange(value, min, max) {
  return (value >= min) && (value <= max);
}

function contains(rect, otherRect) {
  return valueInRange(otherRect.x, rect.x, rect.x + rect.width) &&
    valueInRange(otherRect.x + otherRect.width, rect.x, rect.x + rect.width) &&
    valueInRange(otherRect.y, rect.y, rect.y + rect.height) &&
    valueInRange(otherRect.y + otherRect.height, rect.y, rect.y + rect.height);
}

function doSidesIntersect(rect, otherRect) {
  const horizontalIntersection = (rect.x + rect.width >= otherRect.x) ||
    (otherRect.x + otherRect.width >= rect.x);
  const verticalIntersection = rect.y + rect.height >= otherRect.y ||
    (otherRect.y + otherRect.height >= rect.y);

  return horizontalIntersection || verticalIntersection;
}

function distanceBetweenLeftCenterPoints(element, otherElement) {
  const rect = element.getBoundingClientRect();
  const otherRect = otherElement.getBoundingClientRect();
  const rectMidy = rect.bottom + rect.height / 2;
  const otherRectMidY = otherRect.bottom + otherRect.height / 2;
  const distanceSquared = Math.pow(rect.x - otherRect.x, 2) + Math.pow(rectMidy - otherRectMidY, 2);

  return Math.sqrt(distanceSquared);
}

export { contains, doSidesIntersect, distanceBetweenLeftCenterPoints };
