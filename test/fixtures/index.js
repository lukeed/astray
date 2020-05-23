import { parse as p } from 'meriyah';

export function parse(source) {
	return p(source, { module: true, next: true });
}
