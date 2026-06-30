const Arc = ({
  value,
  max,
  radius,
  color,
  stroke,
  rotation = 270, // default rotation
}: {
  value: number;
  max: number;
  radius: number;
  color: string;
  stroke: number;
  rotation?: number;
}) => {
  const circumference = 2 * Math.PI * radius;
  const arcLength = (300 / 360) * circumference;
  const filled = Math.min((value / max) * arcLength, arcLength);
  const dashArray = `${filled} ${circumference}`;
  const dashOffset = (circumference - arcLength) / 2;

  return (
    <circle
      cx="128.5" // half of width/height
      cy="128.5"
      r={radius}
      fill="transparent"
      stroke={color}
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeDasharray={dashArray}
      strokeDashoffset={dashOffset}
      transform={`rotate(${rotation} 128.5 128.5)`} // rotate around center
    />
  );
};

interface CustomChartProps {
  rings?: number[];
  labels?: string[];
}

const CustomChart = ({ rings = [0, 0, 0], labels = ["", "", ""] }: CustomChartProps) => {
  const stroke = 12;
  const gap = 15;

  return (
    <div className="relative w-full h-full flex justify-end lg:scale-100 scale-70">
        <div className="w-full h-full relative m-auto">
        <svg width="257" height="257" className="rtl:-scale-x-100 m-auto sm:mt-0 -mt-5 ">
            <Arc value={rings[0] || 0} max={100} radius={110} color="#E7D2D2" stroke={17} />
            <Arc value={rings[1] || 0} max={100} radius={110 - stroke - gap} color="#CDA5A6" stroke={17} />
            <Arc value={rings[2] || 0} max={100} radius={110 - 2 * (stroke + gap)} color="#B37B7D" stroke={17} />
        </svg>
        {/* Labels */}
        <div className="absolute top-1.75 sm:mt-0 -mt-5 xl:inset-s-[20%] inset-s-[15%] text-sm text-end min-w-20 font-bold font-just text-[#E7D2D2]">
            {labels[0] || ""}
        </div>
        <div className="absolute top-9.25 sm:mt-0 -mt-5 xl:inset-s-[20%] inset-s-[15%] text-sm text-end min-w-20 font-bold font-just text-[#CDA5A6]">
            {labels[1] || ""}
        </div>
        <div className="absolute top-16.25 sm:mt-0 -mt-5 xl:inset-s-[20%] inset-s-[15%] text-sm text-end min-w-20 font-bold font-just text-[#B37B7D]">
            {labels[2] || ""}
        </div>
      </div>
    </div>
  );
};

export default CustomChart;
