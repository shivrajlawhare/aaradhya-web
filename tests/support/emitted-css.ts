// Emotion/MUI inject their CSS into <style> tags in jsdom. Reading the emitted
// text is the only way to assert values jsdom's computed style can't resolve
// (CSS-variable shorthands, colour-scheme selectors).

export const emittedCss = () =>
  Array.from(document.querySelectorAll('style'))
    .map((style) => style.textContent)
    .join('');

export const emittedRule = (selector: string) => {
  const css = emittedCss();
  const ruleStart = css.indexOf(`${selector}{`);
  if (ruleStart === -1) {
    return '';
  }
  return css.slice(ruleStart, css.indexOf('}', ruleStart));
};

export const emittedRuleFor = (element: Element | null) => {
  const emotionClass = Array.from(element?.classList ?? []).find((name) => name.startsWith('css-'));
  return emittedRule(`.${emotionClass}`);
};
