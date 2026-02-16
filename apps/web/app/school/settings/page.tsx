'use client';

import { useState, useRef } from 'react';
import { Button } from '@mozedu/ui';
import { Input } from '@mozedu/ui';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi, schoolsApi } from '@/lib/api/client';
import { toast } from 'sonner';
import {
  Settings,
  Building2,
  Users,
  Bell,
  Shield,
  Globe,
  Palette,
  Database,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Clock,
  Save,
  Upload,
  Key,
  Trash2,
  Plus,
  ChevronRight,
  User,
  Lock,
} from 'lucide-react';
import { useCurrentEntity } from '@/lib/hooks/use-current-entity';
import { GradeSystemSettings } from '@/components/settings/grade-system-settings';
import { CountryCurriculumSettings } from '@/components/settings/country-curriculum-settings';
import { EmailTemplateManager } from '@/components/settings/email-template-manager';
import Image from 'next/image';
import { useTranslations } from 'next-intl';

// Helper to format role name
const getRoleLabel = (role: string, t: any) => {
  const map: Record<string, string> = {
    SCHOOL_ADMIN: t('settings.roleAdmin'),
    TEACHER_ADMIN: t('settings.roleCoordinator'),
    TEACHER: t('settings.roleTeacher'),
    ACCOUNTANT: t('settings.roleAccountant'),
    LIBRARIAN: t('settings.roleLibrarian'),
    STUDENT: t('settings.roleStudent'),
    PARENT: t('settings.roleParent'),
  };
  return map[role] || role;
};


const notificationSettingsConfig = [
  { id: 'email_attendance', labelKey: 'settings.attendanceAlerts', descKey: 'settings.attendanceAlertsDesc', enabled: true },
  { id: 'email_grades', labelKey: 'settings.gradesPublished', descKey: 'settings.gradesPublishedDesc', enabled: true },
  { id: 'email_events', labelKey: 'settings.schoolEvents', descKey: 'settings.schoolEventsDesc', enabled: false },
  { id: 'sms_urgent', labelKey: 'settings.urgentSms', descKey: 'settings.urgentSmsDesc', enabled: true },
  { id: 'push_messages', labelKey: 'settings.pushNotifications', descKey: 'settings.pushNotificationsDesc', enabled: true },
  { id: 'weekly_report', labelKey: 'settings.weeklyReport', descKey: 'settings.weeklyReportDesc', enabled: false },
];

const academicSettings = {
  currentYear: '2024',
  semester: '1º Semestre',
  classStartTime: '07:00',
  classEndTime: '17:00',
  classDuration: 45,
  breakDuration: 15,
  gradingScale: '0-20',
  passingGrade: 10,
  attendanceThreshold: 75,
};

const settingsSectionsConfig = [
  { id: 'profile', labelKey: 'settings.profileSection', icon: Building2 },
  { id: 'country', labelKey: 'settings.countrySection', icon: Globe },
  { id: 'users', labelKey: 'settings.usersSection', icon: Users },
  { id: 'academic', labelKey: 'settings.academicSection', icon: Calendar },
  { id: 'grading', labelKey: 'settings.gradingSection', icon: Settings },
  { id: 'communications', labelKey: 'settings.communicationsSection', icon: Mail },
  { id: 'notifications', labelKey: 'settings.notificationsSection', icon: Bell },
  { id: 'security', labelKey: 'settings.securitySection', icon: Shield },
  { id: 'appearance', labelKey: 'settings.appearanceSection', icon: Palette },
  { id: 'integrations', labelKey: 'settings.integrationsSection', icon: Database },
];

export default function SettingsPage() {
  const { schoolId, currentSchool } = useCurrentEntity();
  const t = useTranslations('school');
  const [activeSection, setActiveSection] = useState('profile');
  const [notifications, setNotifications] = useState(notificationSettingsConfig);
  const [showAddUser, setShowAddUser] = useState(false);
  const [unsavedChanges, setUnsavedChanges] = useState(false);

  // New User State
  const [newUser, setNewUser] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phoneNumber: '',
    role: 'TEACHER', // Default
  });

  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Logo Upload Mutation
  const uploadLogoMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!schoolId) throw new Error(t('settings.noSchoolSelected'));
      return schoolsApi.uploadLogo(schoolId, file);
    },
    onSuccess: () => {
      toast.success(t('settings.logoUpdated'));
      queryClient.invalidateQueries({ queryKey: ['school', schoolId] });
    },
    onError: (error: any) => {
      toast.error(error.message || t('settings.logoUploadError'));
    }
  });

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadLogoMutation.mutate(file);
    }
  };

  // Fetch Users
  const { data: users = [], isLoading: isLoadingUsers } = useQuery({
    queryKey: ['school-users', schoolId],
    queryFn: async () => {
      if (!schoolId) return [];
      const res = await usersApi.getAll({ schoolId });
      return res as any[];
    },
    enabled: !!schoolId,
  });

  // Create User Mutation
  const createUserMutation = useMutation({
    mutationFn: async () => {
      if (!schoolId) throw new Error(t('settings.noSchoolSelected'));
      return usersApi.create({
        ...newUser,
        first_name: newUser.firstName,
        last_name: newUser.lastName,
        phone_number: newUser.phoneNumber,
        school_id: schoolId,
      });
    },
    onSuccess: () => {
      toast.success(t('settings.userAdded'));
      setShowAddUser(false);
      setNewUser({ firstName: '', lastName: '', email: '', password: '', phoneNumber: '', role: 'TEACHER' });
      queryClient.invalidateQueries({ queryKey: ['school-users'] });
    },
    onError: (error: any) => {
      toast.error(error.message || t('settings.userAddError'));
    }
  });

  const toggleNotification = (id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, enabled: !n.enabled } : n))
    );
    setUnsavedChanges(true);
  };

  const renderProfileSettings = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-24 h-24 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center overflow-hidden border border-border relative">
          {currentSchool?.logoUrl ? (
            <Image src={currentSchool.logoUrl} alt={t('settings.schoolLogoAlt')} fill className="object-cover" />
          ) : (
            <Building2 className="w-12 h-12 text-gray-400" />
          )}
        </div>
        <div>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            onChange={handleLogoUpload}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadLogoMutation.isPending}
          >
            <Upload className="w-4 h-4 mr-2" />
            {uploadLogoMutation.isPending ? t('settings.uploading') : t('settings.uploadLogo')}
          </Button>
          <p className="text-xs text-gray-500 mt-1">{t('settings.logoHint')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            {t('settings.schoolName')}
          </label>
          <Input defaultValue={currentSchool?.name || ''} />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            {t('settings.schoolCode')}
          </label>
          <Input defaultValue={currentSchool?.code || ''} disabled />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            {t('settings.schoolType')}
          </label>
          <select className="w-full h-10 px-3 rounded-md border border-input bg-card text-foreground">
            <option>{t('settings.primary')}</option>
            <option selected>{t('settings.primaryComplete')}</option>
            <option>{t('settings.secondary')}</option>
            <option>{t('settings.secondaryComplete')}</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            {t('settings.principal')}
          </label>
          <Input defaultValue={currentSchool?.principalName || ''} />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            <Mail className="w-4 h-4 inline mr-1" />
            {t('settings.emailLabel')}
          </label>
          <Input type="email" defaultValue="" placeholder={t('settings.emailPlaceholder')} />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            <Phone className="w-4 h-4 inline mr-1" />
            {t('settings.phoneLabel')}
          </label>
          <Input defaultValue="" placeholder={t('settings.phonePlaceholder')} />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-foreground mb-1">
            <MapPin className="w-4 h-4 inline mr-1" />
            {t('settings.address')}
          </label>
          <Input defaultValue={currentSchool?.address || ''} />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            {t('settings.city')}
          </label>
          <Input defaultValue={currentSchool?.city || ''} />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            {t('settings.province')}
          </label>
          <Input defaultValue={currentSchool?.province || ''} />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            <Globe className="w-4 h-4 inline mr-1" />
            {t('settings.website')}
          </label>
          <Input defaultValue="" placeholder={t('settings.websitePlaceholder')} />
        </div>
      </div>
    </div>
  );

  const renderUsersSettings = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {t('settings.manageUsers')}
        </p>
        <Button onClick={() => setShowAddUser(true)}>
          <Plus className="w-4 h-4 mr-2" />
          {t('settings.addUser')}
        </Button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                {t('settings.userColumn')}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                {t('settings.roleColumn')}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                {t('settings.statusColumn')}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                {t('settings.lastAccessColumn')}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                {t('settings.actionsColumn')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {users.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  {isLoadingUsers ? t('settings.loadingUsers') : t('settings.noUsersFound')}
                </td>
              </tr>
            ) : (
              users.map((user: any) => (
                <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{user.first_name} {user.last_name}</p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 text-xs rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                      {getRoleLabel(user.role, t)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs rounded-full ${user.status === 'Activo'
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                      : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' // Default to green for now
                      }`}>
                      {user.status || t('settings.activeStatus')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {user.last_login || '-'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                        <Key className="w-4 h-4 text-gray-500" />
                      </button>
                      <button className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  </td>
                </tr>
              )))}
          </tbody>
        </table>
      </div>

      {/* Add User Modal */}
      {showAddUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {t('settings.addUser')}
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">{t('settings.firstName')}</label>
                  <Input
                    value={newUser.firstName}
                    onChange={e => setNewUser({ ...newUser, firstName: e.target.value })}
                    placeholder={t('settings.firstNamePlaceholder')}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">{t('settings.lastName')}</label>
                  <Input
                    value={newUser.lastName}
                    onChange={e => setNewUser({ ...newUser, lastName: e.target.value })}
                    placeholder={t('settings.lastNamePlaceholder')}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  {t('settings.email')}
                </label>
                <Input
                  type="email"
                  value={newUser.email}
                  onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                  placeholder={t('settings.userEmailPlaceholder')}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  {t('settings.phone')}
                </label>
                <Input
                  value={newUser.phoneNumber}
                  onChange={e => setNewUser({ ...newUser, phoneNumber: e.target.value })}
                  placeholder={t('settings.userPhonePlaceholder')}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  {t('settings.initialPassword')}
                </label>
                <Input
                  type="password"
                  value={newUser.password}
                  onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                  placeholder="********"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  {t('settings.roleLabel')}
                </label>
                <select
                  className="w-full h-10 px-3 rounded-md border border-input bg-card text-foreground"
                  value={newUser.role}
                  onChange={e => setNewUser({ ...newUser, role: e.target.value })}
                >
                  <option value="SCHOOL_ADMIN">{t('settings.roleAdmin')}</option>
                  <option value="TEACHER_ADMIN">{t('settings.roleCoordinator')}</option>
                  <option value="TEACHER">{t('settings.roleTeacher')}</option>
                  <option value="ACCOUNTANT">{t('settings.roleAccountant')}</option>
                  <option value="LIBRARIAN">{t('settings.roleLibrarian')}</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline" onClick={() => setShowAddUser(false)}>
                {t('settings.cancel')}
              </Button>
              <Button onClick={() => createUserMutation.mutate()} disabled={createUserMutation.isPending}>
                {createUserMutation.isPending ? t('settings.adding') : t('settings.add')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );


  const renderAcademicSettings = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-muted/50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            {t('settings.academicYear')}
          </h4>
          <div className="space-y-3">
            <div>
              <label className="block text-sm text-foreground mb-1">
                {t('settings.currentYear')}
              </label>
              <select className="w-full h-10 px-3 rounded-md border border-input bg-card text-foreground">
                <option>2023</option>
                <option selected>2024</option>
                <option>2025</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-foreground mb-1">
                {t('settings.semesterTrimester')}
              </label>
              <select className="w-full h-10 px-3 rounded-md border border-input bg-card text-foreground">
                <option selected>{t('settings.firstSemester')}</option>
                <option>{t('settings.secondSemester')}</option>
              </select>
            </div>
          </div>
        </div>

        <div className="bg-muted/50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            {t('settings.operatingHours')}
          </h4>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-foreground mb-1">
                  {t('settings.startTime')}
                </label>
                <Input type="time" defaultValue={academicSettings.classStartTime} />
              </div>
              <div>
                <label className="block text-sm text-foreground mb-1">
                  {t('settings.endTime')}
                </label>
                <Input type="time" defaultValue={academicSettings.classEndTime} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-foreground mb-1">
                  {t('settings.classDuration')}
                </label>
                <Input type="number" defaultValue={academicSettings.classDuration} />
              </div>
              <div>
                <label className="block text-sm text-foreground mb-1">
                  {t('settings.breakDuration')}
                </label>
                <Input type="number" defaultValue={academicSettings.breakDuration} />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-muted/50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Settings className="w-4 h-4" />
            {t('settings.gradingSystem')}
          </h4>
          <div className="space-y-3">
            <div>
              <label className="block text-sm text-foreground mb-1">
                {t('settings.gradeScale')}
              </label>
              <select className="w-full h-10 px-3 rounded-md border border-input bg-card text-foreground">
                <option selected>0-20</option>
                <option>0-100</option>
                <option>A-F</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-foreground mb-1">
                {t('settings.minPassingGrade')}
              </label>
              <Input type="number" defaultValue={academicSettings.passingGrade} />
            </div>
          </div>
        </div>

        <div className="bg-muted/50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Users className="w-4 h-4" />
            {t('settings.attendance')}
          </h4>
          <div className="space-y-3">
            <div>
              <label className="block text-sm text-foreground mb-1">
                {t('settings.minAttendanceThreshold')}
              </label>
              <Input type="number" defaultValue={academicSettings.attendanceThreshold} />
              <p className="text-xs text-gray-500 mt-1">
                {t('settings.attendanceHint')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderNotificationSettings = () => (
    <div className="space-y-4">
      <p className="text-sm text-gray-500 mb-4">
        {t('settings.notificationsDescription')}
      </p>
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg"
        >
          <div>
            <p className="font-medium text-gray-900 dark:text-white">
              {t(notification.labelKey)}
            </p>
            <p className="text-sm text-gray-500">{t(notification.descKey)}</p>
          </div>
          <button
            onClick={() => toggleNotification(notification.id)}
            className={`relative w-12 h-6 rounded-full transition-colors ${notification.enabled
              ? 'bg-emerald-500'
              : 'bg-gray-300 dark:bg-gray-600'
              }`}
          >
            <span
              className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${notification.enabled ? 'left-7' : 'left-1'
                }`}
            />
          </button>
        </div>
      ))}
    </div>
  );

  const renderSecuritySettings = () => (
    <div className="space-y-6">
      <div className="bg-muted/50 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Lock className="w-4 h-4" />
          {t('settings.passwordPolicies')}
        </h4>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">{t('settings.minLength')}</span>
            <Input type="number" defaultValue={8} className="w-20" />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">{t('settings.requireSpecialChars')}</span>
            <input type="checkbox" defaultChecked className="w-4 h-4 text-emerald-600 rounded" />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">{t('settings.requireNumbers')}</span>
            <input type="checkbox" defaultChecked className="w-4 h-4 text-emerald-600 rounded" />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">{t('settings.requireMixedCase')}</span>
            <input type="checkbox" defaultChecked className="w-4 h-4 text-emerald-600 rounded" />
          </div>
        </div>
      </div>

      <div className="bg-muted/50 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Shield className="w-4 h-4" />
          {t('settings.sessionsAccess')}
        </h4>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">{t('settings.sessionTimeout')}</span>
            <Input type="number" defaultValue={30} className="w-20" />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">{t('settings.twoFactorAuth')}</span>
            <input type="checkbox" className="w-4 h-4 text-emerald-600 rounded" />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">{t('settings.lockAfterFailedAttempts')}</span>
            <Input type="number" defaultValue={5} className="w-20" />
          </div>
        </div>
      </div>

      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
        <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">
          {t('settings.dangerZone')}
        </h4>
        <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-3">
          {t('settings.dangerZoneWarning')}
        </p>
        <div className="flex gap-3">
          <Button variant="outline" className="text-red-600 border-red-300 hover:bg-red-50">
            {t('settings.resetAllPasswords')}
          </Button>
          <Button variant="outline" className="text-red-600 border-red-300 hover:bg-red-50">
            {t('settings.terminateAllSessions')}
          </Button>
        </div>
      </div>
    </div>
  );

  const renderAppearanceSettings = () => (
    <div className="space-y-6">
      <div className="bg-muted/50 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 dark:text-white mb-4">
          {t('settings.interfaceTheme')}
        </h4>
        <div className="grid grid-cols-3 gap-4">
          <button className="p-4 border-2 border-emerald-500 rounded-lg text-center">
            <div className="w-full h-12 bg-white border rounded mb-2"></div>
            <span className="text-sm">{t('settings.themeLight')}</span>
          </button>
          <button className="p-4 border-2 border-gray-300 rounded-lg text-center">
            <div className="w-full h-12 bg-gray-800 rounded mb-2"></div>
            <span className="text-sm">{t('settings.themeDark')}</span>
          </button>
          <button className="p-4 border-2 border-gray-300 rounded-lg text-center">
            <div className="w-full h-12 bg-gradient-to-r from-white to-gray-800 rounded mb-2"></div>
            <span className="text-sm">{t('settings.themeAuto')}</span>
          </button>
        </div>
      </div>

      <div className="bg-muted/50 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 dark:text-white mb-4">
          {t('settings.primaryColor')}
        </h4>
        <div className="flex gap-3">
          <button className="w-10 h-10 bg-emerald-500 rounded-full ring-2 ring-offset-2 ring-emerald-500"></button>
          <button className="w-10 h-10 bg-blue-500 rounded-full"></button>
          <button className="w-10 h-10 bg-purple-500 rounded-full"></button>
          <button className="w-10 h-10 bg-orange-500 rounded-full"></button>
          <button className="w-10 h-10 bg-red-500 rounded-full"></button>
        </div>
      </div>

      <div className="bg-muted/50 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 dark:text-white mb-4">
          {t('settings.language')}
        </h4>
        <select className="w-full max-w-xs h-10 px-3 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
          <option selected>{t('settings.portugueseMoz')}</option>
          <option>{t('settings.portuguesePt')}</option>
          <option>{t('settings.english')}</option>
        </select>
      </div>
    </div>
  );

  const renderIntegrationsSettings = () => (
    <div className="space-y-4">
      <p className="text-sm text-gray-500 mb-4">
        {t('settings.integrationsDescription')}
      </p>

      {[
        { name: t('settings.integrationSige'), description: t('settings.integrationSigeDesc'), connected: true, icon: '🏛️' },
        { name: t('settings.integrationMpesa'), description: t('settings.integrationMpesaDesc'), connected: false, icon: '💳' },
        { name: t('settings.integrationGoogle'), description: t('settings.integrationGoogleDesc'), connected: true, icon: '📧' },
        { name: t('settings.integrationSms'), description: t('settings.integrationSmsDesc'), connected: true, icon: '📱' },
        { name: t('settings.integrationBackup'), description: t('settings.integrationBackupDesc'), connected: false, icon: '☁️' },
      ].map((integration) => (
        <div
          key={integration.name}
          className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">{integration.icon}</span>
            <div>
              <p className="font-medium text-gray-900 dark:text-white">
                {integration.name}
              </p>
              <p className="text-sm text-gray-500">{integration.description}</p>
            </div>
          </div>
          <Button
            variant={integration.connected ? 'outline' : 'primary'}
            size="sm"
          >
            {integration.connected ? t('settings.configure') : t('settings.connect')}
          </Button>
        </div>
      ))}
    </div>
  );

  const renderGradingSettings = () => {
    if (!currentSchool?.id) {
      return (
        <div className="text-center py-12 text-gray-500">
          {t('settings.loadingGrading')}
        </div>
      );
    }

    return <GradeSystemSettings schoolId={currentSchool.id} />;
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'profile':
        return renderProfileSettings();
      case 'country':
        return <CountryCurriculumSettings schoolId={currentSchool?.id || ''} />;
      case 'users':
        return renderUsersSettings();
      case 'academic':
        return renderAcademicSettings();
      case 'grading':
        return renderGradingSettings();
      case 'communications':
        return <EmailTemplateManager schoolId={currentSchool?.id || ''} />;
      case 'notifications':
        return renderNotificationSettings();
      case 'security':
        return renderSecuritySettings();
      case 'appearance':
        return renderAppearanceSettings();
      case 'integrations':
        return renderIntegrationsSettings();
      default:
        return renderProfileSettings();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t('settings.title')}
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            {t('settings.subtitle')}
          </p>
        </div>
        {unsavedChanges && (
          <div className="flex items-center gap-3">
            <span className="text-sm text-amber-600 dark:text-amber-400">
              {t('settings.unsavedChanges')}
            </span>
            <Button variant="outline" onClick={() => setUnsavedChanges(false)}>
              {t('settings.discard')}
            </Button>
            <Button onClick={() => setUnsavedChanges(false)}>
              <Save className="w-4 h-4 mr-2" />
              {t('settings.saveChanges')}
            </Button>
          </div>
        )}
      </div>

      {/* Settings Layout */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <div className="w-full lg:w-64 shrink-0">
          <nav className="bg-card rounded-xl shadow-sm border border-border p-2">
            {settingsSectionsConfig.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${activeSection === section.id
                  ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
              >
                <section.icon className="w-5 h-5" />
                <span className="font-medium">{t(section.labelKey)}</span>
                {activeSection === section.id && (
                  <ChevronRight className="w-4 h-4 ml-auto" />
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 bg-card rounded-xl shadow-sm border border-border p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
            {t(settingsSectionsConfig.find(s => s.id === activeSection)?.labelKey || 'settings.profileSection')}
          </h2>
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
