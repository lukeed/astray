import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import * as astray from '../src';

const walk = suite('walk');

walk('should be a function', () => {
	assert.type(astray.walk, 'function');
});

walk.run();

