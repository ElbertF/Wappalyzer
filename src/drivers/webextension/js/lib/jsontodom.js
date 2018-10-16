jsonToDOM.namespaces = {
  html: 'http://www.w3.org/1999/xhtml',
  xul: 'http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul',
};

jsonToDOM.defaultNamespace = jsonToDOM.namespaces.html;

function jsonToDOM(jsonTemplate, doc, nodes) {
  function namespace(name) {
    const reElemNameParts = /^(?:(.*):)?(.*)$/.exec(name);
    return { namespace: jsonToDOM.namespaces[reElemNameParts[1]], shortName: reElemNameParts[2] };
  }

  // Note that 'elemNameOrArray' is: either the full element name (eg. [html:]div) or an array of elements in JSON notation
  function tag(elemNameOrArray, elemAttr) {
    // Array of elements?  Parse each one...
    if (Array.isArray(elemNameOrArray)) {
      const frag = doc.createDocumentFragment();
      Array.prototype.forEach.call(arguments, (thisElem) => {
        frag.appendChild(tag(...thisElem));
      });
      return frag;
    }

    // Single element? Parse element namespace prefix (if none exists, default to defaultNamespace), and create element
    const elemNs = namespace(elemNameOrArray);
    const elem = doc.createElementNS(elemNs.namespace || jsonToDOM.defaultNamespace, elemNs.shortName);

    // Set element's attributes and/or callback functions (eg. onclick)
    for (const key in elemAttr) {
      const val = elemAttr[key];
      if (nodes && key == 'key') {
        nodes[val] = elem;
        continue;
      }

      const attrNs = namespace(key);
      if (typeof val === 'function') {
        // Special case for function attributes; don't just add them as 'on...' attributes, but as events, using addEventListener
        elem.addEventListener(key.replace(/^on/, ''), val, false);
      } else {
        // Note that the default namespace for XML attributes is, and should be, blank (ie. they're not in any namespace)
        elem.setAttributeNS(attrNs.namespace || '', attrNs.shortName, val);
      }
    }

    // Create and append this element's children
    const childElems = Array.prototype.slice.call(arguments, 2);
    childElems.forEach((childElem) => {
      if (childElem != null) {
        elem.appendChild(
          childElem instanceof doc.defaultView.Node ? childElem
            : Array.isArray(childElem) ? tag(...childElem)
              : doc.createTextNode(childElem),
        );
      }
    });

    return elem;
  }

  return tag(...jsonTemplate);
}
