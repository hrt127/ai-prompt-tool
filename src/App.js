import React, { useEffect, useMemo, useState } from 'react';
import { Clipboard, ClipboardCheck, Library, Save, Search, Plus, Tags, Edit, Trash2, Eye, Download, Upload } from 'lucide-react';

const DEFAULT_TEMPLATES = [
  { id:'research-brief', name:'Research Brief', tags:['research','analysis'],
    context:'You are an expert researcher synthesizing credible sources into concise, actionable insights.',
    task:'Analyze the topic and produce a structured brief with key findings and implications.',
    rules:['Cite facts with source names.','Be concise and neutral.','Call out uncertainty.'],
    format:'Sections: Summary, Key Findings, Risks/Unknowns, References',
    examples:['Example: For ETH staking, summarize yield ranges, slashing risks, providers, and regs.'] },
  { id:'code-review', name:'Code Review Helper', tags:['coding','review'],
    context:'You are a senior engineer reviewing a PR for correctness and maintainability.',
    task:'Identify issues, suggest concrete fixes, and note potential refactors.',
    rules:['Be specific with file/line when possible.','Prefer minimal, safe edits.','Explain rationale.'],
    format:'Sections: Summary, Issues, Suggestions, Tests to Add',
    examples:['Example: Identify unreachable branches and suggest guard clauses.'] },
  { id:'brainstorm', name:'Brainstorming', tags:['ideation','creative'],
    context:'You are a creative partner producing unconventional but feasible ideas.',
    task:'Generate options that vary by complexity, cost, and risk.',
    rules:['List pros/cons for each idea.','Include one weird but plausible idea.'],
    format:'Table: Idea, Rationale, Pros, Cons, Next Step',
    examples:['Example: Growth ideas for a niche DeFi analytics tool.'] }
];

const STORAGE_KEYS = { TEMPLATES:'apt.templates.v1', LAST:'apt.last.v1' };

function useLocalStorageTemplates() {
  const [templates, setTemplates] = useState(() => {
    try { const raw = localStorage.getItem(STORAGE_KEYS.TEMPLATES); return raw ? JSON.parse(raw) : DEFAULT_TEMPLATES; }
    catch { return DEFAULT_TEMPLATES; }
  });
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.TEMPLATES, JSON.stringify(templates)); }, [templates]);
  return [templates, setTemplates];
}

function TextArea({ label, value, onChange, placeholder, rows=4 }) {
  return (
    <div className="space-y-2">
      <label className="text-sm text-slate-300">{label}</label>
      <textarea value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} rows={rows}
        className="w-full rounded-md bg-slate-900/60 border border-slate-700/60 p-3 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"/>
    </div>
  );
}

function MultiLineList({ label, items, onChange, placeholder }) {
  const [text, setText] = useState(items.join('\n'));
  useEffect(()=>{ setText(items.join('\n')); },[items]);
  return (
    <div className="space-y-2">
      <label className="text-sm text-slate-300">{label}</label>
      <textarea value={text} onChange={e=>{ setText(e.target.value);
        onChange(e.target.value.split('\n').map(s=>s.trim()).filter(Boolean)); }} placeholder={placeholder} rows={4}
        className="w-full rounded-md bg-slate-900/60 border border-slate-700/60 p-3 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"/>
    </div>
  );
}

function TagInput({ tags, onChange }) {
  const [entry,setEntry]=useState('');
  const add=(t)=>{ const v=t.trim(); if(!v) return; if(!tags.includes(v)) onChange([...tags,v]); setEntry(''); };
  const remove=(t)=> onChange(tags.filter(x=>x!==t));
  return (
    <div className="space-y-2">
      <label className="text-sm text-slate-300">Tags</label>
      <div className="flex gap-2">
        <input value={entry} onChange={e=>setEntry(e.target.value)} onKeyDown={e=>{ if(e.key==='Enter'){ e.preventDefault(); add(entry); } }}
          placeholder="Add a tag and press Enter"
          className="flex-1 rounded-md bg-slate-900/60 border border-slate-700/60 p-3 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"/>
        <button onClick={()=>add(entry)} className="px-3 rounded-md bg-indigo-600 hover:bg-indigo-500 text-sm">Add</button>
      </div>
      <div className="flex flex-wrap gap-2">
        {tags.map(t=>(
          <span key={t} className="inline-flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-full px-3 py-1 text-sm">
            <Tags size={14}/> {t}
            <button onClick={()=>remove(t)} className="text-slate-400 hover:text-red-400">×</button>
          </span>
        ))}
      </div>
    </div>
  );
}

function AssembledPreview({ assembled }) {
  const [copied,setCopied]=useState(false);
  async function copy(){ await navigator.clipboard.writeText(assembled); setCopied(true); setTimeout(()=>setCopied(false),1200); }
  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm text-slate-300">Assembled Prompt</h3>
        <button onClick={copy} className="inline-flex items-center gap-2 text-sm px-3 py-1 rounded-md bg-slate-800 hover:bg-slate-700 border border-slate-700">
          {copied ? <ClipboardCheck size={16}/> : <Clipboard size={16}/>}
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <textarea readOnly value={assembled} className="flex-1 rounded-md bg-slate-900/60 border border-slate-700/60 p-3 text-slate-100"/>
    </div>
  );
}

function TemplateLibrary({ templates, onUse, onEdit, onDelete, search, setSearch, tagFilter, setTagFilter }) {
  const allTags = useMemo(()=>Array.from(new Set(templates.flatMap(t=>t.tags||[]))).sort(),[templates]);
  const filtered = useMemo(()=>{
    const q=(search||'').toLowerCase().trim();
    const tg=(tagFilter||'').toLowerCase().trim();
    return templates.filter(t=>{
      const inText=!q || [t.name,t.context,t.task,t.format,...(t.rules||[]),...(t.examples||[])].join(' ').toLowerCase().includes(q);
      const inTag=!tg || (t.tags||[]).some(x=>x.toLowerCase().includes(tg));
      return inText && inTag;
    });
  },[templates,search,tagFilter]);

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="flex items-center gap-2 flex-1 bg-slate-900/60 border border-slate-700/60 rounded-md px-3">
          <Search size={16} className="text-slate-400"/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search templates"
            className="flex-1 bg-transparent py-2 outline-none text-slate-100"/>
        </div>
        <div className="flex items-center gap-2 w-56 bg-slate-900/60 border border-slate-700/60 rounded-md px-3">
          <Tags size={16} className="text-slate-400"/>
          <input value={tagFilter} onChange={e=>setTagFilter(e.target.value)} placeholder="Filter by tag"
            className="flex-1 bg-transparent py-2 outline-none text-slate-100"/>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">{allTags.map(t=>(
        <button key={t} onClick={()=>setTagFilter(t)} className="text-xs px-3 py-1 rounded-full border border-slate-700 hover:bg-slate-800">#{t}</button>
      ))}</div>

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
        {filtered.map(t=>(
          <div key={t.id} className="rounded-lg bg-slate-900/60 border border-slate-700/60 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold">{t.name}</h4>
              <div className="flex items-center gap-2">
                <button onClick={()=>onUse(t)} className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-indigo-600 hover:bg-indigo-500"><Eye size={14}/> Use</button>
                <button onClick={()=>onEdit(t)} className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-slate-800 hover:bg-slate-700 border border-slate-700"><Edit size={14}/> Edit</button>
                <button onClick={()=>onDelete(t)} className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-red-600/80 hover:bg-red-600"><Trash2 size={14}/> Delete</button>
              </div>
            </div>
            {t.tags?.length>0 && <div className="flex flex-wrap gap-2">{t.tags.map(tag=>(<span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700">#{tag}</span>))}</div>}
            <p className="text-sm text-slate-300 line-clamp-4">{t.context}</p>
          </div>
        ))}
        {filtered.length===0 && <div className="text-sm text-slate-400">No templates match your search.</div>}
      </div>
    </div>
  );
}

export default function App(){
  const [templates,setTemplates]=useLocalStorageTemplates();
  const [active,setActive]=useState(()=>{ try{ const raw=localStorage.getItem(STORAGE_KEYS.LAST); return raw?JSON.parse(raw):null;}catch{return null;}});
  const [name,setName]=useState(active?.name||'');
  const [tags,setTags]=useState(active?.tags||[]);
  const [context,setContext]=useState(active?.context||'');
  const [task,setTask]=useState(active?.task||'');
  const [rules,setRules]=useState(active?.rules||[]);
  const [format,setFormat]=useState(active?.format||'');
  const [examples,setExamples]=useState(active?.examples||[]);
  const [search,setSearch]=useState('');
  const [tagFilter,setTagFilter]=useState('');
  const [showLibrary,setShowLibrary]=useState(true);

  useEffect(()=>{ const current={ id:active?.id||'unsaved', name,tags,context,task,rules,format,examples };
    localStorage.setItem(STORAGE_KEYS.LAST, JSON.stringify(current)); },[active,name,tags,context,task,rules,format,examples]);

  const assembled=useMemo(()=>{
    const lines=[];
    if(context){ lines.push('Context:'); lines.push(context.trim()); lines.push(''); }
    if(task){ lines.push('Task:'); lines.push(task.trim()); lines.push(''); }
    if(rules?.length){ lines.push('Rules:'); rules.forEach(r=>lines.push(`- ${r}`)); lines.push(''); }
    if(format){ lines.push('Format:'); lines.push(format.trim()); lines.push(''); }
    if(examples?.length){ lines.push('Examples:'); examples.forEach(ex=>lines.push(`- ${ex}`)); lines.push(''); }
    return lines.join('\n').trim();
  },[context,task,rules,format,examples]);

  function resetEditor(){ setActive(null); setName(''); setTags([]); setContext(''); setTask(''); setRules([]); setFormat(''); setExamples([]); }
  function saveTemplate(){
    const id=(active?.id && active.id!=='unsaved')?active.id:`${Date.now()}`;
    const next={ id, name: name||'Untitled', tags, context, task, rules, format, examples };
    const exists=templates.some(t=>t.id===id);
    const updated=exists?templates.map(t=>t.id===id?next:t):[next,...templates];
    setTemplates(updated); setActive(next);
  }
  function applyTemplate(t){ setActive(t); setName(t.name||''); setTags(t.tags||[]); setContext(t.context||''); setTask(t.task||''); setRules(t.rules||[]); setFormat(t.format||''); setExamples(t.examples||[]); setShowLibrary(false); }
  function editTemplate(t){ applyTemplate(t); }
  function deleteTemplate(t){ if(!window.confirm(`Delete template "${t.name}"?`)) return; setTemplates(templates.filter(x=>x.id!==t.id)); if(active?.id===t.id) resetEditor(); }
  function newTemplate(){ resetEditor(); setShowLibrary(false); }
  function exportTemplates(){ const blob=new Blob([JSON.stringify(templates,null,2)],{type:'application/json'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='ai-prompt-templates.json'; a.click(); URL.revokeObjectURL(url); }
  function importTemplates(file){ const reader=new FileReader(); reader.onload=()=>{ try{ const data=JSON.parse(reader.result); if(!Array.isArray(data)) throw new Error('Invalid file'); setTemplates(data);}catch(e){ alert('Import failed: '+e.message);} }; reader.readAsText(file); }

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-800 bg-slate-950/60 backdrop-blur supports-[backdrop-filter]:bg-slate-950/40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Library className="text-indigo-400"/>
            <div>
              <div className="font-semibold">AI Prompt Tool</div>
              <div className="text-xs text-slate-400">Structured prompts. Faster thinking.</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={()=>setShowLibrary(s=>!s)} className="text-sm px-3 py-1.5 rounded-md border border-slate-700 bg-slate-800 hover:bg-slate-700">
              {showLibrary?'Hide Library':'Show Library'}
            </button>
            <button onClick={newTemplate} className="inline-flex items-center gap-2 text-sm px-3 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-500"><Plus size={16}/> New</button>
            <button onClick={saveTemplate} className="inline-flex items-center gap-2 text-sm px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500"><Save size={16}/> Save</button>
            <button onClick={exportTemplates} className="inline-flex items-center gap-2 text-sm px-3 py-1.5 rounded-md border border-slate-700 bg-slate-800 hover:bg-slate-700"><Download size={16}/> Export</button>
            <label className="inline-flex items-center gap-2 text-sm px-3 py-1.5 rounded-md border border-slate-700 bg-slate-800 hover:bg-slate-700 cursor-pointer">
              <Upload size={16}/> Import
              <input type="file" accept="application/json" className="hidden" onChange={e=>e.target.files?.[0] && importTemplates(e.target.files[0])}/>
            </label>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        <section className="xl:col-span-2 space-y-4">
          <div className="rounded-lg bg-slate-900/60 border border-slate-700/60 p-4 space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm text-slate-300">Name</label>
                <input value={name} onChange={e=>setName(e.target.value)} placeholder="e.g., Research Brief: ETH staking landscape"
                  className="w-full rounded-md bg-slate-900/60 border border-slate-700/60 p-3 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"/>
              </div>
              <TagInput tags={tags} onChange={setTags}/>
            </div>

            <TextArea label="Context" value={context} onChange={setContext} placeholder="Who is the assistant and what constraints exist?" rows={4}/>
            <TextArea label="Task" value={task} onChange={setTask} placeholder="What should be produced, for whom, and why?" rows={4}/>
            <MultiLineList label="Rules (one per line)" items={rules} onChange={setRules} placeholder="- Be concise&#10;- Cite sources&#10;- Use bullet points"/>
            <TextArea label="Format" value={format} onChange={setFormat} placeholder="Headings, bullet points, tables, etc." rows={3}/>
            <MultiLineList label="Examples (one per line)" items={examples} onChange={setExamples} placeholder="- Example: Summarize 3 sources..."/>
          </div>

          <div className="rounded-lg bg-slate-900/60 border border-slate-700/60 p-4 h-[360px]">
            <AssembledPreview assembled={assembled}/>
          </div>
        </section>

        <aside className="xl:col-span-1 space-y-4">
          {showLibrary && (
            <div className="rounded-lg bg-slate-900/60 border border-slate-700/60 p-4 space-y-4">
              <TemplateLibrary templates={templates} onUse={applyTemplate} onEdit={editTemplate} onDelete={deleteTemplate}
                search={search} setSearch={setSearch} tagFilter={tagFilter} setTagFilter={setTagFilter}/>
            </div>
          )}
          {!showLibrary && (<div className="rounded-lg bg-slate-900/60 border border-slate-700/60 p-4 text-sm text-slate-300">
            Use, edit, and save your current template. Open the library anytime to browse and search.
          </div>)}
        </aside>
      </main>
    </div>
  );
}
