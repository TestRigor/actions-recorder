
const QUERYABLE_ATTRS = ['text', 'hint', 'title', 'label', 'aria-label', 'name', 'id', 'data-test-id', 'class',
  'placeholder', 'alternative', 'source'];

function leafContainsLowercaseNormalized(searchParam) {
  return `//*/body//*[not(child::*) and contains(translate(normalize-space(.), "ABCDEFGHIJKLMNÑOPQRSTUVWXYZ",
  "abcdefghijklmnñopqrstuvwxyz"), "${searchParam}")]`;
}

function leafContainsLowercaseNormalizedMultiple(searchParams = []) {
  return searchParams.map((searchParam) => leafContainsLowercaseNormalized(searchParam)).join(' | ');
}

function attrMatch(attrValue, searchRoot = '//*/body') {
  return QUERYABLE_ATTRS.map((attr) => `${searchRoot}//*[@${attr}="${attrValue}"]`).join(' | ');
}

function attrNonMatch(attrValue, searchRoot = '//*/body') {
  return QUERYABLE_ATTRS.map((attr) => `${searchRoot}//*[not(@${attr}="${attrValue}")]`).join(' | ');
}

function attrMatchMultiple(attrValues = []) {
  return attrValues.map((value) => attrMatch(value)).join(' | ');
}

export { leafContainsLowercaseNormalized, leafContainsLowercaseNormalizedMultiple,
  attrMatch, attrMatchMultiple, attrNonMatch };
