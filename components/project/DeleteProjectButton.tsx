'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { deleteProjectAction } from '@/app/actions/project';

export default function DeleteProjectButton({
  projectId,
  projectName,
}: {
  projectId: string;
  projectName: string;
}) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowConfirm(true);
  };

  const confirmDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDeleting(true);
    try {
      const res = await deleteProjectAction(projectId);
      if (res.success) {
        router.refresh();
      } else {
        alert(res.error || '销毁失败');
        setShowConfirm(false);
      }
    } catch {
      alert('网络异常，无法销毁项目。');
      setShowConfirm(false);
    } finally {
      setIsDeleting(false);
    }
  };

  const cancelDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowConfirm(false);
  };

  if (showConfirm) {
    return (
      <div
        className="absolute top-3 right-3 flex items-center gap-1 text-[10px] bg-academia-surface/95 border border-academia-crimson/30 rounded-md px-2 py-1"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="text-academia-parchment/70">销毁「{projectName}」？</span>
        <button
          onClick={confirmDelete}
          disabled={isDeleting}
          className="text-academia-crimson hover:text-red-300 transition-colors px-1"
        >
          {isDeleting ? '...' : '确认'}
        </button>
        <button
          onClick={cancelDelete}
          disabled={isDeleting}
          className="text-academia-muted hover:text-academia-parchment transition-colors px-1"
        >
          取消
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleDelete}
      className="absolute top-3 right-3 text-xs text-academia-muted hover:text-academia-crimson transition-colors p-1.5 rounded-md border border-transparent hover:border-academia-crimson/30 hover:bg-academia-crimson/10 opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
      title="销毁项目"
    >
      🗑️
    </button>
  );
}