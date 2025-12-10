import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast, { Toaster } from 'react-hot-toast';
import { emailSettingsApi } from '../lib/api';

export default function EmailSettingsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Email settings state
  const [settings, setSettings] = useState({
    smtpHost: '',
    smtpPort: 587,
    smtpUser: '',
    smtpPass: '',
    fromEmail: '',
    fromName: 'College Admin',
  });

  // Fetch current settings
  const { data: currentSettings } = useQuery({
    queryKey: ['email-settings'],
    queryFn: () => emailSettingsApi.getSettings(),
  });

  // Update settings when data loads
  useEffect(() => {
    if (currentSettings) {
      setSettings({
        smtpHost: currentSettings.smtpHost || '',
        smtpPort: currentSettings.smtpPort || 587,
        smtpUser: currentSettings.smtpUser || '',
        smtpPass: '', // Never populate password from backend
        fromEmail: currentSettings.fromEmail || '',
        fromName: currentSettings.fromName || 'College Admin',
      });
    }
  }, [currentSettings]);

  // Save settings mutation
  const saveMutation = useMutation({
    mutationFn: (data: typeof settings) => emailSettingsApi.updateSettings(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-settings'] });
      toast.success('Email settings saved successfully!');
      setSettings(prev => ({ ...prev, smtpPass: '' })); // Clear password field
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to save settings');
    },
  });

  // Test email mutation
  const testEmailMutation = useMutation({
    mutationFn: (email: string) => emailSettingsApi.sendTestEmail(email),
    onSuccess: (_, email) => {
      toast.success(`Test email sent successfully to ${email}!`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to send test email');
    },
  });

  const handleSave = async () => {
    // Validation
    if (!settings.smtpHost || !settings.smtpPort || !settings.smtpUser || !settings.fromEmail) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!settings.smtpPass && !currentSettings?.id) {
      toast.error('Password is required for new configuration');
      return;
    }

    saveMutation.mutate(settings);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Toaster position="top-right" />

      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } bg-white border-r border-gray-200 transition-all duration-300 flex-shrink-0`}
      >
        <div className="h-full flex flex-col">
          {/* Logo */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              {sidebarOpen && (
                <h2 className="text-xl font-bold text-gray-900">Admin Panel</h2>
              )}
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 rounded-lg hover:bg-gray-100"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d={sidebarOpen ? 'M15 19l-7-7 7-7' : 'M9 5l7 7-7 7'}
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            <Link
              to="/admin"
              className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-gray-100 text-gray-700"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
              {sidebarOpen && <span>Dashboard</span>}
            </Link>

            <Link
              to="/admin/audit-logs"
              className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-gray-100 text-gray-700"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              {sidebarOpen && <span>Audit Logs</span>}
            </Link>

            <Link
              to="/admin/settings"
              className="flex items-center space-x-3 px-4 py-3 rounded-lg bg-blue-50 text-blue-700"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              {sidebarOpen && <span>Settings</span>}
            </Link>
          </nav>

          {/* Logout */}
          <div className="p-4 border-t border-gray-200">
            <button
              onClick={() => {
                localStorage.removeItem('accessToken');
                navigate('/login');
              }}
              className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-red-50 text-red-600 w-full"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              {sidebarOpen && <span>Logout</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto px-6 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Email Settings</h1>
            <p className="mt-2 text-gray-600">
              Configure SMTP settings for sending college email credentials
            </p>
          </div>

          {/* Warning Banner - REMOVED since backend is now integrated */}

          {/* Settings Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6"
          >
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">SMTP Configuration</h2>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      SMTP Host <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={settings.smtpHost}
                      onChange={(e) => setSettings({ ...settings, smtpHost: e.target.value })}
                      placeholder="smtp.gmail.com"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      e.g., smtp.gmail.com, smtp.sendgrid.net
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      SMTP Port <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={settings.smtpPort}
                      onChange={(e) => setSettings({ ...settings, smtpPort: parseInt(e.target.value) || 587 })}
                      placeholder="587"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Common: 587 (TLS), 465 (SSL), 25
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    SMTP Username <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={settings.smtpUser}
                    onChange={(e) => setSettings({ ...settings, smtpUser: e.target.value })}
                    placeholder="your-email@gmail.com"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    SMTP Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    value={settings.smtpPass}
                    onChange={(e) => setSettings({ ...settings, smtpPass: e.target.value })}
                    placeholder="••••••••••••"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    For Gmail, use an App Password, not your regular password
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Sender Information</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    From Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={settings.fromEmail}
                    onChange={(e) => setSettings({ ...settings, fromEmail: e.target.value })}
                    placeholder="noreply@college.edu"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Email address that will appear as the sender
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    From Name
                  </label>
                  <input
                    type="text"
                    value={settings.fromName}
                    onChange={(e) => setSettings({ ...settings, fromName: e.target.value })}
                    placeholder="College Admin"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="border-t border-gray-200 pt-6 flex space-x-4">
              <button
                onClick={handleSave}
                disabled={saveMutation.isPending}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saveMutation.isPending ? 'Saving...' : 'Save Settings'}
              </button>

              <button
                onClick={() => {
                  const email = prompt('Enter email address to send test email:');
                  if (email) {
                    testEmailMutation.mutate(email);
                  }
                }}
                disabled={testEmailMutation.isPending || !currentSettings?.id}
                className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {testEmailMutation.isPending ? 'Sending...' : 'Test Email'}
              </button>
            </div>
          </motion.div>

          {/* Info Panel */}
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-blue-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">Gmail Setup Instructions</h3>
                <div className="mt-2 text-sm text-blue-700">
                  <ol className="list-decimal list-inside space-y-1">
                    <li>Go to your Google Account settings</li>
                    <li>Enable 2-Factor Authentication</li>
                    <li>
                      Generate an App Password (Security → 2-Step Verification → App passwords)
                    </li>
                    <li>Use the 16-character app password in the SMTP Password field</li>
                    <li>Set SMTP Host to: smtp.gmail.com</li>
                    <li>Set SMTP Port to: 587</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>

          {/* Example Settings */}
          <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Example Configurations</h3>
            <div className="space-y-3 text-sm">
              <div>
                <strong className="text-gray-900">Gmail:</strong>
                <div className="mt-1 text-gray-600">
                  Host: smtp.gmail.com | Port: 587 | Use App Password
                </div>
              </div>
              <div>
                <strong className="text-gray-900">SendGrid:</strong>
                <div className="mt-1 text-gray-600">
                  Host: smtp.sendgrid.net | Port: 587 | Username: apikey | Password: Your API Key
                </div>
              </div>
              <div>
                <strong className="text-gray-900">Office365:</strong>
                <div className="mt-1 text-gray-600">
                  Host: smtp.office365.com | Port: 587
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
