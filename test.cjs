const {run} = require("./storyweb.js");
const assert = require("node:assert/strict");
const test = require("node:test");
const wrap = s => "this story starts softly\n" + s + "\nthis story ends softly";
const cases = [
 ["relative arithmetic", "value 1 lines below\n| 6\nvalue 1 lines above\nmultiply\nsay", "36"],
 ["input and join", 'value 1 lines below\n| "Hello "\nread input\njoin\nsay', "Hello Ada"],
 ["add", "value 1 lines below\n| 3\nvalue 1 lines above\nadd\nsay", "6"]
];
for (const [name,source,want] of cases) test(name,()=>assert.equal(run(wrap(source),"Ada"),want));
for(const body of ["say","value 3 lines below","recall unknown","bad token"]) test(body,()=>assert.throws(()=>run(wrap(body))));
test("chapter anagram",()=>assert.equal(run(wrap("read input\nrecall ylgent")+"\nthe chapter begins gently\nsay\nthe chapter ends gently","ok"),"ok"));
test("recursion bound",()=>assert.throws(()=>run(wrap("recall ylgent")+"\nthe chapter begins gently\nrecall ylgent\nthe chapter ends gently"),/execution limit/));
