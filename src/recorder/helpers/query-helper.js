
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

function getIgnoreCaseTranslation(searchTerm, searchIn = '.') {
  if (!searchTerm) {
    return '';
  }

  let cleanSearchTerm = searchTerm.replace("'", '').replace(/\s/g, ''),
    lowerAlphabet = cleanSearchTerm.toLowerCase(),
    upperAlphabet = cleanSearchTerm.toUpperCase();

  return `translate(${searchIn}, '${upperAlphabet}', '${lowerAlphabet}')`;
}

function elementQuery(descriptor, visibleTextOnly) {
  let text = getIgnoreCaseTranslation(descriptor, 'normalize-space(.)');

  return `//*[${text} = ${cleanupQuotes(descriptor.toLowerCase())}]` +
      (visibleTextOnly ? '' : ` | ${attrMatch(descriptor)}`);
}

function nonContainsQuery(descriptor, queryRoot = '//*/body') {
  let text = getIgnoreCaseTranslation(descriptor, 'normalize-space(.)');

  return `${queryRoot}//*[not(contains(${text}, ${cleanupQuotes(descriptor)}))]` +
    attrNonMatch(descriptor, queryRoot);
}

export { leafContainsLowercaseNormalized, leafContainsLowercaseNormalizedMultiple,
  attrMatch, attrMatchMultiple, attrNonMatch, cleanupQuotes, elementQuery, nonContainsQuery };
