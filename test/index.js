import { suite } from 'uvu';
import * as assert from 'uvu/assert';
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

const API = suite('API');

API('should expose `walk` function', () => {
	assert.type(astray.walk, 'function');
});

API('should expose `lookup` function', () => {
	assert.type(astray.lookup, 'function');
});

API.run();
