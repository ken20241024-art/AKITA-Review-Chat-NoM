
import React, { useState, useEffect } from 'react';
import { AppMode, PracticeLevel, TeacherTask } from '../types';
import { getUrlSource } from '../services/integration';

interface HomeProps {
  email: string;
  setEmail: (val: string) => void;
  mode: AppMode;
  setMode: (mode: AppMode) => void;
  level: PracticeLevel;
  setLevel: (level: PracticeLevel) => void;
  uploadedFile: File | null;
  onFileChange: (file: File | null) => void;
  onStart: () => void;
  teacherTask: TeacherTask | null;
  isSyncing?: boolean;
}

export const Home: React.FC<HomeProps> = ({
  email, setEmail, mode, setMode, level, setLevel, uploadedFile, onFileChange, onStart, teacherTask, isSyncing
}) => {
  const [isGasLinked, setIsGasLinked] = useState(true); // Default to true to prevent flicker

  useEffect(() => {
    // integration.ts の判定ロジックと同期させる
    const source = getUrlSource();
    setIsGasLinked(source !== 'NONE');
  }, []);

  return (
    <div className="space-y-12 animate-fadeIn relative z-10">
      <div className="grid grid-cols-2 gap-8">
        <button
          onClick={() => setMode(AppMode.TEACHER_TASK)}
          className={`py-12 px-6 transition-all relative deco-panel corner-stepped ${
            mode === AppMode.TEACHER_TASK
              ? 'bg-[#1B4332] text-[#D4AF37]'
              : 'bg-white/80 text-[#1B4332] opacity-60 hover:opacity-100'
          }`}
        >
          <span className="block text-xl font-bold title-serif">Teacher's task</span>
          <p className="text-[9px] font-bold uppercase tracking-widest mt-2">Curated Session</p>
          {mode === AppMode.TEACHER_TASK && <div className="absolute top-2 right-2 w-2 h-2 bg-[#D4AF37] rounded-full"></div>}
        </button>
        <button
          onClick={() => setMode(AppMode.SELF_STUDY)}
          className={`py-12 px-6 transition-all relative deco-panel corner-stepped ${
            mode === AppMode.SELF_STUDY
              ? 'bg-[#1B4332] text-[#D4AF37]'
              : 'bg-white/80 text-[#1B4332] opacity-60 hover:opacity-100'
          }`}
        >
          <span className="block text-xl font-bold title-serif">Student's task</span>
          <p className="text-[9px] font-bold uppercase tracking-widest mt-2">Independent Study</p>
          {mode === AppMode.SELF_STUDY && <div className="absolute top-2 right-2 w-2 h-2 bg-[#D4AF37] rounded-full"></div>}
        </button>
      </div>

      <div className="deco-panel p-10 md:p-14 space-y-12 shadow-2xl corner-stepped">
        {!isGasLinked && (
          <div className="bg-red-50 border border-red-200 p-4 text-center">
             <p className="text-[10px] font-bold text-red-600 uppercase tracking-widest">
               Warning: GAS Integration Offline. Logs will not be saved.
             </p>
             <p className="text-[8px] text-red-400 uppercase mt-1">Configure 'GLOBAL_GAS_URL' in services/integration.ts</p>
          </div>
        )}

        <div className="space-y-4">
          <label className="text-[11px] font-extrabold uppercase tracking-[0.4em] text-[#1B4332]">student's e-mail</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value.toLowerCase())}
            placeholder="UNIVERSITY_EMAIL@akita-pu.ac.jp"
            className="w-full px-6 py-5 border-2 border-[#1B4332] bg-[#FDFBFF] focus:border-[#D4AF37] outline-none transition-all font-bold text-[#1B4332] placeholder:opacity-30 tracking-tight"
          />
        </div>

        <div className="space-y-6">
          <label className="text-[11px] font-extrabold uppercase tracking-[0.4em] text-[#1B4332]">level</label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.values(PracticeLevel).map((lvl) => (
              <button
                key={lvl}
                disabled={mode === AppMode.TEACHER_TASK}
                onClick={() => setLevel(lvl)}
                className={`py-4 px-2 border font-bold text-[10px] uppercase tracking-widest transition-all ${
                  (mode === AppMode.TEACHER_TASK ? teacherTask?.level === lvl : level === lvl)
                    ? 'bg-[#1B4332] text-[#D4AF37] border-[#D4AF37]'
                    : 'bg-white text-slate-400 border-slate-200 hover:border-[#1B4332] hover:text-[#1B4332]'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <label className="text-[11px] font-extrabold uppercase tracking-[0.4em] text-[#1B4332]">Course Material</label>
          {mode === AppMode.TEACHER_TASK ? (
            <div className="p-8 border-2 border-[#1B4332] border-double bg-[#1B4332]/5 flex items-center justify-between">
              <span className="text-[#1B4332] font-bold uppercase tracking-tight text-lg">
                {teacherTask ? teacherTask.pdfName : (isSyncing ? 'Syncing...' : 'No Task Assigned')}
              </span>
              <span className="text-[9px] font-black text-[#D4AF37] animate-pulse">Ready</span>
            </div>
          ) : (
            <div className="relative border-2 border-[#1B4332] border-dashed hover:border-[#D4AF37] bg-white p-12 transition-all group cursor-pointer overflow-hidden">
              <input
                type="file"
                accept=".pdf"
                onChange={(e) => onFileChange(e.target.files?.[0] || null)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-30"
              />
              <div className="text-center relative z-10 pointer-events-none">
                <div className="w-16 h-16 border-2 border-[#D4AF37] rounded-full mx-auto mb-6 flex items-center justify-center bg-white group-hover:scale-110 transition-transform">
                  <span className="text-3xl text-[#1B4332] font-light">+</span>
                </div>
                {uploadedFile ? (
                  <div className="space-y-2">
                    <p className="text-[#D4AF37] text-sm font-bold uppercase tracking-widest">Document Secured</p>
                    <p className="text-[#1B4332] text-xs font-extrabold truncate max-w-xs mx-auto italic">{uploadedFile.name}</p>
                  </div>
                ) : (
                  <p className="text-[#1B4332] text-[10px] font-extrabold uppercase tracking-[0.3em]">click or drop PDF file</p>
                )}
              </div>
            </div>
          )}
        </div>

        <button
          onClick={onStart}
          disabled={isSyncing}
          className="w-full py-10 button-deco-primary text-xl title-serif shadow-xl disabled:opacity-50"
        >
          {isSyncing ? 'Processing Material...' : 'start session'}
        </button>
      </div>

      <div className="flex justify-center items-center space-x-8 opacity-40">
        <div className="h-0.5 w-16 bg-[#1B4332]"></div>
        <span className="text-[9px] font-bold uppercase tracking-[0.5em]">Akita RC 弐号機</span>
        <div className="h-0.5 w-16 bg-[#1B4332]"></div>
      </div>
    </div>
  );
};
