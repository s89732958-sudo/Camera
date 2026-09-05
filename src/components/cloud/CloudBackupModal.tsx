import React, { useEffect, useState } from 'react';
import { CloudStorageStats, PhotoRecord } from '../../types';
import { estimateLocalStorageUsage } from '../../services/db';
import {
  X,
  Cloud,
  CheckCircle2,
  AlertTriangle,
  HardDrive,
  RefreshCw,
  Trash2,
  Smartphone,
  ShieldCheck,
  Zap,
} from 'lucide-react';

interface CloudBackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  isOffline: boolean;
  onBackupAll: () => Promise<void>;
  onFreeUpSpace: () => Promise<void>;
  isSyncing: boolean;
  photos: PhotoRecord[];
}

export const CloudBackupModal: React.FC<CloudBackupModalProps> = ({
  isOpen,
  onClose,
  isOffline,
  onBackupAll,
  onFreeUpSpace,
  isSyncing,
  photos,
}) => {
  const [cloudStats, setCloudStats] = useState<CloudStorageStats | null>(null);
  const [localStats, setLocalStats] = useState<{ usedMB: string; quotaMB: string }>({
    usedMB: '0',
    quotaMB: '0',
  });
  const [loadingStats, setLoadingStats] = useState(false);

  const fetchStats = async () => {
    setLoadingStats(true);
    try {
      const local = await estimateLocalStorageUsage();
      setLocalStats(local);

      if (!isOffline) {
        const res = await fetch('/api/cloud/storage-stats');
        const data = await res.json();
        setCloudStats(data);
      }
    } catch (e) {
      console.error('Error fetching stats', e);
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchStats();
    }
  }, [isOpen, isOffline]);

  if (!isOpen) return null;

  const syncedCount = photos.filter((p) => p.cloudSyncStatus === 'synced').length;
  const pendingCount = photos.length - syncedCount;

  return (
    <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-2xl flex items-center justify-center p-4 text-white select-none">
      <div className="bg-neutral-900 border border-white/15 rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-400/20 text-amber-400 rounded-xl">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">Cloud Backup & Storage</h3>
              <p className="text-[11px] text-white/50 font-mono">
                {isOffline ? 'Offline Mode Active' : 'Cloud Server Connected'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-white/60 hover:text-white hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Network & Offline Status Banner */}
        <div
          className={`p-3 rounded-xl border flex items-center gap-2.5 text-xs ${
            isOffline
              ? 'bg-amber-500/15 border-amber-500/30 text-amber-200'
              : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-200'
          }`}
        >
          {isOffline ? (
            <>
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <div>
                <p className="font-semibold">Offline Access Mode</p>
                <p className="text-[11px] text-amber-300/80">
                  You can capture, edit, zoom 100x, and export photos offline. Pending photos will backup once reconnected.
                </p>
              </div>
            </>
          ) : (
            <>
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>
                <p className="font-semibold">Cloud Sync Active</p>
                <p className="text-[11px] text-emerald-300/80">
                  Node.js backend cloud storage is ready to backup high-resolution captures.
                </p>
              </div>
            </>
          )}
        </div>

        {/* Storage Breakdown Cards */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          {/* Local Storage (IndexedDB) */}
          <div className="bg-black/40 p-3 rounded-xl border border-white/10 space-y-1">
            <div className="flex items-center gap-1.5 text-white/60 text-[10px]">
              <Smartphone className="w-3.5 h-3.5 text-amber-400" />
              <span>DEVICE STORAGE</span>
            </div>
            <p className="text-base font-bold text-white font-mono">{localStats.usedMB} MB</p>
            <p className="text-[10px] text-white/50">{photos.length} photos saved offline</p>
          </div>

          {/* Cloud Storage */}
          <div className="bg-black/40 p-3 rounded-xl border border-white/10 space-y-1">
            <div className="flex items-center gap-1.5 text-white/60 text-[10px]">
              <Cloud className="w-3.5 h-3.5 text-cyan-400" />
              <span>CLOUD BACKUP</span>
            </div>
            <p className="text-base font-bold text-white font-mono">
              {cloudStats ? `${cloudStats.usedMB} MB` : `${syncedCount} Synced`}
            </p>
            <p className="text-[10px] text-white/50">
              {cloudStats ? `5 GB Cloud Quota (${cloudStats.usedPercentage}% used)` : 'Cloud ready'}
            </p>
          </div>
        </div>

        {/* Sync Summary */}
        <div className="bg-black/30 p-3 rounded-xl border border-white/5 flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-white/80">{syncedCount} Backed Up</span>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                pendingCount > 0 ? 'bg-amber-400' : 'bg-white/30'
              }`}
            />
            <span className="text-white/80">{pendingCount} Pending Sync</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-2">
          {/* Backup All Button */}
          <button
            onClick={onBackupAll}
            disabled={isSyncing || pendingCount === 0 || isOffline}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-black font-semibold text-xs rounded-xl shadow-lg transition-all"
          >
            <Cloud className="w-4 h-4" />
            <span>
              {isSyncing
                ? 'Backing Up Photos...'
                : pendingCount === 0
                ? 'All Photos Backed Up to Cloud'
                : `Backup ${pendingCount} Pending Photos`}
            </span>
          </button>

          {/* Free Up Device Space Button */}
          <button
            onClick={onFreeUpSpace}
            disabled={syncedCount === 0}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-white/10 hover:bg-white/20 disabled:opacity-50 text-white font-medium text-xs rounded-xl border border-white/10 transition-all"
          >
            <HardDrive className="w-4 h-4 text-emerald-400" />
            <span>Free Up Device Space (Clear Local Cache)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
