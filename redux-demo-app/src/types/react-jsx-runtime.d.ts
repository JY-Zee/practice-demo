declare module 'react/jsx-runtime' {
  // 这里只是为了让 TypeScript 能解析 JSX，类型细节用 any 即可
  export const jsx: any
  export const jsxs: any
  export const Fragment: any
}
