
const QUERYABLE_ATTRS = ['text', 'hint', 'title', 'label', 'aria-label', 'name', 'id', 'data-test-id', 'class',
  'placeholder', 'alternative', 'source'];

function cleanupQuotes(value) {
  if (value.indexOf("'") === -1) {
    return '\'' + value + '\'';
  } else if (value.indexOf('\"') === -1) {
    return '"' + value + '"';
  }
  return "concat('" + value.replace("'", "',\"'\",'") + "')";
}

function leafContainsLowercaseNormalized(searchParam) {
  return `//*/body//*[not(child::*) and contains(translate(normalize-space(.), "ABCDEFGHIJKLMNÑOPQRSTUVWXYZ",
  "abcdefghijklmnñopqrstuvwxyz"), ${cleanupQuotes(searchParam)})]`;
}

function leafContainsLowercaseNormalizedMultiple(searchParams = []) {
  return searchParams.map((searchParam) => leafContainsLowercaseNormalized(searchParam)).join(' | ');
}

function attrMatch(attrValue, searchRoot = '//*/body') {
  return QUERYABLE_ATTRS.map((attr) => `${searchRoot}//*[@${attr}=${cleanupQuotes(attrValue)}]`).join(' | ');
}

function attrNonMatch(attrValue) {
  return QUERYABLE_ATTRS.map((attr) => `[not(@${attr}=${cleanupQuotes(attrValue)})]`).join('');
}

function attrMatchMultiple(attrValues = []) {
  return attrValues.map((value) => attrMatch(value)).join(' | ');
}

export { leafContainsLowercaseNormalized, leafContainsLowercaseNormalizedMultiple,
  attrMatch, attrMatchMultiple, attrNonMatch, cleanupQuotes };
