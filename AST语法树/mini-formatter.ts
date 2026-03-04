/**
 * 迷你 TS 表达式格式化 demo
 *
 * 功能目标：
 * 1. 从 demo/sample.ts 读取示例代码
 * 2. 只解析、格式化形如 `const/let/var xxx = 表达式;` 中 `=` 和 `;` 之间的表达式
 * 3. 支持的表达式语法：
 *    - 数字、字符串、布尔、null、undefined
 *    - 标识符
 *    - 数组字面量 [1, 2, a + b]
 *    - 对象字面量 { a: 1, b: foo }
 *    - 箭头函数（表达式体）x => x + 1, (a, b) => a + b
 *    - 运算符 + - * / > < >= <= == != === !==
 * 4. 对整个文件进行简单的 2 空格缩进修复
 * 5. 将格式化结果写入 demo/sample.formatted.ts
 * 6. 将关键示例和部分核心代码片段写入根目录的 AST 说明 md
 */

import * as fs from "fs";
import * as path from "path";

// ========== 一、Token 与 AST 类型定义 ==========

/** 词法分析得到的 token 类型枚举 */
type TokenType =
  | "Number" /** 数字字面量 */
  | "Identifier" /** 标识符（变量名等） */
  | "String" /** 字符串字面量 */
  | "True" /** 关键字 true */
  | "False" /** 关键字 false */
  | "Null" /** 关键字 null */
  | "Undefined" /** 关键字 undefined */
  | "Plus" /** 加号 + */
  | "Minus" /** 减号 - */
  | "Star" /** 乘号 * */
  | "Slash" /** 除号 / */
  | "LeftParen" /** 左圆括号 ( */
  | "RightParen" /** 右圆括号 ) */
  | "LeftBrace" /** 左花括号 { */
  | "RightBrace" /** 右花括号 } */
  | "LeftBracket" /** 左方括号 [ */
  | "RightBracket" /** 右方括号 ] */
  | "Colon" /** 冒号 :（对象属性 key: value） */
  | "Comma" /** 逗号 , */
  | "Arrow" /** 箭头 => */
  | "EqEq" /** 相等 == */
  | "EqEqEq" /** 严格相等 === */
  | "NotEq" /** 不等 != */
  | "NotEqEq" /** 严格不等 !== */
  | "Gt" /** 大于 > */
  | "Lt" /** 小于 < */
  | "Gte" /** 大于等于 >= */
  | "Lte"; /** 小于等于 <= */

/** 单个 token：词法分析器输出的最小单元 */
interface Token {
  /** token 种类 */
  type: TokenType;
  /** 源字符串片段（如 "123"、"+", "=>"） */
  value: string;
  /** 在源字符串中的起始下标 */
  start: number;
  /** 在源字符串中的结束下标（不包含） */
  end: number;
}

/** AST 节点：数字字面量，如 1、42 */
interface NumberLiteral {
  type: "NumberLiteral";
  /** 数值 */
  value: number;
}

/** AST 节点：字符串字面量，如 "hello"、'world' */
interface StringLiteral {
  type: "StringLiteral";
  /** 去掉引号后的字符串内容 */
  value: string;
}

/** AST 节点：布尔字面量 true / false */
interface BooleanLiteral {
  type: "BooleanLiteral";
  value: boolean;
}

/** AST 节点：null 字面量 */
interface NullLiteral {
  type: "NullLiteral";
}

/** AST 节点：undefined 字面量 */
interface UndefinedLiteral {
  type: "UndefinedLiteral";
}

/** AST 节点：标识符，如变量名、属性名 */
interface IdentifierNode {
  type: "Identifier";
  /** 标识符名称 */
  name: string;
}

/** AST 节点：二元算术表达式，如 a + b、x * y */
interface BinaryExpression {
  type: "BinaryExpression";
  /** 运算符：+ - * / */
  operator: "+" | "-" | "*" | "/";
  /** 左操作数 */
  left: ExpressionNode;
  /** 右操作数 */
  right: ExpressionNode;
}

/** 比较/相等运算符字面量 */
type ComparisonOperator = ">" | "<" | ">=" | "<=" | "==" | "!=" | "===" | "!==";

/** AST 节点：比较或相等表达式，如 a > b、x === y */
interface ComparisonExpression {
  type: "ComparisonExpression";
  /** 比较运算符 */
  operator: ComparisonOperator;
  /** 左操作数 */
  left: ExpressionNode;
  /** 右操作数 */
  right: ExpressionNode;
}

/** 对象字面量中的单个属性 key: value */
interface ObjectProperty {
  /** 属性名：标识符或字符串字面量 */
  key: IdentifierNode | StringLiteral;
  /** 属性值表达式 */
  value: ExpressionNode;
}

/** AST 节点：对象字面量，如 { a: 1, b: foo } */
interface ObjectLiteral {
  type: "ObjectLiteral";
  /** 属性列表 */
  properties: ObjectProperty[];
}

/** AST 节点：数组字面量，如 [1, 2, a + b] */
interface ArrayLiteral {
  type: "ArrayLiteral";
  /** 元素表达式列表 */
  elements: ExpressionNode[];
}

/** AST 节点：箭头函数表达式，如 x => x + 1、(a, b) => a + b */
interface ArrowFunctionExpression {
  type: "ArrowFunctionExpression";
  /** 参数列表（本 demo 仅支持简单标识符参数） */
  params: IdentifierNode[];
  /** 函数体表达式（仅支持表达式体，不支持块体 { }） */
  body: ExpressionNode;
}

/** 所有表达式 AST 节点的联合类型 */
type ExpressionNode =
  | NumberLiteral
  | StringLiteral
  | BooleanLiteral
  | NullLiteral
  | UndefinedLiteral
  | IdentifierNode
  | BinaryExpression
  | ComparisonExpression
  | ObjectLiteral
  | ArrayLiteral
  | ArrowFunctionExpression;

// ========== 二、词法分析：把字符串切成 Token ==========

/**
 * 判断是否为空白字符（空格、制表符、换行、回车）
 * @param ch - 单个字符
 * @returns 是否为空白
 */
const isWhitespace = (ch: string): boolean => {
  return ch === " " || ch === "\t" || ch === "\n" || ch === "\r";
};

/**
 * 判断是否为数字字符 0-9
 * @param ch - 单个字符
 * @returns 是否为数字
 */
const isDigit = (ch: string): boolean => {
  return ch >= "0" && ch <= "9";
};

/**
 * 判断是否为标识符起始字符（字母、下划线、$）
 * @param ch - 单个字符
 * @returns 是否可作为标识符开头
 */
const isIdentifierStart = (ch: string): boolean => {
  return (
    (ch >= "a" && ch <= "z") ||
    (ch >= "A" && ch <= "Z") ||
    ch === "_" ||
    ch === "$"
  );
};

/**
 * 判断是否为标识符后续字符（起始字符或数字）
 * @param ch - 单个字符
 * @returns 是否可作为标识符的一部分
 */
const isIdentifierPart = (ch: string): boolean => {
  return isIdentifierStart(ch) || isDigit(ch);
};

/**
 * 词法分析：将表达式字符串切分为 Token 列表
 * @param input - 待解析的表达式字符串（如 "1 + 2 * (3 - 4)"）
 * @returns Token 数组，按出现顺序排列
 */
const tokenize = (input: string): Token[] => {
  /** 已识别到的 token 列表 */
  const tokens: Token[] = [];
  /** 当前扫描位置（下标） */
  let pos = 0;

  while (pos < input.length) {
    /** 当前字符 */
    const ch = input[pos];

    if (isWhitespace(ch)) {
      pos += 1;
      continue;
    }

    if (isDigit(ch)) {
      /** 数字起始位置，用于 slice */
      const start = pos;
      while (pos < input.length && isDigit(input[pos])) {
        pos += 1;
      }
      /** 数字字符串，如 "123" */
      const value = input.slice(start, pos);
      tokens.push({ type: "Number", value, start, end: pos });
      continue;
    }

    if (ch === '"' || ch === "'") {
      /** 引号字符本身，用于匹配结束 */
      const quote = ch;
      const start = pos;
      pos += 1;
      /** 字符串内容（不含引号，含转义序列） */
      let value = "";
      while (pos < input.length && input[pos] !== quote) {
        /** 当前字符，用于拼接或判断转义 */
        const current = input[pos];
        if (current === "\\") {
          /** 反斜杠后的下一个字符 */
          const next = input[pos + 1];
          if (next) {
            value += current + next;
            pos += 2;
            continue;
          }
        }
        value += current;
        pos += 1;
      }
      pos += 1;
      tokens.push({
        type: "String",
        value: quote + value + quote,
        start,
        end: pos,
      });
      continue;
    }

    if (isIdentifierStart(ch)) {
      const start = pos;
      while (pos < input.length && isIdentifierPart(input[pos])) {
        pos += 1;
      }
      /** 标识符或关键字的原始字符串，如 "true"、"foo" */
      const raw = input.slice(start, pos);
      if (raw === "true") {
        tokens.push({ type: "True", value: raw, start, end: pos });
      } else if (raw === "false") {
        tokens.push({ type: "False", value: raw, start, end: pos });
      } else if (raw === "null") {
        tokens.push({ type: "Null", value: raw, start, end: pos });
      } else if (raw === "undefined") {
        tokens.push({ type: "Undefined", value: raw, start, end: pos });
      } else {
        tokens.push({ type: "Identifier", value: raw, start, end: pos });
      }
      continue;
    }

    /** 当前起 2 个字符，用于匹配 ==、!=、>=、<=、=> 等 */
    const twoChars = input.slice(pos, pos + 2);
    /** 当前起 3 个字符，用于优先匹配 ===、!== */
    const threeChars = input.slice(pos, pos + 3);

    if (threeChars === "===") {
      tokens.push({ type: "EqEqEq", value: threeChars, start: pos, end: pos + 3 });
      pos += 3;
      continue;
    }

    if (threeChars === "!==") {
      tokens.push({ type: "NotEqEq", value: threeChars, start: pos, end: pos + 3 });
      pos += 3;
      continue;
    }

    if (twoChars === "==") {
      tokens.push({ type: "EqEq", value: twoChars, start: pos, end: pos + 2 });
      pos += 2;
      continue;
    }

    if (twoChars === "!=") {
      tokens.push({ type: "NotEq", value: twoChars, start: pos, end: pos + 2 });
      pos += 2;
      continue;
    }

    if (twoChars === ">=") {
      tokens.push({ type: "Gte", value: twoChars, start: pos, end: pos + 2 });
      pos += 2;
      continue;
    }

    if (twoChars === "<=") {
      tokens.push({ type: "Lte", value: twoChars, start: pos, end: pos + 2 });
      pos += 2;
      continue;
    }

    if (twoChars === "=>") {
      tokens.push({ type: "Arrow", value: twoChars, start: pos, end: pos + 2 });
      pos += 2;
      continue;
    }

    if (ch === "+") {
      tokens.push({ type: "Plus", value: ch, start: pos, end: pos + 1 });
      pos += 1;
      continue;
    }
    if (ch === "-") {
      tokens.push({ type: "Minus", value: ch, start: pos, end: pos + 1 });
      pos += 1;
      continue;
    }
    if (ch === "*") {
      tokens.push({ type: "Star", value: ch, start: pos, end: pos + 1 });
      pos += 1;
      continue;
    }
    if (ch === "/") {
      tokens.push({ type: "Slash", value: ch, start: pos, end: pos + 1 });
      pos += 1;
      continue;
    }
    if (ch === "(") {
      tokens.push({ type: "LeftParen", value: ch, start: pos, end: pos + 1 });
      pos += 1;
      continue;
    }
    if (ch === ")") {
      tokens.push({ type: "RightParen", value: ch, start: pos, end: pos + 1 });
      pos += 1;
      continue;
    }
    if (ch === "{") {
      tokens.push({ type: "LeftBrace", value: ch, start: pos, end: pos + 1 });
      pos += 1;
      continue;
    }
    if (ch === "}") {
      tokens.push({ type: "RightBrace", value: ch, start: pos, end: pos + 1 });
      pos += 1;
      continue;
    }
    if (ch === "[") {
      tokens.push({ type: "LeftBracket", value: ch, start: pos, end: pos + 1 });
      pos += 1;
      continue;
    }
    if (ch === "]") {
      tokens.push({ type: "RightBracket", value: ch, start: pos, end: pos + 1 });
      pos += 1;
      continue;
    }
    if (ch === ":") {
      tokens.push({ type: "Colon", value: ch, start: pos, end: pos + 1 });
      pos += 1;
      continue;
    }
    if (ch === ",") {
      tokens.push({ type: "Comma", value: ch, start: pos, end: pos + 1 });
      pos += 1;
      continue;
    }

    throw new Error(`Unexpected character in expression: '${ch}' at position ${pos}`);
  }

  return tokens;
};

// ========== 三、语法分析：递归下降解析表达式 ==========

/**
 * 语法分析入口：将 Token 列表解析为一棵表达式 AST
 * @param tokens - 词法分析得到的 Token 数组
 * @returns 表达式根节点（AST）
 */
const parseExpression = (tokens: Token[]): ExpressionNode => {
  /** 当前消费到的 token 下标 */
  let current = 0;

  /** 查看当前 token，不前进 */
  const peek = (): Token | undefined => {
    return tokens[current];
  };

  /**
   * 消费当前 token 并前进；可选校验类型
   * @param expected - 期望的 token 类型，不传则不校验
   * @returns 当前 token
   */
  const consume = (expected?: TokenType): Token => {
    const token = tokens[current];
    if (!token) {
      throw new Error("Unexpected end of input.");
    }
    if (expected && token.type !== expected) {
      throw new Error(`Expected ${expected}, got ${token.type}`);
    }
    current += 1;
    return token;
  };

  /** 解析“基础表达式”：字面量、标识符、括号、数组、对象、箭头函数 */
  const parsePrimary = (): ExpressionNode => {
    /** 当前 token，用于分支判断 */
    const token = peek();
    if (!token) {
      throw new Error("Unexpected end in Primary.");
    }

    if (token.type === "Number") {
      consume("Number");
      return { type: "NumberLiteral", value: Number(token.value) };
    }

    if (token.type === "String") {
      consume("String");
      const raw = token.value;
      const inner = raw.slice(1, -1);
      return { type: "StringLiteral", value: inner };
    }

    if (token.type === "True") {
      consume("True");
      return { type: "BooleanLiteral", value: true };
    }

    if (token.type === "False") {
      consume("False");
      return { type: "BooleanLiteral", value: false };
    }

    if (token.type === "Null") {
      consume("Null");
      return { type: "NullLiteral" };
    }

    if (token.type === "Undefined") {
      consume("Undefined");
      return { type: "UndefinedLiteral" };
    }

    if (token.type === "Identifier") {
      /** 消费掉的标识符 token，可能是单参箭头函数的参数名 */
      const identToken = consume("Identifier");
      if (peek()?.type === "Arrow") {
        consume("Arrow");
        /** 箭头函数体表达式 */
        const body = parseExpression();
        return {
          type: "ArrowFunctionExpression",
          params: [{ type: "Identifier", name: identToken.value }],
          body,
        };
      }
      return { type: "Identifier", name: identToken.value };
    }

    if (token.type === "LeftParen") {
      consume("LeftParen");
      /** 左括号后的第一个 token，用于区分 (expr) 与 (a,b)=> */
      const afterParen = peek();
      /** 箭头函数参数名列表（仅当识别为箭头函数时使用） */
      const params: IdentifierNode[] = [];
      /** 是否已按箭头函数解析并 return */
      let isArrowParams = false;

      if (afterParen && (afterParen.type === "Identifier" || afterParen.type === "RightParen")) {
        if (afterParen.type === "Identifier") {
          while (peek() && peek()!.type === "Identifier") {
            /** 当前消费的参数名 token */
            const paramToken = consume("Identifier");
            params.push({ type: "Identifier", name: paramToken.value });
            if (peek()?.type === "Comma") {
              consume("Comma");
              continue;
            }
            break;
          }
        }
        if (peek()?.type === "RightParen") {
          consume("RightParen");
          if (peek()?.type === "Arrow") {
            consume("Arrow");
            /** 多参箭头函数体 */
            const body = parseExpression();
            isArrowParams = true;
            return {
              type: "ArrowFunctionExpression",
              params,
              body,
            };
          }
        }
        if (!isArrowParams && params.length === 0 && afterParen.type === "RightParen") {
          return { type: "UndefinedLiteral" };
        }
      }

      if (!isArrowParams) {
        /** 括号内的表达式（普通括号，非箭头参数） */
        const expr = parseEquality();
        consume("RightParen");
        return expr;
      }
    }

    if (token.type === "LeftBracket") {
      consume("LeftBracket");
      /** 数组元素表达式列表 */
      const elements: ExpressionNode[] = [];
      while (peek() && peek()!.type !== "RightBracket") {
        /** 当前元素表达式 */
        const element = parseEquality();
        elements.push(element);
        if (peek()?.type === "Comma") {
          consume("Comma");
          continue;
        }
        break;
      }
      if (!peek() || peek()!.type !== "RightBracket") {
        throw new Error("Missing closing ] in array literal.");
      }
      consume("RightBracket");
      return { type: "ArrayLiteral", elements };
    }

    if (token.type === "LeftBrace") {
      consume("LeftBrace");
      /** 对象属性 key: value 列表 */
      const properties: ObjectProperty[] = [];

      while (peek() && peek()!.type !== "RightBrace") {
        /** 当前属性的 key 对应 token */
        const keyToken = peek();
        if (!keyToken) {
          throw new Error("Unexpected end in object literal.");
        }

        /** 属性名 AST 节点（标识符或字符串） */
        let keyNode: IdentifierNode | StringLiteral;
        if (keyToken.type === "Identifier") {
          const t = consume("Identifier");
          keyNode = { type: "Identifier", name: t.value };
        } else if (keyToken.type === "String") {
          const t = consume("String");
          keyNode = {
            type: "StringLiteral",
            value: t.value.slice(1, -1),
          };
        } else {
          throw new Error(`Unexpected token as object key: ${keyToken.type}`);
        }

        if (peek()?.type !== "Colon") {
          throw new Error("Expected ':' after object key.");
        }
        consume("Colon");

        /** 属性值表达式 */
        const valueExpr = parseEquality();
        properties.push({ key: keyNode, value: valueExpr });

        if (peek()?.type === "Comma") {
          consume("Comma");
          continue;
        }
        break;
      }

      if (!peek() || peek()!.type !== "RightBrace") {
        throw new Error("Missing closing } in object literal.");
      }
      consume("RightBrace");
      return { type: "ObjectLiteral", properties };
    }

    throw new Error(`Unexpected token in Primary: ${token.type}`);
  };

  /** 解析乘除表达式（* /），优先级高于加减 */
  const parseMultiplicative = (): ExpressionNode => {
    /** 当前已解析的左侧或整棵子树 */
    let node = parsePrimary();
    while (true) {
      const token = peek();
      if (!token || (token.type !== "Star" && token.type !== "Slash")) {
        break;
      }
      /** 乘号或除号 token */
      const op = consume();
      /** 右操作数 */
      const right = parsePrimary();
      node = {
        type: "BinaryExpression",
        operator: op.value as BinaryExpression["operator"],
        left: node,
        right,
      };
    }
    return node;
  };

  /** 解析加减表达式（+ -），优先级高于比较 */
  const parseAdditive = (): ExpressionNode => {
    let node = parseMultiplicative();
    while (true) {
      const token = peek();
      if (!token || (token.type !== "Plus" && token.type !== "Minus")) {
        break;
      }
      const op = consume();
      const right = parseMultiplicative();
      node = {
        type: "BinaryExpression",
        operator: op.value as BinaryExpression["operator"],
        left: node,
        right,
      };
    }
    return node;
  };

  /** 解析关系比较（> < >= <=），优先级高于相等比较 */
  const parseRelational = (): ExpressionNode => {
    let node = parseAdditive();
    while (true) {
      const token = peek();
      if (!token) {
        break;
      }
      if (
        token.type !== "Gt" &&
        token.type !== "Lt" &&
        token.type !== "Gte" &&
        token.type !== "Lte"
      ) {
        break;
      }
      /** 当前比较运算符 token */
      const opToken = consume();
      const right = parseAdditive();
      /** TokenType 到运算符字符串的映射 */
      const opMap: Record<TokenType, ComparisonOperator> = {
        Gt: ">",
        Lt: "<",
        Gte: ">=",
        Lte: "<=",
      } as unknown as Record<TokenType, ComparisonOperator>;
      /** 映射后的运算符字面量，如 ">=" */
      const mapped = opMap[opToken.type];
      node = {
        type: "ComparisonExpression",
        operator: mapped,
        left: node,
        right,
      };
    }
    return node;
  };

  /** 解析相等比较（== != === !==），优先级最低 */
  const parseEquality = (): ExpressionNode => {
    let node = parseRelational();
    while (true) {
      const token = peek();
      if (!token) {
        break;
      }
      if (
        token.type !== "EqEq" &&
        token.type !== "EqEqEq" &&
        token.type !== "NotEq" &&
        token.type !== "NotEqEq"
      ) {
        break;
      }
      const opToken = consume();
      const right = parseRelational();
      const opMap: Record<TokenType, ComparisonOperator> = {
        EqEq: "==",
        EqEqEq: "===",
        NotEq: "!=",
        NotEqEq: "!==",
      } as unknown as Record<TokenType, ComparisonOperator>;
      const mapped = opMap[opToken.type];
      node = {
        type: "ComparisonExpression",
        operator: mapped,
        left: node,
        right,
      };
    }
    return node;
  };

  
  /** 从相等层开始解析得到的整棵表达式 AST */
  const result = parseEquality();
  if (current < tokens.length) {
    /** 未被消费的 token，说明表达式后有多余内容 */
    const extra = tokens[current];
    throw new Error(
      `Unexpected token after end of expression: ${extra.type} (${extra.value})`
    );
  }
  return result;
};

// ========== 四、代码生成：把 AST 重新变成格式化后的表达式字符串 ==========

/**
 * 获取表达式的优先级数值，用于生成时判断是否需要加括号
 * 数值越小优先级越低，越容易被外层“包”括号
 * @param node - 表达式 AST 节点
 * @returns 优先级数字（乘除 20，加减 10，比较 8，相等 7，箭头函数 5，字面量等 100）
 */
const getPrecedence = (node: ExpressionNode): number => {
  if (node.type === "BinaryExpression") {
    if (node.operator === "*" || node.operator === "/") {
      return 20;
    }
    if (node.operator === "+" || node.operator === "-") {
      return 10;
    }
  }
  if (node.type === "ComparisonExpression") {
    if (node.operator === ">" || node.operator === "<" || node.operator === ">=" || node.operator === "<=") {
      return 8;
    }
    if (
      node.operator === "==" ||
      node.operator === "!=" ||
      node.operator === "===" ||
      node.operator === "!=="
    ) {
      return 7;
    }
  }
  if (node.type === "ArrowFunctionExpression") {
    return 5;
  }
  return 100;
};

/**
 * 将表达式 AST 递归生成格式化后的源码字符串
 * @param node - 当前表达式节点
 * @param parentPrecedence - 父级表达式优先级，用于决定是否给当前结果加括号
 * @returns 格式化后的表达式字符串（单行）
 */
const generateExpression = (node: ExpressionNode, parentPrecedence = 0): string => {
  if (node.type === "NumberLiteral") {
    return String(node.value);
  }
  if (node.type === "StringLiteral") {
    return JSON.stringify(node.value);
  }
  if (node.type === "BooleanLiteral") {
    return node.value ? "true" : "false";
  }
  if (node.type === "NullLiteral") {
    return "null";
  }
  if (node.type === "UndefinedLiteral") {
    return "undefined";
  }
  if (node.type === "Identifier") {
    return node.name;
  }
  if (node.type === "ArrayLiteral") {
    /** 数组元素用 ", " 连接后的字符串 */
    const inner = node.elements.map((el) => generateExpression(el)).join(", ");
    return `[${inner}]`;
  }
  if (node.type === "ObjectLiteral") {
    const inner = node.properties
      .map((prop) => {
        /** 属性名字符串（标识符直接名，字符串带引号） */
        const keyStr =
          prop.key.type === "Identifier"
            ? prop.key.name
            : JSON.stringify(prop.key.value);
        /** 属性值表达式字符串 */
        const valueStr = generateExpression(prop.value);
        return `${keyStr}: ${valueStr}`;
      })
      .join(", ");
    return `{ ${inner} }`;
  }
  if (node.type === "ArrowFunctionExpression") {
    /** 参数列表字符串，单参无括号、多参带括号 */
    const params = node.params.map((p) => p.name).join(", ");
    const paramsStr = node.params.length === 1 ? params : `(${params})`;
    /** 函数体表达式字符串 */
    const bodyStr = generateExpression(node.body, 0);
    return `${paramsStr} => ${bodyStr}`;
  }
  if (node.type === "BinaryExpression" || node.type === "ComparisonExpression") {
    /** 当前节点优先级 */
    const myPrec = getPrecedence(node);
    /** 左子表达式字符串 */
    let leftStr = generateExpression(
      (node as BinaryExpression | ComparisonExpression).left,
      myPrec
    );
    /** 右子表达式字符串 */
    let rightStr = generateExpression(
      (node as BinaryExpression | ComparisonExpression).right,
      myPrec + 0.1
    );
    /** 运算符字符串 */
    const opStr =
      node.type === "BinaryExpression"
        ? node.operator
        : (node as ComparisonExpression).operator;
    /** 拼接结果，若优先级低于父级则加括号 */
    let result = `${leftStr} ${opStr} ${rightStr}`;
    if (myPrec < parentPrecedence) {
      result = `(${result})`;
    }
    return result;
  }
  return "";
};

// ========== 五、TS 文件格式化与缩进修复 ==========

/** 匹配 const/let/var 声明行：捕获缩进、关键字、等号左侧、表达式、分号后内容 */
const assignmentRegex =
  /^(?<indent>\s*)(?<keyword>const|let|var)\s+(?<left>[^=]+?)=\s*(?<expr>.+);(?<tail>.*)$/;

/**
 * 格式化整份 TS 源码：仅处理赋值行中的表达式并统一缩进
 * @param source - 原始 TS 文件内容
 * @returns 格式化后的完整文件内容
 * '  const a = 1;'.match(/^(?<indent>\s*)(?<keyword>const|let|var)\s+(?<left>[^=]+?)=\s*(?<expr>.+);(?<tail>.*)$/)
 * 
 */
const formatTsSource = (source: string): string => {
  /** 按行拆分 */
  const lines = source.split(/\r?\n/);
  /** 格式化后的行列表 */
  const formattedLines: string[] = [];

  for (const line of lines) {
    const match = line.match(assignmentRegex);
    if (!match || !match.groups) {
      formattedLines.push(line);
      continue;
    }

    /** 行首空白（原缩进） */
    const indent = match.groups["indent"] ?? "";
    /** const / let / var */
    const keyword = match.groups["keyword"] ?? "";
    /** 等号左侧：变量名 + 可选类型注解 */
    const left = (match.groups["left"] ?? "").trimEnd();
    /** 等号与分号之间的表达式字符串 */
    const expr = (match.groups["expr"] ?? "").trim();
    /** 分号及之后的内容（如行尾注释） */
    const tail = match.groups["tail"] ?? "";

    try {
      // 先解析成 单个的 字符 如 1， 2, +, -, (, ), 123, 等等 
      const tokens = tokenize(expr);
      // 解析成 表达式json结构 
      /**
       * - +
       * - 左表达式（也就是1）
       * - 右表达式
       *  - *
       *   - 左表达式（也就是2）
       *   - 右表达式
       *    - -
       *     - 左表达式（也就是3）
       *     - 右表达式（也就是4） 
       */
      const ast = parseExpression(tokens);
      /** 格式化后的表达式字符串 */
      const formattedExpr = generateExpression(ast);
      /** 重新拼接的一行 */
      const newLine = `${indent}${keyword} ${left} = ${formattedExpr};${tail}`;
      formattedLines.push(newLine);
    } catch (e) {
      formattedLines.push(line);
    }
  }

  /** 合并为整段文本（尚未统一缩进） */
  const joined = formattedLines.join("\n");
  /** 按 { } [ ] 重新计算并应用 2 空格缩进 */
  const reindented = fixIndent(joined);
  return reindented;
};

/**
 * 按 { } [ ] 重新计算缩进并统一为 2 空格
 * @param source - 多行文本（可能已有混乱缩进）
 * @returns 每行前为 2 空格整数倍的文本
 */
const fixIndent = (source: string): string => {
  const lines = source.split(/\r?\n/);
  /** 输出行列表 */
  const result: string[] = [];
  /** 当前缩进层级（每层 2 空格） */
  let indentLevel = 0;
  /** 单层缩进字符串 */
  const indentUnit = "  ";

  for (const rawLine of lines) {
    /** 去掉行首尾空白后的内容 */
    const trimmed = rawLine.trim();
    if (trimmed === "") {
      result.push("");
      continue;
    }

    /** 行首是否为 } ] )，若是则先减少一层再输出 */
    const startsWithClosing =
      trimmed.startsWith("}") || trimmed.startsWith("]") || trimmed.startsWith(")");

    if (startsWithClosing && indentLevel > 0) {
      indentLevel -= 1;
    }

    /** 当前行应加的前缀空格 */
    const prefix = indentUnit.repeat(indentLevel);
    const lineWithoutIndent = rawLine.trimStart();
    const newLine = prefix + lineWithoutIndent;
    result.push(newLine);

    /** 本行中 { [ 的个数 */
    const openCount = (trimmed.match(/[{\[]/g) || []).length;
    /** 本行中 } ] 的个数 */
    const closeCount = (trimmed.match(/[}\]]/g) || []).length;
    indentLevel += openCount - closeCount;
    if (indentLevel < 0) {
      indentLevel = 0;
    }
  }

  return result.join("\n");
};

// ========== 六、将 Demo 输出写入 AST 说明 md ==========

/**
 * 生成要追加到 AST 说明 md 的 Markdown 文本（示例代码 + 关键代码片段说明）
 * @param originalSource - 原始文件完整内容
 * @param formattedSource - 格式化后文件完整内容
 * @param inputLabel - 可选，在 md 中显示的输入文件路径/名称
 * @param outputLabel - 可选，在 md 中显示的输出文件路径/名称
 * @returns 一段 Markdown 字符串，可直接拼接到 md 末尾
 */
const buildMarkdownAppend = (
  originalSource: string,
  formattedSource: string,
  inputLabel: string = "demo/sample.ts",
  outputLabel: string = "demo/sample.formatted.ts"
): string => {
  /** 原始代码前 20 行，用于展示 */
  const originalLines = originalSource.split(/\r?\n/).slice(0, 20).join("\n");
  /** 格式化后代码前 20 行，用于展示 */
  const formattedLines = formattedSource.split(/\r?\n/).slice(0, 20).join("\n");

  /** 词法分析函数在 md 中的简要代码片段 */
  const tokenizeSnippet = `
function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let pos = 0;
  // 省略：空白、数字、字符串、标识符、多字符运算符、括号等分支
  // 本质：从左到右扫描，根据字符类别推断 token 类型并推进指针
  return tokens;
}
`.trim();

  /** 表达式解析函数在 md 中的简要说明 */
  const parseSnippet = `
const parseExpression = (tokens: Token[]): ExpressionNode => {
  // 内部依次调用 parseEquality → parseRelational → parseAdditive → parseMultiplicative → parsePrimary
  // 每一层根据当前 token 决定是否继续构造对应的 AST 节点
  // 解析完成后如果还有剩余 token，则抛出错误
  return result;
};
`.trim();

  /** 表达式生成函数在 md 中的简要说明 */
  const generateSnippet = `
const generateExpression = (node: ExpressionNode, parentPrecedence = 0): string => {
  // 根据节点类型决定输出：
  // - 字面量、标识符：直接输出
  // - 数组、对象：递归输出内部元素/属性，并加上逗号、空格和括号
  // - 二元/比较表达式：根据优先级判断是否需要外围括号，保证不改变原有语义
  return result;
};
`.trim();

  /** 最终要追加的整段 Markdown */
  const md = `
## AST 实战 Demo：自制表达式解析器 + 简单 TS 格式化

### 示例 TS 代码（节选自 ${inputLabel}）

\`\`\`ts
${originalLines}
\`\`\`

### 格式化后的代码（节选自 ${outputLabel}）

\`\`\`ts
${formattedLines}
\`\`\`

### 关键解析与格式化代码片段（节选）

#### 1. 词法分析（tokenize）核心思路

\`\`\`ts
${tokenizeSnippet}
\`\`\`

#### 2. 表达式解析（parseExpression）核心结构

\`\`\`ts
${parseSnippet}
\`\`\`

#### 3. 表达式生成（generateExpression）核心逻辑

\`\`\`ts
${generateSnippet}
\`\`\`
`.trim();

  return "\n\n" + md + "\n";
};

// ========== 七、主执行入口：格式化 + 写文件 + 追加 md ==========

/** 主入口：从命令行参数读取待格式化文件路径，格式化后输出到同目录的 *.formatted.ts，并可选追加说明到 md */
const main = (): void => {
  /** 命令行传入的待格式化文件路径（第一个参数） */
  const inputArg = process.argv[2];
  if (!inputArg || inputArg.trim() === "") {
    console.error("用法: node mini-formatter.js <待格式化的 .ts 文件路径>");
    console.error("示例: node mini-formatter.js demo/sample.ts");
    process.exit(1);
  }

  /** 项目根目录（demo 的上一级），用于解析相对路径与 md 路径 */
  const rootDir = path.resolve(__dirname, "..");
  /** 待格式化的 TS 源文件绝对路径 */
  const samplePath = path.resolve(rootDir, inputArg.trim());
  /** 格式化结果输出路径：与源文件同目录，文件名为 xxx.formatted.ts */
  const ext = path.extname(samplePath);
  const formattedPath =
    path.join(path.dirname(samplePath), path.basename(samplePath, ext) + ".formatted" + ext);
  /** AST 原理说明 md 路径 */
  const mdPath = path.join(rootDir, "AST语法树原理说明.md");

  if (!fs.existsSync(samplePath)) {
    console.error(`文件不存在: ${samplePath}`);
    process.exit(1);
  }

  /** 原始 TS 文件内容 */
  const source = fs.readFileSync(samplePath, "utf-8");
  /** 格式化后的完整内容（含缩进修复） */
  const formatted = formatTsSource(source);
  fs.writeFileSync(formattedPath, formatted, "utf-8");

  if (fs.existsSync(mdPath)) {
    /** 当前 md 全文 */
    const oldMd = fs.readFileSync(mdPath, "utf-8");
    /** 在 md 中显示的输入/输出路径（相对项目根） */
    const inputLabel = path.relative(rootDir, samplePath);
    const outputLabel = path.relative(rootDir, formattedPath);
    /** 要追加的 Demo 说明段落 */
    const append = buildMarkdownAppend(source, formatted, inputLabel, outputLabel);
    fs.writeFileSync(mdPath, oldMd + append, "utf-8");
  } else {
    console.warn("AST语法树原理说明.md 不存在，跳过 md 追加。");
  }
};

if (require.main === module) {
  main();
}

