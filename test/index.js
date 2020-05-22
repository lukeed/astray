import { test } from 'uvu';
import * as assert from 'uvu/assert';
import astray from '../src';

test('exports', t => {
	assert.type(astray, 'function');
});

test.run();
