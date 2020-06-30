import { toIdentifier, toNode } from './utils';

export const SKIP = true;
export const REMOVE = false;

export function walk(node, visitor, state, parent) {
	if (!node) return;

	if (typeof node !== 'object') {
		return node;
	}

	if (Array.isArray(node)) {
		for (let tmp, item, i=0; i < node.length; i++) {
			tmp = walk(item = node[i], visitor, state, parent);
			if (tmp == null) continue;
			if (tmp === REMOVE) node.splice(i--, 1);
			else if (tmp !== item) node[i] = tmp;
		}
		return node;
	}

	let type = node.type;
	if (!type) return node;

	let key, item, xyz;
	let block = visitor[type];

	if (node.path === void 0) {
		node.path = { parent };
	}

	if (block) {
		if (typeof block === 'function') {
			xyz = block(node, state);
		} else if (block.enter) {
			xyz = block.enter(node, state);
		}

		if (xyz != null) {
			if (xyz === SKIP) {
				return node; // skip traverse
			} else if (xyz === REMOVE) {
				return REMOVE;
			} else {
				xyz.path = node.path;
				node = xyz;
			}
		}
	}

	for (key in node) {
		if (key !== 'path') {
			item = node[key];
			if (item == null) continue;
			if (typeof item !== 'object') continue;

			xyz = walk(item, visitor, state, node);
			if (xyz == null) continue;
			if (xyz === REMOVE) delete node[key];
			else if (xyz !== item) node[key] = xyz;
		}
	}

	if (block && block.exit) {
		xyz = block.exit(node, state);

		if (xyz != null) {
			if (xyz === SKIP) {
				// too late to skip
			} else if (xyz === REMOVE) {
				return REMOVE;
			} else {
				xyz.path = node.path;
				node = xyz;
			}
		}
	}

	return node;
}

// scoped = wip, own list
// scanned = done, seen parents
// bindings = done, full list
export function lookup(baseNode, target) {
	let output = baseNode.path;
	let tracking = [output];
	let program = false; // at end?
	let parent = baseNode;

	output = (output.bindings = output.bindings || {});

	while (parent = parent.path.parent) {
		let dict = parent.path.bindings || parent.path.scoped;

		if (dict === void 0) {
			dict = {}; // WIP scoped

			if (parent.type === 'BlockStatement') {
				// shouldnt happen?
				// can't enter ~into~ an empty parent from a child
				if (parent.body.length) {
					walk(parent.body, {
						FunctionDeclaration(fnode) {
							// Can only be Identifier
							dict[fnode.id.name] = fnode;
						},
						VariableDeclarator(vnode) {
							let tmp = toIdentifier(vnode.id);
							// TODO: extract this loop/concat pattern
							if (Array.isArray(tmp)) tmp.forEach(x => dict[x] = vnode);
							else if (tmp) dict[tmp] = vnode;
						},
					});
				}
			} else if (parent.type === 'FunctionDeclaration') {
				let tmp = toIdentifier(parent);
				if (tmp) dict[tmp] = dict[tmp] || parent;

				// TODO: point to parent ref?
				parent.params.forEach(obj => {
					if (tmp = toIdentifier(obj)) {
						dict[tmp] = dict[tmp] || obj;
					}
				});
			} else if (parent.type === 'Program') {
				let i=0, tmp, xyz, arr=parent.body;
				for (; i < arr.length; i++) {
					if (xyz = toNode(arr[i])) {
						[].concat(xyz).forEach(node => {
							tmp = toIdentifier(node);
							dict[tmp] = dict[tmp] || node;
						});
					}
				}
				program = true; // ~> scanned = true
			}

			parent.path.scoped = dict;
			parent.path.bindings = {};
		}

		parent.path.scanned || tracking.push(parent.path);

		// this sucks
		for (let key in dict) {
			let i=0, tmp, arr=tracking;
			for (; i < arr.length; i++) {
				tmp = arr[i];
				tmp.scanned = tmp.scanned || program;
				tmp.bindings[key] = tmp.bindings[key] || dict[key];
			}
		}

		// Stop if found the given target
		if (target && output[target]) break;
	}

	return output;
}
