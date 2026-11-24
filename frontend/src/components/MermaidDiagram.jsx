import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import { AlertTriangle } from 'lucide-react';

// 'strict' (not 'loose'): diagram text is user-editable and now rendered on
// public pages, so HTML labels and click handlers must stay disabled (XSS).
mermaid.initialize({
    startOnLoad: false,
    theme: 'dark',
    securityLevel: 'strict',
    fontFamily: '"DM Sans", system-ui, sans-serif',
});

export default function MermaidDiagram({ chart, quietError = false }) {
    const ref = useRef(null);
    const [error, setError] = useState(null);
    const [rawChart, setRawChart] = useState("");

    useEffect(() => {
        if (chart && ref.current) {
            setError(null);
            const id = `mermaid-scifi-${Math.random().toString(36).substr(2, 9)}`;
            try {
                let cleanMermaid = chart;
                if (typeof cleanMermaid === 'string') {
                    try {
                        const parsed = JSON.parse(cleanMermaid);
                        if (typeof parsed === 'string') cleanMermaid = parsed;
                    } catch (e) { }

                    cleanMermaid = cleanMermaid
                        .replace(/```mermaid\n?/i, '')
                        .replace(/```\n?/g, '')
                        .replace(/\\n/g, '\n')
                        .trim();

                    cleanMermaid = cleanMermaid.replace(/([A-Za-z0-9_-]+)\[([^\]]+)\]/g, (match, node, innerText) => {
                        if (innerText.startsWith('(') && innerText.endsWith(')')) {
                            return match;
                        }
                        if (/[()]/.test(innerText) && !innerText.includes('"')) {
                            return `${node}["${innerText}"]`;
                        }
                        return match;
                    });

                    // Same guard for {decision} / rhombus nodes: parens (or other
                    // special chars) inside an unquoted {label} break the parser.
                    cleanMermaid = cleanMermaid.replace(/([A-Za-z0-9_-]+)\{([^{}]+)\}/g, (match, node, innerText) => {
                        if (/[()]/.test(innerText) && !innerText.includes('"')) {
                            return `${node}{"${innerText}"}`;
                        }
                        return match;
                    });

                    cleanMermaid = cleanMermaid.replace(/(-->\|)([^|]+)(\|)/g, (match, p1, p2, p3) => {
                        return `${p1}${p2.trim()}${p3}`;
                    });

                    cleanMermaid = cleanMermaid.replace(/(-->\|[^|]+\|)>([\s]*)/g, '$1$2');
                }

                setRawChart(cleanMermaid);

                if (cleanMermaid.length > 5 && (cleanMermaid.includes('graph') || cleanMermaid.includes('flowchart') || cleanMermaid.includes('sequenceDiagram'))) {
                    mermaid.render(id, cleanMermaid).then((result) => {
                        if (ref.current) {
                            ref.current.innerHTML = result.svg;
                        }
                    }).catch(e => {
                        console.error("Mermaid specific render error", e);
                        setError(e.message || "Failed to render diagram.");
                    });
                } else {
                    setError("Not a valid Mermaid diagram syntax.");
                }
            } catch (e) {
                console.error("Mermaid parsing error", e);
                setError(e.message || "Failed to process diagram.");
            }
        }
    }, [chart]);

    if (error && quietError) {
        // Public pages: never dump raw syntax at visitors.
        return (
            <div className="flex items-center gap-2 p-4 rounded-xl border border-mi-border text-mi-text-muted text-sm">
                <AlertTriangle size={16} /> Diagram unavailable for this idea.
            </div>
        );
    }

    if (error) {
        return (
            <div className="w-full overflow-x-auto flex flex-col p-6 text-red-500 bg-red-500/10 border border-red-500/50">
                <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle size={24} />
                    <p className="font-bold uppercase tracking-wider">Diagram Rendering Failed</p>
                </div>
                <div className="text-sm opacity-80 mb-4">{error}</div>
                <div className="text-xs bg-black/50 p-4 border border-red-500/30 w-full whitespace-pre-wrap font-mono text-left">
                    <div className="text-white/50 mb-2">RAW SYNTAX:</div>
                    {rawChart || chart}
                </div>
            </div>
        );
    }

    return <div ref={ref} className="overflow-x-auto p-4 bg-black/40 border border-neo-border flex justify-center w-full min-h-[100px]" />;
}
