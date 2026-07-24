import { useState, useEffect } from "react";
import "./Todo.css";

export default function Todo() {
  const [tasks, setTasks] = useState([]);
  const [input, setInput] = useState("");

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("buzzos-todos");
    if (saved) {
      setTasks(JSON.parse(saved));
    }
  }, []);

  // Save whenever tasks change
  useEffect(() => {
    localStorage.setItem("buzzos-todos", JSON.stringify(tasks));
  }, [tasks]);

  function addTask() {
    if (!input.trim()) return;

    setTasks([
      ...tasks,
      {
        id: Date.now(),
        text: input,
        completed: false
      }
    ]);

    setInput("");
  }

  function toggleTask(id) {
    setTasks(tasks.map(t =>
      t.id === id ? { ...t, completed: !t.completed } : t
    ));
  }

  function deleteTask(id) {
    setTasks(tasks.filter(t => t.id !== id));
  }

  return (
    <div className="todo">
      <div className="todo-input-row">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="New task..."
        />
        <button onClick={addTask}>Add</button>
      </div>

      <div className="todo-list">
        {tasks.map(task => (
          <div key={task.id} className="todo-item">
            <span
              className={task.completed ? "completed" : ""}
              onClick={() => toggleTask(task.id)}
            >
              {task.text}
            </span>
            <button onClick={() => deleteTask(task.id)}>x</button>
          </div>
        ))}
      </div>
    </div>
  );
}
