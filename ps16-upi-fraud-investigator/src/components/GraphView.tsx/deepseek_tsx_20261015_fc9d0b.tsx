import cytoscape from 'cytoscape'
import { useEffect, useRef } from 'react'

export default function GraphView({
  elements, onSelect, height = 600,
}: { elements: any[]; onSelect?: (id: string) => void; height?: number }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!ref.current) return
    const cy = cytoscape({
      container: ref.current,
      elements,
      style: [
        {
          selector: 'node',
          style: {
            label: 'data(label)',
            'background-color': '#22d3ee',
            color: '#e2e8f0',
            'font-size': 10,
            width: 26, height: 26,
          },
        },
        {
          selector: 'edge',
          style: {
            width: 1.5,
            'line-color': '#475569',
            'target-arrow-color': '#475569',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
            label: 'data(label)',
            'font-size': 8,
            color: '#94a3b8',
          },
        },
      ],
      layout: { name: 'cose', animate: false } as any,
    })
    cy.on('tap', 'node', ev => onSelect?.(ev.target.id()))
    return () => cy.destroy()
  }, [elements, onSelect])

  return <div ref={ref} style={{ height }} className="w-full rounded-xl border border-slate-800 bg-slate-950" />
}