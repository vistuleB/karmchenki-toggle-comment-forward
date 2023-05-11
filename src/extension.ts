import * as vscode from 'vscode';
import { AssertionError } from 'assert';


function sorted_selections(editor: vscode.TextEditor) {
	const to_return: vscode.Selection[] = [];
	let num = 0;
	for (const sel of editor.selections) {
		for (let i = num - 1; ; i--) {
			if (i === -1) { to_return.splice(0, 0, sel); break; }
			if (to_return[i].start.isBefore(sel.start)) { to_return.splice(i + 1, 0, sel); break; }
		}
		num++;
	}
	if (to_return.length !== editor.selections.length) { throw new AssertionError(); }
	return to_return;
}

function toggleCommentForward(editor: vscode.TextEditor, edit: vscode.TextEditorEdit) {
	vscode.commands.executeCommand("editor.action.commentLine");
	vscode.commands.executeCommand("cursorDown");
}

function duplicateAndToggleComment(editor: vscode.TextEditor, edit: vscode.TextEditorEdit) {
	if (editor.selections.length === 0) { return; }
	const original_selection: vscode.Selection = editor.selections[0];
	const sorted : vscode.Selection[] = sorted_selections(editor);
	let index_of_original = 0;
	for ( ; index_of_original < sorted.length; index_of_original++) { if (sorted[index_of_original].start === original_selection.start) { break; } }
	if (index_of_original >= sorted.length) { throw new AssertionError(); }

	// ok enough foreplay
	let new_selections : vscode.Selection[] = [];
	for (let index = sorted.length - 1; index >= 0; index--) {
		const s = sorted[index];
		const a = s.start;
		const b = s.end;
		editor.selections = [s];
		vscode.commands.executeCommand("editor.action.commentLine");
		vscode.commands.executeCommand("editor.action.copyLinesDownAction");
		vscode.commands.executeCommand("editor.action.commentLine");
		if (s.start !== a || s.end !== b) { throw new AssertionError(); }
		new_selections.splice(0, 0, editor.selections[0]);
	}
	
	editor.selections = [new_selections[index_of_original]]
	for (let index = 0; index < sorted.length; index++) {
		if (index !== index_of_original) { editor.selections.push(sorted[index]); }
	}
}

function reverseToggleCommentForward(editor: vscode.TextEditor, edit: vscode.TextEditorEdit) {
	vscode.commands.executeCommand("cursorUp");
	vscode.commands.executeCommand("editor.action.commentLine");
}

interface VanillaCommand {
	name: string;
	func: (p1: vscode.TextEditor, p2: vscode.TextEditorEdit) => void;
}

function register_commands(extension_id: string, context: vscode.ExtensionContext, ze_list: VanillaCommand[]) {
	ze_list.forEach(z => vscode.commands.registerTextEditorCommand(extension_id + '.' + z.name, z.func));
}

export function activate(context: vscode.ExtensionContext) {
	register_commands(
		'karmchenki-toggle-comment-forward',
		context,
		[
			{ name: 'toggleCommentForward', func: toggleCommentForward },
			{ name: 'reverseToggleCommentForward', func: reverseToggleCommentForward },
			{ name: 'duplicateAndToggleComment', func: duplicateAndToggleComment }
		]
	);
}

export function deactivate() { }
