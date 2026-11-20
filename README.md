# StoryWeb 0.2
Experimental independent browser dialect inspired by https://github.com/dom96/KillSwitch. Original implementation. The upstream Rust interpreter already runs KillSwitch. StoryWeb specifies a smaller deterministic language with its own syntax. Existing .ks programs require translation.

Open index.html locally. Edit the story, type a name, and click Run story. Run the conformance suite with node --test test.cjs.

## Embed
Copy storyweb.js to your site. Include the script once with defer. Put a story in the page:
```html
<script defer src="storyweb.js"></script>
<story-web><script type="text/x-storyweb">
this story starts softly
read input
say
this story ends softly
</script></story-web>
```
The host reads the first matching child script on each click. The run(source, input) function is also available as StoryWeb.run in the browser and via require in Node. Pass plain text to run for externally supplied sources. Inline script elements follow normal HTML parsing rules.

## Draft specification
Source is case-sensitive. Normalize CRLF and CR to LF, split physical lines, and trim each line. Blank lines, comments beginning with # and data lines beginning with | occupy a physical line but do not execute. Each other line contains exactly one declaration or instruction with single ASCII spaces. Unknown instructions are parse errors, including inside unused chapters.

Exactly one story starts with "this story starts NAME" and closes with "this story ends NAME". Zero or more chapters use "the chapter begins NAME" and "the chapter ends NAME". Blocks cannot nest. Names match [a-z]+ly. A chapter is keyed by its sorted letters, and two chapters cannot share a key. After parsing, execute the story top to bottom, starting with an empty stack and output.

| Instruction | Effect |
| --- | --- |
| value N lines above / below | Push the JSON value after the target line's vertical bar. N is a positive decimal without leading zeros. Values are strings or numbers parsed as JavaScript binary64 and satisfying Number.isSafeInteger. |
| read input | Push the host input string, empty by default. |
| recall WORD | Execute the uniquely matching chapter on the shared stack and resume after the call. WORD must be a distinct lowercase anagram of its name. Forward references work. |
| add / multiply | Pop right then left, both safe integers. Push their sum or product. Reject overflow. |
| join | Pop right then left, convert each to text and concatenate left first. Maximum result is 65,536 UTF-16 units. |
| say | Pop a value and append its text to output. |

Return output records joined by LF with no extra terminator. Runtime errors abort without returning partial output. Reject stack underflow, invalid targets, unknown calls and execution beyond 10,000 instructions or 64 nested calls. The demo displays output as text.

## Adoption and evaluation
Draft for experimentation. The custom element and local interpreter provide integration today. The text/x-storyweb marker is a private convention. Native browser support would require separate implementer interest and interoperability work.

Before freezing 1.0, invite a second independent implementation, exchange test vectors for valid programs and errors, test the embed across Chromium, Firefox and WebKit, and record feedback from sites that use it. Version incompatible grammar changes separately. For the LLM experiment, hold out unfamiliar stories, vary offsets and chapter names, and measure exact output on prediction tasks and passing tests on editing tasks. Compare with human and ordinary stack-language baselines under equal tool access. No model-resistance result has been measured.

## Interactive applications (0.2)
Open counter.html for an example with no application JavaScript. Load the runtime using defer. A story-app contains an output element, a StoryWeb script and buttons with data-story-action attributes. Mount runs the story with empty input. Each click reruns it with the action string. State belongs to the element and lasts for its lifetime. Each event starts with a fresh stack. Successful events commit memory, while a runtime error discards that event's writes. Node and browser callers can use createSession().run(source, input) repeatedly.

Names in save NAME and load NAME use lowercase ASCII letters. Save pops a value into memory. Load pushes the stored value or integer zero for a missing name. Equals (spelled equals) pops two values and pushes 1 for strict equality, otherwise 0. The instruction recall if WORD pops a 0 or 1; 1 invokes the named chapter with the ordinary anagram rules, 0 skips the call. Other flag values are errors.

## Pilot prediction experiment
Generate a fresh private seed with node bench.cjs seed. Run node bench.cjs storyweb SEED and node bench.cjs javascript SEED for 40 paired programs. Each pair has identical observable output. These are variations of one small arithmetic and branching task. Give each language arm to a fresh model session with its language documentation, identical time and token budgets, and the instruction “Predict each output. Return an ordered JSON array of 40 strings.” Keep the seed and other arm private until both submissions are locked. Save the response to answers.json and run node bench.cjs score SEED answers.json. Report model/version, prompt, seed after scoring, budget, accuracy and paired errors. Repeat with human readers and separately with interpreter access. An agent allowed to execute code can directly obtain the outputs. Prediction accuracy alone does not measure ability to write or maintain applications.
