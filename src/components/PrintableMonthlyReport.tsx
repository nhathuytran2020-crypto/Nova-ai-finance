import React from 'react';
import { MonthlyReport } from '../types';
import { Target, TrendingDown, ArrowUpRight, ShieldAlert, Sparkles, AlertTriangle, Fingerprint, Crosshair, BarChart3, Clock } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface PrintableMonthlyReportProps {
    report: MonthlyReport;
    userName: string;
    onClose: () => void;
}

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
};

const PrintableMonthlyReport: React.FC<PrintableMonthlyReportProps> = ({ report, userName, onClose }) => {
    return (
        <div id="monthly-printable-report" className="fixed inset-0 z-[200] flex items-start justify-center bg-black/90 backdrop-blur-sm overflow-y-auto p-4 md:p-8 custom-scrollbar">
            {/* Action Bar (No Print) */}
            <div className="fixed top-8 right-8 flex gap-4 z-[210] no-print">
                <button 
                    onClick={() => window.print()}
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg uppercase tracking-wider text-xs shadow-lg transition-all"
                >
                    Print Report
                </button>
                <button 
                    onClick={onClose}
                    className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-lg uppercase tracking-wider text-xs shadow-lg transition-all"
                >
                    Close
                </button>
            </div>

            {/* A4 Paper Container */}
            <div className="bg-[#1e1e24] w-full max-w-[210mm] min-h-[297mm] p-[15mm] shadow-2xl relative border border-slate-800 shrink-0 print:shadow-none print:border-none print:m-0 print:p-0">
                
                {/* Visual Header */}
                <header className="mb-12 border-b-2 border-slate-700/50 pb-8 relative">
                    <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                        <Fingerprint className="w-48 h-48 text-indigo-400" />
                    </div>
                    <div className="flex justify-between items-end relative z-10">
                        <div>
                            <div className="text-emerald-400 font-bold uppercase tracking-[0.3em] text-[10px] mb-2 flex items-center gap-2">
                                <Sparkles className="w-3 h-3" /> Monthly Financial Audit
                            </div>
                            <h1 className="text-4xl font-black text-white tracking-tighter uppercase mb-2">
                                {report.month}
                            </h1>
                            <p className="text-slate-400 text-xs font-mono uppercase tracking-widest">
                                Subject: {userName}
                            </p>
                        </div>
                        <div className="text-right">
                            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Health Score</div>
                            <div className={`text-5xl font-black leading-none ${report.healthScore >= 70 ? 'text-emerald-400' : report.healthScore >= 40 ? 'text-amber-400' : 'text-rose-400'}`}>
                                {report.healthScore}
                            </div>
                        </div>
                    </div>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-8 print:grid-cols-12 relative z-10">
                    
                    {report.markdownReport ? (
                        <div className="md:col-span-12 print:col-span-12 space-y-8">
                           <div className="markdown-body format-markdown print-break-inside-avoid bg-slate-900/10 p-2">
                                <ReactMarkdown>{report.markdownReport}</ReactMarkdown>
                           </div>
                           <div className="mt-8 pt-6 border-t border-slate-700/50 print-break-inside-avoid">
                               <div className="flex items-center gap-2 text-slate-500 mb-2">
                                   <Clock className="w-3.5 h-3.5" />
                                   <span className="text-[9px] uppercase tracking-widest font-bold">Report Generated</span>
                               </div>
                               <div className="text-xs font-mono text-slate-400">
                                   {new Date().toLocaleDateString()} @ {new Date().toLocaleTimeString()}
                               </div>
                           </div>
                        </div>
                    ) : (
                        <>
                            {/* Left Column (Main Analysis) */}
                            <div className="md:col-span-8 print:col-span-8 space-y-8">
                                
                                {/* The Direct Coach Review */}
                                <section className="print-break-inside-avoid bg-slate-900/50 border border-slate-700/50 p-6 relative overflow-hidden">
                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500"></div>
                                    <h2 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                        <Crosshair className="w-4 h-4 text-indigo-400" /> Coach Assessment
                                    </h2>
                                    <div className="space-y-5">
                                        <div>
                                            <h3 className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1">Bottom Line</h3>
                                            <p className="text-lg font-bold text-white leading-snug">{report.strategicPlan?.objective || 'Data insufficient for summary.'}</p>
                                        </div>
                                        {report.macroForecast && (
                                            <div className="p-4 bg-amber-500/10 border border-amber-500/20">
                                                <h3 className="text-[10px] font-bold text-amber-400 uppercase tracking-widest mb-1 flex items-center gap-1.5"><AlertTriangle className="w-3 h-3" /> Hidden Trend</h3>
                                                <p className="text-sm text-slate-300 font-medium">{report.macroForecast}</p>
                                            </div>
                                        )}
                                        <div>
                                            <h3 className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-2">Next Month's Rule</h3>
                                            <ul className="space-y-2">
                                                {report.strategicPlan?.actions?.map((action, i) => (
                                                    <li key={i} className="flex items-start gap-3">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0 shadow-[0_0_8px_#10b981]"></div>
                                                        <span className="text-sm text-slate-300 font-bold">{action}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                </section>

                                {/* Problems */}
                                {report.problems && report.problems.length > 0 && (
                                    <section className="print-break-inside-avoid">
                                        <h2 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                            <ShieldAlert className="w-4 h-4 text-rose-400" /> Detected Threats
                                        </h2>
                                        <div className="grid grid-cols-1 gap-3">
                                            {(report.problems || []).map((prob, i) => (
                                                <div key={i} className="p-4 border border-rose-500/20 bg-rose-500/5 flex items-start gap-4">
                                                    <div className="text-rose-500 mt-0.5"><Target className="w-5 h-5" /></div>
                                                    <div>
                                                        <h4 className="text-sm font-bold text-white uppercase tracking-wide mb-1">{prob.title}</h4>
                                                        <p className="text-xs text-slate-400">{(prob as any).description}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </section>
                                )}
                                
                                {/* Top Categories */}
                                {(report as any).topCategories && (report as any).topCategories.length > 0 && (
                                <section className="print-break-inside-avoid">
                                    <h2 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                        <BarChart3 className="w-4 h-4 text-slate-400" /> Primary Spend Targets
                                    </h2>
                                    <div className="space-y-3">
                                        {(report as any).topCategories.map((cat: any, i: number) => (
                                            <div key={i} className="flex items-center justify-between p-3 border border-slate-700/50 bg-slate-900/30">
                                                <div className="flex items-center gap-3">
                                                    <div className="text-[10px] font-mono text-slate-500">{(i+1).toString().padStart(2, '0')}</div>
                                                    <div className="font-bold text-slate-200 text-sm uppercase">{cat.category}</div>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <div className="text-sm font-bold text-white">{formatCurrency(cat.amount)}</div>
                                                    <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                                        <div 
                                                            className="h-full bg-indigo-500"
                                                            style={{ width: `${Math.min(100, (cat.amount / Math.max(1, ((report.metrics?.expenseLoadRatio * 100) || 1))) * 10)}%` }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                                )}
                            </div>

                            {/* Right Column (Metrics Dashboard) */}
                            <div className="md:col-span-4 print:col-span-4 space-y-6">
                                
                                <div className="p-5 border border-slate-700/50 bg-slate-900/30 print-break-inside-avoid">
                                    <div className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-2">Savings Rate</div>
                                    <div className="flex items-end gap-2">
                                        <div className={`text-3xl font-black ${report.metrics.savingsPowerIndex > 0 ? 'text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.3)]' : 'text-rose-400 drop-shadow-[0_0_10px_rgba(244,63,94,0.3)]'}`}>
                                            {(report.metrics.savingsPowerIndex * 100).toFixed(1)}%
                                        </div>
                                    </div>
                                    <div className="text-[10px] text-slate-400 mt-2">Of total cash flow retained.</div>
                                </div>

                                <div className="p-5 border border-slate-700/50 bg-slate-900/30 print-break-inside-avoid">
                                    <div className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-2">Fixed Load</div>
                                    <div className="text-3xl font-black text-white">
                                        {(report.metrics.expenseLoadRatio * 100).toFixed(1)}%
                                    </div>
                                    <div className="text-[10px] text-slate-400 mt-2">Proportion of income consumed by fixed costs.</div>
                                </div>

                                <div className="p-5 border border-slate-700/50 bg-slate-900/30 print-break-inside-avoid relative overflow-hidden">
                                    <div className={`absolute top-0 right-0 w-2 h-full ${report.riskScore > 50 ? 'bg-rose-500' : 'bg-emerald-500'}`}></div>
                                    <div className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-2">Risk Factor</div>
                                    <div className={`text-3xl font-black ${report.riskScore > 50 ? 'text-rose-400' : 'text-emerald-400'}`}>
                                        {report.riskScore.toFixed(0)} <span className="text-sm text-slate-500">/ 100</span>
                                    </div>
                                    <div className="text-[10px] text-slate-400 mt-2">Overall volatility mapping.</div>
                                </div>

                                <div className="mt-8 pt-6 border-t border-slate-700/50 print-break-inside-avoid">
                                    <div className="flex items-center gap-2 text-slate-500 mb-2">
                                        <Clock className="w-3.5 h-3.5" />
                                        <span className="text-[9px] uppercase tracking-widest font-bold">Report Generated</span>
                                    </div>
                                    <div className="text-xs font-mono text-slate-400">
                                        {new Date().toLocaleDateString()} @ {new Date().toLocaleTimeString()}
                                    </div>
                                </div>

                            </div>
                        </>
                    )}

                </div>
            </div>
        </div>
    );
};

export default PrintableMonthlyReport;
