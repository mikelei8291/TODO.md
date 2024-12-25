import { ListItem } from "../list-item/index.js";

export class TodoList extends HTMLUListElement {
    constructor(vscode) {
        super();
        this.id = "todo-list";
        this.vscode = vscode;
    }

    addItem(index = null) {
        if (!index) {
            index = this.childElementCount;
        }
        const item = new ListItem(index, "");
        this.insertBefore(item, this.children[index] ?? null);
        item.edit();
    }

    setItems(items) {
        this.replaceChildren(
            ...items.filter(item => item.text !== "").map((item, index) => new ListItem(index, item.text, item.checked))
        );
    }

    save() {
        this.vscode.postMessage(
            Array.from(this.children).map(item => ({ text: item.label.innerText, checked: item.checkbox.checked }))
        );
    }
}

customElements.define("todo-list", TodoList, { extends: "ul" });
