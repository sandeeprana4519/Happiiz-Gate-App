/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Search, 
  ThumbsUp, 
  ThumbsDown, 
  MessageSquare, 
  Download, 
  FileText, 
  Tag, 
  Calendar,
  Send
} from 'lucide-react';
import { SocietyNoticeItem } from '../../types/resident';
import { residentService } from '../../services/firebase/resident.service';

interface ResidentNoticeBoardModalProps {
  isOpen: boolean;
  onClose: () => void;
  societyId: string;
  residentUid: string;
  residentName: string;
  flatNumber: string;
}

export const ResidentNoticeBoardModal: React.FC<ResidentNoticeBoardModalProps> = ({
  isOpen,
  onClose,
  societyId,
  residentUid,
  residentName,
  flatNumber,
}) => {
  const [notices, setNotices] = useState<SocietyNoticeItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [expandedNoticeId, setExpandedNoticeId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');

  const loadData = async () => {
    const list = await residentService.getNotices(societyId);
    setNotices(list);
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, societyId]);

  if (!isOpen) return null;

  const categories = ['ALL', 'General', 'Maintenance', 'Meeting', 'Emergency', 'Water Supply', 'Electricity', 'Events'];

  const filtered = notices.filter((n) => {
    const matchesSearch =
      searchTerm === '' ||
      n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      n.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'ALL' || n.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleLike = async (noticeId: string) => {
    await residentService.toggleNoticeLike(societyId, noticeId, residentUid);
    await loadData();
  };

  const handleAddComment = async (noticeId: string) => {
    if (!commentText.trim()) return;
    await residentService.addNoticeComment(societyId, noticeId, residentName, flatNumber, commentText);
    setCommentText('');
    await loadData();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in select-none">
      <div className="relative w-full max-w-md rounded-3xl bg-white shadow-2xl border border-[#E6F1F5] overflow-hidden animate-scale-in max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-[#E6F1F5] flex items-center justify-between bg-amber-50">
          <div>
            <h2 className="text-base sm:text-lg font-black text-[#111111]">
              Society Notice Board
            </h2>
            <p className="text-xs text-[#A9B0B8]">
              Official circulars from Society Admin & Management Committee
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-200 text-[#64748B] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Category Filter */}
        <div className="p-3 bg-white border-b border-[#E6F1F5] space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-[#A9B0B8]" />
            <input
              type="text"
              placeholder="Search circulars..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#F1F9FC] border border-[#E6F1F5] text-xs focus:outline-none focus:border-[#673AB7]"
            />
          </div>

          <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setSelectedCategory(c)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all whitespace-nowrap cursor-pointer ${
                  selectedCategory === c
                    ? 'bg-[#673AB7] text-white'
                    : 'bg-[#F1F9FC] text-[#64748B] hover:bg-[#E6F1F5]'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Notice List */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs flex-1">
          {filtered.map((n) => {
            const isExpanded = expandedNoticeId === n.id;
            const hasLiked = n.likedByUids.includes(residentUid);

            return (
              <div
                key={n.id}
                className="p-4 rounded-2xl bg-[#F1F9FC] border border-[#E6F1F5] space-y-2.5"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-white text-[#673AB7] border border-[#E6F1F5]">
                      {n.category}
                    </span>
                    {n.priority === 'URGENT' && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-800">
                        Urgent
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-[#A9B0B8]">
                    {new Date(n.publishedAt).toLocaleDateString()}
                  </span>
                </div>

                <h3 className="font-extrabold text-sm text-[#111111]">{n.title}</h3>
                <p className="text-xs text-[#64748B] leading-relaxed">{n.description}</p>

                {n.attachmentName && (
                  <div className="p-2.5 rounded-xl bg-white border border-[#E6F1F5] flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-2 text-slate-800">
                      <FileText className="w-4 h-4 text-[#673AB7]" />
                      <span className="font-bold">{n.attachmentName}</span>
                    </div>
                    <button
                      onClick={() => alert(`Downloading attachment ${n.attachmentName}...`)}
                      className="text-[#673AB7] hover:underline font-bold flex items-center gap-1"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download</span>
                    </button>
                  </div>
                )}

                {/* Actions: Likes & Comments */}
                <div className="flex items-center justify-between pt-2 border-t border-[#E6F1F5]">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleLike(n.id)}
                      className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                        hasLiked ? 'text-[#673AB7] bg-purple-50' : 'text-[#64748B] hover:text-[#111111]'
                      }`}
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                      <span>{n.likes}</span>
                    </button>
                    <button
                      onClick={() => setExpandedNoticeId(isExpanded ? null : n.id)}
                      className="flex items-center gap-1.5 text-xs text-[#64748B] hover:text-[#111111] font-bold transition-colors cursor-pointer"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>{n.comments.length} Comments</span>
                    </button>
                  </div>
                  <span className="text-[10px] text-[#A9B0B8]">
                    By {n.publishedBy}
                  </span>
                </div>

                {/* Expanded Comments */}
                {isExpanded && (
                  <div className="pt-2 border-t border-[#E6F1F5] space-y-2">
                    {n.comments.map((c) => (
                      <div key={c.id} className="p-2 rounded-xl bg-white border border-[#E6F1F5]">
                        <p className="text-[10px] font-bold text-[#111111]">{c.residentName}</p>
                        <p className="text-xs text-[#64748B] mt-0.5">{c.message}</p>
                      </div>
                    ))}

                    <div className="flex gap-2 pt-1">
                      <input
                        type="text"
                        placeholder="Add resident comment..."
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        className="flex-1 px-3 py-1.5 rounded-xl bg-white border border-[#E6F1F5] text-xs focus:outline-none focus:border-[#673AB7]"
                      />
                      <button
                        type="button"
                        onClick={() => handleAddComment(n.id)}
                        className="px-3 py-1.5 rounded-xl bg-[#673AB7] text-white text-xs font-bold hover:bg-[#512DA8] cursor-pointer"
                      >
                        Post
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
