# astray [![CI](https://github.com/lukeed/astray/workflows/CI/badge.svg)](https://github.com/lukeed/astray/actions) [![codecov](https://badgen.net/codecov/c/github/lukeed/astray)](https://codecov.io/gh/lukeed/astray)

> A tiny (1.01 kB) and [fast](#benchmarks) utility to walk an AST without being led astray.

## Install

```
$ npm install --save astray
```


## Usage

```js
import { parse } from 'meriyah';
import * as astray from 'astray';

const AST = parse(`
  const sum = (a, b) => a + b;

  function square(a, b) {
    return a * b;
  }

  function sqrt(num) {
    let value = Math.sqrt(num);
    console.log('square root is:', value);
    return value;
  }
`)

let ref, STATE = new Map;

// Walk AST and find `let value` reference
astray.walk(AST, {
  Identifier(node, state) {
    if (node.name === 'value') {
      ref = node;
    } else if (node.name === 'Math') {
      state.set('Math', true);
    }
  },
  FunctionDeclaration: {
    enter(node, state) {
      state.set('Math', false);
    },
    exit(node, state) {
      console.log(`"${node.id.name}" used Math?`, state.get('Math'));
    }
  }
}, STATE);

//=> "square" used Math? false
//=> "sqrt" used Math? true

// What does `let value` see?
const bindings = astray.lookup(ref);
for (let key in bindings) {
  console.log(`"${key}" ~> `, bindings[key]);
}

//=> "value" ~>  { type: 'VariableDeclarator', ... }
//=> "sqrt" ~>  { type: 'FunctionDeclaration', ... }
//=> "num" ~>  { type: 'Identifier', ... }
//=> "sum" ~>  { type: 'VariableDeclarator', ... }
//=> "square" ~>  { type: 'FunctionDeclaration', ... }
```


## API

### astray.walk<T, S, M>(node: T, visitor: Visitor\<S, M>, state?: S, parent?: any)
Type: `Function`<br>
Returns: `Path<T>` or `T` or `undefined`

Begin traversing an AST starting with `node` and using the `visitor` definition. You may optionally provide a `state` data object that each of the `visitor` methods can access and/or manipulate.

You may also define a `parent`, if known, for the starting `node`; however, this will likely be unknown most of the time.

If `node` is falsey, then `astray.walk` returns nothing.<br>
If `node` is not an object, then the `node` itself is returned.<br>
Otherwise, any other object/array value will be traversed and returned with an added [`Path`](#path-context) context.

#### node
Type: `any`

The walker's starting `node`. Its children will be traversed recursively against the `visitor` definition.

#### visitor
Type: `Visitor`

The defined behavior for traversal. See [Visitors](#visitors) for more.

#### state
Type: `any`<br>
Required: `false`

Any state data to be shared or manipulated during traversal.
When defined, all [Visitors](#visitors) will have access to this value.

#### parent
Type: `any`<br>
Required: `false`

The `node`'s parent, if known.

> **Note:** You will likely never need to define this!<br>In fact, `astray.walk` is recursive and sets/tracks this value as part of each node's [Path Context](#path-context).


### astray.lookup<M, T>(node: T, target?: string)
Type: `Function`<br>
Returns: `Record<string, any>`

Find all [bindings](#scopes) that are accessible to this `node` by scaling its ancestry.

While doing so, each _parent_ context container (eg, `BlockStatement`, `FunctionDeclaration`, or `Program`) is assigned its own cache of available bindings. See [Path Context](#path-context) for more.

A dictionary of scopes are returned for the `node`. This will be an object whose keys are the identifier names and whose values are references to the nodes that the identifier points to.

> **Note:** The return object will always include the `node` itself.

#### node
Type: `any`

The starting point &mdash; the node that's interested in learning what's available to it.

#### target
Type: `string`<br>
Required: `false`

An optional target value that, if found, will immediately exit the ancestral lookup.<br>This should be the name of an identifier that your `node` is interested in, or the name of a parent container that you don't wish to exit.


### astray.SKIP
Type: `Boolean`

Any [Visitor](#visitors) may return this value to skip traversal of the current node's children.

> **Important:** Trying to `SKIP` from an `exit()` block will have no effect.


### astray.REMOVE
Type: `Boolean`

Any [Visitor](#visitors) may return this value to remove this node from the tree.

> **Important:** When the visitor's `exit()` block returns `REMOVE`, the node's children have already been walked.<br>Otherwise, returning `REMOVE` from `enter()` or the named/base block will skip children traversal.


## Visitors

A "visitor" is a definition of behaviors/actions that should be invoked when a matching node's `type` is found.

The visitor keys can be of _any_ (string) value – it's whatever types you expect to see!<br>By default, `astray` assumes you're dealing with the [ESTree format](https://github.com/estree/estree) (which is why the examples and TypeScript definitions reference ESTree types) but you are certainly not limited to this specification.

For example, if you want to target any `VariableDeclaration` nodes, you may do so like this:

```js
const STATE = {};

// via method
astray.walk(tree, {
  VariableDeclaration(node, state) {
    // I entered `VariableDeclaration` node
    assert.is(state === STATE, true);
  }
});

// via enter/exit hooks
astray.walk(tree, {
  VariableDeclaration: {
    enter(node, state) {
      // I entered `VariableDeclaration` node
      assert.is(state === STATE, true);
    },
    exit(node, state) {
      // I exited `VariableDeclaration` node
      assert.is(state === STATE, true);
    }
  }
});
```

As you can see, the object-variant's `enter()` block is synonymous with the method-variant. (For simplicity, both formats will be referred to as the "enter" block.) However, an `exit` may only exist within the object-variant, forcing an existing method-variant to be converted into an `enter` key. When using the object-variant, the `enter` and `exit` keys are both optional – but at least one should exist, of course.

Regardless of the visitor's format, every method has access to the _current_ `node` value as its first parameter. This is direct access to the tree's child, so any modification will mutate the value directly. Additionally, if you provided [`astray.walk()`](##astraywalkt-snode-t-visitor-visitors-state-s-parent-any) with a [`state`](#state) value, that `state` is also passed to each visitor. This, too, allows you to directly mutate/modify your state object.

Anything that happens within the "enter" block happens _before_ the node's children are traversed. In other words, you _may_ alter the fate of this node's children. For example, returning the [`SKIP`](#astrayskip) or [`REMOVE`](#astrayremove) signals prevent your walker from ever seeing the children.

Anything that happens within the "exit" block happens _after_ the node's children have been traversed. For example, because `state` is shared, you can use this opportunity to collect any `state` values/flags that the children may have provided. Again, since child traversal has already happened, returning the [`SKIP`](#astrayskip) signal has no effect. Additionally, returning the [`REMOVE`](#astrayremove) signal still remove the `node` and its children, but still allows you to know what _was_ there.

## Path Context

Any objects seen during traversal (`astray.walk`), even those that had no matching Visitors, receive a new `path` key. This is known as the "path context" – and will _always_ have a `parent` key.

In cases where a `node` does not have a parent (eg, a `Program`), then `node.path.parent` will exist with `undefined` value.

When scaling a `node`'s ancestry (`astray.lookup`), additional keys are added to its **parents'** contexts:

* **scoped** &mdash; a dictionary of [bindings](#scopes) _owned by_ this node's context;
* **bindings** &mdash; a dictionary of [_all bindings_](#scopes) _accessible by_ this node, including its own;
* **scanned** &mdash; a `boolean` indicating that the `bindings` dictionary is complete; aka, has seen all parents

> **Important:** Only **parent** contexts contain scope information. <br>These include `BlockStatement`, `FunctionDeclaration`, and `Program` node types.

## Scopes

When using [`astray.lookup()`](#astraylookupnode-t-target-string), path contexts _may_ obtain scope/binding information. <br>These are records of what each parent container _provides_ (`node.path.scoped`) as well as what is _accessible_ (`node.path.bindings`) to this scope level. Additionally, if a node/parent's _entire_ ancestry has been recorded, then `node.path.scanned` will be true.

The records of bindings (including `astray.lookup`'s return value) are objects keyed by the identifier names. The keys' values are references to the node that included/defined that identifier. For example, this means that `VariableDeclarator`s will be returned instead of the `VariableDeclaration` that contained them. You may still access the `VariableDeclaration` via the `VariableDeclarator`s path context (`node.path.parent`).

Here's a simple example:

```js
import { parse } from 'meriyah';
import * as astray from 'astray';

const source = `
  const API = 'https://...';

  function send(url, isGET) {
    console.log('method:', isGET ? 'GET' : 'POST');
    console.log('URL:', API + url);
  }

  function Hello(props) {
    var foobar = props.url || '/hello';
    send(foobar, true)
  }
`;

let foobar;
const AST = parse(source);

// walk & find `var foobar`
astray.walk(AST, {
  Identifier(node) {
    if (node.name === 'foobar') {
      foobar = node; // save reference
    }
  }
});

// get everything `foobar` can see
const bindings = astray.lookup(foobar);

for (let key in bindings) {
  console.log(key, bindings[key].type);
}

//=> foobar VariableDeclarator
//=> Hello FunctionDeclaration
//=> props Identifier
//=> API VariableDeclarator
//=> send FunctionDeclaration
```


## Benchmarks

> Running on Node.js v10.13.1

***Load Time***

How long does it take to `require` the dependency?

```
@babel/traverse:  174.038ms
estree-walker:      0.711ms
acorn-walk:         1.329ms
ast-types:         31.591ms
astray:             0.544ms
```

***Walking***

All candidates traverse the pre-parsed AST (ESTree format, unless noted otherwise) of `d3.min.js`. <br>Each candidate must count the `Identifier` nodes seen as a validation step.

```
Validation:
  ✔ @babel/traverse ≠   (41,669 identifiers)
  ✔ estree-walker       (41,669 identifiers)
  ✘ acorn-walk †        (23,340 identifiers)
  ✔ ast-types           (41,669 identifiers)
  ✔ astray              (41,669 identifiers)

Benchmark:
  @babel/traverse ≠  x  12.25 ops/sec ± 5.46% (35 runs sampled)
  estree-walker      x 120.87 ops/sec ± 0.86% (79 runs sampled)
  acorn-walk †       x  81.49 ops/sec ± 0.76% (70 runs sampled)
  ast-types          x   4.77 ops/sec ±12.35% (16 runs sampled)
  astray             x 144.27 ops/sec ± 0.89% (81 runs sampled)
```

> **Notice:**<br><br>
> Run `$ cat bench/fixtures/estree.json | grep "Identifier" | wc -l` to verify the `41,669` figure.<br><br>
> <sup>`≠`</sup> Babel does not follow the ESTree format. Instead `@babel/traverse` requires that `@babel/parser` be used in order for validation to pass.<br><br>
> <sup>`†`</sup> Acorn _does_ follow the ESTree format, but `acorn-walk` still fails to count all identifiers. All exported methods (simple, full, recursive) returned the same value. Results are taken using an `acorn` AST, although it fails using while traversing the ESTree fixture (`estree.json`).

## License

MIT © [Luke Edwards](https://lukeed.com)
