import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { SchemaVisualizationData, SchemaNode, SchemaEdge } from '../types';
import { NetworkIcon, MaximizeIcon, MinimizeIcon, ZoomInIcon, ZoomOutIcon, RefreshCwIcon } from './icons';

type ViewMode = 'relationships' | 'hotspots';
type HoverItem = { type: 'node'; id: string } | { type: 'edge'; index: number };

interface NodePosition extends SchemaNode {
    x: number;
    y: number;
}

interface ProcessedEdge extends SchemaEdge {
    d: string;
    textTransform: string;
    textAnchor: 'middle' | 'start' | 'end';
}

interface TooltipData {
    content: string;
    x: number;
    y: number;
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

const Tooltip: React.FC<{ data: TooltipData | null }> = ({ data }) => {
    if (!data) return null;
    return (
        <div 
            className="absolute p-2 text-xs font-semibold text-white bg-slate-800/90 dark:bg-black/80 rounded-md shadow-lg pointer-events-none"
            style={{ top: data.y, left: data.x, transform: 'translate(10px, 10px)' }}
        >
            {data.content}
        </div>
    );
};

const useStaticDiamondLayout = (data: SchemaVisualizationData | null, width: number, height: number): [Map<string, NodePosition>, boolean] => {
    const [nodePositions, setNodePositions] = useState<Map<string, NodePosition>>(new Map());
    const [isLayingOut, setIsLayingOut] = useState(true);

    useEffect(() => {
        if (!data || data.nodes.length === 0 || width === 0 || height === 0) {
            setIsLayingOut(false);
            return;
        }

        setIsLayingOut(true);
        const newPositions = new Map<string, NodePosition>();
        const nodes = data.nodes.slice().sort((a, b) => a.id.localeCompare(b.id));
        const numNodes = nodes.length;

        const centerX = width / 2;
        const centerY = height / 2;
        
        const horizontalRadius = Math.max(1, width / 2 - 100);
        const verticalRadius = Math.max(1, height / 2 - 60);

        if (numNodes === 1) {
             const node = nodes[0];
             newPositions.set(node.id, {
                ...node,
                x: centerX,
                y: centerY,
            });
        } else {
            const nodesPerSide = Math.ceil(numNodes / 4);
            const lerp = (a: number, b: number, t: number) => a * (1 - t) + b * t;
    
            nodes.forEach((node, i) => {
                const side = Math.floor(i / nodesPerSide);
                const positionOnSide = i % nodesPerSide;
                const t = nodesPerSide > 1 ? (positionOnSide + 1) / (nodesPerSide + 1) : 0.5;
    
                let x = 0, y = 0;
    
                switch (side) {
                    case 0: // Top-to-Right
                        x = lerp(centerX, centerX + horizontalRadius, t);
                        y = lerp(centerY - verticalRadius, centerY, t);
                        break;
                    case 1: // Right-to-Bottom
                        x = lerp(centerX + horizontalRadius, centerX, t);
                        y = lerp(centerY, centerY + verticalRadius, t);
                        break;
                    case 2: // Bottom-to-Left
                        x = lerp(centerX, centerX - horizontalRadius, t);
                        y = lerp(centerY + verticalRadius, centerY, t);
                        break;
                    case 3: // Left-to-Top
                    default:
                        x = lerp(centerX - horizontalRadius, centerX, t);
                        y = lerp(centerY, centerY - verticalRadius, t);
                        break;
                }
    
                newPositions.set(node.id, {
                    ...node,
                    x,
                    y,
                });
            });
        }

        setNodePositions(newPositions);
        setIsLayingOut(false);

    }, [data, width, height]);

    return [nodePositions, isLayingOut];
};

const Legend: React.FC<{ mode: ViewMode, isDarkMode: boolean }> = ({ mode, isDarkMode }) => {
    if (mode === 'relationships') return null;

    let title = '';
    let items = [];
    const colors = isDarkMode ? DARK_HEATMAP_COLORS : LIGHT_HEATMAP_COLORS;

    if (mode === 'hotspots') {
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
    onTableSelect: (tableName: string, fromView: ViewMode) => void;
    viewMode: ViewMode;
    setViewMode: (mode: ViewMode) => void;
}

const SchemaVisualizer: React.FC<SchemaVisualizerProps> = ({ data, onTableSelect, viewMode, setViewMode }) => {
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
        const extraHeight = Math.min((nodeCount - 5) * 30, 350);
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

    const [nodePositions, isLayingOut] = useStaticDiamondLayout(data, dimensions.width, dimensions.height);
    const [hoveredItem, setHoveredItem] = useState<HoverItem | null>(null);
    const [tooltip, setTooltip] = useState<TooltipData | null>(null);

    const latestState = useRef({ isLayingOut, nodePositions, dimensions });
    latestState.current = { isLayingOut, nodePositions, dimensions };
    
    const handleFitToView = useCallback(() => {
        const { isLayingOut, nodePositions, dimensions } = latestState.current;
        if (isLayingOut || nodePositions.size === 0 || dimensions.width === 0 || dimensions.height === 0) return;
        
        const nodes = Array.from(nodePositions.values()) as NodePosition[];
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        nodes.forEach(node => {
            minX = Math.min(minX, node.x);
            minY = Math.min(minY, node.y);
            maxX = Math.max(maxX, node.x);
            maxY = Math.max(maxY, node.y);
        });

        if (nodes.length === 1) {
            const node = nodes[0];
            setTransform({ scale: 1.2, x: dimensions.width / 2 - node.x * 1.2, y: dimensions.height / 2 - node.y * 1.2 });
            return;
        }

        const nodesWidth = maxX - minX;
        const nodesHeight = maxY - minY;
        if (nodesWidth <= 0 || nodesHeight <= 0) return;

        const padding = 120;
        const scale = Math.min((dimensions.width - padding) / nodesWidth, (dimensions.height - padding) / nodesHeight, 1.5);
        const x = (dimensions.width / 2) - ((minX + nodesWidth / 2) * scale);
        const y = (dimensions.height / 2) - ((minY + nodesHeight / 2) * scale);
        
        setTransform({ scale, x, y });
    }, []);

    useEffect(() => {
        if (!isLayingOut) handleFitToView();
    }, [isLayingOut, handleFitToView]);

    const handleZoom = (factor: number, clientX?: number, clientY?: number) => {
        setTransform(prev => {
            const newScale = Math.max(0.1, Math.min(prev.scale * factor, 5));
            const svg = svgRef.current;
            if (!svg) return { ...prev, scale: newScale };
            
            const svgPoint = svg.createSVGPoint();
            svgPoint.x = clientX ?? dimensions.width / 2;
            svgPoint.y = clientY ?? dimensions.height / 2;
            
            const ctm = svg.getScreenCTM();
            if (!ctm) return { ...prev, scale: newScale };
            
            // FIX: The `matrixTransform` method can return a generic object type.
            // By adding an explicit type assertion, we ensure that `pointInSVG.x` and `pointInSVG.y` can be accessed without compile-time errors.
            const pointInSVG = svgPoint.matrixTransform(ctm.inverse()) as DOMPoint;
            
            const newX = pointInSVG.x - (pointInSVG.x - prev.x) * (newScale / prev.scale);
            const newY = pointInSVG.y - (pointInSVG.y - prev.y) * (newScale / prev.scale);
            
            return { scale: newScale, x: newX, y: newY };
        });
    };

    const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        if ((e.target as HTMLElement).closest('button, a, .node-group')) return;
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

    const processedEdges = useMemo((): ProcessedEdge[] => {
        if (!data?.edges || nodePositions.size === 0) return [];
    
        const edgeCounts: Record<string, number> = {};
        data.edges.forEach(edge => {
            const key = [edge.from, edge.to].sort().join('--');
            edgeCounts[key] = (edgeCounts[key] || 0) + 1;
        });
    
        const edgeIndices: Record<string, number> = {};
    
        return data.edges.map(edge => {
            const fromNode = nodePositions.get(edge.from);
            const toNode = nodePositions.get(edge.to);
            if (!fromNode || !toNode) return { ...edge, d: '', textTransform: '', textAnchor: 'middle' };
    
            const key = [edge.from, edge.to].sort().join('--');
            const total = edgeCounts[key];
            const index = edgeIndices[key] = (edgeIndices[key] || 0) + 1;
            
            const dx = toNode.x - fromNode.x;
            const dy = toNode.y - fromNode.y;

            let d = `M ${fromNode.x} ${fromNode.y} L ${toNode.x} ${toNode.y}`;
            let textTransform = `translate(${(fromNode.x + toNode.x) / 2}, ${(fromNode.y + toNode.y) / 2})`;
            let textAnchor: 'middle' | 'start' | 'end' = 'middle';
    
            if (total > 1) {
                const dr = Math.sqrt(dx * dx + dy * dy);
                const midX = (fromNode.x + toNode.x) / 2;
                const midY = (fromNode.y + toNode.y) / 2;
                
                const normX = -dy / dr;
                const normY = dx / dr;
                
                const curveFactor = 25;
                const curveOffset = (index - (total + 1) / 2) * curveFactor;
    
                const controlX = midX + curveOffset * normX;
                const controlY = midY + curveOffset * normY;
    
                d = `M ${fromNode.x},${fromNode.y} Q ${controlX},${controlY} ${toNode.x},${toNode.y}`;
                textTransform = `translate(${controlX}, ${controlY})`;
            }

            const angle = Math.atan2(dy, dx) * (180 / Math.PI);
            if (angle > 90 || angle < -90) {
                textTransform += ` rotate(180)`;
                textAnchor = 'middle';
            }
            
            return { ...edge, d, textTransform, textAnchor };
        });
    }, [data, nodePositions]);

    const { highlightedNodes, highlightedEdges } = useMemo(() => {
        const nodes = new Set<string>();
        const edges = new Set<number>();
        if (!hoveredItem || !data) return { highlightedNodes: nodes, highlightedEdges: edges };

        if (hoveredItem.type === 'node') {
            nodes.add(hoveredItem.id);
            data.edges.forEach((edge, index) => {
                if (edge.from === hoveredItem.id) {
                    nodes.add(edge.to);
                    edges.add(index);
                }
                if (edge.to === hoveredItem.id) {
                    nodes.add(edge.from);
                    edges.add(index);
                }
            });
        } else if (hoveredItem.type === 'edge') {
            const edge = data.edges[hoveredItem.index];
            if (edge) {
                nodes.add(edge.from);
                nodes.add(edge.to);
                edges.add(hoveredItem.index);
            }
        }
        return { highlightedNodes: nodes, highlightedEdges: edges };
    }, [hoveredItem, data]);

    const heatmapData = useMemo(() => {
        if (!data) return new Map();
        const map = new Map<string, string>();
        if (viewMode === 'hotspots') {
            const maxScore = Math.max(1, ...data.hotspots.map(h => h.score));
            data.hotspots.forEach(h => map.set(h.tableName, getHeatmapColor(h.score / maxScore, isDarkMode)));
        }
        return map;
    }, [data, viewMode, isDarkMode]);
    
    const handleEdgeMouseMove = (e: React.MouseEvent, edge: SchemaEdge) => {
        const containerBounds = containerRef.current?.getBoundingClientRect();
        if (containerBounds) {
            setTooltip({
                content: edge.label,
                x: e.clientX - containerBounds.left,
                y: e.clientY - containerBounds.top
            });
        }
    };
    
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
                        {(['relationships', 'hotspots'] as ViewMode[]).map(mode => (
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
                    <g transform={`translate(${transform.x}, ${transform.y}) scale(${transform.scale})`}>
                        {processedEdges.map((edge, i) => {
                            const isHighlighted = highlightedEdges.has(i);
                            const isDimmed = hoveredItem ? !isHighlighted && !(hoveredItem.type === 'node' && (hoveredItem.id === edge.from || hoveredItem.id === edge.to)) : false;
                            
                            const edgeOpacity = isDimmed ? 0.1 : (isHighlighted ? 1 : 0.6);
                            const edgeStrokeWidth = isHighlighted ? 2.5 : 1.5;

                            return (
                                <g key={i} className="edge-group" style={{ opacity: edgeOpacity, transition: 'opacity 0.2s ease-in-out' }}>
                                    <path 
                                        d={edge.d}
                                        className={`stroke-current fill-none ${isHighlighted ? 'text-brand-accent' : 'text-slate-400 dark:text-slate-500'}`}
                                        strokeWidth={edgeStrokeWidth}
                                        style={{ transition: 'stroke-width 0.2s, stroke 0.2s' }}
                                    />
                                    <path d={edge.d} stroke="transparent" strokeWidth="15" fill="none"
                                        onMouseEnter={() => setHoveredItem({ type: 'edge', index: i })}
                                        onMouseMove={(e) => handleEdgeMouseMove(e, edge)}
                                        onMouseLeave={() => { setHoveredItem(null); setTooltip(null); }}
                                    />
                                    <text 
                                        className="text-[10px] fill-current text-brand-accent font-semibold pointer-events-none"
                                        textAnchor={edge.textAnchor}
                                        dy="-4"
                                        style={{ opacity: isHighlighted ? 1 : 0, transition: 'opacity 0.2s ease-in-out' }}
                                    >
                                        <textPath href={`#edge-path-${i}`} startOffset="50%">{edge.label}</textPath>
                                    </text>
                                    <path id={`edge-path-${i}`} d={edge.d} className="hidden" />
                                </g>
                            );
                        })}
                        {Array.from(nodePositions.values()).map(node => {
                            const isHovered = hoveredItem?.type === 'node' && hoveredItem.id === node.id;
                            const isHighlighted = highlightedNodes.has(node.id);
                            const isDimmed = hoveredItem ? !isHighlighted : false;

                            const nodeStyle: React.CSSProperties = {
                                opacity: isDimmed ? 0.25 : 1,
                                filter: isHovered ? `drop-shadow(0 0 8px ${isDarkMode ? '#818cf8' : '#6366f1'})` : 'none',
                                transition: 'opacity 0.2s ease-in-out, filter 0.2s ease-in-out',
                            };

                            const fill = viewMode === 'relationships' 
                                ? (isDarkMode ? '#334155' : '#f1f5f9') 
                                : (heatmapData.get(node.id) || (isDarkMode ? '#334155' : '#e2e8f0'));

                            const rectStyle: React.CSSProperties = {
                                fill,
                                stroke: isHighlighted ? (isDarkMode ? '#818cf8' : '#6366f1') : (isDarkMode ? '#475569' : '#cbd5e1'),
                                strokeWidth: isHighlighted ? 2.5 : 1.5,
                                transition: 'fill 0.2s, stroke 0.2s, stroke-width 0.2s',
                            };
                            
                            return (
                                <g 
                                    key={node.id} 
                                    transform={`translate(${node.x}, ${node.y})`} 
                                    className="node-group cursor-pointer" 
                                    onClick={() => onTableSelect(node.label, viewMode)} 
                                    onMouseEnter={() => setHoveredItem({ type: 'node', id: node.id })} 
                                    onMouseLeave={() => setHoveredItem(null)} 
                                    style={nodeStyle}
                                >
                                    <rect x="-55" y="-20" width="110" height="40" rx="8" className={`stroke-current`} style={rectStyle} />
                                    <text className="text-sm font-semibold fill-current text-slate-700 dark:text-slate-200 pointer-events-none" textAnchor="middle" dy=".3em">{node.label}</text>
                                </g>
                            );
                        })}
                    </g>
                </svg>
                <Tooltip data={tooltip} />
                <Legend mode={viewMode} isDarkMode={isDarkMode} />
            </div>
        </div>
    );
};

export default SchemaVisualizer;
