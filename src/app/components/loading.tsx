import styles from "@/app/ui/main.module.css";

export default function LoadingIcon() {
    const points: { x1: number, y1: number, x2: number, y2: number, o: number }[] = [
        { x1: 0, y1: -4, x2: 0, y2: -8, o: 1 },
        { x1: 2.83, y1: -2.83, x2: 5.66, y2: -5.66, o: 0.9 },
        { x1: 4, y1: 0, x2: 8, y2: 0, o: 0.8 },
        { x1: 2.83, y1: 2.83, x2: 5.66, y2: 5.66, o: 0.7 },
        { x1: 0, y1: 4, x2: 0, y2: 8, o: 0.6 },
        { x1: -2.83, y1: 2.83, x2: -5.66, y2: 5.66, o: 0.5 },
        { x1: -4, y1: 0, x2: -8, y2: 0, o: 0.4 },
        { x1: -2.83, y1: -2.83, x2: -5.66, y2: -5.66, o: 0.3 }
    ];
    return (
        <div className="w-6 aspect-1/1 opacity-[40%]">
            <svg  xmlns="http://www.w3.org/2000/svg" viewBox="-10 -10 20 20">
                <g className={styles.loader}>
                {points.map((p,i) => (
                    <line 
                        x1={p.x1} y1={p.y1} x2={p.x2} y2={p.y2} 
                        style={{opacity:p.o}} 
                        stroke="var(--color-front)" 
                        strokeWidth="2" 
                        strokeLinecap="round" 
                        key={`load${i}`} 
                    />
                ))}
                </g>
            </svg>
        </div>
    )
}