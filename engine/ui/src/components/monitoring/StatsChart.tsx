import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface DataPoint {
  timestamp: string;
  cpu: number;
  memory: number;
}

interface StatsChartProps {
  data: DataPoint[];
  title: string;
}

export function StatsChart({ data, title }: StatsChartProps) {
  return (
    <div className="card p-6">
      <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis
            dataKey="timestamp"
            stroke="#9CA3AF"
            fontSize={12}
          />
          <YAxis stroke="#9CA3AF" fontSize={12} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1F2937',
              border: '1px solid #374151',
              borderRadius: '0.5rem',
              color: '#F3F4F6',
            }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="cpu"
            stroke="#0EA5E9"
            strokeWidth={2}
            name="CPU %"
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="memory"
            stroke="#22C55E"
            strokeWidth={2}
            name="Memory %"
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
