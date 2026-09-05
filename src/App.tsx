import React, { useEffect, useState } from 'react';
import { PhotoRecord } from './types';
import {
  getAllLocalPhotos,
  savePhotoLocally,
  deleteLocalPhoto,
  updatePhoto,
  freeUpLocalSpace,
} from './services/db';
import { CameraViewfinder } from './components/camera/CameraViewfinder';
import { GalleryModal } from './components/gallery/GalleryModal';
import { PhotoEditorModal } from './components/editor/PhotoEditorModal';
import { CloudBackupModal } from './components/cloud/CloudBackupModal';
import { CheckCircle2, AlertCircle, Cloud, Sparkles } from 'lucide-react';

export default function App() {
  const [photos, setPhotos] = useState<PhotoRecord[]>([]);
  const [isGalleryOpen, setIsGalleryOpen] = useState<boolean>(false);
  const [isEditorOpen, setIsEditorOpen] = useState<boolean>(false);
  const [isCloudModalOpen, setIsCloudModalOpen] = useState<boolean>(false);
  const [selectedPhotoForEdit, setSelectedPhotoForEdit] = useState<PhotoRecord | null>(null);

  const [isOffline, setIsOffline] = useState<boolean>(!navigator.onLine);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<{
    text: string;
    type: 'success' | 'info' | 'warn';
  } | null>(null);

  const showToast = (text: string, type: 'success' | 'info' | 'warn' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // 1. Initial load from local IndexedDB database
  useEffect(() => {
    async function loadData() {
      try {
        const localList = await getAllLocalPhotos();
        setPhotos(localList);
      } catch (err) {
        console.error('Failed to load local photos', err);
      }
    }
    loadData();

    // Listen for connectivity changes
    const handleOnline = () => {
      setIsOffline(false);
      showToast('Internet connected: Cloud backup available', 'info');
    };
    const handleOffline = () => {
      setIsOffline(true);
      showToast('Offline Mode: Photos saved to device database', 'warn');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // 2. Capture Photo Handler (Offline First + Async Cloud Backup)
  const handleCapturePhoto = async (newPhoto: PhotoRecord) => {
    try {
      // Save locally to IndexedDB first
      await savePhotoLocally(newPhoto);
      setPhotos((prev) => [newPhoto, ...prev]);
      showToast(`Photo captured (${newPhoto.zoomLevel.toFixed(1)}x • ${newPhoto.mode.toUpperCase()})`);

      // If online, perform asynchronous cloud backup
      if (navigator.onLine) {
        backupPhotoToCloud(newPhoto);
      }
    } catch (err) {
      console.error('Error saving photo', err);
      showToast('Failed to save photo locally', 'warn');
    }
  };

  // 3. Backup Single Photo to Node.js Cloud Storage
  const backupPhotoToCloud = async (photo: PhotoRecord) => {
    try {
      const res = await fetch('/api/cloud/photos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(photo),
      });

      if (res.ok) {
        const data = await res.json();
        const updated: PhotoRecord = {
          ...photo,
          cloudSyncStatus: 'synced',
          cloudUrl: data.record?.cloudUrl,
        };
        await updatePhoto(updated);
        setPhotos((prev) => prev.map((p) => (p.id === photo.id ? updated : p)));
      }
    } catch (e) {
      console.warn('Cloud backup failed, kept in local queue', e);
    }
  };

  // 4. Backup All Pending Photos to Cloud
  const handleBackupAll = async () => {
    const unSynced = photos.filter((p) => p.cloudSyncStatus !== 'synced');
    if (unSynced.length === 0) {
      showToast('All photos are already backed up to Cloud', 'info');
      return;
    }

    setIsSyncing(true);
    let successCount = 0;

    for (const photo of unSynced) {
      try {
        const res = await fetch('/api/cloud/photos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(photo),
        });

        if (res.ok) {
          const data = await res.json();
          const updated: PhotoRecord = {
            ...photo,
            cloudSyncStatus: 'synced',
            cloudUrl: data.record?.cloudUrl,
          };
          await updatePhoto(updated);
          setPhotos((prev) => prev.map((p) => (p.id === photo.id ? updated : p)));
          successCount++;
        }
      } catch (e) {
        console.error('Batch backup item failed', e);
      }
    }

    setIsSyncing(false);
    showToast(`Successfully backed up ${successCount} photos to Cloud!`);
  };

  // 5. Delete Photo
  const handleDeletePhoto = async (id: string) => {
    try {
      await deleteLocalPhoto(id);
      setPhotos((prev) => prev.filter((p) => p.id !== id));

      // Also remove from cloud if connected
      if (navigator.onLine) {
        fetch(`/api/cloud/photos/${id}`, { method: 'DELETE' }).catch(() => {});
      }
      showToast('Photo removed from gallery');
    } catch (e) {
      console.error('Error deleting photo', e);
    }
  };

  // 6. Free Up Local Space (Google Photos style)
  const handleFreeUpSpace = async () => {
    try {
      const freed = await freeUpLocalSpace();
      const reloaded = await getAllLocalPhotos();
      setPhotos(reloaded);
      showToast(`Device storage freed! Cached images safely stored in Cloud.`);
    } catch (e) {
      console.error('Error freeing space', e);
    }
  };

  // 7. Save Edited Copy from Photo Editor
  const handleSaveEditorCopy = async (updatedPhoto: PhotoRecord) => {
    await savePhotoLocally(updatedPhoto);
    setPhotos((prev) => [updatedPhoto, ...prev]);
    showToast('Edited photo saved to gallery!');
    if (navigator.onLine) {
      backupPhotoToCloud(updatedPhoto);
    }
  };

  return (
    <main className="w-full h-screen bg-black text-white overflow-hidden relative font-sans">
      {/* Toast Notification Alert */}
      {toastMessage && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-60 max-w-sm w-auto px-4 py-2 bg-neutral-900/90 backdrop-blur-xl border border-white/20 rounded-full shadow-2xl flex items-center gap-2 text-xs font-mono animate-in fade-in slide-in-from-top-2 duration-200 pointer-events-none">
          {toastMessage.type === 'success' && (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          )}
          {toastMessage.type === 'warn' && (
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
          )}
          {toastMessage.type === 'info' && <Cloud className="w-4 h-4 text-cyan-400 shrink-0" />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Main Camera Viewfinder */}
      <CameraViewfinder
        onCapture={handleCapturePhoto}
        onOpenGallery={() => setIsGalleryOpen(true)}
        onOpenCloudModal={() => setIsCloudModalOpen(true)}
        photos={photos}
        isOffline={isOffline}
      />

      {/* In-App Vision Gallery Modal */}
      <GalleryModal
        isOpen={isGalleryOpen}
        onClose={() => setIsGalleryOpen(false)}
        photos={photos}
        onDeletePhoto={handleDeletePhoto}
        onBackupPhoto={backupPhotoToCloud}
        onBackupAll={handleBackupAll}
        onFreeUpSpace={handleFreeUpSpace}
        onOpenEditor={(photo) => {
          setSelectedPhotoForEdit(photo);
          setIsEditorOpen(true);
        }}
        isSyncing={isSyncing}
        isOffline={isOffline}
      />

      {/* Photo Studio Editor Modal */}
      {selectedPhotoForEdit && (
        <PhotoEditorModal
          photo={selectedPhotoForEdit}
          isOpen={isEditorOpen}
          onClose={() => {
            setIsEditorOpen(false);
            setSelectedPhotoForEdit(null);
          }}
          onSaveCopy={handleSaveEditorCopy}
        />
      )}

      {/* Cloud Backup & Storage Stats Modal */}
      <CloudBackupModal
        isOpen={isCloudModalOpen}
        onClose={() => setIsCloudModalOpen(false)}
        isOffline={isOffline}
        onBackupAll={handleBackupAll}
        onFreeUpSpace={handleFreeUpSpace}
        isSyncing={isSyncing}
        photos={photos}
      />
    </main>
  );
}
