import { parse } from 'meriyah';

export function transform(source, full) {
	const AST = parse(source, { module: true, next: true });
	return full ? AST : AST.body[0];
}
