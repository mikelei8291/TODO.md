import * as vscode from 'vscode';
import { TodoViewProvider } from './views/todo-view';
import { EmptyViewProvider } from './views/empty-view';

export function activate(context: vscode.ExtensionContext) {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (workspaceFolder) {
        const provider = new TodoViewProvider(context.extensionUri, vscode.workspace.getConfiguration("editor").get("tabSize"));
        context.subscriptions.push(vscode.window.registerWebviewViewProvider(TodoViewProvider.viewType, provider));
        context.subscriptions.push(vscode.commands.registerCommand(
            "todo-md.add-item", async () => await provider.addItem()
        ));
    } else {
        const provider = new EmptyViewProvider(context.extensionUri);
        context.subscriptions.push(vscode.window.registerWebviewViewProvider(EmptyViewProvider.viewType, provider));
    }
}

export function deactivate() {}
