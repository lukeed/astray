import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { parse } from './fixtures';
import * as astray from '../src';

const walk = suite('walk');

walk('should be a function', () => {
	assert.type(astray.walk, 'function');
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

walk('should maintain `state` across visitor levels', () => {
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
	});

	assert.equal(seen, ['function', 'variable', 'return']);
});

walk('should accept initial `state` value', () => {
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

walk.run();

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
			assert.ok(typeof node.path === 'object');
			assert.ok(typeof node.path.parent === 'object');
			assert.ok(typeof node.path.replace === 'function');
			assert.ok(typeof node.path.remove === 'function');
			assert.ok(typeof node.path.skip === 'function');
		}
	});

	assert.is(count, 6);
});

path('should prevent child traversal via skip()', () => {
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
		IfStatement(node) {
			node.path.skip();
		},
		Identifier(node) {
			count++;
		}
	});

	// would be 12 without skip
	assert.is(count, 2);
});

path.run();

// ---

const lookup = suite('lookup');

lookup('should be a function', () => {
	assert.type(astray.lookup, 'function');
});

lookup.run();
