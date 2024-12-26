import { createElement } from "../utils.js";

export class ListItem extends HTMLLIElement {
    constructor(text = "", checked = false) {
        super();
        const id = crypto.randomUUID();

        this.checkbox = createElement("input", { type: "checkbox", id });
        this.checkbox.checked = checked;
        this.checkbox.addEventListener("change", this.change);

        this.label = createElement("label", { for: id }, text);
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

        this.append(createElement("div", {}, this.checkbox, this.label, this.editBtn, this.deleteBtn));
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
    }

    save = (event) => {
        if (this.label.isContentEditable) {
            if (event.key === "Escape") {
                this.label.innerText = this.previousText;
            }
            if (event.type === "blur" || event.key === "Enter" || event.key === "Escape") {
                this.label.contentEditable = false;
                if (event.ctrlKey) {
                    this.parentElement.addItem(this);
                }
                const parent = this.parentElement;
                if (this.label.innerText.length === 0) {
                    this.remove();
                }
                parent.dispatchEvent(new CustomEvent("state-change", { bubbles: true }));
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
        if (this.subList) {
            arr.push(this.subList.toArray());
        }
        return arr;
    }
}

customElements.define("list-item", ListItem, { extends: "li" });
