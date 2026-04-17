import React from 'react';
import { SessionResult } from '../types';

interface Props {
  result: SessionResult;
  onBack: () => void;
}

export const AnalysisReportView: React.FC<Props> = ({ result, onBack }) => {
  return (
    <div className="space-y-10 animate-fadeIn relative z-10">
      <div className="deco-panel shadow-2xl overflow-hidden corner-stepped">
        <div className="bg-[#1B4332] p-12 text-[#D4AF37] flex flex-col md:flex-row justify-between items-center gap-10 relative">
          <div className="absolute inset-0 opacity-10 sunburst-bg"></div>
          <div className="relative z-10 text-center md:text-left">
            <h2 className="text-4xl font-bold title-serif uppercase tracking-widest">Diagnostic Report</h2>
            <div className="h-0.5 w-24 bg-[#D4AF37] mt-4 mb-2"></div>
            <p className="text-[#C0C0C0] text-[9px] font-bold uppercase tracking-[0.5em]">{result.timestamp} • Dossier MK-II</p>
          </div>
          <div className="relative z-10 text-center md:text-right border-l-2 border-[#D4AF37] pl-8">
            <span className="text-[9px] uppercase font-bold tracking-[0.4em] opacity-60">Practice Tier</span>
            <p className="text-5xl font-bold title-serif italic">{result.level}</p>
          </div>
        </div>

        <div className="p-12 space-y-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { label: '推定CEFRレベル', val: result.cefr, color: 'text-[#1B4332]' },
              { label: '推定発音スコア', val: `${result.pronunciationScore}/100`, color: 'text-[#D4AF37]' },
              { label: '発話総語数', val: `${result.wordCount}語`, color: 'text-[#1B4332]' },
              { label: '語彙レベル', val: result.vocabComplexity, color: 'text-[#1B4332]' }
            ].map((stat, i) => (
              <div key={i} className="bg-white border border-[#D4AF37]/30 p-8 text-center shadow-md relative group hover:border-[#D4AF37] transition-colors">
                <p className="text-[9px] font-bold text-[#1B4332]/40 uppercase tracking-widest mb-3">{stat.label}</p>
                <p className={`text-2xl font-bold title-serif ${stat.color}`}>{stat.val}</p>
              </div>
            ))}
          </div>

          <div className="space-y-8">
            <h3 className="text-2xl font-bold text-[#1B4332] uppercase title-serif border-b border-[#1B4332]/10 inline-block pb-2 tracking-widest">Faculty Critique</h3>
            <div className="grid md:grid-cols-2 gap-10">
              <div className="bg-white p-8 border border-[#1B4332] relative">
                <div className="absolute top-0 right-0 w-8 h-8 bg-[#1B4332] flex items-center justify-center text-[#D4AF37] font-bold text-xs italic">!</div>
                <h4 className="text-[10px] font-bold text-[#1B4332] uppercase tracking-widest mb-6 border-b border-[#1B4332]/5 pb-2">Observations & Corrections</h4>
                <ul className="space-y-4 text-[#1B4332] font-medium text-sm leading-relaxed">
                  {(result.mistakes || "").split(';').map((m, i) => (
                    <li key={i} className="flex items-start">
                      <span className="mr-3 text-[#D4AF37]">✦</span>
                      {m.trim() || 'No major errors detected.'}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-[#1B4332] text-[#D4AF37] p-8 border-r-4 border-[#D4AF37] shadow-xl">
                <h4 className="text-[10px] font-bold uppercase tracking-widest mb-6 opacity-60">Advice / アドバイス</h4>
                <p className="text-lg font-bold leading-relaxed italic title-serif">"{result.advice}"</p>
              </div>
            </div>
          </div>

          <div className="flex justify-center pt-10">
            <button
              onClick={onBack}
              className="w-full max-w-xl py-8 bg-[#1B4332] text-[#D4AF37] border-2 border-[#D4AF37] font-bold uppercase tracking-[0.4em] hover:bg-[#D4AF37] hover:text-[#1B4332] transition-all text-sm shadow-2xl corner-stepped"
            >
              Return to Top
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
