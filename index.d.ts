import * as AST from 'estree';

type Nullable<T> = T | null;
type Fallback = Record<string, any>;

type NodeNames = keyof ESTree.Nodes;
type Handler<N, S> = (node: Path<N>, state: S) => void;

export type Path<T> = T & {
	parent: ESTree.Node | void;
	skip(): void;
	remove(): void;
	replace(node: ESTree.Node): void;
	traverse<S = Fallback>(visitor: Visitor<S>, state?: S): T;
}

export type Visitor<S> = {
	[K in NodeNames]?: Handler<ESTree.Nodes[K], S> | {
		enter?: Handler<ESTree.Nodes[K], S>;
		exit?: Handler<ESTree.Nodes[K], S>;
	}
}

export function walk<T, S = Fallback>(node: T, visitor: Visitor<S>, state?: S, parent?: ESTree.Node): Path<T>;

export namespace ESTree {
	export type Node = AST.Node;

	export interface Nodes {
		Comment: AST.Comment;
		Position: AST.Position;
		Program: AST.Program;
		Directive: AST.Directive;
		EmptyStatement: AST.EmptyStatement;
		BlockStatement: AST.BlockStatement;
		ExpressionStatement: AST.ExpressionStatement;
		IfStatement: AST.IfStatement;
		LabeledStatement: AST.LabeledStatement;
		BreakStatement: AST.BreakStatement;
		ContinueStatement: AST.ContinueStatement;
		WithStatement: AST.WithStatement;
		SwitchStatement: AST.SwitchStatement;
		ReturnStatement: AST.ReturnStatement;
		ThrowStatement: AST.ThrowStatement;
		TryStatement: AST.TryStatement;
		WhileStatement: AST.WhileStatement;
		DoWhileStatement: AST.DoWhileStatement;
		ForStatement: AST.ForStatement;
		ForInStatement: AST.ForInStatement;
		DebuggerStatement: AST.DebuggerStatement;
		FunctionDeclaration: AST.FunctionDeclaration;
		VariableDeclaration: AST.VariableDeclaration;
		VariableDeclarator: AST.VariableDeclarator;
		BaseExpression: AST.BaseExpression;
		ThisExpression: AST.ThisExpression;
		ArrayExpression: AST.ArrayExpression;
		ObjectExpression: AST.ObjectExpression;
		Property: AST.Property;
		FunctionExpression: AST.FunctionExpression;
		SequenceExpression: AST.SequenceExpression;
		UnaryExpression: AST.UnaryExpression;
		BinaryExpression: AST.BinaryExpression;
		AssignmentExpression: AST.AssignmentExpression;
		UpdateExpression: AST.UpdateExpression;
		LogicalExpression: AST.LogicalExpression;
		ConditionalExpression: AST.ConditionalExpression;
		SimpleCallExpression: AST.SimpleCallExpression;
		NewExpression: AST.NewExpression;
		MemberExpression: AST.MemberExpression;
		SwitchCase: AST.SwitchCase;
		CatchClause: AST.CatchClause;
		Identifier: AST.Identifier;
		SimpleLiteral: AST.SimpleLiteral;
		RegExpLiteral: AST.RegExpLiteral;
		ForOfStatement: AST.ForOfStatement;
		Super: AST.Super;
		SpreadElement: AST.SpreadElement;
		ArrowFunctionExpression: AST.ArrowFunctionExpression;
		YieldExpression: AST.YieldExpression;
		TemplateLiteral: AST.TemplateLiteral;
		TaggedTemplateExpression: AST.TaggedTemplateExpression;
		TemplateElement: AST.TemplateElement;
		AssignmentProperty: AST.AssignmentProperty;
		ObjectPattern: AST.ObjectPattern;
		ArrayPattern: AST.ArrayPattern;
		RestElement: AST.RestElement;
		AssignmentPattern: AST.AssignmentPattern;
		ClassBody: AST.ClassBody;
		MethodDefinition: AST.MethodDefinition;
		ClassDeclaration: AST.ClassDeclaration;
		ClassExpression: AST.ClassExpression;
		MetaProperty: AST.MetaProperty;
		ImportDeclaration: AST.ImportDeclaration;
		ImportSpecifier: AST.ImportSpecifier;
		ImportExpression: AST.ImportExpression;
		ImportDefaultSpecifier: AST.ImportDefaultSpecifier;
		ImportNamespaceSpecifier: AST.ImportNamespaceSpecifier;
		ExportNamedDeclaration: AST.ExportNamedDeclaration;
		ExportSpecifier: AST.ExportSpecifier;
		ExportDefaultDeclaration: AST.ExportDefaultDeclaration;
		ExportAllDeclaration: AST.ExportAllDeclaration;
		AwaitExpression: AST.AwaitExpression;
		CallExpression: AST.CallExpression;
		UnaryOperator: AST.UnaryOperator;
		BinaryOperator: AST.BinaryOperator;
		LogicalOperator: AST.LogicalOperator;
		AssignmentOperator: AST.AssignmentOperator;
		UpdateOperator: AST.UpdateOperator;
		Literal: AST.Literal;
	}
}
