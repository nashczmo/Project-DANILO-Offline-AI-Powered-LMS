import { useState, useEffect } from 'react';
import { Server, HardDrive, Cpu, Terminal, AlertCircle } from 'lucide-react';
import { Card, PageHeader, Skeleton, Button, EmptyState } from '../../components/ui';
import { apiRequest } from '../../api.js';

export default function AdminSystem() {
  const [loading, setLoading] = useState(true);
  const [systemData, setSystemData] = useState(null);

  useEffect(() => {
    const fetchSystem = async () => {
      setLoading(true);
      try {
        const data = await apiRequest("/admin/system");
        setSystemData(data);
      } catch (error) {
        console.error("Failed to fetch system data:", error);
        setSystemData(null);
      } finally {
        setLoading(false);
      }
    };
    
    fetchSystem();
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader 
        title="System Configuration" 
        description="Manage core platform settings, database backups, and AI runtimes."
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {loading ? (
          <>
            <Skeleton className="h-40" />
            <Skeleton className="h-40" />
            <Skeleton className="h-40" />
          </>
        ) : !systemData ? (
          <div className="col-span-full">
            <EmptyState
              icon={Server}
              title="No System Data"
              description="System metrics could not be retrieved. Please verify the server status."
            />
          </div>
        ) : (
          <>
            <Card>
              <div className="flex items-center gap-3 mb-4">
                <Cpu className="w-5 h-5 text-blue-500" />
                <h3 className="dn-title">Ollama AI Engine</h3>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-danilo-text-secondary">Status</span>
                  <span className="text-green-600 font-medium">Running</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-danilo-text-secondary">RAM Limit</span>
                  <span className="font-medium">8 GB / 16 GB</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-danilo-text-secondary">GPU VRAM</span>
                  <span className="font-medium">4 GB / 8 GB</span>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-danilo-border">
                <div className="w-full bg-danilo-bg-tertiary rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: '50%' }}></div>
                </div>
              </div>
            </Card>

            <Card>
              <div className="flex items-center gap-3 mb-4">
                <Server className="w-5 h-5 text-purple-500" />
                <h3 className="dn-title">Docker Health</h3>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-danilo-text-secondary">Containers</span>
                  <span className="font-medium">4 Running</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-danilo-text-secondary">Network</span>
                  <span className="text-green-600 font-medium">Healthy</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-danilo-text-secondary">Volumes</span>
                  <span className="font-medium">3 Attached</span>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-danilo-border">
                <div className="w-full bg-danilo-bg-tertiary rounded-full h-2">
                  <div className="bg-purple-500 h-2 rounded-full" style={{ width: '80%' }}></div>
                </div>
              </div>
            </Card>

            <Card>
              <div className="flex items-center gap-3 mb-4">
                <HardDrive className="w-5 h-5 text-orange-500" />
                <h3 className="dn-title">Storage Volumes</h3>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-danilo-text-secondary">Database</span>
                  <span className="font-medium">2.4 GB</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-danilo-text-secondary">Uploads</span>
                  <span className="font-medium">14.1 GB</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-danilo-text-secondary">Models</span>
                  <span className="font-medium">8.2 GB</span>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-danilo-border">
                <div className="w-full bg-danilo-bg-tertiary rounded-full h-2">
                  <div className="bg-orange-500 h-2 rounded-full" style={{ width: '65%' }}></div>
                </div>
              </div>
            </Card>
          </>
        )}
      </div>

      <Card className="min-h-[300px]">
        <div className="flex items-center gap-2 mb-4">
          <Terminal className="w-5 h-5 text-danilo-text-secondary" />
          <h3 className="dn-title">System Logs</h3>
        </div>
        
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-6 w-5/6" />
          </div>
        ) : (
          <div className="bg-gray-900 rounded-xl p-4 font-mono text-sm text-gray-300 h-64 overflow-y-auto">
            <div className="flex gap-2">
              <span className="text-green-400">[INFO]</span>
              <span>2026-05-22T01:15:00Z - System health check passed.</span>
            </div>
            <div className="flex gap-2 mt-2">
              <span className="text-green-400">[INFO]</span>
              <span>2026-05-22T01:16:22Z - Database backup completed successfully.</span>
            </div>
            <div className="flex gap-2 mt-2">
              <span className="text-blue-400">[OLLAMA]</span>
              <span>2026-05-22T01:18:05Z - Model llama3 loaded into memory.</span>
            </div>
            <div className="flex gap-2 mt-2">
              <span className="text-yellow-400">[WARN]</span>
              <span>2026-05-22T01:20:10Z - High memory usage detected (85%).</span>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
