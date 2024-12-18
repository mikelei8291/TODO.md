import * as vscode from 'vscode';
import fs from "fs";

interface TodoItem {
    text: string;
    checked: boolean;
}

const MD_REGEX = /^- \[(?<checked>x| )\] (?<text>.+)$/;

export class TodoViewProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = "todo-md.view";

    private view?: vscode.WebviewView;

    constructor(private readonly extensionUri: vscode.Uri) {}

    public resolveWebviewView(
        webviewView: vscode.WebviewView, _context: vscode.WebviewViewResolveContext, _token: vscode.CancellationToken
    ): Thenable<void> | void {
        this.view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this.extensionUri]
        };

        webviewView.webview.html = this.render(webviewView.webview);
        webviewView.onDidChangeVisibility(this.load);
        vscode.workspace.onDidSaveTextDocument(this.load);
        webviewView.webview.onDidReceiveMessage(this.save);
        this.load();
    }

    public async addItem(inView: boolean = false) {
        const text = inView ? "" : await vscode.window.showInputBox({ placeHolder: "TODO" });
        if (text !== undefined) {
            vscode.commands.executeCommand("todo-md.view.focus");
            this.view?.webview.postMessage({ type: "addItem", args: [text] });
        }
    }

    private serialize(items: TodoItem[]): Uint8Array {
        return new TextEncoder().encode(items.map(item => `- [${item.checked ? "x" : " "}] ${item.text}`).join("\n"));
    }

    private deserialize(content: Uint8Array): TodoItem[] {
        return new TextDecoder().decode(content).split("\n")
            .map(s => s.match(MD_REGEX))
            .filter(m => !!m)
            .map(m => ({ text: m.groups?.text ?? "", checked: m.groups?.checked === "x" }));
    }

    public load = async (document: vscode.TextDocument | void) => {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0].uri;
        if (workspaceFolder) {
            const file = vscode.Uri.joinPath(workspaceFolder, "TODO.md");
            if (document === undefined || (document && document.fileName === file.fsPath)) {
                const items = this.deserialize(await vscode.workspace.fs.readFile(file));
                this.view?.webview.postMessage({ type: "setItems", args: items });
            }
        }
    };

    public save = async (items: TodoItem[]) => {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0].uri;
        if (workspaceFolder) {
            const file = vscode.Uri.joinPath(workspaceFolder, "TODO.md");
            try {
                await vscode.workspace.fs.stat(file);
                await vscode.workspace.fs.writeFile(file, this.serialize(items));
            } catch {
                const edit = new vscode.WorkspaceEdit();
                edit.createFile(file, { contents: this.serialize(items) });
                vscode.workspace.applyEdit(edit);
            }
        }
    };

    private render(webview: vscode.Webview) {
        const html = webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, "src", "static", "index.html"));
        const root = webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, "src", "static"));
        const moduleRoot = webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, "node_modules"));
        return fs.readFileSync(html.fsPath, "utf-8")
            .replaceAll("{{resourceRoot}}", root.toString())
            .replaceAll("{{modules}}", moduleRoot.toString());
    }
}
