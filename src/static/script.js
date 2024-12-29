import { TodoList } from "./components/todo-list/index.js";
import { createElement } from "./components/utils.js";

const vscode = acquireVsCodeApi();
const todoList = new TodoList(vscode);
todoList.id = "todo-list";
todoList.addEventListener("state-change", ({ detail }) => (detail?.save ?? true) ? vscode.postMessage(todoList.toArray()) : undefined);

const dropTarget = createElement("div", { id: "drop-target" });
let previousTarget = undefined;
todoList.addEventListener("dragover", (event) => {
    event.preventDefault();
    if (event.target.matches("#todo-list, div:not(#drop-target), div:not(#drop-target) *")) {
        const items = Array.from(todoList.querySelectorAll("li:not(.dragging) > div"));
        const maxHeight = Math.max(...items.map(item => item.getBoundingClientRect().bottom));
        const target = items.reduce(
            (closest, element) => {
                const { y, height } = element.getBoundingClientRect();
                const offset = event.clientY - (y + height / 2);
                return event.clientY >= 11
                    && event.clientY <= maxHeight + 22
                    && offset > 0
                    && offset <= height / 2 + 8
                    && offset < closest.offset
                    ? { offset, element } : closest;
            },
            { offset: Infinity }
        ).element?.parentElement ?? (event.clientY < 11 ? "top" : event.clientY > maxHeight + 22 ? "bottom" : undefined);
        if (target !== previousTarget) {
            previousTarget = target;
            if (target === "top") {
                todoList.prepend(dropTarget);
            } else if (target === "bottom") {
                todoList.appendChild(dropTarget);
            } else if (target?.subList) {
                target.subList.prepend(dropTarget);
            } else if (target) {
                target.after(dropTarget);
            }
        }
    }
});
todoList.addEventListener("drop", (event) => {
    const item = document.getElementById(event.dataTransfer.getData("text/plain"));
    const parent = item.parentElement;
    dropTarget.replaceWith(item);
    if (item.parentElement !== parent) {
        parent.dispatchEvent(new CustomEvent("state-change", { bubbles: true, detail: { save: false } }));
    }
    item.dispatchEvent(new CustomEvent("state-change", { bubbles: true }));
});
todoList.addEventListener("dragend", () => {
    if (document.body.contains(dropTarget)) {
        dropTarget.remove();
    }
});

document.body.appendChild(todoList);

window.addEventListener("message", (event) => {
    const message = event.data;
    switch (message.type) {
        case "addItem":
            todoList.addItem();
            break;
        case "setItems":
            todoList.setItems(message.args);
            break;
    }
});
