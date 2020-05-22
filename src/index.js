export function walk(node, visitor, state, parent) {
	if (!node) return;

	if (typeof node !== 'object') {
		return node;
	}

	if (Array.isArray(node)) {
		if (!state) state = {};
		for (let tmp, item, i=0; i < node.length; i++) {
			tmp = walk(item = node[i], visitor, state, parent);
			if (!tmp) node.splice(i--, 1);
			else if (tmp === item) continue;
			else node[i] = tmp; // else if tmp.node?
		}
		return node;
	}

	let type = node.type;
	if (!type) return node;

	let block = visitor[type];
	let key, item, tmp, xx = 1;
	if (!state) state = {};

	if (node.path === void 0) {
		node.path = {
					parent: parent,
					skip: () => (xx = 2),
					remove: () => (xx = 0),
			replace: (nxt) => (xx = nxt)
				}
	}

	if (block) {
		if (typeof block === 'function') {
			block(node, state);
		} else if (block.enter) {
			block.enter(node, state);
		}

		if (xx !== 1) {
			if (xx === 2) return node; // skip()
			if (!xx) return; // remove() | replace(falsey)
			xx.path = node.path; // replace(any)
			node = xx;
		}
	}

	for (key in node) {
		if (key !== 'path') {
		item = node[key];
		if (item == null) continue;
		if (typeof item !== 'object') continue;
		tmp = walk(item, visitor, state, node);
		if (tmp === void 0) delete node[key];
		else if (tmp === item) continue;
		else node[key] = tmp;
	}
	}

	if (block && block.exit) {
		block.exit(node, state);
		if (xx !== 1) {
		// Now is too late to skip
		if (!xx) return; // remove() | replace(falsey)
			xx.path = node.path; // replace(any)
			node = xx;
		}
	}

	return node;
}
