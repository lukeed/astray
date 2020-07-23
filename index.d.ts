import * as AST from 'estree';

type Fallback = void;
type NodeNames = keyof ESTree.Nodes;

type Handler<N, S> = (node: Path<N>, state: S) => ESTree.Node | boolean | void;
type Block<N, S> = {
	enter?: Handler<N, S>;
	exit?: Handler<N, S>;
}

export type Path<T> = T & {
	parent: ESTree.Node | void;
	scanned?: boolean;
	bindings?: Record<string, ESTree.Node>;
	locals?: Record<string, ESTree.Node>;
}

export type Visitor<S> = {
	[K in NodeNames]?: Handler<ESTree.Nodes[K], S> | Block<ESTree.Nodes[K], S>;
}

export const SKIP: boolean;
export const REMOVE: boolean;

export function walk<T, S = Fallback>(node: T, visitor: Visitor<S>, state?: S, parent?: ESTree.Node): Path<T>;
export function lookup<T = ESTree.Node>(node: T, target?: string): Record<string, ESTree.Node>;

export interface ESTreeMap {
	Node: AST.Node;
		Comment: AST.Comment;
		Position: AST.Position;
		Program: AST.Program;
		Directive: AST.Directive;
	Function: AST.Function;
	Statement: AST.Statement;
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
	Declaration: AST.Declaration;
		FunctionDeclaration: AST.FunctionDeclaration;
		VariableDeclaration: AST.VariableDeclaration;
		VariableDeclarator: AST.VariableDeclarator;
	Expression: AST.Expression;
		BaseExpression: AST.BaseExpression;
	ChainElement: AST.ChainElement;
	ChainExpression: AST.ChainExpression;
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
	BaseCallExpression: AST.BaseCallExpression;
	CallExpression: AST.CallExpression;
		SimpleCallExpression: AST.SimpleCallExpression;
		NewExpression: AST.NewExpression;
		MemberExpression: AST.MemberExpression;
	Pattern: AST.Pattern;
	BasePattern: AST.BasePattern;
		SwitchCase: AST.SwitchCase;
		CatchClause: AST.CatchClause;
		Identifier: AST.Identifier;
	Literal: AST.Literal;
		SimpleLiteral: AST.SimpleLiteral;
		RegExpLiteral: AST.RegExpLiteral;
	UnaryOperator: AST.UnaryOperator;
	BinaryOperator: AST.BinaryOperator;
	LogicalOperator: AST.LogicalOperator;
	AssignmentOperator: AST.AssignmentOperator;
	UpdateOperator: AST.UpdateOperator;
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
	Class: AST.Class;
	BaseClass: AST.BaseClass;
		ClassBody: AST.ClassBody;
		MethodDefinition: AST.MethodDefinition;
		ClassDeclaration: AST.ClassDeclaration;
		ClassExpression: AST.ClassExpression;
		MetaProperty: AST.MetaProperty;
	ModuleDeclaration: AST.ModuleDeclaration;
	BaseModuleDeclaration: AST.BaseModuleDeclaration;
	ModuleSpecifier: AST.ModuleSpecifier;
	BaseModuleSpecifier: AST.BaseModuleSpecifier;
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
}
