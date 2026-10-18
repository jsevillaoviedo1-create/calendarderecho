import React, { useState, useEffect, useRef } from 'react';
import { useCalendar } from '../context/CalendarContext';
import { useAgenda } from '../context/AgendaContext';
import {
  parseScheduleImageWithFallback,
  getStoredGeminiApiKey,
  setStoredGeminiApiKey,
} from '../lib/geminiParser';
import {
  Camera,
  Upload,
  Sparkles,
  X,
  Check,
  AlertCircle,
  Calendar,
  Clock,
  MapPin,
  Tag,
  Trash2,
  Plus,
  Loader2,
  Image as ImageIcon,
  CheckCircle2,
  BookOpen,
  Key,
  ChevronDown,
  ChevronUp,
  Server,
  RefreshCw,
} from 'lucide-react';

interface ParsedEventDraft {
  id: string;
  selected: boolean;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  category: string;
  description: string;
}

interface ImageScheduleScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ImageScheduleScannerModal({ isOpen, onClose }: ImageScheduleScannerModalProps) {
  const { allCategories, createEvent } = useCalendar();
  const { createTask } = useAgenda();

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>('image/jpeg');
  const [fileName, setFileName] = useState<string>('');

  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successCount, setSuccessCount] = useState<number | null>(null);

  const [parsedEvents, setParsedEvents] = useState<ParsedEventDraft[]>([]);
  const [alsoAddToAgenda, setAlsoAddToAgenda] = useState(true);
  const [isDragOver, setIsDragOver] = useState(false);

  // Gemini API Configuration & Diagnostics
  const [showApiSettings, setShowApiSettings] = useState(false);
  const [personalApiKey, setPersonalApiKey] = useState(getStoredGeminiApiKey() || '');
  const [keySavedMessage, setKeySavedMessage] = useState(false);
  const [serverCheckStatus, setServerCheckStatus] = useState<{
    tested: boolean;
    ok: boolean;
    message: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSavePersonalApiKey = () => {
    setStoredGeminiApiKey(personalApiKey);
    setKeySavedMessage(true);
    setTimeout(() => setKeySavedMessage(false), 3000);
  };

  const handleCheckApiStatus = async () => {
    try {
      const res = await fetch('/api/ai/health');
      if (res.ok) {
        const data = await res.json();
        setServerCheckStatus({
          tested: true,
          ok: true,
          message: `Servidor conectado con IA activa (Modelo: ${data.recommendedModel || 'gemini-3.8-flash'})`,
        });
      } else {
        setServerCheckStatus({
          tested: true,
          ok: false,
          message: `El servidor respondió con código ${res.status}. Puedes utilizar tu clave personal directa.`,
        });
      }
    } catch {
      setServerCheckStatus({
        tested: true,
        ok: false,
        message: 'Servidor local no detectado. Si estás en móvil o estático, introduce tu clave personal de Gemini abajo.',
      });
    }
  };

  // Global paste handler when modal is open
  useEffect(() => {
    if (!isOpen) return;

    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) {
            processFile(file);
            e.preventDefault();
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [isOpen]);

  // Reset state when closed
  useEffect(() => {
    if (!isOpen) {
      setImagePreview(null);
      setImageBase64(null);
      setParsedEvents([]);
      setError(null);
      setSuccessCount(null);
      setAnalyzing(false);
      setSaving(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Por favor selecciona un archivo de imagen válido (PNG, JPG, WEBP).');
      return;
    }

    setError(null);
    setSuccessCount(null);
    setParsedEvents([]);
    setFileName(file.name || 'captura-horario.png');
    setMimeType(file.type || 'image/jpeg');

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const maxDim = 2000;
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const optimized = canvas.toDataURL('image/jpeg', 0.92);
            setImagePreview(optimized);
            setImageBase64(optimized);
            setMimeType('image/jpeg');
            return;
          }
        }
        setImagePreview(dataUrl);
        setImageBase64(dataUrl);
      };
      img.onerror = () => {
        setImagePreview(dataUrl);
        setImageBase64(dataUrl);
      };
      img.src = dataUrl;
    };
    reader.onerror = () => {
      setError('Error al leer el archivo de imagen.');
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  // Call Gemini API with automatic fallback across local dev, Netlify functions, and client
  const handleAnalyzeImage = async () => {
    if (!imageBase64) {
      setError('Pega o selecciona una foto del cuadrante primero.');
      return;
    }

    setAnalyzing(true);
    setError(null);

    try {
      const data = await parseScheduleImageWithFallback({
        imageBase64,
        mimeType,
        currentYear: new Date().getFullYear(),
        availableCategories: allCategories.map((c) => c.name),
      });

      const rawEvents = data.events || [];

      if (!rawEvents || rawEvents.length === 0) {
        setError('No se encontraron horarios ni clases en la imagen. Intenta con una foto más nítida o recortada.');
        setAnalyzing(false);
        return;
      }

      // Map raw events to editable drafts
      const drafts: ParsedEventDraft[] = rawEvents.map((ev: any, idx: number) => {
        // Find best matching category
        let matchedCat = allCategories.find(
          (c) => c.name.toLowerCase() === (ev.category || '').toLowerCase()
        )?.name;

        if (!matchedCat) {
          // If title has examen or final
          const lowTitle = (ev.title || '').toLowerCase();
          if (lowTitle.includes('final')) matchedCat = 'Examen final';
          else if (lowTitle.includes('parcial')) matchedCat = 'Parciales';
          else matchedCat = 'Estudio';
        }

        // Format date: fallback to today if invalid
        let finalDate = ev.date;
        if (!finalDate || !/^\d{4}-\d{2}-\d{2}$/.test(finalDate)) {
          const now = new Date();
          finalDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        }

        return {
          id: `draft_${Date.now()}_${idx}`,
          selected: true,
          title: ev.title || 'Clase / Tarea',
          date: finalDate,
          startTime: ev.startTime || '09:00',
          endTime: ev.endTime || '10:30',
          location: ev.location || '',
          category: matchedCat,
          description: ev.description || '',
        };
      });

      setParsedEvents(drafts);
    } catch (err: any) {
      console.error('Error analyzing schedule image:', err);
      setError(err.message || 'Error al conectar con la IA para analizar la imagen.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleToggleSelect = (id: string) => {
    setParsedEvents((prev) =>
      prev.map((ev) => (ev.id === id ? { ...ev, selected: !ev.selected } : ev))
    );
  };

  const handleSelectAll = (select: boolean) => {
    setParsedEvents((prev) => prev.map((ev) => ({ ...ev, selected: select })));
  };

  const handleUpdateDraft = (id: string, field: keyof ParsedEventDraft, value: any) => {
    setParsedEvents((prev) =>
      prev.map((ev) => (ev.id === id ? { ...ev, [field]: value } : ev))
    );
  };

  const handleDeleteDraft = (id: string) => {
    setParsedEvents((prev) => prev.filter((ev) => ev.id !== id));
  };

  const handleAddNewDraft = () => {
    const today = new Date().toISOString().split('T')[0];
    const newDraft: ParsedEventDraft = {
      id: `draft_${Date.now()}_manual`,
      selected: true,
      title: 'Derecho Romano',
      date: today,
      startTime: '10:00',
      endTime: '11:30',
      location: 'aula 110',
      category: 'Estudio',
      description: '',
    };
    setParsedEvents((prev) => [...prev, newDraft]);
  };

  // Save selected events to Calendar (and Agenda if checked)
  const handleSaveToCalendar = async () => {
    const selectedDrafts = parsedEvents.filter((ev) => ev.selected);
    if (selectedDrafts.length === 0) {
      setError('Por favor selecciona al menos un evento para añadir.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      let count = 0;
      for (const draft of selectedDrafts) {
        // Resolve category color
        const catObj = allCategories.find((c) => c.name === draft.category);
        const color = catObj ? catObj.color : '#8b5cf6';

        // Start and end ISO strings
        const startISO = `${draft.date}T${draft.startTime || '09:00'}:00`;
        const endISO = `${draft.date}T${draft.endTime || '10:30'}:00`;

        // 1. Create calendar event
        await createEvent({
          title: draft.title,
          start: startISO,
          end: endISO,
          location: draft.location || undefined,
          category: draft.category,
          color,
          description: draft.description || undefined,
          allDay: false,
        });

        // 2. Optionally create agenda task for day-by-day view
        if (alsoAddToAgenda) {
          try {
            let semester: '1er semestre' | '2o semestre' | 'General' = '1er semestre';
            let matchedSubject: string = draft.title;

            const lowerTitle = draft.title.toLowerCase();
            if (lowerTitle.includes('constitucional') || lowerTitle.includes('civil') || lowerTitle.includes('penal') || lowerTitle.includes('internacional')) {
              semester = '2o semestre';
            } else if (lowerTitle.includes('romano') || lowerTitle.includes('historia') || lowerTitle.includes('eclesi') || lowerTitle.includes('econom') || lowerTitle.includes('teor')) {
              semester = '1er semestre';
            }

            await createTask({
              title: draft.title,
              date: draft.date,
              time: draft.startTime,
              semester,
              subject: matchedSubject,
              description: draft.location ? `Ubicación: ${draft.location}${draft.description ? ` • ${draft.description}` : ''}` : draft.description,
              completed: false,
              priority: draft.category === 'Urgencia' ? 'urgente' : draft.category.includes('Examen') || draft.category.includes('Parcial') ? 'alta' : 'media',
            });
          } catch (e) {
            console.warn('Could not add to agenda task', e);
          }
        }

        count++;
      }

      setSuccessCount(count);
      setParsedEvents([]);
      setImagePreview(null);
      setImageBase64(null);
    } catch (err: any) {
      console.error('Error saving events:', err);
      setError(err.message || 'Error guardando los eventos en el calendario.');
    } finally {
      setSaving(false);
    }
  };

  const selectedCount = parsedEvents.filter((ev) => ev.selected).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-4xl bg-gradient-to-b from-neutral-900/98 via-zinc-900/98 to-neutral-900/98 border border-yellow-500/40 ring-1 ring-yellow-400/20 rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.85),inset_0_1px_1px_rgba(255,255,255,0.08),0_0_30px_rgba(234,179,8,0.15)] overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header with HUD Aesthetic */}
        <div className="px-6 py-4 border-b border-yellow-500/25 bg-neutral-950/70 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 flex items-center justify-center shadow-md shadow-yellow-400/30 text-black">
              <Sparkles className="w-5 h-5 text-black stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span>Escanear Horario o Cuadrante con Foto</span>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-yellow-400/20 text-yellow-300 border border-yellow-500/35 px-2 py-0.5 rounded-full">
                  IA Automática
                </span>
              </h3>
              <p className="text-xs text-yellow-300/70">
                Pega una foto con <kbd className="px-1.5 py-0.5 bg-neutral-800 rounded border border-yellow-500/30 font-mono text-[10px] text-yellow-300">Ctrl + V</kbd> o sube una imagen de tu horario.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-yellow-400/70 hover:text-white hover:bg-neutral-800 border border-transparent hover:border-yellow-500/30 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
          {/* Success Banner */}
          {successCount !== null && (
            <div className="p-4 bg-emerald-500/15 border border-emerald-500/35 rounded-2xl text-xs text-emerald-300 flex items-center justify-between gap-3 animate-in fade-in">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <h4 className="font-bold text-white text-sm">
                    ¡{successCount} {successCount === 1 ? 'evento añadido' : 'eventos añadidos'} con éxito!
                  </h4>
                  <p className="text-emerald-400/90 text-xs mt-0.5">
                    Se han guardado en tu calendario con sus fechas, aulas y categorías correspondientes.
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-yellow-400 to-amber-400 text-black font-extrabold text-xs shadow-md shadow-yellow-400/20 transition-all shrink-0 cursor-pointer"
              >
                Ver en Calendario
              </button>
            </div>
          )}

          {/* Error Banner */}
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-xs text-red-300 flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-semibold text-red-200">Atención: </span>
                <span>{error}</span>
              </div>
            </div>
          )}

          {/* Gemini API Status & Configuration Collapsible with HUD aesthetic */}
          <div className="bg-neutral-950/70 border border-yellow-500/30 rounded-2xl overflow-hidden transition-all shadow-inner">
            <button
              type="button"
              onClick={() => setShowApiSettings(!showApiSettings)}
              className="w-full px-4 py-3 flex items-center justify-between text-xs text-slate-300 hover:text-white hover:bg-neutral-800/60 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-yellow-400" />
                <span className="font-semibold text-white">
                  Ajustes y Conexión de API Gemini
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-400/15 text-yellow-300 border border-yellow-500/30 font-medium">
                  {personalApiKey ? 'Clave personalizada activa' : 'Servidor listo'}
                </span>
              </div>
              <div className="flex items-center gap-1 text-yellow-400/80">
                <span className="text-[11px] hidden sm:inline">
                  {showApiSettings ? 'Ocultar ajustes' : 'Ver / Cambiar clave'}
                </span>
                {showApiSettings ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            </button>

            {showApiSettings && (
              <div className="p-4 border-t border-yellow-500/20 bg-neutral-900/70 space-y-3 text-xs animate-in fade-in duration-150">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                  <div className="flex-1">
                    <label className="block text-[11px] font-semibold text-yellow-300/80 mb-1">
                      Clave de API de Google Gemini (Opcional si usas el servidor):
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="password"
                        placeholder="Pega aquí tu clave (AIzaSy...)"
                        value={personalApiKey}
                        onChange={(e) => setPersonalApiKey(e.target.value)}
                        className="flex-1 bg-neutral-950 border border-yellow-500/30 rounded-xl px-3 py-2 text-xs text-white placeholder-yellow-300/40 focus:outline-none focus:border-yellow-400 font-mono"
                      />
                      <button
                        type="button"
                        onClick={handleSavePersonalApiKey}
                        className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-yellow-400 to-amber-400 text-black font-extrabold text-xs transition-colors shrink-0 cursor-pointer shadow-sm"
                      >
                        Guardar
                      </button>
                    </div>
                    {keySavedMessage && (
                      <p className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" />
                        <span>Clave guardada con éxito en tu navegador.</span>
                      </p>
                    )}
                  </div>

                  <div className="sm:self-end">
                    <button
                      type="button"
                      onClick={handleCheckApiStatus}
                      className="w-full sm:w-auto px-3 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-yellow-300 hover:text-white border border-yellow-500/30 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-yellow-400" />
                      <span>Comprobar conexión</span>
                    </button>
                  </div>
                </div>

                {serverCheckStatus && (
                  <div
                    className={`p-2.5 rounded-xl border flex items-center gap-2 text-[11px] ${
                      serverCheckStatus.ok
                        ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300'
                        : 'bg-amber-950/30 border-amber-500/30 text-amber-300'
                    }`}
                  >
                    <Server className="w-3.5 h-3.5 shrink-0" />
                    <span>{serverCheckStatus.message}</span>
                  </div>
                )}

                <p className="text-[11px] text-yellow-300/70 leading-relaxed">
                  Si tu servidor o Netlify no tienen configurada la variable <code className="text-yellow-300 font-mono">GEMINI_API_KEY</code>, puedes pegar aquí tu clave personal de Gemini para que el escáner funcione de forma directa y autónoma sin error 404.
                </p>
              </div>
            )}
          </div>

          {/* Upload / Paste Area (when no results yet) */}
          {parsedEvents.length === 0 && (
            <div className="space-y-4">
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-3xl p-8 sm:p-10 text-center transition-all cursor-pointer relative group ${
                  isDragOver
                    ? 'border-yellow-400 bg-yellow-400/10 scale-[0.99]'
                    : imagePreview
                    ? 'border-yellow-500/50 bg-neutral-950/70'
                    : 'border-yellow-500/30 hover:border-yellow-400 bg-neutral-900/60 hover:bg-neutral-900/90'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileInputChange}
                  className="hidden"
                />

                {imagePreview ? (
                  <div className="flex flex-col items-center gap-4">
                    <div className="relative rounded-2xl overflow-hidden border border-yellow-500/35 shadow-xl max-h-64 max-w-md w-full bg-neutral-950">
                      <img
                        src={imagePreview}
                        alt="Vista previa del horario"
                        className="w-full h-auto object-contain max-h-64"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-3">
                        <span className="text-xs font-mono text-yellow-300 truncate">{fileName}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setImagePreview(null);
                          setImageBase64(null);
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs text-yellow-300 hover:text-white border border-yellow-500/30 transition-colors"
                      >
                        Cambiar foto
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center space-y-3">
                    <div className="w-16 h-16 rounded-2xl bg-yellow-400/15 border border-yellow-500/30 text-yellow-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Camera className="w-8 h-8" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm sm:text-base font-bold text-white">
                        Pega una foto de tu horario o cuadrante aquí
                      </h4>
                      <p className="text-xs text-yellow-300/70 max-w-md mx-auto">
                        Copia una captura con <kbd className="px-1.5 py-0.5 bg-neutral-800 rounded border border-yellow-500/30 font-mono text-[10px] text-yellow-400">Ctrl + V</kbd> en cualquier parte, arrastra el archivo o haz clic para subir una foto.
                      </p>
                    </div>
                    <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-neutral-800/90 text-xs text-yellow-300 font-semibold border border-yellow-500/35 mt-2 shadow-inner">
                      <Upload className="w-3.5 h-3.5 text-yellow-400" />
                      <span>Seleccionar foto o captura</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Example box with HUD aesthetic */}
              <div className="p-4 bg-neutral-950/70 border border-yellow-500/30 rounded-2xl flex items-start gap-3 shadow-inner">
                <div className="w-8 h-8 rounded-xl bg-yellow-400/15 text-yellow-400 flex items-center justify-center shrink-0 mt-0.5 border border-yellow-500/25">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="text-xs text-slate-300 leading-relaxed">
                  <span className="font-bold text-white">Ejemplo de cuadrante detectado: </span>
                  <span className="font-mono text-yellow-300 font-semibold">"Derecho romano 14/12 aula 110 10:00-11:30"</span>
                  <p className="mt-1 text-yellow-300/70">
                    La inteligencia artificial leerá el texto de la imagen, detectará la asignatura, fecha, aula/ubicación, hora de inicio y fin, y asignará la categoría adecuada automáticamente.
                  </p>
                </div>
              </div>

              {/* Analyze CTA */}
              {imagePreview && (
                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    disabled={analyzing}
                    onClick={handleAnalyzeImage}
                    className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 hover:from-yellow-300 hover:to-amber-300 text-black font-extrabold text-sm shadow-xl shadow-yellow-400/30 flex items-center justify-center gap-2 transition-all active:scale-98 disabled:opacity-60 cursor-pointer"
                  >
                    {analyzing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-black" />
                        <span>Analizando cuadrante con IA...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-black stroke-[2.5]" />
                        <span>Extraer Horario con IA</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Results Table & Editor (after parsing) */}
          {parsedEvents.length > 0 && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-neutral-950/70 border border-yellow-500/30 rounded-2xl shadow-inner">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Se detectaron {parsedEvents.length} eventos en el cuadrante</span>
                  </h4>
                  <p className="text-xs text-yellow-300/70 mt-0.5">
                    Revisa las fechas, horas y aulas detectadas. Puedes editar cualquier campo antes de añadirlos al calendario.
                  </p>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    type="button"
                    onClick={() => handleSelectAll(true)}
                    className="text-[11px] font-bold text-yellow-400 hover:text-white px-2 py-1 rounded-lg hover:bg-neutral-800"
                  >
                    Seleccionar todos
                  </button>
                  <span className="text-yellow-500/50">•</span>
                  <button
                    type="button"
                    onClick={() => handleSelectAll(false)}
                    className="text-[11px] font-medium text-slate-400 hover:text-white px-2 py-1 rounded-lg hover:bg-neutral-800"
                  >
                    Deseleccionar
                  </button>
                </div>
              </div>

              {/* Event items list */}
              <div className="space-y-3">
                {parsedEvents.map((draft, idx) => (
                  <div
                    key={draft.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      draft.selected
                        ? 'bg-neutral-900/90 border-yellow-500/40 shadow-md ring-1 ring-yellow-400/20'
                        : 'bg-neutral-950/60 border-neutral-800 opacity-60'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Checkbox */}
                      <input
                        type="checkbox"
                        checked={draft.selected}
                        onChange={() => handleToggleSelect(draft.id)}
                        className="mt-2 w-4 h-4 rounded text-yellow-400 bg-neutral-950 border-yellow-500/40 focus:ring-yellow-400 cursor-pointer accent-yellow-400"
                      />

                      {/* Main Fields Grid */}
                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-12 gap-3">
                        {/* Title / Subject */}
                        <div className="sm:col-span-5">
                          <label className="block text-[10px] font-semibold text-yellow-300/80 mb-1">
                            Asignatura / Título
                          </label>
                          <input
                            type="text"
                            value={draft.title}
                            onChange={(e) => handleUpdateDraft(draft.id, 'title', e.target.value)}
                            className="w-full bg-neutral-950 border border-yellow-500/30 rounded-xl px-3 py-1.5 text-xs text-white placeholder-yellow-300/40 focus:outline-none focus:ring-2 focus:ring-yellow-400/30"
                            placeholder="Ej. Derecho Romano"
                          />
                        </div>

                        {/* Date */}
                        <div className="sm:col-span-3">
                          <label className="block text-[10px] font-semibold text-yellow-300/80 mb-1 flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-yellow-400" />
                            <span>Fecha</span>
                          </label>
                          <input
                            type="date"
                            value={draft.date}
                            onChange={(e) => handleUpdateDraft(draft.id, 'date', e.target.value)}
                            className="w-full bg-neutral-950 border border-yellow-500/30 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-yellow-400/30 [color-scheme:dark]"
                          />
                        </div>

                        {/* Start and End Times */}
                        <div className="sm:col-span-4 flex items-center gap-1.5">
                          <div className="flex-1">
                            <label className="block text-[10px] font-semibold text-yellow-300/80 mb-1 flex items-center gap-1">
                              <Clock className="w-3 h-3 text-yellow-400" />
                              <span>Inicio</span>
                            </label>
                            <input
                              type="time"
                              value={draft.startTime}
                              onChange={(e) => handleUpdateDraft(draft.id, 'startTime', e.target.value)}
                              className="w-full bg-neutral-950 border border-yellow-500/30 rounded-xl px-2 py-1.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-yellow-400/30 [color-scheme:dark]"
                            />
                          </div>
                          <span className="text-yellow-500/60 mt-5">-</span>
                          <div className="flex-1">
                            <label className="block text-[10px] font-semibold text-yellow-300/80 mb-1">
                              Fin
                            </label>
                            <input
                              type="time"
                              value={draft.endTime}
                              onChange={(e) => handleUpdateDraft(draft.id, 'endTime', e.target.value)}
                              className="w-full bg-neutral-950 border border-yellow-500/30 rounded-xl px-2 py-1.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-yellow-400/30 [color-scheme:dark]"
                            />
                          </div>
                        </div>

                        {/* Location / Aula */}
                        <div className="sm:col-span-6">
                          <label className="block text-[10px] font-semibold text-yellow-300/80 mb-1 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-yellow-400" />
                            <span>Aula / Ubicación</span>
                          </label>
                          <input
                            type="text"
                            value={draft.location}
                            onChange={(e) => handleUpdateDraft(draft.id, 'location', e.target.value)}
                            placeholder="Ej. aula 110, Aula Magna..."
                            className="w-full bg-neutral-950 border border-yellow-500/30 rounded-xl px-3 py-1.5 text-xs text-white placeholder-yellow-300/40 focus:outline-none focus:ring-2 focus:ring-yellow-400/30"
                          />
                        </div>

                        {/* Category Selector */}
                        <div className="sm:col-span-5">
                          <label className="block text-[10px] font-semibold text-yellow-300/80 mb-1 flex items-center gap-1">
                            <Tag className="w-3 h-3 text-yellow-400" />
                            <span>Categoría</span>
                          </label>
                          <select
                            value={draft.category}
                            onChange={(e) => handleUpdateDraft(draft.id, 'category', e.target.value)}
                            className="w-full bg-neutral-950 border border-yellow-500/30 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-yellow-400/30 [color-scheme:dark]"
                          >
                            {allCategories.map((c) => (
                              <option key={c.id} value={c.name} className="bg-neutral-900 text-white">
                                {c.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Delete row */}
                        <div className="sm:col-span-1 flex items-end justify-center pb-0.5">
                          <button
                            type="button"
                            onClick={() => handleDeleteDraft(draft.id)}
                            title="Eliminar este evento"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add manual row button */}
              <button
                type="button"
                onClick={handleAddNewDraft}
                className="w-full py-2.5 rounded-xl border border-dashed border-yellow-500/30 hover:border-yellow-400/60 bg-neutral-900/60 hover:bg-neutral-900 text-xs font-bold text-yellow-400 hover:text-white transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-yellow-400" />
                <span>Añadir otra clase o evento manualmente</span>
              </button>

              {/* Bottom controls & Save bar */}
              <div className="pt-4 border-t border-yellow-500/25 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 text-xs text-yellow-300/90 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={alsoAddToAgenda}
                      onChange={(e) => setAlsoAddToAgenda(e.target.checked)}
                      className="w-4 h-4 rounded text-yellow-400 bg-neutral-950 border-yellow-500/40 focus:ring-yellow-400 cursor-pointer accent-yellow-400"
                    />
                    <BookOpen className="w-3.5 h-3.5 text-yellow-400" />
                    <span>Añadir también a la Agenda (Día a Día)</span>
                  </label>
                </div>

                <div className="flex items-center gap-3 justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setParsedEvents([]);
                      setImagePreview(null);
                      setImageBase64(null);
                    }}
                    className="px-4 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-yellow-300 hover:text-white border border-yellow-500/30 transition-colors cursor-pointer"
                  >
                    Escanear otra foto
                  </button>

                  <button
                    type="button"
                    disabled={saving || selectedCount === 0}
                    onClick={handleSaveToCalendar}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 hover:from-yellow-300 hover:to-amber-300 text-black font-extrabold text-xs shadow-lg shadow-yellow-400/30 transition-all active:scale-98 disabled:opacity-50 cursor-pointer flex items-center gap-2"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-black" />
                        <span>Añadiendo al calendario...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4 text-black stroke-[3]" />
                        <span>Añadir {selectedCount} {selectedCount === 1 ? 'evento' : 'eventos'} al Calendario</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
