import React, { useState } from 'react';
import { useCalendar } from '../context/CalendarContext';
import { Tag, Plus, Trash2, X, Check, Pencil, Palette } from 'lucide-react';

interface CategoryManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRESET_COLORS = [
  '#3b82f6', // Blue
  '#8b5cf6', // Violet
  '#10b981', // Emerald
  '#f97316', // Orange
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#ef4444', // Red
  '#a855f7', // Purple
  '#e11d48', // Rose / Examen final
  '#6366f1', // Indigo
  '#f59e0b', // Amber
  '#64748b', // Slate
];

export function CategoryManagerModal({ isOpen, onClose }: CategoryManagerModalProps) {
  const { allCategories, createCustomCategory, updateCustomCategory, deleteCustomCategory } = useCalendar();

  const [name, setName] = useState('');
  const [selectedColor, setSelectedColor] = useState('#8b5cf6');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Editing category state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('#8b5cf6');

  if (!isOpen) return null;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Por favor indica un nombre para la categoría.');
      return;
    }

    // Check duplicate
    const exists = allCategories.some(
      (c) => c.name.toLowerCase() === name.trim().toLowerCase()
    );
    if (exists) {
      setError('Ya existe una categoría con este nombre.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await createCustomCategory(name.trim(), selectedColor);
      setName('');
    } catch (err: any) {
      setError(err.message || 'Error creando la categoría.');
    } finally {
      setLoading(false);
    }
  };

  const handleStartEdit = (cat: { id: string; name: string; color: string }) => {
    setEditingId(cat.id);
    setEditName(cat.name);
    setEditColor(cat.color);
    setError(null);
  };

  const handleSaveEdit = async (id: string) => {
    if (!editName.trim()) {
      setError('El nombre no puede estar vacío.');
      return;
    }

    // Duplicate check with other categories
    const exists = allCategories.some(
      (c) => c.id !== id && c.name.toLowerCase() === editName.trim().toLowerCase()
    );
    if (exists) {
      setError('Ya existe otra categoría con este nombre.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await updateCustomCategory(id, editName.trim(), editColor);
      setEditingId(null);
    } catch (err: any) {
      setError(err.message || 'Error actualizando categoría.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, catName: string) => {
    if (!confirm(`¿Eliminar la categoría "${catName}"?`)) return;
    try {
      await deleteCustomCategory(id);
      if (editingId === id) setEditingId(null);
    } catch (err: any) {
      setError(err.message || 'Error eliminando categoría.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 relative flex flex-col max-h-[90vh]">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Tag className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Gestionar Categorías</h3>
            <p className="text-xs text-slate-400">
              Todas las categorías son completamente editables y eliminables.
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-300">
            {error}
          </div>
        )}

        {/* Create new category form */}
        <form onSubmit={handleCreate} className="p-4 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-3 mb-5">
          <h4 className="text-xs font-bold text-white flex items-center gap-1.5 uppercase tracking-wider text-slate-300">
            <Plus className="w-3.5 h-3.5 text-amber-400" />
            <span>Crear nueva categoría</span>
          </h4>

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">Nombre</label>
            <input
              type="text"
              required
              placeholder="Ej. Tareas Derecho, Seminarios, Prácticas..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1.5 flex items-center justify-between">
              <span>Color distintivo</span>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-slate-500 font-mono">{selectedColor}</span>
                <input
                  type="color"
                  value={selectedColor}
                  onChange={(e) => setSelectedColor(e.target.value)}
                  className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent"
                />
              </div>
            </label>
            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setSelectedColor(c)}
                  className={`w-6 h-6 rounded-lg transition-transform cursor-pointer flex items-center justify-center ${
                    selectedColor === c ? 'scale-110 ring-2 ring-white shadow-md' : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: c }}
                >
                  {selectedColor === c && <Check className="w-3 h-3 text-white drop-shadow" />}
                </button>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-400">Vista previa:</span>
              <span
                className="px-2.5 py-1 rounded-lg text-xs font-medium text-white flex items-center gap-1.5 shadow-sm"
                style={{ backgroundColor: selectedColor }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-white shrink-0" />
                <span>{name.trim() || 'Nombre de categoría'}</span>
              </span>
            </div>

            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="px-3.5 py-1.5 text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{loading ? 'Añadiendo...' : 'Añadir Categoría'}</span>
            </button>
          </div>
        </form>

        {/* Existing categories list */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Categorías activas ({allCategories.length})
            </h4>
            <span className="text-[11px] text-slate-500">Editables y eliminables</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {allCategories.map((cat) => {
              const isEditing = editingId === cat.id;

              if (isEditing) {
                return (
                  <div
                    key={cat.id}
                    className="p-3 rounded-xl bg-slate-950 border border-amber-500/50 shadow-md col-span-1 sm:col-span-2 space-y-2.5 animate-in fade-in"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                        <Pencil className="w-3.5 h-3.5" />
                        <span>Editar Categoría</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="text-slate-400 hover:text-white text-xs p-1"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        placeholder="Nombre de la categoría"
                        className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={editColor}
                          onChange={(e) => setEditColor(e.target.value)}
                          className="w-7 h-7 rounded cursor-pointer border-0 bg-transparent"
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveEdit(cat.id)}
                          disabled={loading || !editName.trim()}
                          className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Guardar</span>
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {PRESET_COLORS.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setEditColor(c)}
                          className={`w-5 h-5 rounded-md transition-transform cursor-pointer ${
                            editColor === c ? 'scale-110 ring-2 ring-white' : 'hover:scale-105'
                          }`}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={cat.id}
                  className="p-2.5 rounded-xl bg-slate-950/40 border border-slate-800 flex items-center justify-between gap-2 hover:border-slate-700/80 transition-colors group"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span className="text-xs font-medium text-white truncate">{cat.name}</span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {/* Edit button */}
                    <button
                      onClick={() => handleStartEdit(cat)}
                      title="Editar nombre y color"
                      className="p-1 text-slate-400 hover:text-amber-300 rounded-lg hover:bg-amber-500/10 transition-colors cursor-pointer"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>

                    {/* Delete button */}
                    <button
                      onClick={() => handleDelete(cat.id, cat.name)}
                      title="Eliminar categoría"
                      className="p-1 text-slate-400 hover:text-red-400 rounded-lg hover:bg-red-500/10 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-colors cursor-pointer"
          >
            Listo
          </button>
        </div>
      </div>
    </div>
  );
}
