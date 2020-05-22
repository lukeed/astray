import { test } from 'uvu';
import * as assert from 'uvu/assert';
import * as astray from '../src';

test('exports', t => {
	assert.type(astray, 'object');
	assert.type(astray.walk, 'function');
});

test.run();
