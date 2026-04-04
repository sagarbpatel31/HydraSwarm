export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            HydraSwarm
          </h1>
          <p className="text-gray-600 mt-1">
            AI Software Company with Institutional Memory
          </p>
        </header>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">API Endpoints (Backend Ready)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm font-mono">
            <div className="p-3 bg-green-50 rounded">
              <span className="text-green-700 font-bold">GET</span>{" "}
              <a href="/api/health" className="text-blue-600 hover:underline">/api/health</a>
              <span className="text-gray-500 ml-2">— Health check</span>
            </div>
            <div className="p-3 bg-blue-50 rounded">
              <span className="text-blue-700 font-bold">POST</span>{" "}
              /api/seed
              <span className="text-gray-500 ml-2">— Seed HydraDB</span>
            </div>
            <div className="p-3 bg-green-50 rounded">
              <span className="text-green-700 font-bold">GET</span>{" "}
              <a href="/api/agents" className="text-blue-600 hover:underline">/api/agents</a>
              <span className="text-gray-500 ml-2">— Agent roster</span>
            </div>
            <div className="p-3 bg-blue-50 rounded">
              <span className="text-blue-700 font-bold">POST</span>{" "}
              /api/runs
              <span className="text-gray-500 ml-2">— Start a run</span>
            </div>
            <div className="p-3 bg-green-50 rounded">
              <span className="text-green-700 font-bold">GET</span>{" "}
              /api/runs
              <span className="text-gray-500 ml-2">— List all runs</span>
            </div>
            <div className="p-3 bg-green-50 rounded">
              <span className="text-green-700 font-bold">GET</span>{" "}
              /api/runs/[runId]
              <span className="text-gray-500 ml-2">— Run details</span>
            </div>
            <div className="p-3 bg-green-50 rounded">
              <span className="text-green-700 font-bold">GET</span>{" "}
              /api/runs/[runId]/stream
              <span className="text-gray-500 ml-2">— SSE live updates</span>
            </div>
            <div className="p-3 bg-green-50 rounded">
              <span className="text-green-700 font-bold">GET</span>{" "}
              /api/lessons
              <span className="text-gray-500 ml-2">— Extracted lessons</span>
            </div>
            <div className="p-3 bg-blue-50 rounded">
              <span className="text-blue-700 font-bold">POST</span>{" "}
              /api/memory/search
              <span className="text-gray-500 ml-2">— Search memory</span>
            </div>
            <div className="p-3 bg-green-50 rounded">
              <span className="text-green-700 font-bold">GET</span>{" "}
              /api/memory/graph?runId=...
              <span className="text-gray-500 ml-2">— Task graph</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Quick Test</h2>
          <p className="text-gray-600 text-sm mb-3">
            The frontend dashboard (agent cards, artifact tabs, timeline, graph) will be built here.
            Backend API is fully functional — test with curl:
          </p>
          <pre className="bg-gray-900 text-green-400 p-4 rounded text-xs overflow-x-auto">
{`# 1. Check health
curl http://localhost:3000/api/health

# 2. Seed demo data into HydraDB
curl -X POST http://localhost:3000/api/seed

# 3. Start a task run
curl -X POST http://localhost:3000/api/runs \\
  -H "Content-Type: application/json" \\
  -d '{"taskDescription": "Add rate limiting and audit logs to the billing API"}'

# 4. Get run details (replace RUN_ID)
curl http://localhost:3000/api/runs/RUN_ID

# 5. View extracted lessons
curl http://localhost:3000/api/lessons`}
          </pre>
        </div>
      </div>
    </div>
  );
}
