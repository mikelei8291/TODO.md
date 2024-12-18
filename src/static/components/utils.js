export const createElement = (tagName, attributes = {}, ...children) => {
    const element = document.createElement(tagName);
    Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, value));
    element.append(...children);
    return element;
};
