// @arr/flatten
export function flat(arr, out) {
	for (var i=0, tmp; i < arr.length; i++) {
		Array.isArray(tmp = arr[i]) ? flat(tmp, out)
			: tmp != null && out.push(tmp);
	}
	return out;
}

export function toIdentifier(node) {
	if (!node) return node;

	// ExportNamedDeclaration
	if (node.declaration) {
		node = node.declaration;
	}

	let i=0, tmp, out=[];

	switch (node.type) {
		case 'Identifier':
			return node.name;
		case 'VariableDeclaration': {
			for (; i < node.declarations.length; i++) {
				tmp = toIdentifier(node.declarations[i]);
				if (Array.isArray(tmp)) flat(tmp, out);
				else if (tmp) out.push(tmp);
			}
			return out;
		}
		case 'ImportDeclaration': {
			for (; i < node.specifiers.length; i++) {
				tmp = toIdentifier(node.specifiers[i]);
				if (Array.isArray(tmp)) flat(tmp, out);
				else if (tmp) out.push(tmp);
			}
			return out;
		}
		case 'ImportSpecifier':
		case 'ImportDefaultSpecifier':
		case 'ImportNamespaceSpecifier':
			return toIdentifier(node.local);
		case 'VariableDeclarator':
		case 'FunctionDeclaration':
			return toIdentifier(node.id);
		case 'ObjectPattern': {
			for (; i < node.properties.length; i++) {
				tmp = toIdentifier(node.properties[i].value); // the alias
				if (Array.isArray(tmp)) flat(tmp, out);
				else if (tmp) out.push(tmp);
			}
			return out;
		}
		default:
			console.log('[TODO] Could not find identifier for "%s"', node.type, node);
			break;
	}
}
