import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { transform } from './fixtures';
import * as astray from '../src';

const walk = suite('walk');

walk('should be a function', () => {
	assert.type(astray.walk, 'function');
});

walk('should traverse child nodes recursively', () => {
	const seen = [];
	const program = transform(`
		const INFORMAL = true;
		export function testing(props) {
			let name = props.name || props.fullname;
			return INFORMAL ? whaddup(name) : greet(name);
		}
	`, true);

	const output = astray.walk(program, {
		Identifier(node) {
			seen.push(node.name);
		}
	});

	assert.is(output.type, 'Program', 'returns the base node');
	assert.ok(output === program, 'returns original binding');
	assert.ok(output.path, 'attaches "path" attribute');

	assert.equal(seen, [
		'INFORMAL',
		'testing', 'props',
		'name', 'props', 'name', 'props', 'fullname',
		'INFORMAL', 'whaddup', 'name', 'greet', 'name'
	]);
});

walk.run();

