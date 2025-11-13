'use client';

import DashboardLayout from '../components/DashboardLayout';

export default function ProfilePage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="bg-white/95 backdrop-blur-sm rounded-xl p-6 shadow-lg">
          <h2 className="text-3xl font-bold text-[#001C3D] mb-6">👤 Profile Settings</h2>
          
          {/* Profile Info */}
          <div className="mb-6">
            <div className="flex items-center gap-6 mb-6">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#9448B0] to-[#332277] flex items-center justify-center">
                <span className="text-4xl">👤</span>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-[#001C3D]">Student</h3>
                <p className="text-gray-600">student@example.com</p>
              </div>
            </div>
          </div>

          {/* Settings Sections */}
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-bold text-[#001C3D] mb-4">Account Information</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Username</label>
                  <input
                    type="text"
                    defaultValue="Student"
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-[#9448B0] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Email</label>
                  <input
                    type="email"
                    defaultValue="student@example.com"
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-[#9448B0] focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-bold text-[#001C3D] mb-4">Preferences</h3>
              <div className="space-y-3">
                {[
                  { label: 'Email Notifications', checked: true },
                  { label: 'Progress Reminders', checked: true },
                  { label: 'Weekly Reports', checked: false },
                ].map((setting, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-gray-50 rounded-lg p-4">
                    <span className="font-semibold text-[#001C3D]">{setting.label}</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked={setting.checked} />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#9448B0]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#9448B0]"></div>
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-4">
              <button className="flex-1 bg-[#9448B0] text-white font-bold py-3 px-6 rounded-lg hover:bg-[#A058C0] transition-colors">
                Save Changes
              </button>
              <button className="flex-1 bg-gray-300 text-[#001C3D] font-bold py-3 px-6 rounded-lg hover:bg-gray-400 transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

