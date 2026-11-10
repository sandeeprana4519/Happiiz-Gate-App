import React, { useState } from 'react';
import { 
  Building2, 
  DoorOpen, 
  Plus, 
  Search, 
  MapPin, 
  Phone, 
  Mail, 
  Check, 
  X, 
  Key,
  Edit3,
  Lock,
  Eye,
  EyeOff,
  FileText,
  Download,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Shield
} from 'lucide-react';
import { SocietyBuilding, SocietyFlat, FlatType, FlatOccupancyStatus } from '../../types/societyAdmin';
import { Society, EntityDocument } from '../../types/society';
import { useAuth } from '../../context/AuthContext';
import { updateUserAccountPassword } from '../../services/firebase/auth.service';

interface SocietyStructureProps {
  society: Society;
  buildings: SocietyBuilding[];
  flats: SocietyFlat[];
  onUpdateSociety: (data: Partial<Society>) => Promise<void>;
  onCreateBuilding: (building: any) => Promise<void>;
  onUpdateBuilding: (id: string, data: Partial<SocietyBuilding>) => Promise<void>;
  onCreateFlat: (flat: any) => Promise<void>;
  onUpdateFlat: (id: string, data: Partial<SocietyFlat>) => Promise<void>;
}

// -------------------------------------------------------------
// MODULE 2: SOCIETY PROFILE MANAGEMENT (READ-ONLY WITH PASSWORD UPDATE)
// -------------------------------------------------------------
export const SocietyProfileView: React.FC<SocietyStructureProps> = ({
  society,
}) => {
  const { user } = useAuth();

  // Password Modal State
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdError, setPwdError] = useState('');
  const [pwdSuccess, setPwdSuccess] = useState('');

  // Document Lightbox Preview
  const [previewDoc, setPreviewDoc] = useState<EntityDocument | null>(null);

  const rules =
    '1. Visitors must verify pass code at security gates.\n2. Quiet hours observed after 10:30 PM.\n3. Clubhouse & gym require prior booking through Happiiz app.';
  const emergencyContacts =
    'Gate 1 Security: +91 98765 00001\nFacility Manager: +91 98765 00002\nLocal Police: 100\nFire Brigade: 101';

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdLoading(true);
    setPwdError('');
    setPwdSuccess('');

    if (newPassword.length < 6) {
      setPwdError('New password must be at least 6 characters long.');
      setPwdLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setPwdError('New password and confirmation do not match.');
      setPwdLoading(false);
      return;
    }

    try {
      const uid = user?.uid || 'usr_society_admin_02';
      await updateUserAccountPassword(uid, newPassword, currentPassword);
      setPwdSuccess('Your password has been updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        setPwdSuccess('');
        setShowPasswordModal(false);
      }, 2000);
    } catch (err: any) {
      setPwdError(err.message || 'Failed to update password');
    } finally {
      setPwdLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Password Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Society Entity Profile & By-laws</h2>
          <p className="text-xs text-gray-500 font-medium">
            Official registration parameters, regulatory documentation, and community guidelines managed by Super Admin
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setPwdError('');
            setPwdSuccess('');
            setShowPasswordModal(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#673AB7] hover:bg-[#5E35B1] text-white rounded-xl font-bold text-xs transition shadow-xs cursor-pointer"
        >
          <Key className="w-4 h-4" />
          <span>Update Password (पासवर्ड बदलें)</span>
        </button>
      </div>

      {/* Super Admin Protected Entity Notice */}
      <div className="p-4 bg-[#F1F9FC] border border-[#BEE3F8] rounded-2xl flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-[#673AB7] shrink-0 mt-0.5" />
        <div className="text-xs">
          <span className="font-bold text-gray-900 block mb-0.5">
            Super Admin Verified & Protected Entity Profile
          </span>
          <p className="text-gray-600 leading-relaxed">
            This community entity profile, official registration data, and verified regulatory documents are strictly audited and managed by the Super Admin console. All parameters are locked to ensure regulatory compliance. Society administrators can only update their login password.
          </p>
        </div>
      </div>

      {/* Primary Details Card (Read-Only) */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Society Name */}
          <div>
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
              Society / Community Name
            </label>
            <p className="text-sm font-extrabold text-gray-900">
              {society.societyName || society.name || 'Emerald Heights Luxury Enclave'}
            </p>
          </div>

          {/* Society Code */}
          <div>
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
              Society Unique Code
            </label>
            <span className="font-mono font-bold text-xs text-[#673AB7] bg-purple-50 border border-purple-100 px-3 py-1 rounded-lg inline-block">
              {society.societyCode || 'SOC-101'}
            </span>
          </div>

          {/* Status */}
          <div>
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
              Platform Status
            </label>
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                society.status === 'ACTIVE'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{society.status || 'ACTIVE'}</span>
            </span>
          </div>

          {/* Full Address */}
          <div className="md:col-span-2">
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
              Full Physical Address
            </label>
            <p className="text-xs text-gray-700 flex items-center gap-1.5 font-medium">
              <MapPin className="w-4 h-4 text-[#673AB7] shrink-0" />
              <span>{society.address}, {society.city}, {society.state}</span>
            </p>
          </div>

          {/* City & State */}
          <div>
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
              Location / State
            </label>
            <p className="text-xs font-semibold text-gray-800">
              {society.city}, {society.state || 'Karnataka'}
            </p>
          </div>

          {/* Campus Capacity Breakdown */}
          <div className="md:col-span-3 grid grid-cols-3 gap-4 bg-[#F1F9FC] p-4 rounded-xl border border-[#E6F1F5]">
            <div>
              <span className="text-[10px] text-gray-400 uppercase font-bold block mb-1">Total Towers</span>
              <span className="text-sm font-extrabold text-gray-900">{society.totalTowers || 3} Towers</span>
            </div>
            <div>
              <span className="text-[10px] text-gray-400 uppercase font-bold block mb-1">Total Flats / Units</span>
              <span className="text-sm font-extrabold text-gray-900">{society.totalFlats || 150} Units</span>
            </div>
            <div>
              <span className="text-[10px] text-gray-400 uppercase font-bold block mb-1">Security Gates</span>
              <span className="text-sm font-extrabold text-gray-900">{society.totalGates || 2} Active Gates</span>
            </div>
          </div>

          {/* Subscription Tier */}
          <div>
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
              Subscription Plan
            </label>
            <span className="inline-block px-2.5 py-1 rounded-lg text-xs font-bold bg-purple-50 text-[#673AB7] border border-purple-100">
              {society.subscriptionPlan || society.subscriptionType || 'Enterprise'}
            </span>
          </div>

          {/* Subscription Duration */}
          <div>
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
              Duration / Validity
            </label>
            <p className="text-xs font-semibold text-gray-800">
              {society.subscriptionDuration || '1 Year'}
            </p>
          </div>

          {/* Contact Phone */}
          <div>
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
              Contact Phone
            </label>
            <p className="text-xs font-semibold text-gray-800 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              <span>{society.contactPhone || '+91 98765 00001'}</span>
            </p>
          </div>

          {/* Admin Login Email */}
          <div>
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
              Admin Login Email
            </label>
            <p className="text-xs font-mono font-semibold text-gray-800 flex items-center gap-1.5 truncate">
              <Mail className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              <span className="truncate">{society.adminLoginEmail || society.contactEmail || 'admin@emeraldheights.in'}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Uploaded Regulatory Documents Section (Read-Only) */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#673AB7]" />
              <span>Official Regulatory & Verification Documents</span>
            </h3>
            <p className="text-xs text-gray-500 font-medium">
              Verified legal and regulatory documentation uploaded during society registration
            </p>
          </div>
          <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-full border border-purple-100">
            {(society.documents && society.documents.length) || 0} Document(s)
          </span>
        </div>

        {!society.documents || society.documents.length === 0 ? (
          <div className="p-6 rounded-xl bg-gray-50 text-center text-gray-400 text-xs">
            <FileText className="w-8 h-8 mx-auto mb-2 opacity-30" />
            No documents were attached during registration. Contact Super Admin to update official records.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {society.documents.map((doc, idx) => (
              <div
                key={doc.id || idx}
                className="p-3.5 rounded-xl border border-gray-200 bg-gray-50/70 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="w-8 h-8 rounded-lg bg-purple-100 text-[#673AB7] flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="truncate">
                    <div className="font-bold text-gray-900 truncate">{doc.title}</div>
                    <div className="text-[10px] text-gray-500 font-mono truncate">{doc.name}</div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => setPreviewDoc(doc)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-gray-200 text-[#673AB7] hover:bg-purple-50 font-bold text-[11px] cursor-pointer"
                  >
                    <Eye className="w-3 h-3" />
                    <span>View</span>
                  </button>
                  {doc.fileUrl && (
                    <a
                      href={doc.fileUrl}
                      download={doc.name || 'document'}
                      className="p-1 rounded-lg border border-gray-200 bg-white text-gray-600 hover:text-gray-900"
                      title="Download"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Rules & Emergency Contacts (Read-Only) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-6 space-y-3">
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
            Society By-laws & Guidelines
          </label>
          <div className="bg-[#F1F9FC] p-4 rounded-xl border border-gray-100 text-xs text-gray-700 whitespace-pre-line leading-relaxed font-medium">
            {rules}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-6 space-y-3">
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
            Emergency Contacts Directory
          </label>
          <div className="bg-red-50/60 p-4 rounded-xl border border-red-100 text-xs text-gray-800 whitespace-pre-line leading-relaxed font-medium">
            {emergencyContacts}
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* UPDATE PASSWORD MODAL (ONLY PERMITTED ACTION FOR SOCIETY ADMIN)  */}
      {/* ============================================================== */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-purple-100 text-[#673AB7] flex items-center justify-center">
                  <Key className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-sm">Update Login Password</h3>
                  <p className="text-[11px] text-gray-500 font-medium">पासवर्ड बदलें (Change Admin Password)</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPasswordModal(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {pwdError && (
              <div className="p-3 mb-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{pwdError}</span>
              </div>
            )}

            {pwdSuccess && (
              <div className="p-3 mb-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold flex items-center gap-2">
                <Check className="w-4 h-4 shrink-0" />
                <span>{pwdSuccess}</span>
              </div>
            )}

            <form onSubmit={handlePasswordSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Current Password (Optional if newly assigned)
                </label>
                <input
                  type="password"
                  placeholder="Enter current password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#673AB7]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  New Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    placeholder="Minimum 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-3.5 pr-10 py-2 rounded-xl border border-gray-200 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#673AB7]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                  >
                    {showNewPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Confirm New Password <span className="text-red-500">*</span>
                </label>
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  required
                  placeholder="Re-enter new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#673AB7]"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="px-4 py-2 border border-gray-200 rounded-xl text-gray-600 text-xs font-bold hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={pwdLoading}
                  className="px-4 py-2 bg-[#673AB7] hover:bg-[#5E35B1] text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {pwdLoading ? 'Updating Password...' : 'Save Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* DOCUMENT PREVIEW LIGHTBOX                                      */}
      {/* ============================================================== */}
      {previewDoc && (
        <div className="fixed inset-0 z-60 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
              <div>
                <h4 className="font-bold text-gray-900 text-sm">{previewDoc.title}</h4>
                <p className="text-xs text-gray-500 font-mono">{previewDoc.name}</p>
              </div>
              <div className="flex items-center gap-2">
                {previewDoc.fileUrl && (
                  <a
                    href={previewDoc.fileUrl}
                    download={previewDoc.name}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-xs font-bold text-gray-700 shadow-2xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => setPreviewDoc(null)}
                  className="p-1.5 rounded-xl hover:bg-gray-200 text-gray-500 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 p-4 bg-gray-100 overflow-auto flex items-center justify-center min-h-[400px]">
              {previewDoc.fileUrl ? (
                previewDoc.fileType?.includes('pdf') || previewDoc.fileUrl.startsWith('data:application/pdf') ? (
                  <iframe
                    src={previewDoc.fileUrl}
                    title={previewDoc.title}
                    className="w-full h-[550px] rounded-xl border border-gray-300 bg-white"
                  />
                ) : (
                  <img
                    src={previewDoc.fileUrl}
                    alt={previewDoc.title}
                    className="max-h-[550px] max-w-full rounded-xl object-contain shadow-md"
                  />
                )
              ) : (
                <div className="text-center text-gray-400">
                  <FileText className="w-12 h-12 mx-auto mb-2 opacity-40" />
                  <p className="text-xs">No file content available for preview.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// -------------------------------------------------------------
// MODULE 3: TOWER / BLOCK / WING MANAGEMENT
// -------------------------------------------------------------
export const SocietyBuildingsView: React.FC<SocietyStructureProps> = ({
  society,
  buildings,
  onCreateBuilding,
  onUpdateBuilding
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingBuilding, setEditingBuilding] = useState<SocietyBuilding | null>(null);
  const [name, setName] = useState('');
  const [type, setType] = useState<'Tower' | 'Block' | 'Wing' | 'Villa Row'>('Tower');
  const [floorsCount, setFloorsCount] = useState(12);
  const [totalFlats, setTotalFlats] = useState(48);
  const [submitting, setSubmitting] = useState(false);

  const handleOpenAdd = () => {
    setEditingBuilding(null);
    setName('');
    setType('Tower');
    setFloorsCount(10);
    setTotalFlats(40);
    setShowAddModal(true);
  };

  const handleOpenEdit = (b: SocietyBuilding) => {
    setEditingBuilding(b);
    setName(b.name);
    setType(b.type);
    setFloorsCount(b.floorsCount);
    setTotalFlats(b.totalFlats);
    setShowAddModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingBuilding) {
        await onUpdateBuilding(editingBuilding.id, {
          name,
          type,
          floorsCount,
          totalFlats
        });
      } else {
        await onCreateBuilding({
          societyId: society.id,
          name,
          type,
          floorsCount,
          totalFlats,
          status: 'ACTIVE',
          createdAt: new Date().toISOString()
        });
      }
      setShowAddModal(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (b: SocietyBuilding) => {
    const newStatus = b.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    await onUpdateBuilding(b.id, { status: newStatus });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Towers, Wings & Blocks</h2>
          <p className="text-sm text-gray-500">Manage high-rise towers, residential blocks, and floor configurations</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#673AB7] text-white rounded-xl hover:bg-[#5E35B1] font-medium text-sm transition shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Add Tower / Block
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {buildings.map((b) => (
          <div key={b.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:border-purple-200 transition">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#F1F9FC] text-[#673AB7] flex items-center justify-center font-bold">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">{b.name}</h3>
                  <span className="text-xs px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 font-medium">
                    {b.type}
                  </span>
                </div>
              </div>
              <button
                onClick={() => handleToggleStatus(b)}
                className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                  b.status === 'ACTIVE'
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {b.status}
              </button>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 py-3 border-y border-gray-50">
              <div className="bg-[#F1F9FC] p-3 rounded-xl">
                <span className="text-xs text-gray-500 block">Floors</span>
                <span className="text-lg font-bold text-gray-900">{b.floorsCount}</span>
              </div>
              <div className="bg-[#F1F9FC] p-3 rounded-xl">
                <span className="text-xs text-gray-500 block">Total Flats</span>
                <span className="text-lg font-bold text-[#673AB7]">{b.totalFlats}</span>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-end">
              <button
                onClick={() => handleOpenEdit(b)}
                className="text-xs text-[#673AB7] hover:underline font-semibold flex items-center gap-1"
              >
                <Edit3 className="w-3.5 h-3.5" /> Edit Configuration
              </button>
            </div>
          </div>
        ))}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-gray-100">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-900">
                {editingBuilding ? 'Edit Building Structure' : 'Add New Tower / Block'}
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Building / Tower Name</label>
                <input
                  type="text"
                  placeholder="e.g. Tower A (Sunflower)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-[#673AB7] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Structure Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as any)}
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-[#673AB7] focus:outline-none"
                >
                  <option value="Tower">Tower</option>
                  <option value="Wing">Wing</option>
                  <option value="Block">Block</option>
                  <option value="Villa Row">Villa Row</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Total Floors</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={floorsCount}
                    onChange={(e) => setFloorsCount(Number(e.target.value))}
                    required
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-[#673AB7] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Total Flats</label>
                  <input
                    type="number"
                    min="1"
                    value={totalFlats}
                    onChange={(e) => setTotalFlats(Number(e.target.value))}
                    required
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-[#673AB7] focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-gray-200 rounded-xl text-gray-600 text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-[#673AB7] text-white rounded-xl text-sm font-medium hover:bg-[#5E35B1] transition"
                >
                  {submitting ? 'Saving...' : editingBuilding ? 'Update Tower' : 'Create Tower'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// -------------------------------------------------------------
// MODULE 4: FLAT MANAGEMENT
// -------------------------------------------------------------
export const SocietyFlatsView: React.FC<SocietyStructureProps> = ({
  society,
  buildings,
  flats,
  onCreateFlat,
  onUpdateFlat
}) => {
  const [filterBuilding, setFilterBuilding] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingFlat, setEditingFlat] = useState<SocietyFlat | null>(null);

  // Form State
  const [flatNumber, setFlatNumber] = useState('');
  const [buildingName, setBuildingName] = useState(buildings[0]?.name || 'Tower A');
  const [floor, setFloor] = useState(1);
  const [flatType, setFlatType] = useState<FlatType>('2BHK');
  const [occupancyStatus, setOccupancyStatus] = useState<FlatOccupancyStatus>('OCCUPIED');
  const [ownerName, setOwnerName] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('');
  const [tenantName, setTenantName] = useState('');
  const [tenantPhone, setTenantPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const filteredFlats = flats.filter((f) => {
    const matchBuilding = filterBuilding === 'ALL' || f.buildingName === filterBuilding;
    const matchStatus = filterStatus === 'ALL' || f.occupancyStatus === filterStatus;
    const matchSearch = searchTerm === '' || 
      f.flatNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (f.ownerName && f.ownerName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (f.tenantName && f.tenantName.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchBuilding && matchStatus && matchSearch;
  });

  const handleOpenAdd = () => {
    setEditingFlat(null);
    setFlatNumber('');
    setBuildingName(buildings[0]?.name || 'Tower A');
    setFloor(1);
    setFlatType('2BHK');
    setOccupancyStatus('VACANT');
    setOwnerName('');
    setOwnerPhone('');
    setTenantName('');
    setTenantPhone('');
    setShowAddModal(true);
  };

  const handleOpenEdit = (f: SocietyFlat) => {
    setEditingFlat(f);
    setFlatNumber(f.flatNumber);
    setBuildingName(f.buildingName);
    setFloor(f.floor);
    setFlatType(f.flatType);
    setOccupancyStatus(f.occupancyStatus);
    setOwnerName(f.ownerName || '');
    setOwnerPhone(f.ownerPhone || '');
    setTenantName(f.tenantName || '');
    setTenantPhone(f.tenantPhone || '');
    setShowAddModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const selectedBuilding = buildings.find(b => b.name === buildingName);
      if (editingFlat) {
        await onUpdateFlat(editingFlat.id, {
          flatNumber,
          buildingName,
          buildingId: selectedBuilding?.id || editingFlat.buildingId,
          floor,
          flatType,
          occupancyStatus,
          ownerName: ownerName || undefined,
          ownerPhone: ownerPhone || undefined,
          tenantName: tenantName || undefined,
          tenantPhone: tenantPhone || undefined
        });
      } else {
        await onCreateFlat({
          societyId: society.id,
          buildingId: selectedBuilding?.id || 'bld_1',
          buildingName,
          flatNumber,
          floor,
          flatType,
          occupancyStatus,
          ownerName: ownerName || undefined,
          ownerPhone: ownerPhone || undefined,
          tenantName: tenantName || undefined,
          tenantPhone: tenantPhone || undefined
        });
      }
      setShowAddModal(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Flat Management</h2>
          <p className="text-sm text-gray-500">Configure residential flats, owner & tenant allocations, and occupancy status</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#673AB7] text-white rounded-xl hover:bg-[#5E35B1] font-medium text-sm transition shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Add Flat Unit
        </button>
      </div>

      {/* Filters and search */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search flat, owner or tenant..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-[#F1F9FC] rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#673AB7]"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={filterBuilding}
            onChange={(e) => setFilterBuilding(e.target.value)}
            className="px-3 py-2 bg-[#F1F9FC] border border-gray-200 rounded-xl text-xs font-medium text-gray-700 focus:outline-none"
          >
            <option value="ALL">All Towers</option>
            {buildings.map(b => (
              <option key={b.id} value={b.name}>{b.name}</option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 bg-[#F1F9FC] border border-gray-200 rounded-xl text-xs font-medium text-gray-700 focus:outline-none"
          >
            <option value="ALL">All Occupancy</option>
            <option value="OCCUPIED">Occupied</option>
            <option value="VACANT">Vacant</option>
            <option value="UNDER_MAINTENANCE">Under Maintenance</option>
          </select>

          <span className="text-xs text-gray-500 ml-auto md:ml-0 font-medium">
            Showing {filteredFlats.length} of {flats.length}
          </span>
        </div>
      </div>

      {/* Flats Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 bg-[#F1F9FC] text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <th className="py-3 px-4">Flat No</th>
                <th className="py-3 px-4">Tower & Floor</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Occupancy</th>
                <th className="py-3 px-4">Owner</th>
                <th className="py-3 px-4">Tenant</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {filteredFlats.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-gray-400 text-sm">
                    No flats match your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredFlats.map((flat) => (
                  <tr key={flat.id} className="hover:bg-purple-50/20 transition">
                    <td className="py-3.5 px-4 font-bold text-gray-900">
                      {flat.flatNumber}
                    </td>
                    <td className="py-3.5 px-4 text-gray-600">
                      <div>{flat.buildingName}</div>
                      <span className="text-xs text-gray-400">Floor {flat.floor}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 text-xs font-medium">
                        {flat.flatType}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                        flat.occupancyStatus === 'OCCUPIED'
                          ? 'bg-emerald-50 text-emerald-700'
                          : flat.occupancyStatus === 'VACANT'
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {flat.occupancyStatus.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-xs">
                      {flat.ownerName ? (
                        <div>
                          <div className="font-semibold text-gray-800">{flat.ownerName}</div>
                          <div className="text-gray-400">{flat.ownerPhone}</div>
                        </div>
                      ) : (
                        <span className="text-gray-400 italic">Unassigned</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-xs">
                      {flat.tenantName ? (
                        <div>
                          <div className="font-semibold text-gray-800">{flat.tenantName}</div>
                          <div className="text-gray-400">{flat.tenantPhone}</div>
                        </div>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleOpenEdit(flat)}
                        className="text-xs text-[#673AB7] hover:bg-purple-50 px-2.5 py-1.5 rounded-lg font-semibold transition"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-gray-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-900">
                {editingFlat ? `Edit Unit ${editingFlat.flatNumber}` : 'Add New Residential Flat'}
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Flat / Unit Number</label>
                  <input
                    type="text"
                    placeholder="e.g. A-402"
                    value={flatNumber}
                    onChange={(e) => setFlatNumber(e.target.value)}
                    required
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-[#673AB7] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Tower / Block</label>
                  <select
                    value={buildingName}
                    onChange={(e) => setBuildingName(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-[#673AB7] focus:outline-none"
                  >
                    {buildings.map(b => (
                      <option key={b.id} value={b.name}>{b.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Floor Level</label>
                  <input
                    type="number"
                    min="0"
                    value={floor}
                    onChange={(e) => setFloor(Number(e.target.value))}
                    required
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-[#673AB7] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Apartment Type</label>
                  <select
                    value={flatType}
                    onChange={(e) => setFlatType(e.target.value as FlatType)}
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-[#673AB7] focus:outline-none"
                  >
                    <option value="1BHK">1 BHK</option>
                    <option value="2BHK">2 BHK</option>
                    <option value="3BHK">3 BHK</option>
                    <option value="4BHK">4 BHK</option>
                    <option value="Penthouse">Penthouse</option>
                    <option value="Duplex">Duplex</option>
                    <option value="Villa">Villa</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Occupancy Status</label>
                <select
                  value={occupancyStatus}
                  onChange={(e) => setOccupancyStatus(e.target.value as FlatOccupancyStatus)}
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-[#673AB7] focus:outline-none"
                >
                  <option value="OCCUPIED">Occupied</option>
                  <option value="VACANT">Vacant</option>
                  <option value="UNDER_MAINTENANCE">Under Maintenance</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </div>

              <div className="pt-2 border-t border-gray-100">
                <h4 className="text-xs font-bold text-gray-700 uppercase mb-3">Owner Details</h4>
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Owner Full Name"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-[#673AB7] focus:outline-none"
                  />
                  <input
                    type="tel"
                    placeholder="Owner Phone (+91)"
                    value={ownerPhone}
                    onChange={(e) => setOwnerPhone(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-[#673AB7] focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-gray-100">
                <h4 className="text-xs font-bold text-gray-700 uppercase mb-3">Tenant Details (If Rented)</h4>
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Tenant Full Name"
                    value={tenantName}
                    onChange={(e) => setTenantName(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-[#673AB7] focus:outline-none"
                  />
                  <input
                    type="tel"
                    placeholder="Tenant Phone (+91)"
                    value={tenantPhone}
                    onChange={(e) => setTenantPhone(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-[#673AB7] focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-gray-200 rounded-xl text-gray-600 text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-[#673AB7] text-white rounded-xl text-sm font-medium hover:bg-[#5E35B1] transition"
                >
                  {submitting ? 'Saving...' : editingFlat ? 'Save Flat' : 'Add Unit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
