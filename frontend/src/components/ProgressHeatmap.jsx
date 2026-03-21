import { useMemo } from "react";
import "../styles/ProgressHeatmap.css";

/*
  Expected data format (you will pass from backend later):

  [
    { date: "2025-02-01", count: 3 },
    { date: "2025-02-02", count: 0 },
    ...
  ]
*/

export default function ProgressHeatmap({ data = [] }) {

  // Generate last 365 days grid
  const days = useMemo(() => {
    const today = new Date();
    const result = [];

    for (let i = 364; i >= 0; i--) {
      const date = new Date();
      date.setDate(today.getDate() - i);

      const formatted = date.toISOString().split("T")[0];

      const found = data.find(d => d.date === formatted);

      result.push({
        date: formatted,
        count: found ? found.count : 0
      });
    }

    return result;
  }, [data]);

  const getColorLevel = (count) => {
    if (count === 0) return "level-0";
    if (count < 3) return "level-1";
    if (count < 6) return "level-2";
    if (count < 10) return "level-3";
    return "level-4";
  };

  return (
    <div className="heatmap-wrapper">
      <div className="heatmap-grid">
        {days.map((day, index) => (
          <div
            key={index}
            className={`heatmap-cell ${getColorLevel(day.count)}`}
            title={`${day.date} - ${day.count} workouts`}
          />
        ))}
      </div>

      <div className="heatmap-legend">
        <span>Less</span>
        <div className="legend-box level-0" />
        <div className="legend-box level-1" />
        <div className="legend-box level-2" />
        <div className="legend-box level-3" />
        <div className="legend-box level-4" />
        <span>More</span>
      </div>
    </div>
  );
}
