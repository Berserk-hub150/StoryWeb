/* StoryWeb 0.1 | Apache-2.0 */
(() => {
  "use strict";
  const signature = name => [...name].sort().join("");
  function run(source, input = "") {
    const lines = source.replace(/\r\n?/g, "\n").split("\n").map(s => s.trim());
    const stack = [], output = [], chapters = new Map();
    let story, block;
    const fail = (i, msg) => { throw Error("Line " + (i + 1) + ": " + msg); };
    for (const [i, line] of lines.entries()) {
      if (!line || line.startsWith("#") || line.startsWith("|")) continue;
      const open = /^(this story starts|the chapter begins) ([a-z]+ly)$/.exec(line);
      if (open) {
        if (block) fail(i, "nested block");
        block = {name: open[2], body: [], chapter: open[1] === "the chapter begins"};
        if (block.chapter) {
          const key = signature(block.name);
          if (chapters.has(key)) fail(i, "ambiguous chapter");
          chapters.set(key, block);
        } else {
          if (story) fail(i, "duplicate story");
          story = block;
        }
      } else if (block && line === (block.chapter ? "the chapter ends " : "this story ends ") + block.name) {
        block = null;
      } else if (block) {
        if (!/^(read input|add|multiply|join|say|value [1-9][0-9]* lines (above|below)|recall [a-z]+)$/.test(line)) fail(i, "unknown instruction");
        block.body.push(i);
      } else fail(i, "expected block");
    }
    if (block || !story) throw Error("Expected one complete story and closed chapters");
    let steps = 0;
    function execute(block, depth) {
      for (const i of block.body) {
        if (++steps > 10000 || depth > 64) fail(i, "execution limit");
        const op = lines[i];
        const pop = () => { if (!stack.length) fail(i, "empty stack"); return stack.pop(); };
        if (op.startsWith("value ")) {
          const [,n,,dir] = op.split(" ");
          const target = lines[i + Number(n) * (dir === "above" ? -1 : 1)];
          if (!target?.startsWith("|")) fail(i, "expected literal line");
          let v;
          try { v = JSON.parse(target.slice(1)); } catch { fail(i, "invalid literal"); }
          if (typeof v !== "string" && !Number.isSafeInteger(v)) fail(i, "expected string or safe integer");
          stack.push(v);
        } else if (op === "read input") stack.push(String(input));
        else if (op === "say") output.push(String(pop()));
        else if (op.startsWith("recall ")) {
          const next = chapters.get(signature(op.slice(7)));
          if (!next || next.name === op.slice(7)) fail(i, "expected a distinct chapter anagram");
          execute(next, depth + 1);
        } else {
          const right = pop(), left = pop();
          if (op === "join") {
            if (String(left).length + String(right).length > 65536) fail(i, "string limit");
            stack.push(String(left) + String(right));
          } else {
            if (![left,right].every(Number.isSafeInteger)) fail(i, "expected integers");
            const result = op === "add" ? left + right : left * right;
            if (!Number.isSafeInteger(result)) fail(i, "integer overflow");
            stack.push(result);
          }
        }
      }
    }
    execute(story, 0);
    return output.join("\n");
  }
  if (typeof module !== "undefined") module.exports = {run};
  if (typeof window === "undefined") return;
  window.StoryWeb = Object.freeze({run});
  customElements.define("story-web", class extends HTMLElement {
    connectedCallback() {
      if (this.shadowRoot) return;
      const root = this.attachShadow({mode:"open"});
      root.innerHTML = '<label>Input <input></label> <button>Run story</button><pre aria-live="polite"></pre>';
      const render = () => {
        const out = root.querySelector("pre");
        try { out.textContent = run(this.querySelector('script[type="text/x-storyweb"]').textContent, root.querySelector("input").value); }
        catch (error) { out.textContent = error.message; }
      };
      root.querySelector("button").onclick = render;
      queueMicrotask(render);
    }
  });
})();
