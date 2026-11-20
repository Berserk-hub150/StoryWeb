// Generate equivalent prediction tasks and grade exact string answers.
const {createHash, randomBytes} = require("node:crypto");
const fs = require("node:fs");
const {run} = require("./storyweb.js");

function task(seed, id) {
  const bytes = createHash("sha256").update(JSON.stringify([seed,id])).digest();
  const a = bytes[0], b = bytes[1], threshold = bytes[2] % 2 ? a : b;
  const gap = bytes[3] % 5;
  const padding = Array(gap).fill("# a quiet pause");
  const chapter = ["gently","slowly","kindly"][bytes[4] % 3];
  const alias = [...chapter].reverse().join("");
  const multiply = bytes[5] % 2 === 0;
  const source = ["this story starts softly","value 1 lines below","| "+a,"save n","load n",
    "value "+(gap+1)+" lines below",...padding,"| "+threshold,"equals","recall if "+alias,
    "load n","say","this story ends softly","the chapter begins "+chapter,"load n",
    "value 1 lines below","| "+b,multiply?"multiply":"add","save n","the chapter ends "+chapter].join("\n");
  const javascript = 'let n = '+a+'; if (n === '+threshold+') n '+(multiply?'*=':'+=')+' '+b+'; console.log(String(n));';
  const answer = String(a === threshold ? (multiply ? a*b : a+b) : a);
  if (run(source) !== answer) throw Error("Reference implementations disagree");
  return {id, source, javascript, answer};
}

const [mode, seed, arg] = process.argv.slice(2);
if (mode === "seed") console.log(randomBytes(16).toString("hex"));
else if (!seed || !["storyweb","javascript","score"].includes(mode)) {
  console.error("node bench.cjs seed | (storyweb|javascript) SEED | score SEED answers.json");
  process.exitCode = 1;
} else {
  const tasks = Array.from({length:40}, (_,i)=>task(seed,i));
  if (mode === "score") {
    const answers = JSON.parse(fs.readFileSync(arg,"utf8"));
    if (!Array.isArray(answers) || answers.length !== tasks.length ||
        !answers.every(a=>typeof a === "string")) throw Error("Expected 40 ordered strings");
    const correct = tasks.filter(t=>answers[t.id] === t.answer).length;
    console.log(JSON.stringify({correct,total:tasks.length,accuracy:correct/tasks.length}));
  } else console.log(JSON.stringify(tasks.map(t=>({id:t.id,program:mode === "storyweb"?t.source:t.javascript})),null,2));
}
