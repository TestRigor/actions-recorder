module.exports.HTML_TAGS = ['a', 'abbr', 'acronym', 'address', 'applet', 'area', 'article', 'aside', 'audio', 'b',
  'base', 'basefont', 'bdi', 'bdo', 'bgsound', 'big', 'blink', 'blockquote', 'body', 'br', 'button', 'canvas',
  'caption', 'center', 'cite', 'code', 'col', 'colgroup', 'content', 'data', 'datalist', 'dd', 'decorator', 'del',
  'details', 'dfn', 'dir', 'div', 'dl', 'dt', 'element', 'em', 'embed', 'fieldset', 'figcaption', 'figure',
  'font', 'footer', 'form', 'frame', 'frameset', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'head', 'header', 'hgroup',
  'hr', 'html', 'i', 'iframe', 'img', 'input', 'ins', 'isindex', 'kbd', 'keygen', 'label', 'legend', 'li', 'link',
  'listing', 'main', 'map', 'mark', 'marquee', 'menu', 'menuitem', 'meta', 'meter', 'nav', 'nobr', 'noframes',
  'noscript', 'object', 'ol', 'optgroup', 'option', 'output', 'p', 'param', 'plaintext', 'pre', 'progress', 'q',
  'rp', 'rt', 'ruby', 's', 'samp', 'script', 'section', 'select', 'shadow', 'small', 'source', 'spacer', 'span',
  'strike', 'strong', 'style', 'sub', 'summary', 'sup', 'table', 'tbody', 'td', 'template', 'textarea', 'tfoot',
  'th', 'thead', 'time', 'title', 'tr', 'track', 'tt', 'u', 'ul', 'var', 'video', 'wbr', 'xmp'];

module.exports.INLINE_TAGS = ['b', 'big', 'i', 'small', 'tt', 'abbr', 'acronym', 'cite', 'code', 'dfn', 'em', 'kbd',
  'strong', 'samp', 'time', 'var', 'a', 'bdo', 'br', 'img', 'svg', 'map', 'object', 'q', 'script', 'span', 'sub', 'sup',
  'button', 'input', 'label', 'select', 'textarea'];

module.exports.CONSIDER_INNER_TEXT_TAGS = ['mat-slide-toggle'];

module.exports.isInput = function (element) {
  return element.tagName && (element.tagName.toLowerCase() === 'input' ||
    element.tagName.toLowerCase() === 'select' ||
    element.tagName.toLowerCase() === 'textarea' ||
    element.isContentEditable);
};

module.exports.isButtonOrLink = function (element) {
  return (element.tagName && (element.tagName.toLowerCase() === 'button' || element.tagName.toLowerCase() === 'a'));
};

module.exports.isButton = function (element) {
  if (element.tagName && element.tagName.toLowerCase() === 'button') {
    return true;
  }
  return (element.tagName && element.tagName.toLowerCase() === 'input') &&
    (element.type && (element.type === 'submit' || element.type === 'button' || element.type === 'reset'));
};
