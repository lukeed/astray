import { toIdentifier } from './utils';

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
			// scanned: false,
			// bindings: {},
			skip: () => (xx = 2),
			remove: () => (xx = 0),
			replace: (nxt) => (xx = nxt)
		}
	}
	// need this?
	// else if (!parent) {
	// 	parent = node.path.parent;
	// }

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
			// Now is too late to skip
		if (xx !== 1 && xx !== 2) {
			if (!xx) return; // remove() | replace(falsey)
			xx.path = node.path; // replace(any)
			node = xx;
		}
	}

	return node;
}

export function lookup(baseNode, target) {
	let parent = baseNode;
	let output = {}; // TODO: need to assign to each parent

	while (parent = parent.path.parent) {
		// TODO: incomplete types list
		if (parent.path.scanned) { // TODO: setter
			for (let k in parent.path.bindings) {
				if (!output[k]) output[k] = parent.path.bindings[k];
			}
		} else if (parent.type === 'BlockStatement') {
			let arr = parent.body;

			// should not happen?
			if (!arr.length) continue;

			walk(arr, {
				FunctionDeclaration(fnode) {
					console.log('[FOUND][INNER] FunctionDeclaration: ', fnode);
				},
				VariableDeclarator(vnode) {
					if (vnode.id.type === 'Identifier') {
						output[vnode.id.name] = vnode;
					} else {
						console.log('[TODO] Non-Identifier Variable:', vnode.type, vnode);
					}
				},
			});
		} else if (parent.type === 'FunctionDeclaration') {
			let tmp = toIdentifier(parent);
			if (tmp && !output[tmp]) output[tmp] = parent;

			// TODO: point to parent ref?
			parent.params.forEach(obj => {
				if (tmp = toIdentifier(obj)) {
					if (!output[tmp]) output[tmp] = obj;
				}
			});
		} else if (parent.type === 'Program') {
			let i=0, tmp, arr=parent.body;
			for (; i < arr.length; i++) {
				if (tmp = toIdentifier(arr[i])) {
					[].concat(tmp).forEach(str => {
						if (output[str]) return;
						output[str] = arr[i];
					});
				}
			}
		}

		// TODO: Assign THIS LOOP'S scopes to this parent
		// parent.path.scanned = true;

		// Stop early if found the given target
		if (target && output[target]) return output;
	}

	return output;
}
