import * as vscode from 'vscode';
import fs from "fs";

export class EmptyViewProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = "todo-md.view";

    constructor(private readonly extensionUri: vscode.Uri) {}

    public resolveWebviewView(
        webviewView: vscode.WebviewView, _context: vscode.WebviewViewResolveContext, _token: vscode.CancellationToken
    ): Thenable<void> | void {
        webviewView.webview.html = this.render(webviewView.webview);
    }

    private render(webview: vscode.Webview) {
        const html = webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, "src", "static", "empty.html"));
        return fs.readFileSync(html.fsPath, "utf-8");
    }
}
