const fs = require('fs');
const { resolve } = require('path');
const { execFileSync } = require('child_process');

const BIN = require.resolve('bundt');
const output = resolve(__dirname, 'foo.js');

const utils = fs.readFileSync(
	resolve('./src/utils.js'), 'utf8'
).replace(/export function/g, 'function');

const index = fs.readFileSync(
	resolve('./src/index.js'), 'utf8'
).replace(/^import.*;\n/, utils);

// ~> temporary file
fs.writeFileSync(output, index);

execFileSync('node', [BIN, output], {
	stdio: 'inherit'
});

// ~> byeee
fs.unlinkSync(output);
