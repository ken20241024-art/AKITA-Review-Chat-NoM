
import React, { useState, useEffect } from 'react';
import { PracticeLevel, TeacherTask, SessionResult } from '../types';
import { updateGlobalTask, getUrlSource } from '../services/integration';
import { GoogleGenAI } from "@google/genai";

interface AdminDashboardProps {
  onSaveTask: (task: TeacherTask) => void;
  onBack: () => void;
}

const SPREADSHEET_ID = "1KKYsoc7FfTlLAlPQKW5hY3ujaX6ErWqfcWuH9suQK20";
const AUDIO_FOLDER_ID = "1OgMDAH6TpBU9WAJk7POfphN9FdQa8M86";

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onSaveTask, onBack }) => {
  const [level, setLevel] = useState<PracticeLevel>(PracticeLevel.INTERMEDIATE);
  const [pdfName, setPdfName] = useState('');
  const [taskContext, setTaskContext] = useState('');
  const [gasUrl, setGasUrl] = useState('');
  const [activeSource, setActiveSource] = useState<'MANUAL' | 'GLOBAL_CODE' | 'ENV' | 'NONE'>('NONE');
  const [isSaving, setIsSaving] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);

  useEffect(() => {
    const manualUrl = localStorage.getItem('akita_gas_url');
    setGasUrl(manualUrl || '');
    setActiveSource(getUrlSource());
  }, []);

  const handleGasUrlChange = (val: string) => {
    const url = val.trim();
    setGasUrl(url);
    if (url) localStorage.setItem('akita_gas_url', url);
    else localStorage.removeItem('akita_gas_url');
    setActiveSource(getUrlSource());
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPdfName(file.name);
    setIsExtracting(true);

    try {
      const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("Gemini API Key is missing. Please check your environment settings.");
      }

      const ai = new GoogleGenAI({ apiKey });

      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        try {
          const base64 = (reader.result as string).split(',')[1];
          const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: {
              parts: [
                { inlineData: { data: base64, mimeType: "application/pdf" } },
                { text: "Extract the FULL TEXT content from this academic PDF for Socratic discussion. Return only the extracted text." }
              ]
            }
          });

          const text = response.text;
          
          if (text) {
            setTaskContext(text.trim());
          }
        } catch (err) {
          console.error("Extraction error inside reader:", err);
          alert("Failed to extract text from PDF. Please check your API key and network.");
        } finally {
          setIsExtracting(false);
        }
      };
    } catch (err) {
      console.error(err);
      setIsExtracting(false);
      alert(err instanceof Error ? err.message : "Extraction failed.");
    }
  };

  const saveTask = async () => {
    if (!pdfName || !taskContext) return alert('Required fields are missing.');
    setIsSaving(true);
    const newTask: TeacherTask = { pdfName, pdfContent: taskContext, level, updatedAt: new Date().toISOString() };
    const success = await updateGlobalTask(newTask);
    if (success) {
      onSaveTask(newTask);
      alert('Global Task synced.');
    } else {
      alert('Sync failed.');
    }
    setIsSaving(false);
  };

  const gasCode = `/**
 * Google Apps Script for AKITA Review Chat mkII
 * [v2.1 - Enhanced Duplicate Prevention]
 */
const SPREADSHEET_ID = "${SPREADSHEET_ID}";
const AUDIO_FOLDER_ID = "${AUDIO_FOLDER_ID}";

function doGet(e) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    if (e && e.parameter.action === 'get_task') {
      const sheet = ss.getSheetByName('Config') || ss.insertSheet('Config');
      return ContentService.createTextOutput(sheet.getRange(1, 1).getValue() || "null").setMimeType(ContentService.MimeType.JSON);
    }
    return ContentService.createTextOutput("System Online");
  } catch(e) {
    return ContentService.createTextOutput("Error: " + e.toString());
  }
}

function doPost(e) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const payload = JSON.parse(e.postData.contents);
    const action = payload.action;
    const data = payload.data;

    if (action === 'save_session') {
      // --- DUPLICATE CHECK START ---
      const cache = CacheService.getScriptCache();
      const lockKey = "lock_" + data.sessionId;
      if (cache.get(lockKey)) {
        return ContentService.createTextOutput(JSON.stringify({status: 'duplicate', message: 'Already archived'})).setMimeType(ContentService.MimeType.JSON);
      }
      cache.put(lockKey, "true", 300); // 5 minute lock
      // --- DUPLICATE CHECK END ---

      const today = new Date();
      const sheetName = Utilities.formatDate(today, "GMT+9", "yyyy-MM-dd");
      let sheet = ss.getSheetByName(sheetName) || ss.insertSheet(sheetName);
      if (sheet.getLastRow() === 0) {
        sheet.appendRow(["Timestamp", "Email", "Mode", "Level", "CEFR", "Word Count", "Vocab Complexity", "Pronunciation", "Mistakes & Suggestions", "Advice", "Script", "Session ID"]);
      }
      sheet.appendRow([
        data.timestamp, data.email, data.mode, data.level, data.cefr, 
        data.wordCount, data.vocabComplexity, data.pronunciationScore + "/100", 
        data.mistakes, data.advice, data.script, data.sessionId
      ]);

      if (data.audioBase64) {
        try {
          const folder = DriveApp.getFolderById(AUDIO_FOLDER_ID);
          const fileName = "AKITA_" + data.email.split('@')[0] + "_" + data.timestamp.replace(/[:\\/]/g, "-") + ".wav";
          folder.createFile(Utilities.newBlob(Utilities.base64Decode(data.audioBase64), 'audio/wav', fileName));
        } catch (err) { console.log("Audio Error: " + err.toString()); }
      }

      try {
        let body = "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\\n";
        body += "   AKITA Review Chat mkII - Diagnostic Report\\n";
        body += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\\n\\n";
        body += "【学生情報】\\n";
        body += "メールアドレス: " + data.email + "\\n";
        body += "実施日時:       " + data.timestamp + "\\n";
        body += "練習ティア:     " + data.level + " (" + data.mode + ")\\n\\n";
        
        body += "【セッション指標】\\n";
        body += "------------------------------------------------------\\n";
        body += "■ 推定CEFRレベル:  " + data.cefr + "\\n";
        body += "■ 発話総語数:      " + data.wordCount + " words\\n";
        body += "■ 推定発音スコア:  " + data.pronunciationScore + "/100\\n";
        body += "■ 語彙レベル:      " + data.vocabComplexity + "\\n\\n";
        
        body += "【添削と修正案】\\n";
        body += "------------------------------------------------------\\n";
        body += (data.mistakes ? data.mistakes.split('; ').join('\\n・') : "重大な間違いは見つかりませんでした。") + "\\n\\n";
        
        body += "【教授からのアドバイス】\\n";
        body += "------------------------------------------------------\\n";
        body += (data.advice || "継続して練習しましょう。") + "\\n\\n";
        
        body += "【会話の記録】\\n";
        body += "------------------------------------------------------\\n";
        body += data.script + "\\n\\n";
        
        body += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\\n";
        body += " Akita Provincial University - Academic Systems 2025\\n";
        body += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━";
        
        MailApp.sendEmail({
          to: data.email,
          subject: "[AKITA] Review Feedback: " + data.cefr + " Level Reached",
          body: body
        });
      } catch (err) { console.log("Email Error: " + err.toString()); }

    } else if (action === 'save_task') {
      const sheet = ss.getSheetByName('Config') || ss.insertSheet('Config');
      sheet.getRange(1, 1).setValue(JSON.stringify(data));
    }
    return ContentService.createTextOutput(JSON.stringify({status: 'ok'})).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({status: 'error', message: err.toString()})).setMimeType(ContentService.MimeType.JSON);
  }
}`;

  return (
    <div className="space-y-10 animate-fadeIn relative z-10">
      <div className="flex justify-between items-end border-b border-[#1B4332]/10 pb-6">
        <div>
          <h2 className="text-4xl font-bold title-serif text-[#1B4332] uppercase tracking-widest">Admin Registry</h2>
          <p className="text-[9px] font-bold text-[#D4AF37] uppercase tracking-[0.5em] mt-2">Central Management Console</p>
        </div>
        <button onClick={onBack} className="text-[10px] font-bold text-[#1B4332] uppercase tracking-widest border-b border-[#1B4332]">Exit Dashboard</button>
      </div>

      <div className="grid md:grid-cols-2 gap-10">
        <div className="space-y-10">
          <div className="deco-panel p-10 bg-[#1B4332] text-[#D4AF37] corner-stepped">
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] mb-8 flex items-center">
              <span className="w-1.5 h-6 bg-white mr-3"></span> Registry Link
            </h3>
            <div className="space-y-4">
               <label className="text-[9px] font-bold text-white/50 uppercase tracking-widest">Active Source: {activeSource}</label>
               <input 
                 type="text" 
                 value={gasUrl}
                 onChange={(e) => handleGasUrlChange(e.target.value)}
                 placeholder="Paste Web App URL here..."
                 className="w-full p-4 border border-white/10 bg-white/5 outline-none font-mono text-[10px] text-white"
               />
               <p className="text-[8px] text-[#D4AF37] uppercase opacity-70">Note: Manual input overrides code-defined URL.</p>
            </div>
          </div>

          <div className="deco-panel p-10 space-y-8 corner-stepped">
            <h3 className="text-xs font-bold text-[#1B4332] uppercase tracking-[0.2em] flex items-center">
              <span className="w-1.5 h-6 bg-[#D4AF37] mr-3"></span> Task Orchestrator
            </h3>
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Difficulty Tier</label>
                <select value={level} onChange={(e) => setLevel(e.target.value as PracticeLevel)} className="w-full p-4 border border-slate-200 font-bold text-sm bg-white">
                  {Object.values(PracticeLevel).map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">PDF Source</label>
                <input type="file" accept=".pdf" onChange={handleUpload} className="block w-full text-[10px] text-slate-500 file:mr-4 file:py-2 file:px-4 file:border file:border-[#1B4332] file:text-[9px] file:font-bold file:bg-[#1B4332] file:text-[#D4AF37]"/>
              </div>
              <textarea 
                value={taskContext} 
                onChange={(e) => setTaskContext(e.target.value)} 
                placeholder="AI Context..." 
                className="w-full p-4 border border-slate-200 h-64 text-sm outline-none focus:border-[#D4AF37] bg-white leading-relaxed font-medium"
              />
              <button onClick={saveTask} disabled={isSaving || isExtracting} className="w-full py-5 button-deco-primary disabled:opacity-50">
                Sync Task
              </button>
            </div>
          </div>
        </div>

        <div className="deco-panel p-10 corner-stepped bg-white/50 flex flex-col">
          <h3 className="text-xs font-bold text-[#1B4332] uppercase tracking-[0.2em] mb-6 flex items-center">
            <span className="w-1.5 h-6 bg-[#1B4332] mr-3"></span> GAS Script Manifest
          </h3>
          <div className="relative group flex-grow">
            <pre className="bg-[#1B4332] text-[#D4AF37] p-6 rounded text-[8px] font-mono overflow-auto h-[500px] leading-relaxed">
              {gasCode}
            </pre>
            <button onClick={() => { navigator.clipboard.writeText(gasCode); alert('GAS Code Copied!'); }} className="absolute top-4 right-4 bg-[#D4AF37] text-[#1B4332] px-4 py-2 text-[10px] font-bold shadow-xl">COPY TO CLIPBOARD</button>
          </div>
        </div>
      </div>
    </div>
  );
};
