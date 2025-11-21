import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface DataPoint {
  timestamp: string;
  cpu: number;
  memory: number;
}

interface StatsChartProps {
  data: DataPoint[];
  title: string;
  height?: number;
  showBrush?: boolean;
  syncId?: string;
}

export function StatsChart({ data, title, height = 300, syncId }: StatsChartProps) {
  return (
    <div className="card p-6 bg-gray-900/50 border border-white/5 backdrop-blur-sm">
      <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
        {title}
      </h3>
      <div style={{ width: '100%', height }}>
        <ResponsiveContainer>
          <AreaChart data={data} syncId={syncId} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorMemory" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
            <XAxis
              dataKey="timestamp"
              stroke="#9CA3AF"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              dy={10}
            />
            <YAxis
              stroke="#9CA3AF"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              dx={-10}
              domain={[0, 100]}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(17, 24, 39, 0.95)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '0.5rem',
                color: '#F3F4F6',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
              }}
              itemStyle={{ padding: '2px 0' }}
            />
            <Legend
              verticalAlign="top"
              height={36}
              iconType="circle"
            />
            <Area
              type="monotone"
              dataKey="cpu"
              stroke="#3B82F6"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorCpu)"
              name="CPU Usage %"
              animationDuration={500}
            />
            <Area
              type="monotone"
              dataKey="memory"
              stroke="#10B981"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorMemory)"
              name="Memory Usage %"
              animationDuration={500}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
