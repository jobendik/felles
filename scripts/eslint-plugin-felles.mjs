// FELLES custom ESLint rules (AD-1, AD-5, AD-6, AD-7, AD-9, AD-18, AD-26).
// Each rule is small and has a failing fixture and a compliant twin in eslint-fixtures/cases.mjs.

/** @param {import('estree').Node} node */
function stringValue(node) {
  if (node.type === "Literal" && typeof node.value === "string") return node.value;
  if (node.type === "TemplateElement") return node.value.cooked ?? node.value.raw;
  return null;
}

function isDeclarationString(node) {
  const parent = node.parent;
  return (
    parent !== undefined &&
    (parent.type === "ImportDeclaration" ||
      parent.type === "ExportAllDeclaration" ||
      parent.type === "ExportNamedDeclaration" ||
      parent.type === "ImportExpression" ||
      (parent.type === "ExpressionStatement" && parent.directive !== undefined))
  );
}

/**
 * A rule that reports every string (Literal or template quasi) matching a test.
 * @param {string} description
 * @param {(text: string, options: any) => string | null} check returns a message or null
 */
function stringRule(description, check) {
  return {
    meta: {
      type: "problem",
      docs: { description },
      schema: [{ type: "object" }],
      messages: { found: "{{message}}" },
    },
    create(context) {
      const options = context.options[0] ?? {};
      const visit = (node) => {
        if (isDeclarationString(node)) return;
        const text = stringValue(node);
        if (text === null) return;
        const message = check(text, options);
        if (message !== null) context.report({ node, messageId: "found", data: { message } });
      };
      return { Literal: visit, TemplateElement: visit };
    },
  };
}

const SQL_STATEMENT =
  /\b(select\b[\s\S]*\bfrom\b|insert\s+(or\s+\w+\s+)?into\b|update\s+\w+\s+set\b|delete\s+from\b|create\s+(table|trigger|index|view)\b|drop\s+(table|trigger|index)\b|pragma\s+\w+)/i;

const rules = {
  "no-sql-interpolation": {
    meta: {
      type: "problem",
      docs: { description: "prepare/exec accept string literals or constants only (NFR-04)" },
      schema: [],
      messages: {
        found:
          "Pass a string literal or a constant to {{name}}(), never a template with expressions or a concatenation.",
      },
    },
    create(context) {
      return {
        CallExpression(node) {
          const callee = node.callee;
          if (callee.type !== "MemberExpression" || callee.property.type !== "Identifier") return;
          const name = callee.property.name;
          if (name !== "prepare" && name !== "exec") return;
          const arg = node.arguments[0];
          if (arg === undefined) return;
          const dynamic =
            (arg.type === "TemplateLiteral" && arg.expressions.length > 0) ||
            (arg.type === "BinaryExpression" && arg.operator === "+") ||
            (arg.type === "CallExpression" &&
              arg.callee.type === "MemberExpression" &&
              arg.callee.property.type === "Identifier" &&
              (arg.callee.property.name === "concat" || arg.callee.property.name === "replace"));
          if (dynamic) context.report({ node: arg, messageId: "found", data: { name } });
        },
      };
    },
  },

  "no-clock-reads": {
    meta: {
      type: "problem",
      docs: {
        description:
          "Date.now(), new Date() and performance.now() only in the clock modules (AD-6)",
      },
      schema: [],
      messages: {
        now: "Read time through the injected Clock (AD-6), not Date.now().",
        newDate: "Read time through the injected Clock (AD-6), not new Date().",
        performance: "performance.now() is only allowed in the clock modules (AD-6).",
      },
    },
    create(context) {
      return {
        CallExpression(node) {
          const c = node.callee;
          if (
            c.type !== "MemberExpression" ||
            c.object.type !== "Identifier" ||
            c.property.type !== "Identifier"
          )
            return;
          if (c.object.name === "Date" && c.property.name === "now")
            context.report({ node, messageId: "now" });
          if (c.object.name === "performance" && c.property.name === "now")
            context.report({ node, messageId: "performance" });
        },
        NewExpression(node) {
          if (
            node.callee.type === "Identifier" &&
            node.callee.name === "Date" &&
            node.arguments.length === 0
          ) {
            context.report({ node, messageId: "newDate" });
          }
        },
      };
    },
  },

  "no-date-arithmetic": {
    meta: {
      type: "problem",
      docs: {
        description: "new Date(arg), setDate and getTimezoneOffset only in the time modules (AD-5)",
      },
      schema: [],
      messages: {
        newDate: "Do not build dates with new Date(arg); use the Oslo helpers (AD-5).",
        method: "{{name}}() is banned outside the time modules (AD-5).",
      },
    },
    create(context) {
      return {
        NewExpression(node) {
          if (
            node.callee.type === "Identifier" &&
            node.callee.name === "Date" &&
            node.arguments.length > 0
          ) {
            context.report({ node, messageId: "newDate" });
          }
        },
        CallExpression(node) {
          const c = node.callee;
          if (c.type === "MemberExpression" && c.property.type === "Identifier") {
            if (c.property.name === "setDate" || c.property.name === "getTimezoneOffset") {
              context.report({ node, messageId: "method", data: { name: c.property.name } });
            }
          }
        },
      };
    },
  },

  "no-async-unit-of-work": {
    meta: {
      type: "problem",
      docs: { description: "UnitOfWork.run callbacks are synchronous (AD-7)" },
      schema: [],
      messages: {
        found:
          "UnitOfWork.run accepts a synchronous callback only; do asynchronous work before the transaction (AD-7).",
      },
    },
    create(context) {
      const text = (n) => context.sourceCode.getText(n);
      return {
        CallExpression(node) {
          const c = node.callee;
          if (
            c.type !== "MemberExpression" ||
            c.property.type !== "Identifier" ||
            c.property.name !== "run"
          )
            return;
          if (!/uow|unitofwork/i.test(text(c.object))) return;
          const first = node.arguments[0];
          if (
            first !== undefined &&
            (first.type === "ArrowFunctionExpression" || first.type === "FunctionExpression") &&
            first.async
          ) {
            context.report({ node: first, messageId: "found" });
          }
        },
      };
    },
  },

  "no-test-modifiers": {
    meta: {
      type: "problem",
      docs: { description: ".skip, .only, .todo and their aliases are banned (AD-26)" },
      schema: [],
      messages: {
        found:
          "{{name}} is banned: skipped, focused and todo tests do not count as evidence (AD-26).",
      },
    },
    create(context) {
      const MODIFIERS = new Set(["skip", "only", "todo", "fixme", "failing"]);
      const ROOTS = new Set(["describe", "it", "test", "suite", "bench"]);
      const ALIASES = new Set(["xit", "xtest", "xdescribe", "fit", "fdescribe"]);
      function rootName(node) {
        let n = node;
        while (n.type === "MemberExpression") n = n.object;
        if (n.type === "CallExpression") return rootName(n.callee);
        return n.type === "Identifier" ? n.name : null;
      }
      return {
        MemberExpression(node) {
          if (node.property.type !== "Identifier" || !MODIFIERS.has(node.property.name)) return;
          const root = rootName(node.object);
          if (root !== null && ROOTS.has(root)) {
            context.report({
              node,
              messageId: "found",
              data: { name: `${root}.${node.property.name}` },
            });
          }
        },
        CallExpression(node) {
          if (node.callee.type === "Identifier" && ALIASES.has(node.callee.name)) {
            context.report({ node, messageId: "found", data: { name: node.callee.name } });
          }
        },
      };
    },
  },

  "no-sql-outside-repositories": stringRule(
    "SQL appears only in repositories, platform/db, migrations, seed and tests (AD-1)",
    (text) =>
      SQL_STATEMENT.test(text)
        ? "SQL belongs in *.repository.ts, *.sql.ts, platform/db, migrations or seed (AD-1)."
        : null,
  ),

  "no-or-replace": stringRule(
    "INSERT OR REPLACE and REPLACE INTO bypass the history triggers (AD-9)",
    (text) =>
      /\bor\s+replace\b|\breplace\s+into\b/i.test(text)
        ? "INSERT OR REPLACE / REPLACE INTO is banned (AD-9)."
        : null,
  ),

  "no-name-order-like": stringRule(
    "LIKE and ORDER BY on name, purpose or description feed no user-visible result (AD-16, AD-18)",
    (text) => {
      if (/\border\s+by\b[^;)]*\b(name|purpose|description)\b/i.test(text))
        return "ORDER BY name/purpose/description is banned; sort in application code with compareNb (AD-16).";
      if (/[\w")\]]\s+(not\s+)?like\s+[?:'"$@]/i.test(text))
        return "LIKE is banned; search in application code with normaliseSearch (AD-16).";
      return null;
    },
  ),

  "no-session-insert": stringRule("Tests authenticate through mintSession only (AD-20)", (text) =>
    /\binsert\s+(or\s+\w+\s+)?into\s+sessions\b/i.test(text)
      ? "Insert sessions through the mintSession test helper only (AD-20)."
      : null,
  ),

  "no-foreign-table": stringRule("Only the owning module names a table (AD-1)", (text, options) => {
    const tables = Array.isArray(options.tables) ? options.tables : [];
    for (const table of tables) {
      if (new RegExp(`\\b(from|join|into|update|table)\\s+${table}\\b`, "i").test(text)) {
        return `The table ${table} may be named only by its owning module (AD-1).`;
      }
    }
    return null;
  }),
};

export default { meta: { name: "felles" }, rules };
