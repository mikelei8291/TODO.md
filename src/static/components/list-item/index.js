import { TodoList } from "../todo-list/index.js";
import { createElement } from "../utils.js";

export class ListItem extends HTMLLIElement {
    constructor(text = "", checked = false) {
        super();
        const id = crypto.randomUUID();
        this.id = id;
        this.draggable = true;

        this.checkbox = createElement("input", { type: "checkbox", id: `cb-${id}` });
        this.checkbox.checked = checked;
        this.checkbox.addEventListener("change", this.change);

        this.label = createElement("label", { for: `cb-${id}` }, text);
        this.label.addEventListener("click", (event) => {
            if (this.label.isContentEditable) {
                event.preventDefault();
            }
        });
        this.label.addEventListener("keydown", this.save);
        this.label.addEventListener("blur", this.exitEdit);

        this.editBtn = createElement("button", {}, createElement("i", { class: "codicon codicon-edit" }));
        this.editBtn.addEventListener("click", this.edit);

        this.deleteBtn = createElement("button", {}, createElement("i", { class: "codicon codicon-remove" }));
        this.deleteBtn.addEventListener("click", this.delete);

        this.append(createElement("div", {}, this.checkbox, this.label, this.editBtn, this.deleteBtn));
        this.addEventListener("dragstart", this.dragstart);
        this.addEventListener("dragend", this.dragend);
    }

    get subList() {
        return this.querySelector("ul");
    }

    set subList(list) {
        this.subList?.remove();
        this.appendChild(list);
    }

    get checked() {
        return this.subList?.checked ?? this.checkbox.checked;
    }

    set checked(value) {
        this.checkbox.checked = value;
        if (this.subList) {
            this.subList.checked = value;
        }
        this.checkbox.indeterminate = false;
    }

    dragstart(event) {
        event.dataTransfer.setData("text/plain", event.target.id);
        setTimeout(() => event.target.classList.add("dragging"), 0);
    }

    dragend(event) {
        event.target.classList.remove("dragging");
    }

    exitEdit = () => {
        this.label.contentEditable = false;
        this.draggable = true;
        const parent = this.parentElement;
        if (this.label.innerText.length === 0) {
            this.remove();
        }
        parent.dispatchEvent(new CustomEvent("state-change", { bubbles: true }));
    };

    save = (event) => {
        if (this.label.isContentEditable) {
            switch (event.key) {
                case "Tab":
                    event.preventDefault();
                    this.label.removeEventListener("blur", this.exitEdit);
                    if (event.shiftKey) {
                        const parent = this.parentElement;
                        const sibling = parent.closest("li");
                        if (sibling) {
                            sibling.after(this);
                        }
                        parent.dispatchEvent(new CustomEvent("state-change", { bubbles: true }));
                    } else {
                        const parent = this.previousElementSibling;
                        if (parent) {
                            if (parent.subList) {
                                parent.subList.appendChild(this);
                            } else {
                                const subList = new TodoList();
                                parent.appendChild(subList);
                                subList.appendChild(this);
                            }
                        }
                        this.dispatchEvent(new CustomEvent("state-change", { bubbles: true }));
                    }
                    this.edit();
                    this.label.addEventListener("blur", this.exitEdit);
                    break;
                case "Escape":
                    this.label.innerText = this.previousText;
                case "Enter":
                    if (event.ctrlKey) {
                        this.parentElement.addItem(this);
                    }
                    this.label.blur();  // this also triggers the exitEdit() method
            }
        }
    };

    change = () => {
        if (this.subList) {
            this.subList.checked = this.checkbox.checked;
        }
        this.dispatchEvent(new CustomEvent("state-change", { bubbles: true }));
    };

    edit = () => {
        if (!this.label.isContentEditable) {
            this.previousText = this.label.innerText;
            this.label.contentEditable = true;
            this.draggable = false;
        }
        if (this.label.isContentEditable) {
            this.label.focus();
            const range = document.createRange();
            const selection = document.getSelection();
            range.setStart(this.label, 1);
            selection.removeAllRanges();
            selection.addRange(range);
        }
    };

    delete = () => {
        const parent = this.parentElement;
        this.remove();
        parent.dispatchEvent(new CustomEvent("state-change", { bubbles: true }));
    };

    toArray() {
        const arr = [{ text: this.label.innerText, checked: this.checkbox.checked }];
        if (this.subList?.hasChildNodes()) {
            arr.push(this.subList.toArray());
        }
        return arr;
    }
}

customElements.define("list-item", ListItem, { extends: "li" });
