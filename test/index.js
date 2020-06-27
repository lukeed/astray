import klona from 'klona';
import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { parse } from './helpers';
import * as astray from '../src';

const ENUM = suite('ENUM');

ENUM('SKIP', () => {
	assert.is(astray.SKIP, true);
});

ENUM('REMOVE', () => {
	assert.is(astray.REMOVE, false);
});

ENUM.run();

// ---

const walk = suite('walk');

walk('should be a function', () => {
	assert.type(astray.walk, 'function');
});

walk('should return non-objects immediately', () => {
	assert.is(astray.walk(123), 123);
});

walk('should be able to visit base node', () => {
	let seen = false;
	const program = parse(`var hello = 'world';`);
	const output = astray.walk(program, {
		Program(node) {
			assert.ok(node === program);
			seen = true;
		}
	});
	assert.is(output.type, 'Program', 'returns the base node');
	assert.ok(output === program, 'returns original binding');
	assert.ok(output.path, 'attaches "path" attribute');
	assert.ok(seen, '~> visited itself');
});

walk('should traverse child nodes recursively', () => {
	const seen = [];
	const program = parse(`
		const INFORMAL = true;
		export function testing(props) {
			let name = props.name || props.fullname;
			return INFORMAL ? whaddup(name) : greet(name);
		}
	`);

	astray.walk(program, {
		Identifier(node) {
			seen.push(node.name);
		}
	});

	assert.equal(seen, [
		'INFORMAL',
		'testing', 'props',
		'name', 'props', 'name', 'props', 'fullname',
		'INFORMAL', 'whaddup', 'name', 'greet', 'name'
	]);
});

walk('should support visitors with enter/exit methods', () => {
	const state = { count: 0 };
	const program = parse(`
		function hello(props) {
			return props.name || 'world';
		}
	`);

	astray.walk(program, {
		Program: {
			enter(n, s) {
				assert.is(s, state);
				assert.is(s.count, 0);
			},
			exit(n, s) {
				assert.is(s, state);
				assert.is(s.count, 4);
			}
		},
		Identifier(n, s) {
			assert.is(s, state);
			s.count++;
		}
	}, state);

	assert.is(state.count, 4);
});

walk('should update Node item after visitor mutations', () => {
	const program = parse(`export var foo = '123';`);
	const copy = klona(program);

	astray.walk(program, {
		VariableDeclarator(node) {
			node.init.value = 'bar';
		}
	});

	assert.equal(program, program);
	assert.not.equal(program, copy);
});

walk.run();

// ---

const states = suite('state');

states('maintain `state` across visitor levels', () => {
	const program = parse(`
		export function hello(props) {
			var name = props.name || 'world';
			return 'Howdy, ' + name;
		}
	`);

	const seen = [];
	astray.walk(program, {
		FunctionDeclaration(node, state) {
			state.parent = 'hello';
			seen.push('function');
		},
		VariableDeclaration(node, state) {
			assert.is(state.parent, 'hello');
			state.variable = 'name';
			seen.push('variable');
		},
		ReturnStatement(node, state) {
			assert.is(state.parent, 'hello');
			assert.is(state.variable, 'name');
			seen.push('return');
		}
	}, {});

	assert.equal(seen, ['function', 'variable', 'return']);
});

states('accept initial `state` value', () => {
	const state = { count: 0 };
	const program = parse(`
		export function hello(props) {
			var name = props.name || 'world';
			return 'Howdy, ' + name;
		}
	`);

	astray.walk(program, {
		Identifier(n, s) {
			assert.is(s, state);
			s.count++;
		}
	}, state);

	assert.is(state.count, 6);
});

states.run();

// ---

const path = suite('Node.Path');

path('should be attached to all Nodes', () => {
	const program = parse(`
		export function hello(props) {
			var name = props.name || 'world';
			return 'Howdy, ' + name;
		}
	`);

	let count = 0;
	astray.walk(program, {
		Identifier(node) {
			count++; // just to make sure
			assert.type(node.path, 'object');
			assert.type(node.path.parent, 'object');
		}
	});

	assert.is(count, 6);
});

path.run();

// ---

const remove = suite('remove');

remove('should remove Node on remove() :: block', () => {
	const program = parse(`
		let name = 'lukeed';
		if (HUMANIZE) name = 'Luke';
	`);

	const count = program.body.length;
	assert.is(count, 2, 'initial nodes');

	let idents = 0;
	astray.walk(program, {
		IfStatement() {
			return false; // REMOVE
		},
		Identifier() {
			idents++;
		}
	});

	assert.is(program.body.length, 1, 'decrement child count');
	assert.is(idents, 1, 'never saw `IfStatement` contents');

	let exists = false;
	astray.walk(program, {
		IfStatement() {
			exists = true;
		},
	});

	assert.is(exists, false);
});

remove('should remove Node on remove() :: enter', () => {
	const program = parse(`
		let name = 'lukeed';
		if (HUMANIZE) name = 'Luke';
	`);

	const count = program.body.length;
	assert.is(count, 2, 'initial nodes');

	let idents = 0;
	astray.walk(program, {
		IfStatement: {
			enter: () => false // REMOVE
		},
		Identifier() {
			idents++;
		}
	});

	assert.is(program.body.length, 1, 'decremented child count');
	assert.is(idents, 1, 'never saw `IfStatement` contents');

	let exists = false;
	astray.walk(program, {
		IfStatement() {
			exists = true;
		}
	});

	assert.is(exists, false);
});

remove('should remove Node on remove() :: exit', () => {
	const program = parse(`
		let name = 'lukeed';
		if (HUMANIZE) name = 'Luke';
	`);

	const count = program.body.length;
	assert.is(count, 2, 'initial nodes');

	let idents = 0;
	astray.walk(program, {
		IfStatement: {
			exit: () => false // REMOVE
		},
		Identifier() {
			idents++;
		}
	});

	assert.is(program.body.length, 1, 'decremented child count');
	assert.is(idents, 3, 'traversed `IfStatement` contents');

	let exists = false;
	astray.walk(program, {
		IfStatement() {
			exists = true;
		},
	});

	assert.is(exists, false);
});

remove.run();

// ---

const skip = suite('skip');

skip('should skip Node children if parent visitor returns `true`', () => {
	const program = parse(`
		export function hello(props) {
			if (props.disabled) {
				var name = props.name || 'world';
				var verb = props.informal ? 'Yo' : 'Hello';
				return verb + ' , ' + name;
			}
		}
	`);

	let count = 0;
	astray.walk(program, {
		IfStatement() {
			return true; // SKIP
		},
		Identifier(node) {
			count++;
		}
	});

	// would be 12 without skip
	assert.is(count, 2);
});

skip('should skip Node children :: block', () => {
	const program = parse(`
		let foo = 'lukeed';
		if (bar) baz = 'Luke';
	`);

	let count = 0;
	let idents = [];

	astray.walk(program, {
		Identifier(node) {
			count++;
			idents.push(node.name);
		},
		IfStatement(node) {
			// node.path.skip();
			return true; // SKIP
		},
	});

	assert.is(count, 1);
	assert.equal(idents, ['foo']);
});

skip('should skip Node children :: enter', () => {
	const program = parse(`
		let foo = 'lukeed';
		if (bar) baz = 'Luke';
	`);

	let count = 0;
	let idents = [];

	astray.walk(program, {
		Identifier(node) {
			count++;
			idents.push(node.name);
		},
		IfStatement: {
			enter(node) {
				// node.path.skip();
				return true; // SKIP
			},
		}
	});

	assert.is(count, 1);
	assert.equal(idents, ['foo']);
});

skip('should skip Node children :: exit', () => {
	const program = parse(`
		let foo = 'lukeed';
		if (bar) baz = 'Luke';
	`);

	let count = 0;
	let idents = [];

	astray.walk(program, {
		Identifier(node) {
			count++;
			idents.push(node.name);
		},
		IfStatement: {
			exit(node) {
				// node.path.skip();
				return true; // SKIP
			},
		}
	});

	// skip() on exit is too late
	assert.is(count, 3);
	assert.equal(idents, ['foo', 'bar', 'baz']);
});

skip.run();

// ---

const replace = suite('replace');

replace('should replace Node w/ new content :: block', () => {
	const program = parse(`
		export const foo = 'bar';
	`);

	const next = parse(`
		var hello = 'world';
	`);

	astray.walk(program, {
		VariableDeclaration(node) {
			// node.path.replace(next.body[0])
			return next.body[0]; // REPLACE
		}
	});

	let updated = false;
	astray.walk(program, {
		Identifier(node) {
			if (node.name === 'hello') {
				updated = true;
			}
		}
	});

	assert.ok(updated);
});

replace('should replace Node w/ new content :: enter', () => {
	const program = parse(`
		export const foo = 'bar';
	`);

	const next = parse(`
		var hello = 'world';
	`);

	astray.walk(program, {
		VariableDeclaration: {
			enter(node) {
				// node.path.replace(next.body[0]);
				return next.body[0]; // REPLACE
			}
		}
	});

	let updated = false;
	astray.walk(program, {
		Identifier(node) {
			if (node.name === 'hello') {
				updated = true;
			}
		}
	});

	assert.ok(updated);
});

replace('should replace Node w/ new content :: exit', () => {
	const program = parse(`
		export const foo = 'bar';
	`);

	const next = parse(`
		var hello = 'world';
	`);

	astray.walk(program, {
		VariableDeclaration: {
			exit(node) {
				// node.path.replace(next.body[0]);
				return next.body[0]; // REPLACE
			}
		}
	});

	let updated = false;
	astray.walk(program, {
		Identifier(node) {
			if (node.name === 'hello') {
				updated = true;
			}
		}
	});

	assert.ok(updated);
});

replace.skip('should remove Node w/ falsey content', () => {
	const program = parse(`
		var a=1, b=2, c=3, d=4;
	`);

	let count = 0
	astray.walk(program, {
		Identifier(node) {
			count++;
			switch (node.name) {
				case 'a': node.path.replace(null);
				case 'b': node.path.replace(undefined);
				case 'c': node.path.replace(false);
				case 'd': node.path.replace(0);
			}
		},
	});

	assert.is(count, 4);

	let check = 0;
	astray.walk(program, {
		Identifier() {
			check++;
		},
	});

	assert.is(check, 0);
});

replace('should replace Node before child traversal :: block', () => {
	const program = parse(`
		var foo = 123;
		var bar = { aaa: foo };
	`);

	let seen = [];
	astray.walk(program, {
		Identifier(node) {
			seen.push(node.name);
		},
		ObjectExpression(node) {
			// node.path.replace({
			// 	type: 'Literal',
			// 	value: '123'
			// });
			return {
				type: 'Literal',
				value: '123'
			};
		}
	});

	assert.is(seen.length, 2, 'after: 2 identifiers');
	assert.equal(seen, ['foo', 'bar']);
});

replace('should replace Node before child traversal :: repeat run', () => {
	const program = parse(`
		var foo = 123; // +1
		var bar = {    // +1
			aaa: foo     // +2
		};
	`);

	let count = 0;
	astray.walk(program, {
		Identifier() {
			count++;
		}
	});

	assert.is(count, 4, 'initial: 4 identifiers');

	let seen = [];
	astray.walk(program, {
		Identifier(node) {
			seen.push(node.name);
		},
		ObjectExpression(node) {
			// node.path.replace({
			// 	type: 'Literal',
			// 	value: '123'
			// });
			return {
				type: 'Literal',
				value: '123'
			};
		}
	});

	assert.is(seen.length, 2, 'after: 2 identifiers');
	assert.equal(seen, ['foo', 'bar']);
});

replace.run();

// ---

function setup(ident, source) {
	let node, program = parse(source);
	astray.walk(program, {
		Identifier(n) {
			if (n.name === ident) {
				node = n;
			}
		}
	});
	return { node, program };
}

// ---

const lookup = suite('lookup');

lookup('should be a function', () => {
	assert.type(astray.lookup, 'function');
});

lookup('should return all bindings input Node', () => {
	const { node } = setup('foobar', `
		const API = 'https://...';

		function Hello(props) {
			var foobar = props.name || (API + '/hello');
		}
	`);

	assert.ok(node, 'found "foobar" ident');

	const output = astray.lookup(node);
	assert.type(output, 'object');

	const idents = Object.keys(output);
	assert.equal(idents, ['foobar', 'Hello', 'props', 'API']);

	assert.is(output.foobar.type, 'VariableDeclarator');
	assert.is(output.Hello.type, 'FunctionDeclaration');
	assert.is(output.props.type, 'Identifier'); // TODO: link function?
	assert.is(output.API.type, 'VariableDeclaration'); // TODO: inconsistent V/ion|or
});

lookup('should fill ancestry with bindings caches', () => {
	const { node } = setup('foobar', `
		const API = 'https://...';

		function Hello(props) {
			var foobar = props.name || (API + '/hello');
		}
	`);

	assert.ok(node, 'found "foobar" ident');

	const { foobar, Hello, props, API } = astray.lookup(node);

	assert.is(foobar.path.scanned, true);
	assert.equal(Object.keys(foobar.path.scoped), []);
	assert.equal(Object.keys(foobar.path.bindings), ['foobar', 'Hello', 'props', 'API']);

	assert.is(Hello.path.scanned, true);
	assert.equal(Object.keys(Hello.path.scoped), ['Hello', 'props']);
	assert.equal(Object.keys(Hello.path.bindings), ['Hello', 'props', 'API']);

	// TODO: is this right?
	assert.is('scoped' in props.path, false);
	assert.is('scanned' in props.path, false);
	assert.is('bindings' in props.path, false);

	// TODO: is this right?
	assert.is('scoped' in API.path, false);
	assert.is('scanned' in API.path, false);
	assert.is('bindings' in API.path, false);
});

lookup('should return early when `target` found', () => {
	const { node } = setup('foobar', `
		const API = 'https://...';

		function Hello(props) {
			var foobar = props.name || (API + '/hello');
		}
	`);

	assert.ok(node, 'found "foobar" ident');

	const output = astray.lookup(node, 'Hello');
	assert.type(output, 'object');

	const idents = Object.keys(output);
	assert.equal(idents, ['foobar', 'Hello', 'props']);

	const { foobar, Hello } = output;

	// incomplete ancestry
	assert.is(foobar.path.scanned, false);
	assert.is('bindings' in foobar, false);
	assert.equal(foobar.path.scoped, {});

	assert.is(Hello.path.scanned, false);
	assert.is('bindings' in Hello, false);
	assert.equal(Object.keys(Hello.path.scoped), ['Hello', 'props']);
});

lookup.run();
