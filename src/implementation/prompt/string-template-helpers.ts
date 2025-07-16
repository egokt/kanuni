export function compile<T extends Record<string, any>>(
  strings: TemplateStringsArray,
  ...keys: (keyof T)[]
): (data: T) => string {
  return (data: T): string => {
    return strings.reduce((result, str, i) => {
      const key = keys[i];
      const value = key ? data[key] : '';
      return `${result}${str}${value}`;
    }, '');
  };
}
