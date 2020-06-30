import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { parse } from './helpers';
import * as astray from '../src';

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

lookup('should return all bindings input Node', () => {
	const { node } = setup('foobar', `
		const API = 'https://...';

		function Hello(props) {
			const greet = str => 'Hello, ' + str;

			function say(str) {
				console.log('inner', str);
			}

			var foobar = props.name || (API + '/hello');
		}
	`);

	assert.ok(node, 'found "foobar" ident');

	const output = astray.lookup(node);
	assert.type(output, 'object');

	assert.equal(
		Object.keys(output),
		['greet', 'say', 'foobar', 'Hello', 'props', 'API']
	);

	assert.is(output.say.type, 'FunctionDeclaration');
	assert.is(output.greet.type, 'VariableDeclarator');
	assert.is(output.foobar.type, 'VariableDeclarator');
	assert.is(output.Hello.type, 'FunctionDeclaration');
	assert.is(output.props.type, 'Identifier');
	assert.is(output.API.type, 'VariableDeclarator');
});

lookup('should introduce sibling scopes', () => {
	const { node } = setup('hello', `
		function Hello(props) {
			let { foo, bar } = greet();
			var hello = 'world';

			function init() {
				console.log({ hello });
			}
		}
	`);

	assert.ok(node, 'found "hello" ident');

	const output = astray.lookup(node);
	assert.type(output, 'object');

	assert.equal(
		Object.keys(output),
		['init', 'foo', 'bar', 'hello', 'Hello', 'props']
	);

	assert.is(output.foo.type, output.bar.type);
	assert.is(output.bar.type, 'VariableDeclarator');
	assert.is(output.hello.type, 'VariableDeclarator');
	assert.is(output.init.type, 'FunctionDeclaration');
	assert.is(output.Hello.type, 'FunctionDeclaration');
	assert.is(output.props.type, 'Identifier');
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
