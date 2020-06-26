import { toIdentifier } from './utils';

export const SKIP = true;
export const REMOVE = false;

export function walk(node, visitor, state, parent) {
	if (!node) return;

	if (typeof node !== 'object') {
		return node;
	}

	if (Array.isArray(node)) {
		// if (!state) state = {};
		for (let tmp, item, i=0; i < node.length; i++) {
			tmp = walk(item = node[i], visitor, state, parent);
			if (tmp === false) node.splice(i--, 1);
			else if (tmp && tmp !== item) node[i] = tmp;
			// else if (tmp === item) continue;
			// else node[i] = tmp; // else if tmp.node?
		}
		return node;
	}

	let type = node.type;
	if (!type) return node;

	let key, item, xyz;
	let block = visitor[type];
	// if (!state) state = {};

	if (node.path === void 0) {
		// scanned: false,
		// bindings: {},
		node.path = { parent };
	}
	// need this?
	// else if (!parent) {
	// 	parent = node.path.parent;
	// }

	if (block) {
		if (typeof block === 'function') {
			xyz = block(node, state);
		} else if (block.enter) {
			xyz = block.enter(node, state);
		}

		if (xyz === SKIP) {
			return node; // skip traverse
		} else if (xyz === REMOVE) {
			return REMOVE;
		} else if (xyz) {
			xyz.path = node.path;
			node = xyz;
		}
	}

	for (key in node) {
		if (key !== 'path') {
			item = node[key];
			if (item == null) continue;
			if (typeof item !== 'object') continue;

			xyz = walk(item, visitor, state, node);
			if (xyz === REMOVE) delete node[key];
			else if (xyz && xyz !== item) node[key] = xyz;
		}
	}

	if (block && block.exit) {
		xyz = block.exit(node, state);

		if (xyz === SKIP) {
			// too late to skip
		} else if (xyz === REMOVE) {
			return REMOVE;
		} else if (xyz) {
			xyz.path = node.path;
			node = xyz;
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
