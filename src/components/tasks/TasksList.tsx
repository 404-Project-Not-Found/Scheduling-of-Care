"use client";

import TaskItem from "./TaskItem";

type Task = {
  id: string;
  title: string;
  nextDue: string;
};

type TasksListProps = {
  tasks: Task[];
};

export default function TasksList({ tasks }: TasksListProps) {
  return (
    <ul className="space-y-3">
      {tasks.map((t) => (
        <TaskItem key={t.id} title={t.title} nextDue={t.nextDue} />
      ))}
    </ul>
  );
}
