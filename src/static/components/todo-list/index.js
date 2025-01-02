import { ListItem } from "../list-item/index.js";

export class TodoList extends HTMLUListElement {
    constructor() {
        super();
        this.addEventListener("state-change", () => {
            if (!this.isRoot) {
                if (this.childElementCount === 0) {
                    this.remove();
                } else {
                    this.parentElement.checkbox.checked = this.checked;
                    this.parentElement.checkbox.indeterminate = this.indeterminate;
                }
            }
        });
    }

    get checked() {
        return Array.from(this.children).every(item => item.checked);
    }

    set checked(value) {
        Array.from(this.children).forEach(item => item.checked = value);
    }

    get indeterminate() {
        return Array.from(this.children).some(item => item.checked || item.checkbox.indeterminate) && !this.checked;
    }

    get isRoot() {
        return this.parentElement === document.body;
    }

    addItem(element = null) {
        if (!element) {
            element = this.lastElementChild;
        }
        const item = new ListItem();
        if (element) {
            element.after(item);
        } else {
            this.appendChild(item);
        }
        item.edit();
    }

    setItems(items) {
        this.replaceChildren();
        items.forEach(item => {
            if (Array.isArray(item)) {
                const todoList = new TodoList();
                todoList.setItems(item);
                this.lastElementChild.subList = todoList;
                this.lastElementChild.checkbox.indeterminate = todoList.indeterminate;
            } else {
                this.appendChild(new ListItem(item.text, item.checked));
            }
        });
    }

    toArray() {
        return Array.from(this.children).flatMap(item => item.toArray());
    }
}

customElements.define("todo-list", TodoList, { extends: "ul" });
