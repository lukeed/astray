export function toIdentifier(node) {
	// ExportNamedDeclaration
	if (node.declaration) node = node.declaration;

	if (node.type === 'VariableDeclaration') {
		node = node.declarations[0];
	}

	switch (node.type) {
		case 'Identifier':
			return node.name;
		case 'ImportDeclaration':
			return node.specifiers.map(toIdentifier);
		case 'ImportSpecifier':
		case 'ImportDefaultSpecifier':
		case 'ImportNamespaceSpecifier':
			return toIdentifier(node.local);
		case 'VariableDeclarator':
		case 'FunctionDeclaration':
			return toIdentifier(node.id);
		case 'ObjectPattern':
			return node.properties.map(obj => {
				return toIdentifier(obj.value); // the alias, if any
			});
		default:
			console.log('[TODO] Could not find identifier for "%s"', node.type, node);
			break;
	}
}
