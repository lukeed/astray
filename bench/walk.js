const assert = require('uvu/assert');
const { Suite } = require('benchmark');

console.log('\Load times: ');

console.time('@babel/traverse');
const babel = require('@babel/traverse').default;
console.timeEnd('@babel/traverse');

console.time('estree-walker');
const estree = require('estree-walker');
console.timeEnd('estree-walker');

console.time('acorn-walk');
const acorn = require('acorn-walk');
console.timeEnd('acorn-walk');

console.time('ast-types');
const asttypes = require('ast-types');
console.timeEnd('ast-types');

console.time('astray');
const astray = require('astray');
console.timeEnd('astray');

const FIXTURES = {
	'@babel/traverse': './fixtures/babel.json',
	'estree-walker': './fixtures/estree.json',
	'acorn-walk': './fixtures/acorn.json',
	'ast-types': './fixtures/estree.json',
	'astray': './fixtures/estree.json',
}

const walkers = {
	'@babel/traverse': (tree) => {
		let count = 0;
		babel(tree, {
			noScope: true,
			Identifier() {
				count++;
			}
		});
		return count;
	},
	'estree-walker': (tree) => {
		let count = 0;
		estree.walk(tree, {
			enter(n) {
				if (n.type === 'Identifier') {
					count++;
				}
			}
		});
		return count;
	},
	'acorn-walk': (tree) => {
		let count = 0;
		acorn.simple(tree, {
			Identifier() {
				count++;
			}
		});
		return count;
	},
	'ast-types': (tree) => {
		let count = 0;
		asttypes.visit(tree, {
			visitIdentifier(path) {
				count++;
				this.traverse(path);
			}
		});
		return count;
	},
	'astray': (tree) => {
		let count = 0;
		astray.walk(tree, {
			Identifier() {
				count++;
			}
			// Identifier: {
			// 	enter() {
			// 		count++;
			// }
		});
		return count;
	}
};

console.log('\nValidation: ');
Object.keys(walkers).forEach(name => {
	const INPUT = require(FIXTURES[name]);
	const idents = walkers[name](INPUT);

	try {
		assert.is(idents, 41669, 'saw 41,669 identifiers');
		console.log('  ✔', `${name} (41,669 identifiers)`);
	} catch (err) {
		console.log('  ✘', `${name} (${idents.toLocaleString()} identifiers)`);
	}
});

console.log('\nBenchmark:');
const bench = new Suite().on('cycle', e => {
	console.log('  ' + e.target, e.target.hz.toFixed(3));
});

Object.keys(walkers).forEach(name => {
	const INPUT = require(FIXTURES[name]);
	bench.add(name + ' '.repeat(18 - name.length), () => {
		walkers[name](INPUT);
	})
});

bench.run();
