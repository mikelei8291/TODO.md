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

    public async addItem() {
        if (this.view?.visible) {
            await this.view.webview.postMessage({ type: "addItem" });
        } else {
            const text = (await vscode.window.showInputBox({ placeHolder: "TODO" }))?.trim();
            if (text) {
                this.save((await this.loadItems() ?? []).concat({ text, checked: false }));
            }
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

    private async loadItems(document: vscode.TextDocument | void): Promise<TodoItem[] | undefined> {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0].uri;
        if (workspaceFolder) {
            const file = vscode.Uri.joinPath(workspaceFolder, "TODO.md");
            if (document === undefined || document.fileName === file.fsPath) {
                return this.deserialize(await vscode.workspace.fs.readFile(file));
            }
        }
    }

    private setBadge(items: TodoItem[]) {
        const value = items.filter(item => !item.checked).length;
        if (this.view) {
            this.view.badge = { tooltip: value ? `${value} undone task${value > 1 ? "s" : ""}` : "All done!", value };
        }
    }

    private load = async (document: vscode.TextDocument | void) => {
        const items = await this.loadItems(document);
        if (items) {
            this.view?.webview.postMessage({ type: "setItems", args: items });
            this.setBadge(items);
        }
    };

    private save = async (items: TodoItem[]) => {
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
            this.setBadge(items);
        }
    };

    private render(webview: vscode.Webview) {
        const html = webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, "src", "static", "index.html"));
        const root = webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, "src", "static"));
        const moduleRoot = webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, "assets", "node_modules"));
        return fs.readFileSync(html.fsPath, "utf-8")
            .replaceAll("{{resourceRoot}}", root.toString())
            .replaceAll("{{modules}}", moduleRoot.toString());
    }
}
