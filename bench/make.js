const fs = require('fs');
const path = require('path');
const acorn = require('acorn');
const meriyah = require('meriyah');
const babel = require('@babel/parser');

const D3 = require.resolve('d3/dist/d3.min.js');
const source = fs.readFileSync(D3, 'utf8');

fs.writeFileSync(
	path.join(__dirname, 'fixtures', 'estree.json'),
	JSON.stringify(meriyah.parse(source), null, 2),
);

fs.writeFileSync(
	path.join(__dirname, 'fixtures', 'acorn.json'),
	JSON.stringify(acorn.parse(source), null, 2),
);

fs.writeFileSync(
	path.join(__dirname, 'fixtures', 'babel.json'),
	JSON.stringify(babel.parse(source), null, 2),
);
