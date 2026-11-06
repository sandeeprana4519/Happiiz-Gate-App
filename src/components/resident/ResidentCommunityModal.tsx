/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  X, 
  MessageSquare, 
  Heart, 
  Search, 
  Plus, 
  Phone, 
  Users, 
  Share2, 
  Tag, 
  Send,
  Building,
  ShieldCheck
} from 'lucide-react';
import { CommunityPost } from '../../types/resident';
import { GuardResidentDirectoryItem } from '../../types/guard';
import { residentService } from '../../services/firebase/resident.service';
import { guardService } from '../../services/firebase/guard.service';

interface ResidentCommunityModalProps {
  isOpen: boolean;
  onClose: () => void;
  societyId: string;
  residentUid: string;
  residentName: string;
  flatNumber: string;
}

export const ResidentCommunityModal: React.FC<ResidentCommunityModalProps> = ({
  isOpen,
  onClose,
  societyId,
  residentUid,
  residentName,
  flatNumber,
}) => {
  const [activeTab, setActiveTab] = useState<'FEED' | 'DIRECTORY'>('FEED');
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [directory, setDirectory] = useState<GuardResidentDirectoryItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostCategory, setNewPostCategory] = useState<any>('General Discussion');
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});

  const loadData = async () => {
    const [pts, dir] = await Promise.all([
      residentService.getCommunityPosts(societyId),
      guardService.getResidentDirectory(societyId),
    ]);
    setPosts(pts);
    setDirectory(dir);
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, societyId]);

  if (!isOpen) return null;

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostContent.trim()) return;

    await residentService.createCommunityPost(
      societyId,
      residentUid,
      residentName,
      flatNumber,
      newPostCategory,
      newPostContent
    );
    setNewPostContent('');
    setShowCreatePost(false);
    await loadData();
  };

  const handleLike = async (postId: string) => {
    await residentService.togglePostLike(societyId, postId, residentUid);
    await loadData();
  };

  const handleAddComment = async (postId: string) => {
    const text = commentInputs[postId];
    if (!text || !text.trim()) return;

    await residentService.addPostComment(societyId, postId, residentName, flatNumber, text);
    setCommentInputs({ ...commentInputs, [postId]: '' });
    await loadData();
  };

  const filteredDirectory = directory.filter((d) =>
    searchTerm === '' ||
    d.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.flatNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.buildingName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in select-none">
      <div className="relative w-full max-w-md rounded-3xl bg-white shadow-2xl border border-[#E6F1F5] overflow-hidden animate-scale-in max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-[#E6F1F5] flex items-center justify-between bg-purple-50">
          <div>
            <h2 className="text-base sm:text-lg font-black text-[#111111]">
              Society Social & Directory
            </h2>
            <p className="text-xs text-[#A9B0B8]">
              Connect with fellow residents of Emerald Heights
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-200 text-[#64748B] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 p-3 bg-white border-b border-[#E6F1F5] gap-2">
          <button
            onClick={() => setActiveTab('FEED')}
            className={`py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'FEED'
                ? 'bg-[#673AB7] text-white shadow-xs'
                : 'bg-[#F1F9FC] text-[#64748B] hover:bg-[#E6F1F5]'
            }`}
          >
            Community Feed ({posts.length})
          </button>
          <button
            onClick={() => setActiveTab('DIRECTORY')}
            className={`py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'DIRECTORY'
                ? 'bg-[#673AB7] text-white shadow-xs'
                : 'bg-[#F1F9FC] text-[#64748B] hover:bg-[#E6F1F5]'
            }`}
          >
            Resident Directory
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs flex-1">
          {/* TAB 1: SOCIAL FEED */}
          {activeTab === 'FEED' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-[#111111]">Recent Discussions</span>
                <button
                  onClick={() => setShowCreatePost(!showCreatePost)}
                  className="px-3 py-1.5 rounded-xl bg-[#673AB7] text-white text-xs font-bold hover:bg-[#512DA8] transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create Post</span>
                </button>
              </div>

              {showCreatePost && (
                <form onSubmit={handleCreatePost} className="p-4 rounded-2xl bg-[#F1F9FC] border border-[#E6F1F5] space-y-3">
                  <h4 className="font-bold text-xs text-[#111111]">Start a Discussion</h4>
                  <select
                    value={newPostCategory}
                    onChange={(e) => setNewPostCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-[#E6F1F5] text-xs font-medium focus:outline-none focus:border-[#673AB7]"
                  >
                    <option value="General Discussion">General Discussion</option>
                    <option value="Society Updates">Society Updates</option>
                    <option value="Lost & Found">Lost & Found</option>
                    <option value="Events">Events</option>
                    <option value="Recommendations">Recommendations</option>
                  </select>
                  <textarea
                    rows={3}
                    required
                    placeholder="What's happening in our society?"
                    value={newPostContent}
                    onChange={(e) => setNewPostContent(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-white border border-[#E6F1F5] text-xs focus:outline-none focus:border-[#673AB7]"
                  />
                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-[#673AB7] text-white text-xs font-bold hover:bg-[#512DA8] cursor-pointer"
                  >
                    Publish to Society
                  </button>
                </form>
              )}

              <div className="space-y-3">
                {posts.map((post) => {
                  const hasLiked = post.likedByUids.includes(residentUid);

                  return (
                    <div
                      key={post.id}
                      className="p-4 rounded-2xl bg-[#F1F9FC] border border-[#E6F1F5] space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-[#673AB7] text-white font-bold flex items-center justify-center text-xs">
                            {post.authorName.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-xs text-[#111111]">
                              {post.authorName} ({post.authorFlat})
                            </p>
                            <p className="text-[10px] text-[#A9B0B8]">
                              {new Date(post.createdAt).toLocaleDateString()} · {post.category}
                            </p>
                          </div>
                        </div>
                      </div>

                      <p className="text-xs text-[#111111] leading-relaxed">{post.content}</p>

                      <div className="flex items-center gap-4 pt-2 border-t border-[#E6F1F5]">
                        <button
                          onClick={() => handleLike(post.id)}
                          className={`flex items-center gap-1.5 text-xs font-bold cursor-pointer ${
                            hasLiked ? 'text-rose-600' : 'text-[#64748B] hover:text-[#111111]'
                          }`}
                        >
                          <Heart className={`w-4 h-4 ${hasLiked ? 'fill-rose-600' : ''}`} />
                          <span>{post.likes}</span>
                        </button>
                        <span className="flex items-center gap-1.5 text-xs text-[#64748B] font-bold">
                          <MessageSquare className="w-4 h-4" />
                          <span>{post.comments.length}</span>
                        </span>
                      </div>

                      {/* Comments Thread */}
                      {post.comments.length > 0 && (
                        <div className="space-y-1.5 pt-1">
                          {post.comments.map((cm, idx) => (
                            <div key={idx} className="p-2 rounded-xl bg-white border border-[#E6F1F5]">
                              <p className="text-[10px] font-bold text-[#111111]">
                                {cm.authorName} ({cm.authorFlat})
                              </p>
                              <p className="text-xs text-[#64748B] mt-0.5">{cm.content}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="flex gap-2 pt-1">
                        <input
                          type="text"
                          placeholder="Write a comment..."
                          value={commentInputs[post.id] || ''}
                          onChange={(e) =>
                            setCommentInputs({ ...commentInputs, [post.id]: e.target.value })
                          }
                          className="flex-1 px-3 py-1.5 rounded-xl bg-white border border-[#E6F1F5] text-xs focus:outline-none focus:border-[#673AB7]"
                        />
                        <button
                          type="button"
                          onClick={() => handleAddComment(post.id)}
                          className="px-3 py-1.5 rounded-xl bg-[#673AB7] text-white text-xs font-bold hover:bg-[#512DA8] cursor-pointer"
                        >
                          Reply
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: RESIDENT DIRECTORY */}
          {activeTab === 'DIRECTORY' && (
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-[#A9B0B8]" />
                <input
                  type="text"
                  placeholder="Search by flat, name or tower..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#F1F9FC] border border-[#E6F1F5] text-xs focus:outline-none focus:border-[#673AB7]"
                />
              </div>

              <div className="space-y-2">
                {filteredDirectory.map((r) => (
                  <div
                    key={r.uid}
                    className="p-3.5 rounded-2xl bg-[#F1F9FC] border border-[#E6F1F5] flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-sm text-[#111111]">{r.fullName}</span>
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-white text-[#673AB7] border border-[#E6F1F5]">
                          {r.occupantType}
                        </span>
                      </div>
                      <p className="text-xs text-[#64748B] mt-0.5">
                        {r.buildingName} - <strong className="text-[#111111]">Flat {r.flatNumber}</strong>
                        {r.intercomNumber && ` · Intercom: ${r.intercomNumber}`}
                      </p>
                    </div>

                    <button
                      onClick={() => alert(`Calling resident ${r.fullName} at Flat ${r.flatNumber} via secure intercom...`)}
                      className="p-2.5 rounded-xl bg-white border border-[#E6F1F5] hover:bg-[#673AB7] hover:text-white text-[#673AB7] transition-all cursor-pointer"
                      title="Intercom Call"
                    >
                      <Phone className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
