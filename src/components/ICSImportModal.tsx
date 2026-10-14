import React, { useState, useRef } from 'react';
import { useCalendar } from '../context/CalendarContext';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { parseICS, exportToICS, downloadICS } from '../lib/ics';
import { CalendarEventItem } from '../types/calendar';
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
  Download,
  Calendar,
  X,
  Sparkles,
} from 'lucide-react';

interface ICSImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ICSImportModal({ isOpen, onClose }: ICSImportModalProps) {
  const { importEventsBatch, events } = useCalendar();
  const { currentUser } = useAuth();
  const { notifyEventChange } = useNotifications();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [parsedEvents, setParsedEvents] = useState<CalendarEventItem[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [importedCount, setImportedCount] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  if (!isOpen) return null;

  const processFile = async (file: File) => {
    if (!currentUser) return;
    setError(null);
    setImportedCount(null);
    setFileName(file.name);

    try {
      const text = await file.text();
      const eventsList = parseICS(text, currentUser.uid);
      if (eventsList.length === 0) {
        setError('No se encontraron eventos válidos en el archivo .ics.');
        setParsedEvents([]);
      } else {
        setParsedEvents(eventsList);
      }
    } catch (err: any) {
      setError(err.message || 'Error al procesar el archivo iCalendar.');
      setParsedEvents([]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && (file.name.endsWith('.ics') || file.name.endsWith('.ical') || file.type.includes('calendar'))) {
      processFile(file);
    } else {
      setError('Por favor arrastra un archivo con extensión .ics.');
    }
  };

  const handleImport = async () => {
    if (parsedEvents.length === 0) return;
    setImporting(true);
    setError(null);
    try {
      const count = await importEventsBatch(parsedEvents);
      setImportedCount(count);
      await notifyEventChange(
        '📥 Eventos ICS Importados',
        `Se han importado exitosamente ${count} eventos a tu calendario de Chronos.`,
        undefined,
        'ics_imported'
      );
      setParsedEvents([]);
    } catch (err: any) {
      setError(err.message || 'Error importando eventos a Firestore.');
    } finally {
      setImporting(false);
    }
  };

  const loadSampleICS = () => {
    if (!currentUser) return;
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');

    const sampleICS = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Chronos//Sample//ES
BEGIN:VEVENT
UID:sample_1@chronos
SUMMARY:Revisión Trimestral de Objetivos (OKRs)
DESCRIPTION:Revisión de métricas de crecimiento y arquitectura de software.
LOCATION:Sala Principal / Google Meet
DTSTART:${y}${m}${d}T100000Z
DTEND:${y}${m}${d}T113000Z
CATEGORIES:Trabajo
END:VEVENT
BEGIN:VEVENT
UID:sample_2@chronos
SUMMARY:Sesión de Entrenamiento Funcional
DESCRIPTION:Entrenamiento en gimnasio y cardio.
LOCATION:Club Deportivo Central
DTSTART:${y}${m}${d}T180000Z
DTEND:${y}${m}${d}T190000Z
CATEGORIES:Salud & Deporte
END:VEVENT
BEGIN:VEVENT
UID:sample_3@chronos
SUMMARY:Cena con Amigos
DESCRIPTION:Celebración de cumpleaños.
LOCATION:Restaurante La Terraza
DTSTART:${y}${m}${d}T210000Z
DTEND:${y}${m}${d}T230000Z
CATEGORIES:Personal
END:VEVENT
END:VCALENDAR`;

    try {
      const eventsList = parseICS(sampleICS, currentUser.uid);
      setParsedEvents(eventsList);
      setFileName('ejemplo-eventos.ics');
      setError(null);
      setImportedCount(null);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleExportAll = () => {
    if (events.length === 0) {
      setError('No tienes eventos en tu calendario para exportar.');
      return;
    }
    const icsContent = exportToICS(events, 'Mi Calendario Chronos');
    downloadICS(icsContent, `chronos_export_${new Date().toISOString().split('T')[0]}.ics`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden p-6 relative max-h-[90vh] flex flex-col">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Title */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
            <UploadCloud className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Importar y Exportar Archivos ICS</h3>
            <p className="text-xs text-slate-400">
              Compatible con Google Calendar, Apple Calendar, Outlook y ical.js.
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-300 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {importedCount !== null && (
          <div className="mb-4 p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
            <div>
              <p className="font-semibold text-emerald-200">
                ¡{importedCount} eventos importados a Firestore con éxito!
              </p>
              <p className="text-emerald-400/80 text-[11px] mt-0.5">
                Ya están sincronizados en tiempo real en tu calendario.
              </p>
            </div>
          </div>
        )}

        {/* Drag & Drop Zone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
            isDragging
              ? 'border-indigo-500 bg-indigo-500/10'
              : 'border-slate-800 hover:border-slate-700 bg-slate-950/40 hover:bg-slate-950/60'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".ics,.ical,text/calendar"
            onChange={handleFileChange}
            className="hidden"
          />
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto mb-3">
            <FileText className="w-6 h-6" />
          </div>
          <p className="text-sm font-semibold text-white">
            Arrastra tu archivo <span className="text-indigo-400">.ics</span> aquí
          </p>
          <p className="text-xs text-slate-400 mt-1">O haz clic para explorar en tu equipo</p>

          <div className="mt-4 flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                loadSampleICS();
              }}
              className="text-[11px] font-medium text-indigo-400 hover:text-indigo-300 px-3 py-1 rounded-full bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 transition-colors flex items-center gap-1"
            >
              <Sparkles className="w-3 h-3" />
              <span>Cargar ejemplo rápido (.ics)</span>
            </button>
          </div>
        </div>

        {/* Parsed Events Preview */}
        {parsedEvents.length > 0 && (
          <div className="mt-4 flex-1 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-300">
                Eventos detectados en <span className="text-indigo-400 font-mono">{fileName}</span>:
              </span>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300">
                {parsedEvents.length} eventos
              </span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-48 border border-slate-800 rounded-xl p-2 bg-slate-950/40">
              {parsedEvents.map((ev, index) => (
                <div
                  key={index}
                  className="p-2.5 rounded-lg bg-slate-900 border border-slate-800/80 flex items-center justify-between text-xs"
                >
                  <div className="min-w-0 pr-2">
                    <p className="font-semibold text-white truncate">{ev.title}</p>
                    <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                      <Calendar className="w-3 h-3 text-slate-500 shrink-0" />
                      <span>{new Date(ev.start).toLocaleString()}</span>
                      {ev.location && <span className="truncate"> • {ev.location}</span>}
                    </p>
                  </div>
                  <span
                    className="px-2 py-0.5 rounded text-[10px] font-medium shrink-0"
                    style={{ backgroundColor: `${ev.color}20`, color: ev.color }}
                  >
                    {ev.category}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-3">
              <button
                onClick={handleImport}
                disabled={importing}
                className="w-full py-3 px-4 rounded-xl font-semibold bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-lg shadow-indigo-600/25 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  {importing
                    ? 'Importando eventos a Firestore...'
                    : `Confirmar e Importar ${parsedEvents.length} eventos a Firestore`}
                </span>
              </button>
            </div>
          </div>
        )}

        {/* Export Section */}
        <div className="mt-5 pt-4 border-t border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-300">Exportar tus eventos</p>
            <p className="text-[11px] text-slate-500">Descarga un archivo .ics con tus eventos actuales.</p>
          </div>
          <button
            onClick={handleExportAll}
            disabled={events.length === 0}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/80 flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-40"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exportar .ICS</span>
          </button>
        </div>
      </div>
    </div>
  );
}
