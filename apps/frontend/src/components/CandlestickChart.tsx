"use client";

import { useEffect, useRef } from "react";
import {
  createChart,
  CandlestickSeries,
  type IChartApi,
  type ISeriesApi,
  type CandlestickData,
} from "lightweight-charts";

export function CandlestickChart({ data }: { data: CandlestickData[] }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    chartRef.current = createChart(containerRef.current, {
      height: 400,
    });

    // ✅ CORRECT v4 API
    seriesRef.current = chartRef.current.addSeries(CandlestickSeries);

    chartRef.current.timeScale().fitContent();

    return () => chartRef.current?.remove();
  }, []);

  useEffect(() => {
    if (seriesRef.current && data.length) {
      seriesRef.current.setData(data);
    }
  }, [data]);

  return <div ref={containerRef} className="w-full" />;
}
