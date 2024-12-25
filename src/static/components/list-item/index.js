import { createElement } from "../utils.js";

export class ListItem extends HTMLLIElement {
    constructor(index, text, checked = false) {
        super();
        this.index = index;

        this.checkbox = createElement("input", { type: "checkbox", id: `todo-md-cb-${index}` });
        this.checkbox.checked = checked;
        this.checkbox.addEventListener("change", this.change);

        this.label = createElement("label", { for: `todo-md-cb-${index}` }, text);
        this.label.addEventListener("click", (event) => {
            if (this.label.isContentEditable) {
                event.preventDefault();
            }
        });
        this.label.addEventListener("keydown", this.save);
        this.label.addEventListener("blur", this.save);

        this.editBtn = createElement("button", {}, createElement("i", { class: "codicon codicon-edit" }));
        this.editBtn.addEventListener("click", this.edit);

        this.deleteBtn = createElement("button", {}, createElement("i", { class: "codicon codicon-remove" }));
        this.deleteBtn.addEventListener("click", this.delete);

        this.append(this.checkbox, this.label, this.editBtn, this.deleteBtn);
    }

    save = (event) => {
        if (this.label.isContentEditable) {
            if (event.key === "Escape") {
                this.label.innerText = this.previousText;
            }
            if (event.type === "blur" || event.key === "Enter" || event.key === "Escape") {
                this.label.contentEditable = false;
                if (event.ctrlKey) {
                    this.parentElement.addItem(this.index + 1);
                }
                const todoList = this.parentElement;
                if (this.label.innerText.length === 0) {
                    this.remove();
                }
                todoList.save();
            }
        }
    };

    change = () => {
        this.parentElement.save();
    };

    edit = () => {
        if (!this.label.isContentEditable) {
            this.previousText = this.label.innerText;
            this.label.contentEditable = true;
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
        this.remove();
        document.getElementById("todo-list").save();
    };
}

customElements.define("list-item", ListItem, { extends: "li" });
