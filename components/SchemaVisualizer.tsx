import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { SchemaVisualizationData, SchemaNode } from '../types';
import { NetworkIcon, MaximizeIcon, MinimizeIcon, ZoomInIcon, ZoomOutIcon, RefreshCwIcon } from './icons';

type ViewMode = 'relationships' | 'coverage' | 'hotspots';

interface NodePosition extends SchemaNode {
    x: number;
    y: number;
    vx: number;
    vy: number;
}

const LIGHT_HEATMAP_COLORS = ['#a7f3d0', '#fde047', '#fca5a5', '#ef4444'];
const DARK_HEATMAP_COLORS = ['#22d3ee', '#facc15', '#fb923c', '#f43f5e']; 

const getHeatmapColor = (score: number, isDarkMode: boolean): string => {
    const colors = isDarkMode ? DARK_HEATMAP_COLORS : LIGHT_HEATMAP_COLORS;
    const neutralColor = isDarkMode ? '#334155' : '#e2e8f0';

    if (score <= 0) return neutralColor;
    if (score < 0.25) return colors[0];
    if (score < 0.50) return colors[1];
    if (score < 0.75) return colors[2];
    return colors[3];
};


const useForceDirectedLayout = (data: SchemaVisualizationData, width: number, height: number): [Map<string, NodePosition>, boolean] => {
    const [nodePositions, setNodePositions] = useState<Map<string, NodePosition>>(new Map());
    const [isSimulating, setIsSimulating] = useState(true);
    const simulationRef = useRef<number | null>(null);

    useEffect(() => {
        if (!data || data.nodes.length === 0 || width === 0) {
            setIsSimulating(false);
            return;
        }

        setIsSimulating(true);
        const initialNodes = new Map<string, NodePosition>();
        
        const numNodes = data.nodes.length;
        const radius = Math.min(width, height) / 3;
        data.nodes.forEach((node, i) => {
            const angle = (i / numNodes) * 2 * Math.PI;
            initialNodes.set(node.id, {
                ...node,
                x: width / 2 + radius * Math.cos(angle),
                y: height / 2 + radius * Math.sin(angle),
                vx: 0,
                vy: 0,
            });
        });

        setNodePositions(initialNodes);

        const nodes = Array.from(initialNodes.values());
        const edges = data.edges;

        const simulationStep = () => {
            let totalKineticEnergy = 0;

            nodes.forEach(nodeA => {
                nodeA.vx += (width / 2 - nodeA.x) * 0.003;

                nodes.forEach(nodeB => {
                    if (nodeA.id === nodeB.id) return;
                    const dx = nodeB.x - nodeA.x;
                    const dy = nodeB.y - nodeA.y;
                    let distance = Math.sqrt(dx * dx + dy * dy);
                    if (distance < 1) distance = 1;
                    const force = -40000 / (distance * distance); 
                    nodeA.vx += (dx / distance) * force;
                    nodeA.vy += (dy / distance) * force;
                });
            });

            edges.forEach(edge => {
                const nodeA = initialNodes.get(edge.from);
                const nodeB = initialNodes.get(edge.to);
                if (!nodeA || !nodeB) return;

                const dx = nodeB.x - nodeA.x;
                const dy = nodeB.y - nodeA.y;
                let distance = Math.sqrt(dx * dx + dy * dy);
                if (distance < 1) distance = 1;
                const displacement = distance - 250; 
                const force = 0.05 * displacement;

                const fx = (dx / distance) * force;
                const fy = (dy / distance) * force;

                nodeA.vx += fx;
                nodeA.vy += fy;
                nodeB.vx -= fx;
                nodeB.vy -= fy;
            });

            nodes.forEach(node => {
                // Heavily increased damping (lower multiplier) to eliminate bouncing.
                node.vx *= 0.5;
                node.vy *= 0.5;

                node.x += node.vx;
                node.y += node.vy;

                node.x = Math.max(80, Math.min(width - 80, node.x));
                node.y = Math.max(40, Math.min(height - 40, node.y));
                
                totalKineticEnergy += 0.5 * (node.vx * node.vx + node.vy * node.vy);
            });

            setNodePositions(new Map(initialNodes));

            if (totalKineticEnergy > 0.01) {
                simulationRef.current = requestAnimationFrame(simulationStep);
            } else {
                 setIsSimulating(false);
            }
        };

        simulationRef.current = requestAnimationFrame(simulationStep);

        return () => {
            if (simulationRef.current) {
                cancelAnimationFrame(simulationRef.current);
            }
        };
    }, [data, width, height]);
    
    return [nodePositions, isSimulating];
};

const Legend: React.FC<{ mode: ViewMode, isDarkMode: boolean }> = ({ mode, isDarkMode }) => {
    if (mode === 'relationships') return null;

    let title = '';
    let items = [];
    const colors = isDarkMode ? DARK_HEATMAP_COLORS : LIGHT_HEATMAP_COLORS;

    if (mode === 'coverage') {
        title = 'Rule Coverage';
        items = [
            { color: colors[0], label: 'Low (<25%)' },
            { color: colors[1], label: 'Medium (25-50%)' },
            { color: colors[2], label: 'Good (50-75%)' },
            { color: colors[3], label: 'Excellent (>75%)' },
        ];
    } else if (mode === 'hotspots') {
        title = 'Anomaly Hotspot';
        items = [
            { color: colors[0], label: 'Low' },
            { color: colors[1], label: 'Moderate' },
            { color: colors[2], label: 'High' },
            { color: colors[3], label: 'Critical' },
        ];
    }

    return (
        <div className="absolute bottom-2 right-2 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm p-2 rounded-md shadow text-xs pointer-events-none">
            <h4 className="font-bold mb-1 text-slate-700 dark:text-slate-200">{title}</h4>
            {items.map(item => (
                <div key={item.label} className="flex items-center">
                    <div className="w-3 h-3 rounded-sm mr-1.5" style={{ backgroundColor: item.color }} />
                    <span className="text-slate-600 dark:text-slate-400">{item.label}</span>
                </div>
            ))}
        </div>
    );
};

function debounce<F extends (...args: any[]) => void>(func: F, delay: number): (...args: Parameters<F>) => void {
    let timeoutId: number | null = null;
    return (...args: Parameters<F>) => {
        if (timeoutId) {
            clearTimeout(timeoutId);
        }
        timeoutId = window.setTimeout(() => {
            func(...args);
        }, delay);
    };
}

interface SchemaVisualizerProps {
    data: SchemaVisualizationData | null;
    onTableSelect: (tableName: string) => void;
}

const SchemaVisualizer: React.FC<SchemaVisualizerProps> = ({ data, onTableSelect }) => {
    const [viewMode, setViewMode] = useState<ViewMode>('relationships');
    const containerRef = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = useState({ width: 0, height: 400 });
    const [isFullscreen, setIsFullscreen] = useState(false);
    
    const [transform, setTransform] = useState({ scale: 1, x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [startDrag, setStartDrag] = useState({ x: 0, y: 0 });
    const svgRef = useRef<SVGSVGElement>(null);

    const [isDarkMode, setIsDarkMode] = useState(() => window.matchMedia('(prefers-color-scheme: dark)').matches);
    
    const calculatedHeight = useMemo(() => {
        if (!data?.nodes) return 450;
        const nodeCount = data.nodes.length;
        if (nodeCount <= 5) return 450;
        // Add 30px for each node above 5, but cap the total height at 800px.
        const extraHeight = Math.min((nodeCount - 5) * 30, 350); // 450 + 350 = 800
        return 450 + extraHeight;
    }, [data?.nodes]);

    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = () => setIsDarkMode(mediaQuery.matches);
        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, []);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && isFullscreen) setIsFullscreen(false);
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isFullscreen]);

    useEffect(() => {
        const debouncedResize = debounce((entry: ResizeObserverEntry) => {
            const { width, height } = entry.contentRect;
            setDimensions({ width, height });
        }, 150);

        const observer = new ResizeObserver(entries => { if (entries[0]) debouncedResize(entries[0]); });
        const currentRef = containerRef.current;
        if (currentRef) observer.observe(currentRef);
        return () => { if (currentRef) observer.unobserve(currentRef); };
    }, []);

    const [nodePositions, isSimulating] = useForceDirectedLayout(data!, dimensions.width, dimensions.height);
    const [hoveredNode, setHoveredNode] = useState<string | null>(null);

    // Use a ref to store the latest state for callbacks to prevent stale closures.
    const latestState = useRef({ isSimulating, nodePositions, dimensions });
    latestState.current = { isSimulating, nodePositions, dimensions };
    
    const handleFitToView = useCallback(() => {
        // Read the latest state from the ref to ensure data is current.
        const { isSimulating, nodePositions, dimensions } = latestState.current;
        if (isSimulating || nodePositions.size === 0 || dimensions.width === 0 || dimensions.height === 0) return;
        
        const nodes = Array.from(nodePositions.values());
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        nodes.forEach(node => {
            minX = Math.min(minX, node.x);
            minY = Math.min(minY, node.y);
            maxX = Math.max(maxX, node.x);
            maxY = Math.max(maxY, node.y);
        });

        const nodesWidth = maxX - minX;
        const nodesHeight = maxY - minY;
        if (nodesWidth <= 0 || nodesHeight <= 0) return;

        const padding = 80;
        const scale = Math.min((dimensions.width - padding) / nodesWidth, (dimensions.height - padding) / nodesHeight, 1.5);
        const x = (dimensions.width / 2) - ((minX + nodesWidth / 2) * scale);
        const y = (dimensions.height / 2) - ((minY + nodesHeight / 2) * scale);
        
        setTransform({ scale, x, y });
    }, []); // Empty dependency array makes this function stable.

    useEffect(() => {
        if (!isSimulating) handleFitToView();
    }, [isSimulating, handleFitToView]);

    const handleZoom = (factor: number, clientX?: number, clientY?: number) => {
        setTransform(prev => {
            const newScale = Math.max(0.1, Math.min(prev.scale * factor, 5));
            if (!svgRef.current) return { ...prev, scale: newScale };
            
            const svgPoint = svgRef.current.createSVGPoint();
            svgPoint.x = clientX ?? dimensions.width / 2;
            svgPoint.y = clientY ?? dimensions.height / 2;
            const pointInSVG = svgPoint.matrixTransform(svgRef.current.getScreenCTM()?.inverse());
            
            const newX = pointInSVG.x - (pointInSVG.x - prev.x) * (newScale / prev.scale);
            const newY = pointInSVG.y - (pointInSVG.y - prev.y) * (newScale / prev.scale);
            
            return { scale: newScale, x: newX, y: newY };
        });
    };

    const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        if ((e.target as HTMLElement).closest('button')) return; // Ignore clicks on buttons
        setIsDragging(true);
        setStartDrag({ x: e.clientX - transform.x, y: e.clientY - transform.y });
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (isDragging) {
            setTransform(prev => ({ ...prev, x: e.clientX - startDrag.x, y: e.clientY - startDrag.y }));
        }
    };

    const handleMouseUp = () => setIsDragging(false);

    const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
        e.preventDefault();
        handleZoom(e.deltaY < 0 ? 1.1 : 1 / 1.1, e.clientX, e.clientY);
    };

    const highlightedNodes = useMemo(() => {
        if (!hoveredNode || !data) return null;
        const connected = new Set([hoveredNode]);
        data.edges.forEach(edge => {
            if (edge.from === hoveredNode) connected.add(edge.to);
            if (edge.to === hoveredNode) connected.add(edge.from);
        });
        return connected;
    }, [hoveredNode, data]);

    const heatmapData = useMemo(() => {
        if (!data) return new Map();
        const map = new Map<string, string>();
        if (viewMode === 'coverage') {
            const maxCoverage = Math.max(1, ...data.ruleCoverage.map(r => r.coverage));
            data.ruleCoverage.forEach(r => map.set(r.tableName, getHeatmapColor(r.coverage / maxCoverage, isDarkMode)));
        } else if (viewMode === 'hotspots') {
            const maxScore = Math.max(1, ...data.hotspots.map(h => h.score));
            data.hotspots.forEach(h => map.set(h.tableName, getHeatmapColor(h.score / maxScore, isDarkMode)));
        }
        return map;
    }, [data, viewMode, isDarkMode]);

    if (!data || data.nodes.length === 0) return null;

    return (
        <div 
            ref={containerRef}
            className={isFullscreen 
                ? 'fixed inset-0 z-50 bg-white dark:bg-brand-dark flex flex-col' 
                : 'border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm bg-white dark:bg-slate-800/50 flex flex-col'
            }
            style={!isFullscreen ? { height: `${calculatedHeight}px` } : {}}
        >
            <div className="p-4 border-b border-slate-200 dark:border-slate-700/50 flex justify-between items-center flex-shrink-0">
                <h3 className="flex items-center text-lg font-semibold text-slate-800 dark:text-white">
                    <NetworkIcon className="w-5 h-5 mr-3 text-brand-accent" />
                    Smart Schema Visualizations
                </h3>
                <div className="flex items-center gap-4">
                    <div className="hidden sm:flex items-center gap-1 p-1 bg-slate-200 dark:bg-slate-700 rounded-lg">
                        <button onClick={() => handleZoom(1.2)} title="Zoom In" className="p-1.5 rounded-md hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors">
                            <ZoomInIcon className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                        </button>
                        <button onClick={() => handleZoom(1 / 1.2)} title="Zoom Out" className="p-1.5 rounded-md hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors">
                            <ZoomOutIcon className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                        </button>
                        <div className="w-px h-4 bg-slate-300 dark:bg-slate-600 mx-1"></div>
                        <button onClick={handleFitToView} title="Fit to View" className="p-1.5 rounded-md hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors">
                            <RefreshCwIcon className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                        </button>
                    </div>

                    <div className="flex items-center gap-2 rounded-lg bg-slate-200 dark:bg-slate-700 p-1">
                        {(['relationships', 'coverage', 'hotspots'] as ViewMode[]).map(mode => (
                            <button key={mode} onClick={() => setViewMode(mode)} className={`px-2 py-1 text-xs font-medium rounded-md transition-colors ${viewMode === mode ? 'bg-white dark:bg-slate-800 text-brand-primary dark:text-white shadow' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600'}`}>
                                {mode.charAt(0).toUpperCase() + mode.slice(1)}
                            </button>
                        ))}
                    </div>
                    <button 
                        onClick={() => setIsFullscreen(!isFullscreen)} 
                        className="p-1.5 rounded-full text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                        aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
                        title={isFullscreen ? "Exit fullscreen (Esc)" : "Enter fullscreen"}
                    >
                        {isFullscreen ? <MinimizeIcon className="w-5 h-5" /> : <MaximizeIcon className="w-5 h-5" />}
                    </button>
                </div>
            </div>
            <div 
                className="relative flex-grow min-h-0 overflow-hidden"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onWheel={handleWheel}
                style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
            >
                <svg
                    ref={svgRef}
                    width="100%"
                    height="100%"
                    className="absolute inset-0"
                >
                    <defs>
                        <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                            <path d="M 0 0 L 10 5 L 0 10 z" />
                        </marker>
                    </defs>
                    <g transform={`translate(${transform.x}, ${transform.y}) scale(${transform.scale})`}>
                        {data.edges.map((edge, i) => {
                            const fromNode = nodePositions.get(edge.from);
                            const toNode = nodePositions.get(edge.to);
                            if (!fromNode || !toNode) return null;
                            
                            const isHighlightedEdge = highlightedNodes ? highlightedNodes.has(edge.from) && highlightedNodes.has(edge.to) : false;
                            const isDimmed = hoveredNode ? !isHighlightedEdge : false;

                            const edgeOpacity = isDimmed ? 0.1 : (isHighlightedEdge ? 1 : 0.4);
                            const edgeStrokeWidth = isHighlightedEdge ? 2 : 1.5;

                            return (
                                <g key={i} style={{ opacity: edgeOpacity, transition: 'opacity 0.3s ease-in-out' }}>
                                    <line 
                                        x1={fromNode.x} y1={fromNode.y} x2={toNode.x} y2={toNode.y} 
                                        className={`stroke-current ${isHighlightedEdge ? 'text-brand-accent' : 'text-slate-400 dark:text-slate-500'}`} 
                                        strokeWidth={edgeStrokeWidth}
                                        markerEnd="url(#arrow)"
                                        style={{ transition: 'stroke-width 0.2s' }}
                                    />
                                    <text 
                                        x={(fromNode.x + toNode.x) / 2} y={(fromNode.y + toNode.y) / 2 - 5} 
                                        className="text-[10px] fill-current text-brand-accent font-semibold" 
                                        textAnchor="middle" 
                                        style={{ opacity: isHighlightedEdge ? 1 : 0, transition: 'opacity 0.3s ease-in-out' }}
                                    >
                                        {edge.label}
                                    </text>
                                </g>
                            );
                        })}
                        {Array.from(nodePositions.values()).map(node => {
                            const isHovered = hoveredNode === node.id;
                            const isNeighbor = highlightedNodes ? highlightedNodes.has(node.id) && !isHovered : false;
                            const isDimmed = hoveredNode ? !(isHovered || isNeighbor) : false;

                            const nodeStyle: React.CSSProperties = {
                                opacity: isDimmed ? 0.2 : 1,
                                filter: isHovered ? `drop-shadow(0 0 8px ${isDarkMode ? '#818cf8' : '#6366f1'})` : 'none',
                                transition: 'opacity 0.3s ease-in-out, filter 0.3s ease-in-out',
                            };

                            const fill = viewMode === 'relationships' 
                                ? (isDarkMode ? '#334155' : '#f1f5f9') 
                                : (heatmapData.get(node.id) || (isDarkMode ? '#334155' : '#e2e8f0'));

                            const rectStyle: React.CSSProperties = {
                                fill,
                                stroke: isHovered || isNeighbor ? (isDarkMode ? '#818cf8' : '#6366f1') : (isDarkMode ? '#475569' : '#cbd5e1'),
                                strokeWidth: isHovered ? 2.5 : isNeighbor ? 2 : 1.5,
                                transition: 'fill 0.2s, stroke 0.2s, stroke-width 0.2s',
                            };
                            
                            return (
                                <g key={node.id} transform={`translate(${node.x}, ${node.y})`} className="cursor-pointer" onClick={() => onTableSelect(node.label)} onMouseEnter={() => setHoveredNode(node.id)} onMouseLeave={() => setHoveredNode(null)} style={nodeStyle}>
                                    <rect x="-55" y="-20" width="110" height="40" rx="8" className={`stroke-current`} style={rectStyle} />
                                    <text className="text-sm font-semibold fill-current text-slate-700 dark:text-slate-200" textAnchor="middle" dy=".3em">{node.label}</text>
                                </g>
                            );
                        })}
                    </g>
                </svg>
                <Legend mode={viewMode} isDarkMode={isDarkMode} />
                {isSimulating && <div className="absolute top-2 left-2 text-xs text-slate-400 animate-pulse">Optimizing layout...</div>}
            </div>
        </div>
    );
};

export default SchemaVisualizer;