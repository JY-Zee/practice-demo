## AST 语法树 Demo 实现说明

本文件用于记录当前仓库中 `demo/mini-formatter.ts` 的实现步骤与逻辑说明，方便后续回顾和扩展。

---

### 一、Demo 目标回顾

- **目标 1**：手写一个“自制表达式解析器”，只覆盖常见 TS 表达式子集：
  - 数字 / 字符串 / 布尔 / null / undefined
  - 标识符
  - 数组字面量 `[1, 2, a + b]`
  - 对象字面量 `{ a: 1, b: foo }`
  - 箭头函数（表达式体）`x => x + 1`、`(a, b) => a + b`
  - 运算符：`+ - * / > < >= <= == != === !==`
- **目标 2**：对 `demo/sample.ts` 中形如 `const/let/var xxx = 表达式;` 的行：
  - 只解析并格式化 `=` 和 `;` 之间的表达式部分。
  - 保留声明关键字、变量名、类型注解、行尾注释等其他部分。
- **目标 3**：对整个文件做一次简单缩进修复：
  - 基于 `{`、`}`、`[`、`]` 判断缩进层级。
  - 使用 2 个空格作为一个缩进单位。
- **目标 4**：将格式化结果写入 `demo/sample.formatted.ts`，并在 `AST语法树原理说明.md` 中追加 demo 示例和关键代码片段。

---

### 二、文件结构

- `demo/sample.ts`
  - Demo 使用的示例 TS 源文件，包含：
    - 简单算术表达式。
    - 包含对象、数组的表达式。
    - 箭头函数和比较表达式。
- `demo/mini-formatter.ts`
  - 整个 Demo 的核心实现文件：
    - 包含 Token / AST 类型定义。
    - 词法分析（`tokenize`）。
    - 语法分析（`parseExpression` 以及若干子函数）。
    - 表达式生成（`generateExpression`）。
    - TS 源文件行级格式化（`formatTsSource`）。
    - 缩进修复（`fixIndent`）。
    - 将结果输出为新文件、并追加到 AST 说明 md（`main` 函数）。
- `AST语法树原理说明.md`
  - 原有 AST 原理说明文件。
  - 运行 `mini-formatter.ts` 后，会在文件末尾新增一节 “AST 实战 Demo：自制表达式解析器 + 简单 TS 格式化”。

---

### 三、词法分析（tokenize）实现步骤说明

1. **输入**：传入表达式字符串（即某行中 `=` 与 `;` 之间的部分）。
2. **输出**：Token 列表，每个 Token 包含：
   - `type`：枚举 `TokenType`。
   - `value`：源字符串片段。
   - `start` / `end`：在原字符串中的位置（本 Demo 中主要用于调试）。
3. **字符分类函数**：
   - `isWhitespace`：判断空格、tab、换行。
   - `isDigit`：判断数字字符。
   - `isIdentifierStart` / `isIdentifierPart`：判断标识符合法字符（字母、下划线、数字等）。
4. **主循环逻辑**：
   - 跳过空白字符。
   - 如果是数字，连续读取数字构成一个 `Number` Token。
   - 如果是字符串引号（`'` 或 `"`），读取到下一个同类引号为止（简单处理转义）。
   - 如果是标识符起始字符：
     - 读取完整标识符。
     - 根据具体字面值区分出 `true/false/null/undefined`，否则为 `Identifier`。
   - 处理多字符运算符：
     - 先匹配长度为 3 的 `===` / `!==`。
     - 再匹配长度为 2 的 `==` / `!=` / `>=` / `<=` / `=>`。
   - 处理单字符运算符和括号：`+ - * / ( ) { } [ ] : ,`。
   - 遇到未知字符时抛出错误，保证 demo 有基本的容错和调试能力。

设计要点：

- 多字符运算符优先匹配最长，这样可以避免 `===` 被错误拆成 `==` 和 `=（未识别）`。
- 标识符中同时支持 `_` 和 `$`，贴近 JavaScript/TypeScript 实际语法。

---

### 四、语法分析（parseExpression）实现步骤说明

语法分析采用 **递归下降** 的写法，将不同优先级的运算拆分到不同层级函数中。

1. **入口函数**：`parseExpression(tokens: Token[]): ExpressionNode`
   - 内部维护 `current` 索引，以及 `peek` / `consume` 两个辅助函数：
     - `peek()`：查看当前 Token，不前进。
     - `consume(expected?)`：消费当前 Token 并前进，可选校验类型。
   - 主要调用顺序：`parseEquality` → `parseRelational` → `parseAdditive` → `parseMultiplicative` → `parsePrimary`。
   - 解析完成后，如果还有未消费的 Token，则抛出错误，避免“半截成功”的情况。

2. **优先级层级划分**：

   - `parsePrimary`：
     - 处理字面量（数字、字符串、布尔、null、undefined）。
     - 处理标识符（普通变量名）。
     - 处理数组字面量 `[ ... ]`。
     - 处理对象字面量 `{ key: value, ... }`。
     - 处理括号表达式 `(expr)`。
     - 处理箭头函数：
       - `x => expr`
       - `(a, b) => expr`
   - `parseMultiplicative`：处理 `*`、`/`。
   - `parseAdditive`：处理 `+`、`-`。
   - `parseRelational`：处理 `> < >= <=`。
   - `parseEquality`：处理 `== != === !==`。

3. **对象与数组的解析要点**：
   - 数组：
     - 在 `[` 后连续调用 `parseEquality` 解析元素。
     - 使用逗号分隔元素，直到遇到 `]`。
   - 对象：
     - 在 `{` 后解析 `key: value` 形式的属性对。
     - `key` 支持标识符或字符串字面量。
     - 每个属性的 `value` 使用 `parseEquality` 解析。
     - 使用逗号分隔属性，直到遇到 `}`。

4. **箭头函数解析要点**：
   - 单参数形式：
     - 看到 `Identifier` 后紧跟 `Arrow`（`=>`），即解析为：
       - `params = [Identifier]`
       - `body = parseExpression()`。
   - 多参数形式：
     - 以 `(` 开始，读取一组 `Identifier` + 逗号列表，遇到 `)` 结束。
     - 紧接 `Arrow`（`=>`）则视为箭头函数参数列表。
     - body 同样用 `parseExpression()` 解析（只支持表达式体）。

通过这种“由低到高的优先级递归”，可以保证：

- 乘除高于加减。
- 加减高于比较。
- 比较高于相等比较。
- 括号、数组、对象、箭头函数在 `Primary` 层一次性处理。

---

### 五、表达式生成（generateExpression）实现步骤说明

1. **目标**：从 AST 节点还原为一个“风格统一”的表达式字符串：
   - 二元运算符两侧总是有空格：`a + b`、`x * y`。
   - 对象格式为单行：`{ a: 1, b: foo }`。
   - 数组格式为单行：`[1, 2, a + b]`。
   - 箭头函数格式统一为 `x => x + 1` 或 `(a, b) => a + b`。
   - 使用运算符优先级决定是否需要额外括号，保证语义不变。

2. **优先级函数**：`getPrecedence(node: ExpressionNode): number`
   - 为不同类型的表达式返回一个数值优先级：
     - 乘除：20。
     - 加减：10。
     - 比较：8。
     - 相等比较：7。
     - 箭头函数：5。
     - 其他（字面量等）：100（无需括号）。

3. **生成函数**：`generateExpression(node, parentPrecedence)`
   - 对于字面量和标识符：
     - 直接返回对应字符串（字符串使用 `JSON.stringify` 保证引号成对）。
   - 对于数组：
     - 逐个生成元素字符串，用逗号+空格连接，再加上 `[` 和 `]`。
   - 对于对象：
     - key 为标识符时直接输出 `a`，为字符串时输出带引号的 `"a"`。
     - value 递归调用 `generateExpression`。
   - 对于箭头函数：
     - 单参数：直接输出 `x => body`。
     - 多参数：使用括号包裹参数 `(a, b) => body`。
   - 对于二元/比较表达式：
     - 先生成左右子表达式字符串。
     - 使用 `myPrec` 与 `parentPrecedence` 比较，低于父级优先级时外层加括号。

这种生成策略保证了：

- 格式统一（空格、逗号、括号风格固定）。
- 在不改变运算优先级的前提下尽可能减少不必要括号。

---

### 六、TS 文件行级格式化与缩进修复说明

1. **行级格式化（formatTsSource）**
   - 使用正则：`assignmentRegex` 匹配形如：
     - `const a: number = 1+2 * (3-4);`
     - `let price = basePrice* count + tax;`
   - 正则分组提取：
     - `indent`：行首缩进。
     - `keyword`：`const/let/var`。
     - `left`：`=` 左侧（变量名和类型注解）。
     - `expr`：`=` 到 `;` 之间的表达式（待解析部分）。
     - `tail`：`;` 之后可能存在的注释等内容。
   - 对 `expr` 执行：
     - `tokenize` → `parseExpression` → `generateExpression`。
   - 重新拼接为：
     - `indent + keyword + " " + left + " = " + formattedExpr + ";" + tail`。
   - 解析失败或抛错时保持原行不变，保证 demo 有基本的鲁棒性。

2. **缩进修复（fixIndent）**
   - 将格式化后的多行代码再次遍历，根据 `{` / `}` / `[` / `]` 调整缩进层级：
     - 使用 `indentLevel` 记录当前缩进深度。
     - 对每行：
       - 去掉原有前导空白。
       - 如果行首是 `}` 或 `]` 或 `)`，先将 `indentLevel--`（不低于 0）。
       - 在行前插入 `indentLevel` 个 `"  "`（两个空格）作为新缩进。
       - 统计本行中出现的 `{` / `[` 和 `}` / `]` 的数量，更新 `indentLevel`。
   - 这种实现虽然简单，但足以覆盖 demo 中的对象、数组嵌套缩进场景。

---

### 七、Demo 运行与 MD 追加逻辑说明

1. **主函数 `main`**
   - 计算根目录、`demo` 目录以及相关文件路径：
     - `demo/sample.ts`：源文件。
     - `demo/sample.formatted.ts`：格式化结果输出文件。
     - `AST语法树原理说明.md`：要追加内容的 md 文件。
   - 读取 `sample.ts`，调用 `formatTsSource` 得到格式化后的代码。
   - 将结果写入 `sample.formatted.ts`。
   - 若根目录下存在 `AST语法树原理说明.md`：
     - 调用 `buildMarkdownAppend` 生成一段 markdown 文本，包含：
       - 源代码和格式化结果的节选。
       - `tokenize` / `parseExpression` / `generateExpression` 的核心代码片段说明。
     - 将该 markdown 文本追加到 `AST语法树原理说明.md` 末尾。

2. **运行方式（建议）**
   - 使用 `ts-node` 或先用 `tsc` 编译再用 `node` 运行：
     - `ts-node demo/mini-formatter.ts`
     - 或编译后：`node dist/demo/mini-formatter.js`

---

### 八、后续可扩展方向

- 在现有解析能力基础上进一步支持：
  - 函数调用（如 `foo(a, b)`）。
  - 更复杂的箭头函数参数形式（带类型注解、解构等）。
  - 块体箭头函数：`x => { return x + 1; }`。
- 将当前自制解析器替换为标准的 TypeScript 或 Babel Parser：
  - 获得完整 TS 语法支持。
  - 本 Demo 中的格式化与缩进逻辑依然可以复用在 AST 遍历结果上。

