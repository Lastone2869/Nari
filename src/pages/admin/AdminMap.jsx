import SafetyMap from '../SafetyMap';

export default function AdminMap() {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex-1 h-[80vh]">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-nari-navy">Master Map Omni-View</h2>
          <p className="text-gray-500 text-sm">Real-time overlay of safe zones, verified incidents, and live SOS tracking.</p>
        </div>
      </div>
      <div className="h-full -mx-6 -my-4 relative overflow-hidden rounded-b-2xl">
        {/* We reuse the SafetyMap component but use CSS to override its min-h-screen container */}
        <div className="absolute inset-0 [&>div]:min-h-0 [&>div]:pt-0 [&>div]:pb-0">
          <SafetyMap />
        </div>
      </div>
    </div>
  );
}
