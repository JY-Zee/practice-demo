## AST 抽象语法树原理记录

### 一、AST 是什么

- **定义**：AST（Abstract Syntax Tree，抽象语法树）是用一棵树来描述源代码结构的数据结构，方便程序对代码进行分析和改造。
- **本质作用**：把“源代码字符串（字符流）”转换成“有层级、有节点类型、可遍历的树形数据结构”。

示例（JavaScript）：

```js
const a = 1 + 2;
```

对应的 AST 结构示意（伪结构）：

```text
Program
  └─ VariableDeclaration
      └─ VariableDeclarator
          ├─ Identifier(name="a")
          └─ BinaryExpression(operator="+")
              ├─ Literal(value=1)
              └─ Literal(value=2)
```

---

### 二、从源码到 AST 的三个核心阶段

1. **词法分析（Lexing / Tokenizing）**
   - 输入：源代码字符串。
   - 输出：Token 列表（关键字、标识符、数字、运算符、括号等）。
   - 原理：扫描器从左到右读取字符，通过状态机规则判断当前是一类什么 token：
     - 字母开头 → 标识符 / 关键字
     - 数字开头 → 数字字面量
     - `"` 或 `'` → 字符串字面量
     - `+`、`-`、`*`、`/`、`(`、`)` 等 → 运算符 / 符号 token

2. **语法分析（Parsing）**
   - 输入：Token 列表。
   - 输出：AST 树（带有 type/子节点等字段的树）。
   - 原理：根据语言的文法规则，把 token 按顺序“组装成树”，常见方式：
     - 手写递归下降解析器（`parseExpression` / `parseStatement` 等函数）。
     - 使用 LL / LR / LALR 等算法由工具根据文法生成解析器。
   - 每个节点通常有：
     - `type`：节点类型（如 `Identifier`、`BinaryExpression`、`IfStatement`）。
     - 若干字段：如 `left`、`right`、`test`、`consequent`、`alternate`、`body` 等。

3. **（可选）语义分析与补充信息**
   - 在 AST 基础上进一步理解代码：
     - 建立符号表（变量/函数定义、作用域）。
     - 类型推断和类型检查（例如 TypeScript）。
     - 记录引用关系、未使用变量、不可达代码等。
   - 通常不改变树的结构，而是在节点上挂额外的语义信息。

---

### 三、AST 节点结构与遍历（Visitor 模式）

- **节点结构示例（类 ESTree/Babel 风格）**

```js
{
  type: "BinaryExpression",
  operator: "+",
  left: { type: "Identifier", name: "a" },
  right: { type: "Literal", value: 1 }
}
```

- **常见字段命名**
  - `body`：语句列表。
  - `expression`：单个表达式。
  - `left` / `right`：二元表达式左右子树。
  - `test`：条件表达式（如 `if (test) {}`）。
  - `consequent` / `alternate`：if 的 then/else 分支。

- **遍历（Traversal，访问者模式）思路**
  - 写一个通用 `traverse(ast, visitor)`。
  - `visitor` 定义“遇到某种节点类型时要做的事情”，例如：

```js
const visitor = {
  Identifier(path) {
    // 访问所有 Identifier 节点
  },
  BinaryExpression(path) {
    // 访问所有二元表达式节点
  }
};
```

---

### 四、一个迷你表达式解析器的设计（伪代码级别）

#### 1. 支持的简化语法

- 整数：`123`
- 运算符：`+ - * /`
- 括号：`( )`
- 示例：`1 + 2 * (3 - 4)`

文法（简化版）：

```text
Expression     → AdditiveExpression

AdditiveExpression
  → MultiplicativeExpression
  | AdditiveExpression "+" MultiplicativeExpression
  | AdditiveExpression "-" MultiplicativeExpression

MultiplicativeExpression
  → PrimaryExpression
  | MultiplicativeExpression "*" PrimaryExpression
  | MultiplicativeExpression "/" PrimaryExpression

PrimaryExpression
  → NumberLiteral
  | "(" Expression ")"
```

#### 2. 词法分析器（Tokenizer）伪代码

核心思路：

```text
function tokenize(input: string): Token[]:
    tokens = []
    position = 0

    while position < input.length:
        char = input[position]

        if char 是空白:
            position += 1
            continue

        if char 是数字:
            start = position
            while position < input.length AND input[position] 还是数字:
                position += 1
            value = input[start:position]
            tokens.push({ type: "Number", value })
            continue

        如果 char 是 + - * / ( ):
            按字符映射到对应 token 类型（Plus/Minus/Star/Slash/LeftParen/RightParen）
            tokens.push(token)
            position += 1
            continue

        否则:
            抛出错误: Unexpected character

    return tokens
```

#### 3. 语法分析器（Parser，递归下降）伪代码

AST 节点示意：

```text
NumberLiteral:
  type: "NumberLiteral"
  value: number

BinaryExpression:
  type: "BinaryExpression"
  operator: "+", "-", "*", "/"
  left: ExpressionNode
  right: ExpressionNode
```

解析入口：

```text
function parse(tokens: Token[]): ExpressionNode:
    currentIndex = 0

    定义辅助函数:
      peek()    → 查看当前 token
      consume() → 消费并前进

    定义:
      parseExpression()
      parseAdditiveExpression()
      parseMultiplicativeExpression()
      parsePrimaryExpression()

    root = parseExpression()
    如果还有剩余 token → 抛错
    return root
```

加减层：

```text
function parseAdditiveExpression():
    node = parseMultiplicativeExpression()

    while 当前 token 是 "+" 或 "-":
        op = 当前 token
        消费 op
        right = parseMultiplicativeExpression()
        node = {
          type: "BinaryExpression",
          operator: op.value,
          left: node,
          right
        }

    return node
```

乘除层：

```text
function parseMultiplicativeExpression():
    node = parsePrimaryExpression()

    while 当前 token 是 "*" 或 "/":
        op = 当前 token
        消费 op
        right = parsePrimaryExpression()
        node = {
          type: "BinaryExpression",
          operator: op.value,
          left: node,
          right
        }

    return node
```

基础表达式：

```text
function parsePrimaryExpression():
    token = 当前 token

    if token.type == "Number":
        消费 Number
        return { type: "NumberLiteral", value: 数值化(token.value) }

    if token.type == "LeftParen":
        消费 "("
        expr = parseExpression()
        消费 ")"
        return expr

    否则抛错: Unexpected token
```

最终，对于输入：`1 + 2 * (3 - 4)`，会生成类似：

```text
BinaryExpression("+")
  left: NumberLiteral(1)
  right:
    BinaryExpression("*")
      left: NumberLiteral(2)
      right:
        BinaryExpression("-")
          left: NumberLiteral(3)
          right: NumberLiteral(4)
```

#### 4. 遍历与求值伪代码

遍历：

```text
function traverse(node, visit):
    if node 为 null: return
    visit(node)
    if node.type == "BinaryExpression":
        traverse(node.left, visit)
        traverse(node.right, visit)
```

求值：

```text
function evaluate(node):
    if node.type == "NumberLiteral":
        return node.value

    if node.type == "BinaryExpression":
        leftVal = evaluate(node.left)
        rightVal = evaluate(node.right)

        按 operator 做 + - * / 运算并返回
```

---

### 五、与实际前端工具的关系

上述迷你解析器是 Babel、TypeScript、ESLint、Prettier、打包工具等的“极简模型”：

1. 源代码 → 词法分析 → Token。
2. Token → 语法分析 → AST。
3. 在 AST 上做：
   - 语法转换（新语法转旧语法）。
   - 静态检查（eslint 规则）。
   - 代码格式化（prettier）。
   - 依赖分析、Tree Shaking、重写 import/export 等。

后续如果需要，可以在此文件基础上补充：
- 真实的 JS/TS demo 实现。
- 针对项目中使用的具体 AST 工具（如 Babel/TypeScript/ESLint 插件）的实践记录。



## AST 实战 Demo：自制表达式解析器 + 简单 TS 格式化

### 示例 TS 代码（节选自 demo\sample.ts）

```ts
const a: number = 1+2 * (3-4);
let price = basePrice* count + tax;
var total = (price+extraFee)/(discount+1);
const config = {a:1,b: { nested:2}, list:[1,2, a + b]};
const filter = items => items.filter(item => item.value>10);
const compare = (x, y) => x*2 === y + 3;


```

### 格式化后的代码（节选自 demo\sample.formatted.ts）

```ts
const a: number = 1 + 2 * (3 - 4);
let price = basePrice * count + tax;
var total = (price+extraFee)/(discount+1);
const config = { a: 1, b: { nested: 2 }, list: [1, 2, a + b] };
const filter = items => items.filter(item => item.value>10);
const compare = (x, y) => x*2 === y + 3;


```

### 关键解析与格式化代码片段（节选）

#### 1. 词法分析（tokenize）核心思路

```ts
function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let pos = 0;
  // 省略：空白、数字、字符串、标识符、多字符运算符、括号等分支
  // 本质：从左到右扫描，根据字符类别推断 token 类型并推进指针
  return tokens;
}
```

#### 2. 表达式解析（parseExpression）核心结构

```ts
const parseExpression = (tokens: Token[]): ExpressionNode => {
  // 内部依次调用 parseEquality → parseRelational → parseAdditive → parseMultiplicative → parsePrimary
  // 每一层根据当前 token 决定是否继续构造对应的 AST 节点
  // 解析完成后如果还有剩余 token，则抛出错误
  return result;
};
```

#### 3. 表达式生成（generateExpression）核心逻辑

```ts
const generateExpression = (node: ExpressionNode, parentPrecedence = 0): string => {
  // 根据节点类型决定输出：
  // - 字面量、标识符：直接输出
  // - 数组、对象：递归输出内部元素/属性，并加上逗号、空格和括号
  // - 二元/比较表达式：根据优先级判断是否需要外围括号，保证不改变原有语义
  return result;
};
```


## AST 实战 Demo：自制表达式解析器 + 简单 TS 格式化

### 示例 TS 代码（节选自 demo\sample.ts）

```ts
const a: number = 1+2 * (3-4);
let price = basePrice* count + tax;
var total = (price+extraFee)/(discount+1);
const config = {a:1,b: { nested:2}, list:[1,2, a + b]};
const filter = items => items.filter(item => item.value>10);
const compare = (x, y) => x*2 === y + 3;


```

### 格式化后的代码（节选自 demo\sample.formatted.ts）

```ts
const a: number = 1 + 2 * (3 - 4);
let price = basePrice * count + tax;
var total = (price+extraFee)/(discount+1);
const config = { a: 1, b: { nested: 2 }, list: [1, 2, a + b] };
const filter = items => items.filter(item => item.value>10);
const compare = (x, y) => x*2 === y + 3;


```

### 关键解析与格式化代码片段（节选）

#### 1. 词法分析（tokenize）核心思路

```ts
function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let pos = 0;
  // 省略：空白、数字、字符串、标识符、多字符运算符、括号等分支
  // 本质：从左到右扫描，根据字符类别推断 token 类型并推进指针
  return tokens;
}
```

#### 2. 表达式解析（parseExpression）核心结构

```ts
const parseExpression = (tokens: Token[]): ExpressionNode => {
  // 内部依次调用 parseEquality → parseRelational → parseAdditive → parseMultiplicative → parsePrimary
  // 每一层根据当前 token 决定是否继续构造对应的 AST 节点
  // 解析完成后如果还有剩余 token，则抛出错误
  return result;
};
```

#### 3. 表达式生成（generateExpression）核心逻辑

```ts
const generateExpression = (node: ExpressionNode, parentPrecedence = 0): string => {
  // 根据节点类型决定输出：
  // - 字面量、标识符：直接输出
  // - 数组、对象：递归输出内部元素/属性，并加上逗号、空格和括号
  // - 二元/比较表达式：根据优先级判断是否需要外围括号，保证不改变原有语义
  return result;
};
```


## AST 实战 Demo：自制表达式解析器 + 简单 TS 格式化

### 示例 TS 代码（节选自 demo\sample.ts）

```ts
const a: number = 1+2 * (3-4);
let price = basePrice* count + tax;
var total = (price+extraFee)/(discount+1);
const config = {a:1,b: { nested:2}, list:[1,2, a + b]};
const filter = items => items.filter(item => item.value>10);
const compare = (x, y) => x*2 === y + 3;


```

### 格式化后的代码（节选自 demo\sample.formatted.ts）

```ts
const a: number = 1 + 2 * (3 - 4);
let price = basePrice * count + tax;
var total = (price+extraFee)/(discount+1);
const config = { a: 1, b: { nested: 2 }, list: [1, 2, a + b] };
const filter = items => items.filter(item => item.value>10);
const compare = (x, y) => x*2 === y + 3;


```

### 关键解析与格式化代码片段（节选）

#### 1. 词法分析（tokenize）核心思路

```ts
function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let pos = 0;
  // 省略：空白、数字、字符串、标识符、多字符运算符、括号等分支
  // 本质：从左到右扫描，根据字符类别推断 token 类型并推进指针
  return tokens;
}
```

#### 2. 表达式解析（parseExpression）核心结构

```ts
const parseExpression = (tokens: Token[]): ExpressionNode => {
  // 内部依次调用 parseEquality → parseRelational → parseAdditive → parseMultiplicative → parsePrimary
  // 每一层根据当前 token 决定是否继续构造对应的 AST 节点
  // 解析完成后如果还有剩余 token，则抛出错误
  return result;
};
```

#### 3. 表达式生成（generateExpression）核心逻辑

```ts
const generateExpression = (node: ExpressionNode, parentPrecedence = 0): string => {
  // 根据节点类型决定输出：
  // - 字面量、标识符：直接输出
  // - 数组、对象：递归输出内部元素/属性，并加上逗号、空格和括号
  // - 二元/比较表达式：根据优先级判断是否需要外围括号，保证不改变原有语义
  return result;
};
```


## AST 实战 Demo：自制表达式解析器 + 简单 TS 格式化

### 示例 TS 代码（节选自 demo\sample.ts）

```ts
const a: number = 1+2 * (3-4);
let price = basePrice* count + tax;
var total = (price+extraFee)/(discount+1);
const config = {a:1,b: { nested:2}, list:[1,2, a + b]};
const filter = items => items.filter(item => item.value>10);
const compare = (x, y) => x*2 === y + 3;


```

### 格式化后的代码（节选自 demo\sample.formatted.ts）

```ts
const a: number = 1 + 2 * (3 - 4);
let price = basePrice * count + tax;
var total = (price+extraFee)/(discount+1);
const config = { a: 1, b: { nested: 2 }, list: [1, 2, a + b] };
const filter = items => items.filter(item => item.value>10);
const compare = (x, y) => x*2 === y + 3;


```

### 关键解析与格式化代码片段（节选）

#### 1. 词法分析（tokenize）核心思路

```ts
function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let pos = 0;
  // 省略：空白、数字、字符串、标识符、多字符运算符、括号等分支
  // 本质：从左到右扫描，根据字符类别推断 token 类型并推进指针
  return tokens;
}
```

#### 2. 表达式解析（parseExpression）核心结构

```ts
const parseExpression = (tokens: Token[]): ExpressionNode => {
  // 内部依次调用 parseEquality → parseRelational → parseAdditive → parseMultiplicative → parsePrimary
  // 每一层根据当前 token 决定是否继续构造对应的 AST 节点
  // 解析完成后如果还有剩余 token，则抛出错误
  return result;
};
```

#### 3. 表达式生成（generateExpression）核心逻辑

```ts
const generateExpression = (node: ExpressionNode, parentPrecedence = 0): string => {
  // 根据节点类型决定输出：
  // - 字面量、标识符：直接输出
  // - 数组、对象：递归输出内部元素/属性，并加上逗号、空格和括号
  // - 二元/比较表达式：根据优先级判断是否需要外围括号，保证不改变原有语义
  return result;
};
```


## AST 实战 Demo：自制表达式解析器 + 简单 TS 格式化

### 示例 TS 代码（节选自 demo\sample.ts）

```ts
const a: number = 1+2 * (3-4);
let price = basePrice* count + tax;
var total = (price+extraFee)/(discount+1);
const config = {a:1,b: { nested:2}, list:[1,2, a + b]};
const filter = items => items.filter(item => item.value>10);
const compare = (x, y) => x*2 === y + 3;


```

### 格式化后的代码（节选自 demo\sample.formatted.ts）

```ts
const a: number = 1 + 2 * (3 - 4);
let price = basePrice * count + tax;
var total = (price+extraFee)/(discount+1);
const config = { a: 1, b: { nested: 2 }, list: [1, 2, a + b] };
const filter = items => items.filter(item => item.value>10);
const compare = (x, y) => x*2 === y + 3;


```

### 关键解析与格式化代码片段（节选）

#### 1. 词法分析（tokenize）核心思路

```ts
function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let pos = 0;
  // 省略：空白、数字、字符串、标识符、多字符运算符、括号等分支
  // 本质：从左到右扫描，根据字符类别推断 token 类型并推进指针
  return tokens;
}
```

#### 2. 表达式解析（parseExpression）核心结构

```ts
const parseExpression = (tokens: Token[]): ExpressionNode => {
  // 内部依次调用 parseEquality → parseRelational → parseAdditive → parseMultiplicative → parsePrimary
  // 每一层根据当前 token 决定是否继续构造对应的 AST 节点
  // 解析完成后如果还有剩余 token，则抛出错误
  return result;
};
```

#### 3. 表达式生成（generateExpression）核心逻辑

```ts
const generateExpression = (node: ExpressionNode, parentPrecedence = 0): string => {
  // 根据节点类型决定输出：
  // - 字面量、标识符：直接输出
  // - 数组、对象：递归输出内部元素/属性，并加上逗号、空格和括号
  // - 二元/比较表达式：根据优先级判断是否需要外围括号，保证不改变原有语义
  return result;
};
```


## AST 实战 Demo：自制表达式解析器 + 简单 TS 格式化

### 示例 TS 代码（节选自 demo\sample.ts）

```ts
const a: number = 1+2 * (3-4);
let price = basePrice* count + tax;
var total = (price+extraFee)/(discount+1);
const config = {a:1,b: { nested:2}, list:[1,2, a + b]};
const filter = items => items.filter(item => item.value>10);
const compare = (x, y) => x*2 === y + 3;


```

### 格式化后的代码（节选自 demo\sample.formatted.ts）

```ts
const a: number = 1 + 2 * (3 - 4);
let price = basePrice * count + tax;
var total = (price+extraFee)/(discount+1);
const config = { a: 1, b: { nested: 2 }, list: [1, 2, a + b] };
const filter = items => items.filter(item => item.value>10);
const compare = (x, y) => x*2 === y + 3;


```

### 关键解析与格式化代码片段（节选）

#### 1. 词法分析（tokenize）核心思路

```ts
function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let pos = 0;
  // 省略：空白、数字、字符串、标识符、多字符运算符、括号等分支
  // 本质：从左到右扫描，根据字符类别推断 token 类型并推进指针
  return tokens;
}
```

#### 2. 表达式解析（parseExpression）核心结构

```ts
const parseExpression = (tokens: Token[]): ExpressionNode => {
  // 内部依次调用 parseEquality → parseRelational → parseAdditive → parseMultiplicative → parsePrimary
  // 每一层根据当前 token 决定是否继续构造对应的 AST 节点
  // 解析完成后如果还有剩余 token，则抛出错误
  return result;
};
```

#### 3. 表达式生成（generateExpression）核心逻辑

```ts
const generateExpression = (node: ExpressionNode, parentPrecedence = 0): string => {
  // 根据节点类型决定输出：
  // - 字面量、标识符：直接输出
  // - 数组、对象：递归输出内部元素/属性，并加上逗号、空格和括号
  // - 二元/比较表达式：根据优先级判断是否需要外围括号，保证不改变原有语义
  return result;
};
```


## AST 实战 Demo：自制表达式解析器 + 简单 TS 格式化

### 示例 TS 代码（节选自 demo\sample.ts）

```ts
const a: number = 1+2 * (3-4);
let price = basePrice* count + tax;
var total = (price+extraFee)/(discount+1);
const config = {a:1,b: { nested:2}, list:[1,2, a + b]};
const filter = items => items.filter(item => item.value>10);
const compare = (x, y) => x*2 === y + 3;


```

### 格式化后的代码（节选自 demo\sample.formatted.ts）

```ts
const a: number = 1 + 2 * (3 - 4);
let price = basePrice * count + tax;
var total = (price+extraFee)/(discount+1);
const config = { a: 1, b: { nested: 2 }, list: [1, 2, a + b] };
const filter = items => items.filter(item => item.value>10);
const compare = (x, y) => x*2 === y + 3;


```

### 关键解析与格式化代码片段（节选）

#### 1. 词法分析（tokenize）核心思路

```ts
function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let pos = 0;
  // 省略：空白、数字、字符串、标识符、多字符运算符、括号等分支
  // 本质：从左到右扫描，根据字符类别推断 token 类型并推进指针
  return tokens;
}
```

#### 2. 表达式解析（parseExpression）核心结构

```ts
const parseExpression = (tokens: Token[]): ExpressionNode => {
  // 内部依次调用 parseEquality → parseRelational → parseAdditive → parseMultiplicative → parsePrimary
  // 每一层根据当前 token 决定是否继续构造对应的 AST 节点
  // 解析完成后如果还有剩余 token，则抛出错误
  return result;
};
```

#### 3. 表达式生成（generateExpression）核心逻辑

```ts
const generateExpression = (node: ExpressionNode, parentPrecedence = 0): string => {
  // 根据节点类型决定输出：
  // - 字面量、标识符：直接输出
  // - 数组、对象：递归输出内部元素/属性，并加上逗号、空格和括号
  // - 二元/比较表达式：根据优先级判断是否需要外围括号，保证不改变原有语义
  return result;
};
```


## AST 实战 Demo：自制表达式解析器 + 简单 TS 格式化

### 示例 TS 代码（节选自 demo\sample.ts）

```ts
const a: number = 1+2 * (3-4);
let price = basePrice* count + tax;
var total = (price+extraFee)/(discount+1);
const config = {a:1,b: { nested:2}, list:[1,2, a + b]};
const filter = items => items.filter(item => item.value>10);
const compare = (x, y) => x*2 === y + 3;


```

### 格式化后的代码（节选自 demo\sample.formatted.ts）

```ts
const a: number = 1 + 2 * (3 - 4);
let price = basePrice * count + tax;
var total = (price+extraFee)/(discount+1);
const config = { a: 1, b: { nested: 2 }, list: [1, 2, a + b] };
const filter = items => items.filter(item => item.value>10);
const compare = (x, y) => x*2 === y + 3;


```

### 关键解析与格式化代码片段（节选）

#### 1. 词法分析（tokenize）核心思路

```ts
function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let pos = 0;
  // 省略：空白、数字、字符串、标识符、多字符运算符、括号等分支
  // 本质：从左到右扫描，根据字符类别推断 token 类型并推进指针
  return tokens;
}
```

#### 2. 表达式解析（parseExpression）核心结构

```ts
const parseExpression = (tokens: Token[]): ExpressionNode => {
  // 内部依次调用 parseEquality → parseRelational → parseAdditive → parseMultiplicative → parsePrimary
  // 每一层根据当前 token 决定是否继续构造对应的 AST 节点
  // 解析完成后如果还有剩余 token，则抛出错误
  return result;
};
```

#### 3. 表达式生成（generateExpression）核心逻辑

```ts
const generateExpression = (node: ExpressionNode, parentPrecedence = 0): string => {
  // 根据节点类型决定输出：
  // - 字面量、标识符：直接输出
  // - 数组、对象：递归输出内部元素/属性，并加上逗号、空格和括号
  // - 二元/比较表达式：根据优先级判断是否需要外围括号，保证不改变原有语义
  return result;
};
```


## AST 实战 Demo：自制表达式解析器 + 简单 TS 格式化

### 示例 TS 代码（节选自 demo\sample.ts）

```ts
const a: number = 1+2 * (3-4);
let price = basePrice* count + tax;
var total = (price+extraFee)/(discount+1);
const config = {a:1,b: { nested:2}, list:[1,2, a + b]};
const filter = items => items.filter(item => item.value>10);
const compare = (x, y) => x*2 === y + 3;


```

### 格式化后的代码（节选自 demo\sample.formatted.ts）

```ts
const a: number = 1 + 2 * (3 - 4);
let price = basePrice * count + tax;
var total = (price+extraFee)/(discount+1);
const config = { a: 1, b: { nested: 2 }, list: [1, 2, a + b] };
const filter = items => items.filter(item => item.value>10);
const compare = (x, y) => x*2 === y + 3;


```

### 关键解析与格式化代码片段（节选）

#### 1. 词法分析（tokenize）核心思路

```ts
function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let pos = 0;
  // 省略：空白、数字、字符串、标识符、多字符运算符、括号等分支
  // 本质：从左到右扫描，根据字符类别推断 token 类型并推进指针
  return tokens;
}
```

#### 2. 表达式解析（parseExpression）核心结构

```ts
const parseExpression = (tokens: Token[]): ExpressionNode => {
  // 内部依次调用 parseEquality → parseRelational → parseAdditive → parseMultiplicative → parsePrimary
  // 每一层根据当前 token 决定是否继续构造对应的 AST 节点
  // 解析完成后如果还有剩余 token，则抛出错误
  return result;
};
```

#### 3. 表达式生成（generateExpression）核心逻辑

```ts
const generateExpression = (node: ExpressionNode, parentPrecedence = 0): string => {
  // 根据节点类型决定输出：
  // - 字面量、标识符：直接输出
  // - 数组、对象：递归输出内部元素/属性，并加上逗号、空格和括号
  // - 二元/比较表达式：根据优先级判断是否需要外围括号，保证不改变原有语义
  return result;
};
```


## AST 实战 Demo：自制表达式解析器 + 简单 TS 格式化

### 示例 TS 代码（节选自 demo\sample.ts）

```ts
const a: number = 1+2 * (3-4);
let price = basePrice* count + tax;
var total = (price+extraFee)/(discount+1);
const config = {a:1,b: { nested:2}, list:[1,2, a + b]};
const filter = items => items.filter(item => item.value>10);
const compare = (x, y) => x*2 === y + 3;


```

### 格式化后的代码（节选自 demo\sample.formatted.ts）

```ts
const a: number = 1 + 2 * (3 - 4);
let price = basePrice * count + tax;
var total = (price+extraFee)/(discount+1);
const config = { a: 1, b: { nested: 2 }, list: [1, 2, a + b] };
const filter = items => items.filter(item => item.value>10);
const compare = (x, y) => x*2 === y + 3;


```

### 关键解析与格式化代码片段（节选）

#### 1. 词法分析（tokenize）核心思路

```ts
function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let pos = 0;
  // 省略：空白、数字、字符串、标识符、多字符运算符、括号等分支
  // 本质：从左到右扫描，根据字符类别推断 token 类型并推进指针
  return tokens;
}
```

#### 2. 表达式解析（parseExpression）核心结构

```ts
const parseExpression = (tokens: Token[]): ExpressionNode => {
  // 内部依次调用 parseEquality → parseRelational → parseAdditive → parseMultiplicative → parsePrimary
  // 每一层根据当前 token 决定是否继续构造对应的 AST 节点
  // 解析完成后如果还有剩余 token，则抛出错误
  return result;
};
```

#### 3. 表达式生成（generateExpression）核心逻辑

```ts
const generateExpression = (node: ExpressionNode, parentPrecedence = 0): string => {
  // 根据节点类型决定输出：
  // - 字面量、标识符：直接输出
  // - 数组、对象：递归输出内部元素/属性，并加上逗号、空格和括号
  // - 二元/比较表达式：根据优先级判断是否需要外围括号，保证不改变原有语义
  return result;
};
```


## AST 实战 Demo：自制表达式解析器 + 简单 TS 格式化

### 示例 TS 代码（节选自 demo\sample.ts）

```ts
const a: number = 1+2 * (3-4);
let price = basePrice* count + tax;
var total = (price+extraFee)/(discount+1);
const config = {a:1,b: { nested:2}, list:[1,2, a + b]};
const filter = items => items.filter(item => item.value>10);
const compare = (x, y) => x*2 === y + 3;


```

### 格式化后的代码（节选自 demo\sample.formatted.ts）

```ts
const a: number = 1 + 2 * (3 - 4);
let price = basePrice * count + tax;
var total = (price+extraFee)/(discount+1);
const config = { a: 1, b: { nested: 2 }, list: [1, 2, a + b] };
const filter = items => items.filter(item => item.value>10);
const compare = (x, y) => x*2 === y + 3;


```

### 关键解析与格式化代码片段（节选）

#### 1. 词法分析（tokenize）核心思路

```ts
function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let pos = 0;
  // 省略：空白、数字、字符串、标识符、多字符运算符、括号等分支
  // 本质：从左到右扫描，根据字符类别推断 token 类型并推进指针
  return tokens;
}
```

#### 2. 表达式解析（parseExpression）核心结构

```ts
const parseExpression = (tokens: Token[]): ExpressionNode => {
  // 内部依次调用 parseEquality → parseRelational → parseAdditive → parseMultiplicative → parsePrimary
  // 每一层根据当前 token 决定是否继续构造对应的 AST 节点
  // 解析完成后如果还有剩余 token，则抛出错误
  return result;
};
```

#### 3. 表达式生成（generateExpression）核心逻辑

```ts
const generateExpression = (node: ExpressionNode, parentPrecedence = 0): string => {
  // 根据节点类型决定输出：
  // - 字面量、标识符：直接输出
  // - 数组、对象：递归输出内部元素/属性，并加上逗号、空格和括号
  // - 二元/比较表达式：根据优先级判断是否需要外围括号，保证不改变原有语义
  return result;
};
```


## AST 实战 Demo：自制表达式解析器 + 简单 TS 格式化

### 示例 TS 代码（节选自 demo\sample.ts）

```ts
const a: number = 1+2 * (3-4);
let price = basePrice* count + tax;
var total = (price+extraFee)/(discount+1);
const config = {a:1,b: { nested:2}, list:[1,2, a + b]};
const filter = items => items.filter(item => item.value>10);
const compare = (x, y) => x*2 === y + 3;


```

### 格式化后的代码（节选自 demo\sample.formatted.ts）

```ts
const a: number = 1 + 2 * (3 - 4);
let price = basePrice * count + tax;
var total = (price+extraFee)/(discount+1);
const config = { a: 1, b: { nested: 2 }, list: [1, 2, a + b] };
const filter = items => items.filter(item => item.value>10);
const compare = (x, y) => x*2 === y + 3;


```

### 关键解析与格式化代码片段（节选）

#### 1. 词法分析（tokenize）核心思路

```ts
function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let pos = 0;
  // 省略：空白、数字、字符串、标识符、多字符运算符、括号等分支
  // 本质：从左到右扫描，根据字符类别推断 token 类型并推进指针
  return tokens;
}
```

#### 2. 表达式解析（parseExpression）核心结构

```ts
const parseExpression = (tokens: Token[]): ExpressionNode => {
  // 内部依次调用 parseEquality → parseRelational → parseAdditive → parseMultiplicative → parsePrimary
  // 每一层根据当前 token 决定是否继续构造对应的 AST 节点
  // 解析完成后如果还有剩余 token，则抛出错误
  return result;
};
```

#### 3. 表达式生成（generateExpression）核心逻辑

```ts
const generateExpression = (node: ExpressionNode, parentPrecedence = 0): string => {
  // 根据节点类型决定输出：
  // - 字面量、标识符：直接输出
  // - 数组、对象：递归输出内部元素/属性，并加上逗号、空格和括号
  // - 二元/比较表达式：根据优先级判断是否需要外围括号，保证不改变原有语义
  return result;
};
```


## AST 实战 Demo：自制表达式解析器 + 简单 TS 格式化

### 示例 TS 代码（节选自 demo\sample.ts）

```ts
const a: number = 1+2 * (3-4);
let price = basePrice* count + tax;
var total = (price+extraFee)/(discount+1);
const config = {a:1,b: { nested:2}, list:[1,2, a + b]};
const filter = items => items.filter(item => item.value>10);
const compare = (x, y) => x*2 === y + 3;


```

### 格式化后的代码（节选自 demo\sample.formatted.ts）

```ts
const a: number = 1 + 2 * (3 - 4);
let price = basePrice * count + tax;
var total = (price+extraFee)/(discount+1);
const config = { a: 1, b: { nested: 2 }, list: [1, 2, a + b] };
const filter = items => items.filter(item => item.value>10);
const compare = (x, y) => x*2 === y + 3;


```

### 关键解析与格式化代码片段（节选）

#### 1. 词法分析（tokenize）核心思路

```ts
function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let pos = 0;
  // 省略：空白、数字、字符串、标识符、多字符运算符、括号等分支
  // 本质：从左到右扫描，根据字符类别推断 token 类型并推进指针
  return tokens;
}
```

#### 2. 表达式解析（parseExpression）核心结构

```ts
const parseExpression = (tokens: Token[]): ExpressionNode => {
  // 内部依次调用 parseEquality → parseRelational → parseAdditive → parseMultiplicative → parsePrimary
  // 每一层根据当前 token 决定是否继续构造对应的 AST 节点
  // 解析完成后如果还有剩余 token，则抛出错误
  return result;
};
```

#### 3. 表达式生成（generateExpression）核心逻辑

```ts
const generateExpression = (node: ExpressionNode, parentPrecedence = 0): string => {
  // 根据节点类型决定输出：
  // - 字面量、标识符：直接输出
  // - 数组、对象：递归输出内部元素/属性，并加上逗号、空格和括号
  // - 二元/比较表达式：根据优先级判断是否需要外围括号，保证不改变原有语义
  return result;
};
```


## AST 实战 Demo：自制表达式解析器 + 简单 TS 格式化

### 示例 TS 代码（节选自 demo\sample.ts）

```ts
const a: number = 1+2 * (3-4);
let price = basePrice* count + tax;
var total = (price+extraFee)/(discount+1);
const config = {a:1,b: { nested:2}, list:[1,2, a + b]};
const filter = items => items.filter(item => item.value>10);
const compare = (x, y) => x*2 === y + 3;


```

### 格式化后的代码（节选自 demo\sample.formatted.ts）

```ts
const a: number = 1 + 2 * (3 - 4);
let price = basePrice * count + tax;
var total = (price+extraFee)/(discount+1);
const config = { a: 1, b: { nested: 2 }, list: [1, 2, a + b] };
const filter = items => items.filter(item => item.value>10);
const compare = (x, y) => x*2 === y + 3;


```

### 关键解析与格式化代码片段（节选）

#### 1. 词法分析（tokenize）核心思路

```ts
function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let pos = 0;
  // 省略：空白、数字、字符串、标识符、多字符运算符、括号等分支
  // 本质：从左到右扫描，根据字符类别推断 token 类型并推进指针
  return tokens;
}
```

#### 2. 表达式解析（parseExpression）核心结构

```ts
const parseExpression = (tokens: Token[]): ExpressionNode => {
  // 内部依次调用 parseEquality → parseRelational → parseAdditive → parseMultiplicative → parsePrimary
  // 每一层根据当前 token 决定是否继续构造对应的 AST 节点
  // 解析完成后如果还有剩余 token，则抛出错误
  return result;
};
```

#### 3. 表达式生成（generateExpression）核心逻辑

```ts
const generateExpression = (node: ExpressionNode, parentPrecedence = 0): string => {
  // 根据节点类型决定输出：
  // - 字面量、标识符：直接输出
  // - 数组、对象：递归输出内部元素/属性，并加上逗号、空格和括号
  // - 二元/比较表达式：根据优先级判断是否需要外围括号，保证不改变原有语义
  return result;
};
```


## AST 实战 Demo：自制表达式解析器 + 简单 TS 格式化

### 示例 TS 代码（节选自 demo\sample.ts）

```ts
const a: number = 1+2 * (3-4);
let price = basePrice* count + tax;
var total = (price+extraFee)/(discount+1);
const config = {a:1,b: { nested:2}, list:[1,2, a + b]};
const filter = items => items.filter(item => item.value>10);
const compare = (x, y) => x*2 === y + 3;


```

### 格式化后的代码（节选自 demo\sample.formatted.ts）

```ts
const a: number = 1 + 2 * (3 - 4);
let price = basePrice * count + tax;
var total = (price+extraFee)/(discount+1);
const config = { a: 1, b: { nested: 2 }, list: [1, 2, a + b] };
const filter = items => items.filter(item => item.value>10);
const compare = (x, y) => x*2 === y + 3;


```

### 关键解析与格式化代码片段（节选）

#### 1. 词法分析（tokenize）核心思路

```ts
function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let pos = 0;
  // 省略：空白、数字、字符串、标识符、多字符运算符、括号等分支
  // 本质：从左到右扫描，根据字符类别推断 token 类型并推进指针
  return tokens;
}
```

#### 2. 表达式解析（parseExpression）核心结构

```ts
const parseExpression = (tokens: Token[]): ExpressionNode => {
  // 内部依次调用 parseEquality → parseRelational → parseAdditive → parseMultiplicative → parsePrimary
  // 每一层根据当前 token 决定是否继续构造对应的 AST 节点
  // 解析完成后如果还有剩余 token，则抛出错误
  return result;
};
```

#### 3. 表达式生成（generateExpression）核心逻辑

```ts
const generateExpression = (node: ExpressionNode, parentPrecedence = 0): string => {
  // 根据节点类型决定输出：
  // - 字面量、标识符：直接输出
  // - 数组、对象：递归输出内部元素/属性，并加上逗号、空格和括号
  // - 二元/比较表达式：根据优先级判断是否需要外围括号，保证不改变原有语义
  return result;
};
```


## AST 实战 Demo：自制表达式解析器 + 简单 TS 格式化

### 示例 TS 代码（节选自 demo\sample.ts）

```ts
const a: number = 1+2 * (3-4);
let price = basePrice* count + tax;
var total = (price+extraFee)/(discount+1);
const config = {a:1,b: { nested:2}, list:[1,2, a + b]};
const filter = items => items.filter(item => item.value>10);
const compare = (x, y) => x*2 === y + 3;


```

### 格式化后的代码（节选自 demo\sample.formatted.ts）

```ts
const a: number = 1 + 2 * (3 - 4);
let price = basePrice * count + tax;
var total = (price+extraFee)/(discount+1);
const config = { a: 1, b: { nested: 2 }, list: [1, 2, a + b] };
const filter = items => items.filter(item => item.value>10);
const compare = (x, y) => x*2 === y + 3;


```

### 关键解析与格式化代码片段（节选）

#### 1. 词法分析（tokenize）核心思路

```ts
function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let pos = 0;
  // 省略：空白、数字、字符串、标识符、多字符运算符、括号等分支
  // 本质：从左到右扫描，根据字符类别推断 token 类型并推进指针
  return tokens;
}
```

#### 2. 表达式解析（parseExpression）核心结构

```ts
const parseExpression = (tokens: Token[]): ExpressionNode => {
  // 内部依次调用 parseEquality → parseRelational → parseAdditive → parseMultiplicative → parsePrimary
  // 每一层根据当前 token 决定是否继续构造对应的 AST 节点
  // 解析完成后如果还有剩余 token，则抛出错误
  return result;
};
```

#### 3. 表达式生成（generateExpression）核心逻辑

```ts
const generateExpression = (node: ExpressionNode, parentPrecedence = 0): string => {
  // 根据节点类型决定输出：
  // - 字面量、标识符：直接输出
  // - 数组、对象：递归输出内部元素/属性，并加上逗号、空格和括号
  // - 二元/比较表达式：根据优先级判断是否需要外围括号，保证不改变原有语义
  return result;
};
```


## AST 实战 Demo：自制表达式解析器 + 简单 TS 格式化

### 示例 TS 代码（节选自 demo\sample.ts）

```ts
const a: number = 1+2 * (3-4);
let price = basePrice* count + tax;
var total = (price+extraFee)/(discount+1);
const config = {a:1,b: { nested:2}, list:[1,2, a + b]};
const filter = items => items.filter(item => item.value>10);
const compare = (x, y) => x*2 === y + 3;


```

### 格式化后的代码（节选自 demo\sample.formatted.ts）

```ts
const a: number = 1 + 2 * (3 - 4);
let price = basePrice * count + tax;
var total = (price+extraFee)/(discount+1);
const config = { a: 1, b: { nested: 2 }, list: [1, 2, a + b] };
const filter = items => items.filter(item => item.value>10);
const compare = (x, y) => x*2 === y + 3;


```

### 关键解析与格式化代码片段（节选）

#### 1. 词法分析（tokenize）核心思路

```ts
function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let pos = 0;
  // 省略：空白、数字、字符串、标识符、多字符运算符、括号等分支
  // 本质：从左到右扫描，根据字符类别推断 token 类型并推进指针
  return tokens;
}
```

#### 2. 表达式解析（parseExpression）核心结构

```ts
const parseExpression = (tokens: Token[]): ExpressionNode => {
  // 内部依次调用 parseEquality → parseRelational → parseAdditive → parseMultiplicative → parsePrimary
  // 每一层根据当前 token 决定是否继续构造对应的 AST 节点
  // 解析完成后如果还有剩余 token，则抛出错误
  return result;
};
```

#### 3. 表达式生成（generateExpression）核心逻辑

```ts
const generateExpression = (node: ExpressionNode, parentPrecedence = 0): string => {
  // 根据节点类型决定输出：
  // - 字面量、标识符：直接输出
  // - 数组、对象：递归输出内部元素/属性，并加上逗号、空格和括号
  // - 二元/比较表达式：根据优先级判断是否需要外围括号，保证不改变原有语义
  return result;
};
```
