import type * as Nodes from 'estree';

type Nullable<T> = T | null;
type Fallback = Record<string, any>;

type NodeNames = keyof typeof Nodes;
type Handler<K, S> = (node: Path<Nodes[K]>, state: S) => void;

export type Path<T, P = any> = T & {
	parent: Nullable<P>;
	scanned: boolean;
	skip(): void;
	remove(): void;
	replace<X = any>(node: X): X;
	traverse<S = Fallback>(visitor: Visitor<S>, state?: S): T;
}

export type Visitor<S> = {
	[K in keyof NodeNames]: Handler<K, S> | {
		enter?: Handler<K, S>;
		exit?: Handler<K, S>;
	}
}

export function walk<T, S = Fallback>(node: T, visitor: Visitor, state?: S, parent?: any): Path<T>;
