import { TodoList } from "./components/todo-list/index.js";

const vscode = acquireVsCodeApi();
const todoList = new TodoList(vscode);
todoList.id = "todo-list";
todoList.addEventListener("state-change", () => vscode.postMessage(todoList.toArray()));
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
