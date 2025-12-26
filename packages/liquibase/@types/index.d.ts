// Type definitions for to-regex
declare module 'to-regex' {
  interface ToRegexOptions {
    flags?: string;
    contains?: boolean;
  }

  function toRegex(patterns: string | string[], options?: ToRegexOptions): RegExp;
  export = toRegex;
}

