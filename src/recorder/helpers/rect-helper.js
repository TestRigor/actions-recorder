function valueInRange(value, min, max) {
  return (value >= min) && (value <= max);
}

function contains(rect, otherRect) {
  return valueInRange(otherRect.x, rect.x, rect.x + rect.width) &&
    valueInRange(otherRect.x + otherRect.width, rect.x, rect.x + rect.width) &&
    valueInRange(otherRect.y, rect.y, rect.y + rect.height) &&
    valueInRange(otherRect.y + otherRect.height, rect.y, rect.y + rect.height);
}

function distanceBetweenLeftCenterPoints(element, otherElement) {
  const rect = element.getBoundingClientRect();
  const otherRect = otherElement.getBoundingClientRect();
  const rectMidY = rect.bottom - rect.height / 2;
  const otherRectMidY = otherRect.bottom - otherRect.height / 2;
  const distanceSquared = Math.pow(rect.x - otherRect.x, 2) + Math.pow(rectMidY - otherRectMidY, 2);

  return Math.sqrt(distanceSquared);
}

function getWindowRect() {
  return {
    x: window.scrollX,
    y: window.scrollY,
    width: window.innerWidth,
    height: window.innerHeight
  };
}

const TRIVIAL_RECT = {
  x: 0,
  y: 0,
  width: 0,
  height: 0
};

function getRect(node) {
  let windowRect = getWindowRect(),
    boundingClientRect = node.getBoundingClientRect ? node.getBoundingClientRect() : TRIVIAL_RECT,
    x = windowRect.x + boundingClientRect.left,
    y = windowRect.y + boundingClientRect.top,
    width = boundingClientRect.width,
    height = boundingClientRect.height;

  return {
    x: x,
    y: y,
    width: width,
    height: height
  };
}

function getRectCenter(rect) {
  return {
    x: Math.round(rect.x + (rect.width / 2)),
    y: Math.round(rect.y + (rect.height / 2))
  };
}

function isPointInsideRect(x, y, rect) {
  return (x >= rect.x) &&
    (x <= rect.x + rect.width) &&
    (y >= rect.y) &&
    (y <= rect.y + rect.height);
}

function hasRectIntersection(rect1, rect2) {
  return isPointInsideRect(rect1.x, rect1.y, rect2) ||
    isPointInsideRect(rect1.x + rect1.width, rect1.y, rect2) ||
    isPointInsideRect(rect1.x, rect1.y + rect1.height, rect2) ||
    isPointInsideRect(rect1.x + rect1.width, rect1.y + rect1.height, rect2);
}

function isNodeContainsOther(parent, child) {
  let current = child;

  do {
    if (parent.isSameNode(current) || (current.nodeType === Node.DOCUMENT_FRAGMENT_NODE)) {
      return true;
    }

    current = current.parentNode;
  } while (current);

  return false;
}

function isVisible(node) {
  let rect = getRect(node),
    windowRect = getWindowRect(),
    style = window.getComputedStyle(node),
    isOnScreen = hasRectIntersection(rect, windowRect),
    isAccessible = false;

  let isPossiblyVisible = !!(node.offsetWidth || node.offsetHeight ||
    (node.getClientRects() && node.getClientRects().length)) &&
    style.getPropertyValue('visibility') !== 'hidden' &&
    rect.height >= 1 && rect.width >= 1;

  if (isOnScreen && isPossiblyVisible) {
    let center = getRectCenter(rect),
      relativeCenter = {
        x: center.x - windowRect.x,
        y: center.y - windowRect.y
      };

    if (isPointInsideRect(center.x, center.y, windowRect)) {
      let nodeAtCenter = document.elementFromPoint(relativeCenter.x, relativeCenter.y);

      isAccessible = !!nodeAtCenter && (isNodeContainsOther(node, nodeAtCenter) ||
        isNodeContainsOther(nodeAtCenter, node) ||
        isNodeContainsOther(node.parentNode, nodeAtCenter.parentNode));
    }
  }

  return isAccessible && style.getPropertyValue('display') !== 'none';
}

export {contains, distanceBetweenLeftCenterPoints, isVisible};
