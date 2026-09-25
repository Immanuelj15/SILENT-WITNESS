import React, { useState, useEffect } from 'react';
import { BookOpen, ShieldAlert, AlertTriangle, CheckCircle, Search, ChevronRight } from 'lucide-react';

export default function ScamKnowledgeBase({ isOpen, onClose }) {
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      fetchCategories();
    }
  }, [isOpen]);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await fetch('http://localhost:8000/api/knowledge-base');
      if (res.ok) {
        const data = await res.json();
        setCategories(data.categories || []);
        if (data.categories && data.categories.length > 0) {
          setSelectedCategory(data.categories[0]);
        }
      }
    } catch (e) {
      console.error('Failed to load knowledge base:', e);
    } finally {
      setLoading(false);
    }
  };

  const filtered = categories.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.description.toLowerCase().includes(search.toLowerCase()) ||
    c.category.toLowerCase().includes(search.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-5xl w-full p-6 shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-100">Scam Pattern Knowledge Base</h3>
              <p className="text-xs text-slate-400">
                17 Structured Attack Archetypes & Coercion Playbooks (Sections 30 & 31)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 text-lg px-2.5 py-1 rounded-lg hover:bg-slate-800 transition"
          >
            ✕
          </button>
        </div>

        {/* Search Input */}
        <div className="relative mb-4 flex-shrink-0">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search attack categories (e.g. OTP, Digital Arrest, Courier, Remote Access, Loan)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-950/70 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-purple-500 placeholder:text-slate-500"
          />
        </div>

        {/* Main Content: Split List and Detail */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 flex-1 min-h-0 overflow-hidden">
          {/* Categories Sidebar */}
          <div className="md:col-span-5 overflow-y-auto pr-2 space-y-2 custom-scrollbar">
            {loading ? (
              <div className="text-xs text-slate-500 italic p-4 text-center">Loading threat taxonomies...</div>
            ) : filtered.length === 0 ? (
              <div className="text-xs text-slate-500 italic p-4 text-center">No categories matching search</div>
            ) : (
              filtered.map((cat) => {
                const isSelected = selectedCategory && selectedCategory.category === cat.category;
                const isCritical = cat.severity === 'CRITICAL';

                return (
                  <div
                    key={cat.category}
                    onClick={() => setSelectedCategory(cat)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-slate-800 border-purple-500 ring-1 ring-purple-500/50'
                        : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          isCritical ? 'bg-red-500/20 text-red-300' : 'bg-amber-500/20 text-amber-300'
                        }`}>
                          {cat.severity}
                        </span>
                        <span className="text-xs font-semibold text-slate-200">{cat.name}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 line-clamp-1">{cat.description}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-600 flex-shrink-0" />
                  </div>
                );
              })
            )}
          </div>

          {/* Selected Category Detail */}
          <div className="md:col-span-7 bg-slate-950/70 border border-slate-800 rounded-xl p-5 overflow-y-auto custom-scrollbar flex flex-col justify-between">
            {selectedCategory ? (
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h4 className="text-base font-bold text-slate-100">{selectedCategory.name}</h4>
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-purple-950/40 text-purple-300 border border-purple-800">
                      ID: {selectedCategory.category}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">{selectedCategory.description}</p>
                </div>

                {/* Attack Stages */}
                <div>
                  <h5 className="text-xs font-semibold uppercase tracking-wider text-purple-300 mb-2">
                    Known Attack Progression Stages
                  </h5>
                  <div className="space-y-1.5">
                    {selectedCategory.attackStages.map((stg, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-slate-300 bg-slate-900/60 p-2 rounded border border-slate-800/80">
                        <span className="font-mono text-purple-400 font-bold">0{i + 1}</span>
                        <span>{stg}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Dangerous Requests & Signals */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="bg-red-950/20 border border-red-900/40 rounded-lg p-3">
                    <h6 className="font-bold text-red-300 mb-1.5 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5" /> Dangerous Requests
                    </h6>
                    <ul className="space-y-1 text-slate-300 text-[11px] list-disc list-inside">
                      {selectedCategory.dangerousRequests.map((req, i) => (
                        <li key={i}>{req}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-amber-950/20 border border-amber-900/40 rounded-lg p-3">
                    <h6 className="font-bold text-amber-300 mb-1.5 flex items-center gap-1.5">
                      <ShieldAlert className="w-3.5 h-3.5" /> Warning Signals
                    </h6>
                    <ul className="space-y-1 text-slate-300 text-[11px] list-disc list-inside">
                      {selectedCategory.commonSignals.map((sig, i) => (
                        <li key={i}>{sig}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Recommended Safety Action */}
                <div className="bg-emerald-950/30 border border-emerald-900/50 rounded-lg p-3.5 text-xs">
                  <h6 className="font-bold text-emerald-300 mb-1 flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4" /> Recommended Safety Action
                  </h6>
                  <p className="text-slate-200 leading-relaxed mt-0.5">{selectedCategory.recommendedAction}</p>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">Select an attack category from the list to view its playbook.</p>
            )}

            <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-500 flex justify-between">
              <span>Section 31: Knowledge Base acts as supporting context, not sole ground truth.</span>
              <span>Updated: 2026-09-25</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
