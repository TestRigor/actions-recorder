const TRIVIAL_RECT = {
  x: 0,
  y: 0,
  width: 0,
  height: 0
};

const ALPHA = 0.0000001;

const RELATION = [
  ['above and on the left of', 'on the left of', 'below and on the left of'],
  ['above', 'near', 'below'],
  ['above and on the right of', 'on the right of', 'below and on the right of']
];

function isTrivial(rect) {
  return rect === TRIVIAL_RECT;
}

function getWindowRect() {
  return {
    x: window.scrollX,
    y: window.scrollY,
    width: window.innerWidth,
    height: window.innerHeight
  };
}

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
    height: height,
    right: x + width,
    bottom: y + height
  };
}

function hasBody(element) {
  let elementRect = getRect(element);

  if ((elementRect.height > ALPHA) || (elementRect.width > ALPHA)) {
    return true;
  }
  return [].slice.call(element.children).some((child) => hasBody(child));
}

function valueInRange(value, min, max) {
  return (value >= min) && (value <= max);
}

function ensureRightAndBottom(rect) {
  if (!('right' in rect)) {
    rect.right = rect.x + rect.width;
  }
  if (!('bottom' in rect)) {
    rect.bottom = rect.y + rect.height;
  }
}

function rectObjFromDiagonal(x1, y1, x2, y2) {
  let x1Real = x1,
    y1Real = y1,
    x2Real = x2,
    y2Real = y2;

  if (x2 < x1) {
    x1Real = x2;
    x2Real = x1;
  }

  if (y2 < y1) {
    y1Real = y2;
    y2Real = y1;
  }
  return {
    x: x1Real,
    y: y1Real,
    width: x2Real - x1Real,
    height: y2Real - y1Real
  };
}

function intersect(rect, other) {
  if (rect === other) {
    return rect;
  }

  if (isTrivial(rect) || isTrivial(other)) {
    return TRIVIAL_RECT;
  }

  let x1 = Math.max(rect.x, other.x),
    y1 = Math.max(rect.y, other.y),
    x2 = Math.min(rect.x + rect.width, other.x + other.width),
    y2 = Math.min(rect.y + rect.height, other.y + other.height);

  if (((x2 - x1) < 1) || ((y2 - y1) < 1)) {
    return TRIVIAL_RECT;
  }

  return rectObjFromDiagonal(x1, y1, x2, y2);
}

function getOverlapRatio(rect, other) {
  let intersection = intersect(rect, other),
    intersectionArea = intersection.width * intersection.height,
    rectArea = rect.width * rect.height;

  return (intersectionArea / rectArea);
}

function contains(rect, otherRect) {
  ensureRightAndBottom(rect);
  ensureRightAndBottom(otherRect);
  return valueInRange(otherRect.x, rect.x, rect.right) &&
      valueInRange(otherRect.right, rect.x, rect.right) &&
      valueInRange(otherRect.y, rect.y, rect.bottom) &&
      valueInRange(otherRect.bottom, rect.y, rect.bottom);
}

function containsOrOverlaps(rect, otherRect) {
  if (contains(rect, otherRect)) {
    return true;
  }
  let overlap = getOverlapRatio(otherRect, rect);

  return overlap >= 0.3;
}

function isLeft(rect, other, strict) {
  let buffer = strict ? 0 : 1;

  return (rect.x + rect.width - buffer) < other.x;
}

function isOnTop(rect, other, strict) {
  let buffer = strict ? 0 : 1;

  return (rect.y + rect.height - buffer) < other.y;
}

function extendOnX(rect) {
  let windowRect = getWindowRect();

  return {
    x: rect.x - windowRect.width,
    y: rect.y,
    width: 2 * windowRect.width,
    height: rect.height,
    right: rect.x + windowRect.width,
    bottom: rect.bottom
  };
}

function extendOnY(rect) {
  let windowRect = getWindowRect();

  return {
    x: rect.x,
    y: rect.y - windowRect.height,
    width: rect.width,
    height: 2 * windowRect.height,
    right: rect.right,
    bottom: rect.y + windowRect.height
  };
}

function getRelation(element, anchor) {
  let xRelation = 1,
    yRelation = 1,
    roughly = false,
    elementRect = getRect(element),
    anchorRect = getRect(anchor),
    windowRect = getWindowRect(),
    lookupArea = {};

  if (isLeft(elementRect, anchorRect, false)) {
    xRelation = 0;
    lookupArea.x = 0;
    lookupArea.width = anchorRect.x - 1;
  } else if (isLeft(anchorRect, elementRect, false)) {
    xRelation = 2;
    lookupArea.x = anchorRect.x + 1;
    lookupArea.width = windowRect.width;
  } else {
    if (((elementRect.x < anchorRect.x) || (elementRect.right > anchorRect.right)) &&
        (getOverlapRatio(elementRect, extendOnY(anchorRect)) < 0.3)) {
      roughly = true;
      lookupArea.x = 0;
      lookupArea.width = windowRect.width;
    } else {
      roughly = false;
      lookupArea.x = anchorRect.x;
      lookupArea.width = anchorRect.width;
    }
  }
  if (isOnTop(elementRect, anchorRect, false)) {
    yRelation = 0;
    lookupArea.y = 0;
    lookupArea.height = anchorRect.y - 1;
  } else if (isOnTop(anchorRect, elementRect, false)) {
    yRelation = 2;
    lookupArea.y = anchorRect.y + 1;
    lookupArea.height = windowRect.height;
  } else {
    if (((elementRect.y < anchorRect.y) || (elementRect.bottom > anchorRect.bottom)) &&
        (getOverlapRatio(elementRect, extendOnX(anchorRect)) < 0.3)) {
      roughly = true;
      lookupArea.y = 0;
      lookupArea.height = windowRect.height;
    } else {
      roughly = false;
      lookupArea.y = anchorRect.y;
      lookupArea.height = anchorRect.height;
    }
  }
  return {
    relation: RELATION[xRelation][yRelation],
    roughly: roughly,
    lookupArea: lookupArea
  };
}

function distXIfOnLeft(rect, other) {
  if (isLeft(rect, other, true)) {
    return other.x - (rect.x + rect.width);
  }
  return 0;
}

function distYIfOnTop(rect, other) {
  if (isOnTop(rect, other, true)) {
    return other.y - (rect.y + rect.height);
  }
  return 0;
}

function calcDistanceX(rect, other) {
  return distXIfOnLeft(rect, other) + distXIfOnLeft(other, rect);
}

function calcDistanceY(rect, other) {
  return distYIfOnTop(rect, other) + distYIfOnTop(other, rect);
}

function visualDistance(element, otherElement) {
  let rect = getRect(element),
    other = getRect(otherElement);

  if (rect === other) {
    // Same rectangle always overlap
    return 0;
  }

  if (isTrivial(rect) || isTrivial(other)) {
    // Rectangles with no width or height shouldn't be related
    return Math.MAX_SAFE_INTEGER;
  }

  if (intersect(rect, other) !== TRIVIAL_RECT) {
    return 0;
  }

  let diffX = calcDistanceX(rect, other),
    diffY = calcDistanceY(rect, other);

  if (diffX < ALPHA) {
    return diffY;
  }

  if (diffY < ALPHA) {
    return diffX;
  }

  return Math.sqrt(diffX * diffX + diffY * diffY);
}

function distanceBetweenLeftCenterPoints(element, otherElement) {
  const rect = element.getBoundingClientRect();
  const otherRect = otherElement.getBoundingClientRect();
  const rectMidY = rect.bottom - rect.height / 2;
  const otherRectMidY = otherRect.bottom - otherRect.height / 2;
  const distanceSquared = Math.pow(rect.x - otherRect.x, 2) + Math.pow(rectMidY - otherRectMidY, 2);

  return Math.sqrt(distanceSquared);
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

function isPossiblyVisible(node) {
  let rect = getRect(node),
    style = window.getComputedStyle(node);

  return !!(node.offsetWidth || node.offsetHeight ||
    (node.getClientRects() && node.getClientRects().length)) &&
    style.getPropertyValue('visibility') !== 'hidden' &&
    rect.height >= 1 && rect.width >= 1;
}

function isVisible(node) {
  let rect = getRect(node),
    windowRect = getWindowRect(),
    style = window.getComputedStyle(node),
    isOnScreen = hasRectIntersection(rect, windowRect),
    isAccessible = false;

  if (isOnScreen && isPossiblyVisible(node)) {
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

export {contains, distanceBetweenLeftCenterPoints, isPossiblyVisible, isVisible, visualDistance,
  getRelation, getRect, containsOrOverlaps, hasBody};
