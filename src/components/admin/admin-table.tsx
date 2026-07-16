"use client";

import { Pencil, Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Column<T> {
  label: string;
  render: (item: T) => React.ReactNode;
}

interface AdminTableProps<T extends { id?: string }> {
  title: string;
  items: T[];
  columns: Column<T>[];
  onAdd: () => void;
  onEdit: (item: T) => void;
  onDelete: (item: T) => void;
}

export function AdminTable<T extends { id?: string }>({
  title,
  items,
  columns,
  onAdd,
  onEdit,
  onDelete,
}: AdminTableProps<T>) {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">{title}</h2>
        <Button variant="primary" size="sm" onClick={onAdd}>
          <Plus className="h-4 w-4" /> Add New
        </Button>
      </div>
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                {columns.map((col) => (
                  <th key={col.label} className="text-left px-4 py-3 text-muted font-medium">
                    {col.label}
                  </th>
                ))}
                <th className="text-right px-4 py-3 text-muted font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 && (
                <tr>
                  <td colSpan={columns.length + 1} className="text-center py-10 text-muted">
                    No items yet.
                  </td>
                </tr>
              )}
              {items.map((item, i) => (
                <tr
                  key={item.id ?? i}
                  className="border-b border-white/5 hover:bg-white/3 transition-colors"
                >
                  {columns.map((col) => (
                    <td key={col.label} className="px-4 py-3 align-middle">
                      {col.render(item)}
                    </td>
                  ))}
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => onEdit(item)}
                        className="p-2 rounded-lg hover:bg-blue/10 text-blue transition-colors"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => onDelete(item)}
                        className="p-2 rounded-lg hover:bg-red/10 text-red transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
