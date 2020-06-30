import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import * as utils from '../src/utils';
import { parse } from './helpers';

function transform(str) {
	return parse(str).body[0];
}

function isNode(node, type, isLength) {
	assert.is(Array.isArray(node), !!isLength);
	if (isLength != null) assert.is(node.length, isLength);
	assert.is((isLength ? node[0] : node).type, type);
}

// ---

const flat = suite('flat');

flat('is a function', () => {
	assert.type(utils.flat, 'function');
});

flat('should flatten child array into output', () => {
	const output = [1, 2, 3];
	utils.flat([3, 2, 1], output);
	assert.equal(output, [1, 2, 3, 3, 2, 1]);
});

flat('should flatten nested child arrays into output', () => {
	const output = [1, 2, 3];
	utils.flat([3, [2, [1, [0]]]], output);
	assert.equal(output, [1, 2, 3, 3, 2, 1, 0]);
});

flat('should ignore nullish child items', () => {
	const output = [1, 2, 3];
	utils.flat([null, [null, [undefined, []]]], output);
	assert.equal(output, [1, 2, 3]);
});

flat.run();

// ---

const toIdentifier = suite('toIdentifier');

toIdentifier('is a function', () => {
	assert.type(utils.toIdentifier, 'function');
});

toIdentifier('Identifier', () => {
	const ident = { type: 'Identifier', name: 'foobar' };
	assert.equal(utils.toIdentifier(ident), 'foobar');
});

toIdentifier('ImportDeclaration :: named', () => {
	const node = transform(`import { foo } from 'baz'`);
	assert.equal(utils.toIdentifier(node), ['foo']);
});

toIdentifier('ImportDeclaration :: named.multi', () => {
	const node = transform(`import { foo, bar } from 'baz';`);
	assert.equal(utils.toIdentifier(node), ['foo', 'bar']);
});

toIdentifier('ImportDeclaration :: alias', () => {
	const node = transform(`import { foo as bar } from 'baz';`);
	assert.equal(utils.toIdentifier(node), ['bar']);
});

toIdentifier('ImportDeclaration :: alias.multi', () => {
	const node = transform(`import { foo as f, bar as b } from 'baz';`);
	assert.equal(utils.toIdentifier(node), ['f', 'b']);
});

toIdentifier('ImportDeclaration :: default', () => {
	const node = transform(`import foo from 'foo';`);
	assert.equal(utils.toIdentifier(node), ['foo']);
});

toIdentifier('ImportDeclaration :: namespace', () => {
	const node = transform(`import * as foo from 'foo';`);
	assert.equal(utils.toIdentifier(node), ['foo']);
});

toIdentifier('ImportDeclaration :: mixed', () => {
	const node = transform(`import foo, { bar, baz, bat as t } from 'foo';`);
	assert.equal(utils.toIdentifier(node), ['foo', 'bar', 'baz', 't']);
});


toIdentifier('ExportNamedDeclaration :: mixed', () => {
	const node = transform(`import foo, { bar, baz, bat as t } from 'foo';`);
	assert.equal(utils.toIdentifier(node), ['foo', 'bar', 'baz', 't']);
});

toIdentifier('ExportDefaultDeclaration :: function :: anonymous', () => {
	const node = transform(`export default function () {}`);
	assert.is(utils.toIdentifier(node), null);
});

toIdentifier('ExportDefaultDeclaration :: function :: named', () => {
	const node = transform(`export default function foobar() {}`);
	assert.is(utils.toIdentifier(node), 'foobar');
});

toIdentifier('ExportNamedDeclaration :: const', () => {
	const node = transform(`export const foo = 123;`);
	assert.equal(utils.toIdentifier(node), ['foo']);
});

toIdentifier('ExportNamedDeclaration :: let', () => {
	const node = transform(`export let foo = 123;`);
	assert.equal(utils.toIdentifier(node), ['foo']);
});

toIdentifier('ExportNamedDeclaration :: var', () => {
	const node = transform(`export var foo = 123;`);
	assert.equal(utils.toIdentifier(node), ['foo']);
});


toIdentifier('VariableDeclaration :: var', () => {
	const node = transform(`var foo = 123;`);
	assert.equal(utils.toIdentifier(node), ['foo']);
});

toIdentifier('VariableDeclaration :: let', () => {
	const node = transform(`let foo = 123;`);
	assert.equal(utils.toIdentifier(node), ['foo']);
});

toIdentifier('VariableDeclaration :: const', () => {
	const node = transform(`const foo = 123;`);
	assert.equal(utils.toIdentifier(node), ['foo']);
});

toIdentifier('VariableDeclaration :: destructured', () => {
	const node = transform(`var { foo, bar } = foobar;`);
	assert.equal(utils.toIdentifier(node), ['foo', 'bar']);
});

toIdentifier('VariableDeclaration :: multiple', () => {
	const node = transform(`var foo = 123, bar = 456;`);
	assert.equal(utils.toIdentifier(node), ['foo', 'bar']);
});

toIdentifier('VariableDeclaration :: function :: anonymous', () => {
	const node = transform(`var foo = function () {};`);
	assert.equal(utils.toIdentifier(node), ['foo']);
});

toIdentifier('VariableDeclaration :: function :: named', () => {
	const node = transform(`var foo = function bar () {};`);
	assert.equal(utils.toIdentifier(node), ['foo']);
});


toIdentifier('FunctionDeclaration', () => {
	const node = transform(`function foo () {}`);
	assert.equal(utils.toIdentifier(node), 'foo');
});

toIdentifier('VariableDeclarator', () => {
	/** @type import('estree').VariableDeclaration */
	// @ts-ignore
	const { declarations } = transform(`var foo = 123`);
	assert.equal(utils.toIdentifier(declarations[0]), 'foo');
});


toIdentifier('ObjectPattern :: simple', () => {
	const node = transform(`let { foo, bar } = foobar();`);
	assert.equal(utils.toIdentifier(node), ['foo', 'bar']);
});

toIdentifier('ObjectPattern :: nested', () => {
	const node = transform(`let { foo: { bar } } = foobar();`);
	assert.equal(utils.toIdentifier(node), ['bar']);
});


toIdentifier('Unknown', () => {
	const node = { type: 'foo', value: 'bar' };
	assert.is(utils.toIdentifier(node), undefined);
});

toIdentifier.run();

// ---

const toNode = suite('toNode');

toNode('is a function', () => {
	assert.type(utils.toNode, 'function');
});

toNode('Identifier', () => {
	const ident = { type: 'Identifier', name: 'foobar' };
	assert.equal(utils.toNode(ident), undefined);
});

toNode('ImportDeclaration :: ImportSpecifier', () => {
	const foo = transform(`import { foo } from 'baz'`);
	isNode(utils.toNode(foo), 'ImportSpecifier', 1);

	const bar = transform(`import { foo, bar } from 'baz';`);
	isNode(utils.toNode(bar), 'ImportSpecifier', 2);

	const baz = transform(`import { foo as bar } from 'baz';`);
	isNode(utils.toNode(baz), 'ImportSpecifier', 1);

	const bat = transform(`import { foo as f, bar as b } from 'baz';`);
	isNode(utils.toNode(bat), 'ImportSpecifier', 2);
});

toNode('ImportDeclaration :: ImportDefaultSpecifier', () => {
	const node = transform(`import foo from 'foo';`);
	isNode(utils.toNode(node), 'ImportDefaultSpecifier', 1);
});

toNode('ImportDeclaration :: ImportNamespaceSpecifier', () => {
	const node = transform(`import * as foo from 'foo';`);
	isNode(utils.toNode(node), 'ImportNamespaceSpecifier', 1);
});

toNode('ImportDeclaration :: mixed', () => {
	const node = transform(`import foo, { bar, baz, bat as t } from 'foo';`);
	const output = utils.toNode(node);
	assert.instance(output, Array);
	assert.is(output.length, 4);

	const types = output.map(x => x.type);
	assert.equal(types, ['ImportDefaultSpecifier', 'ImportSpecifier', 'ImportSpecifier', 'ImportSpecifier']);
});

toNode('ExportDefaultDeclaration :: FunctionDeclaration', () => {
	const foo = transform(`export default function () {}`);
	isNode(utils.toNode(foo), 'FunctionDeclaration');

	const bar = transform(`export default function bar() {}`);
	isNode(utils.toNode(bar), 'FunctionDeclaration');
});

toNode('ExportNamedDeclaration :: FunctionDeclaration', () => {
	const foo = transform(`export function foo() {}`);
	isNode(utils.toNode(foo), 'FunctionDeclaration');
});

// Returns array of VariableDeclarators
toNode('ExportNamedDeclaration :: VariableDeclaration', () => {
	const foo = transform(`export const foo = 123;`);
	isNode(utils.toNode(foo), 'VariableDeclarator', 1);

	const bar = transform(`export const foo = 1, bar = 2;`);
	isNode(utils.toNode(bar), 'VariableDeclarator', 2);

	const baz = transform(`export var foo = 123;`);
	isNode(utils.toNode(baz), 'VariableDeclarator', 1);

	const bat = transform(`export let foo = 123;`);
	isNode(utils.toNode(bat), 'VariableDeclarator', 1);

	const quz = transform(`export var foo = function () {};`);
	isNode(utils.toNode(quz), 'VariableDeclarator', 1);
});

toNode('ExportNamedDeclaration :: ExportSpecifer', () => {
	const foo = transform(`export { foo }`);
	assert.is(utils.toNode(foo), undefined);

	const bar = transform(`export { foo as bar }`);
	assert.is(utils.toNode(bar), undefined);
});

// Returns inner Declarators
toNode('VariableDeclaration :: single', () => {
	const foo = transform(`var foo = 123;`);
	isNode(utils.toNode(foo), 'VariableDeclarator', 1);

	const bar = transform(`let foo = 123;`);
	isNode(utils.toNode(bar), 'VariableDeclarator', 1);

	const baz = transform(`const foo = 123;`);
	isNode(utils.toNode(baz), 'VariableDeclarator', 1);
});

toNode('VariableDeclaration :: multiple', () => {
	const foo = transform(`var foo=123, bar=456;`);
	isNode(utils.toNode(foo), 'VariableDeclarator', 2);

	const bar = transform(`var foo, bar=1, baz=2;`);
	isNode(utils.toNode(bar), 'VariableDeclarator', 3);
});

toNode('VariableDeclaration :: FunctionExpression', () => {
	const foo = transform(`const foo = function foo() {};`);
	isNode(utils.toNode(foo), 'VariableDeclarator', 1);

	const bar = transform(`const foo = function bar() {};`);
	isNode(utils.toNode(bar), 'VariableDeclarator', 1);

	const baz = transform(`const foo = function () {};`);
	isNode(utils.toNode(baz), 'VariableDeclarator', 1);
});

toNode('VariableDeclaration :: CallExpression', () => {
	const foo = transform(`const foo = (function () {})();`);
	isNode(utils.toNode(foo), 'VariableDeclarator', 1);
});

toNode('VariableDeclaration :: ObjectExpression', () => {
	const foo = transform(`var { foo, bar } = foobar();`);
	isNode(utils.toNode(foo), 'VariableDeclarator', 1);

	const bar = transform(`let { foo: { bar } } = foobar();`);
	isNode(utils.toNode(bar), 'VariableDeclarator', 1);
});

toNode('FunctionDeclaration', () => {
	const foo = transform(`function foo() {}`);
	isNode(utils.toNode(foo), 'FunctionDeclaration');
});

toNode('ImportSpecifier', () => {
	const item = { type: 'ImportSpecifier' };
	assert.equal(utils.toNode(item), item);
});

toNode('ImportDefaultSpecifier', () => {
	const item = { type: 'ImportDefaultSpecifier' };
	assert.equal(utils.toNode(item), item);
});

toNode('ImportNamespaceSpecifier', () => {
	const item = { type: 'ImportNamespaceSpecifier' };
	assert.equal(utils.toNode(item), item);
});

toNode('FunctionDeclaration', () => {
	const item = { type: 'FunctionDeclaration' };
	assert.equal(utils.toNode(item), item);
});

toNode('VariableDeclarator', () => {
	const item = { type: 'VariableDeclarator' };
	assert.equal(utils.toNode(item), item);
});

toNode('Unknown', () => {
	const item = { type: 'foo', value: 'bar' };
	assert.is(utils.toNode(item), undefined);
});

toNode('empty', () => {
	assert.is(utils.toNode(0), 0);
	assert.is(utils.toNode(false), false);
	assert.is(utils.toNode(undefined), undefined);
	assert.is(utils.toNode(null), null);
});

toNode.run();
