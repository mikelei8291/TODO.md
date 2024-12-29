import { TodoList } from "./components/todo-list/index.js";

const ITEM_HALF_HEIGHT = 11;
const ITEM_GAP = ITEM_HALF_HEIGHT * 2 + 8;

const vscode = acquireVsCodeApi();
const todoList = new TodoList(vscode);
todoList.id = "todo-list";
todoList.addEventListener("state-change", () => vscode.postMessage(todoList.toArray()));

let dropTarget;
todoList.addEventListener("dragover", (event) => {
    event.preventDefault();
    dropTarget = Array.from(todoList.querySelectorAll("li:not(.dragging)")).map(element => {
        const { y } = element.getBoundingClientRect();
        return { offset: event.clientY - (y + ITEM_HALF_HEIGHT), element };
    }).reduce(
        (closest, item) => item.offset > 0 && item.offset <= ITEM_GAP && item.offset < closest.offset ? item : closest,
        { offset: Infinity }
    ).element;
    if (!dropTarget && event.clientY < ITEM_HALF_HEIGHT) {
        dropTarget = todoList;
    }
});
todoList.addEventListener("drop", (event) => {
    const item = document.getElementById(event.dataTransfer.getData("text/plain"));
    if (dropTarget) {
        if (dropTarget === todoList) {
            todoList.prepend(item);
        } else if (dropTarget.subList) {
            dropTarget.subList.prepend(item);
        } else {
            dropTarget.after(item);
        }
    } else {
        todoList.append(item);
    }
    vscode.postMessage(todoList.toArray());
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
