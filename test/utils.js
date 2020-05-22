import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { transform } from './fixtures';
import * as utils from '../src/utils';

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

toIdentifier.run();
