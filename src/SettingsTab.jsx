import React, { useState, useEffect } from 'react';

const SettingsTab = ({ 
    currentUser, 
    setShowProfileModal, 
    showNotification, 
    defaultSubTab = 'security',
    notifications = [],
    markNotificationAsRead,
    markAllNotificationsAsRead
}) => {
    // Determine which settings pane is active on the right
    const [activeTab, setActiveTab] = useState(defaultSubTab);

    // If defaultSubTab prop changes dynamically from parent, update it
    useEffect(() => {
        setActiveTab(defaultSubTab);
    }, [defaultSubTab]);
    // Local state for password form
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    const handlePasswordChange = (e) => {
        const { name, value } = e.target;
        setPasswordData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handlePasswordSubmit = (e) => {
        e.preventDefault();
        
        if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
            if (showNotification) showNotification('Please fill in all password fields.', 'error');
            return;
        }

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            if (showNotification) showNotification('New passwords do not match!', 'error');
            return;
        }

        if (passwordData.newPassword.length < 6) {
            if (showNotification) showNotification('New password must be at least 6 characters long.', 'error');
            return;
        }

        // Simulate API call success
        if (showNotification) showNotification('Password updated successfully!', 'success');
        
        // Reset form
        setPasswordData({
            currentPassword: '',
            newPassword: '',
            confirmPassword: ''
        });
    };

    return (
        <div className="tab-content active animate-fade-in max-w-6xl mx-auto space-y-8 pb-10">
            {/* Stylish Header */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 relative overflow-hidden shadow-sm border border-slate-200 dark:border-slate-700 z-10 block text-left">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10 w-full">
                    <div>
                        <h2 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-3">
                            <div className="w-12 h-12 bg-[#F6DD26]/20 rounded-2xl flex items-center justify-center text-[#800000] shrink-0 border border-[#F6DD26]/50">
                                <i className="fas fa-cog text-xl animate-spin-[6s_linear_infinite]"></i>
                            </div>
                            System Configuration
                        </h2>
                        <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">Manage your profile, security preferences, and system behavior.</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Column: Navigation Sidebar Alternative */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-slate-100 dark:border-slate-700 block text-left w-full relative">
                        <div className="flex flex-col items-center p-6 border-b border-slate-100 dark:border-slate-700 mb-4 w-full">
                            <div className="w-24 h-24 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shadow-lg shadow-black/5 mb-4 relative overflow-hidden group border-4 border-[#800000] ring-4 ring-[#F6DD26]/50 shrink-0">
                                {currentUser?.profilePic ? (
                                    <img src={currentUser.profilePic} alt="Profile" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                ) : (
                                    <span className="text-3xl font-black text-red-800 tracking-tighter">{currentUser?.name ? currentUser.name.substring(0,2).toUpperCase() : 'U'}</span>
                                )}
                                <button onClick={() => setShowProfileModal && setShowProfileModal(true)} type="button" className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all duration-300 backdrop-blur-sm text-white border-0 outline-none w-full h-full">
                                    <i className="fas fa-camera text-xl border-2 border-white/50 p-2 rounded-full"></i>
                                </button>
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 dark:text-white">{currentUser?.name || 'User'}</h3>
                            <span className="px-3 py-1 bg-[#F6DD26]/20 text-[#800000] border border-[#F6DD26]/40 rounded-full text-xs font-bold uppercase tracking-wider mt-2">{currentUser?.role || 'Staff'}</span>
                        </div>
                        <div className="space-y-2 w-full">
                            <button onClick={() => setShowProfileModal && setShowProfileModal(true)} type="button" className="w-full text-left px-5 py-4 rounded-2xl bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 font-bold hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors flex items-center justify-between group outline-none border border-slate-200 dark:border-slate-700 cursor-pointer shadow-sm">
                                <span className="flex items-center gap-3"><i className="fas fa-user-edit text-[#800000] transition-colors"></i> Edit Profile Info</span>
                                <i className="fas fa-chevron-right text-xs opacity-50 group-hover:translate-x-1 transition-all text-[#800000]"></i>
                            </button>
                            <button type="button" onClick={() => setActiveTab('notifications')} className={`w-full text-left px-5 py-4 rounded-2xl bg-white dark:bg-slate-900 font-semibold transition-colors flex items-center justify-between group outline-none border cursor-pointer shadow-sm ${activeTab === 'notifications' ? 'border-[#800000] text-[#800000] shadow-md ring-2 ring-[#800000]/10' : 'border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-red-50 hover:border-[#800000]/20'}`}>
                                <span className="flex items-center gap-3"><i className={`fas fa-bell transition-colors ${activeTab === 'notifications' ? 'text-[#F6DD26]' : 'text-slate-400 group-hover:text-[#F6DD26]'}`}></i> Notifications</span>
                            </button>
                            <button type="button" onClick={() => setActiveTab('security')} className={`w-full text-left px-5 py-4 rounded-2xl bg-white dark:bg-slate-900 font-semibold transition-colors flex items-center justify-between group outline-none border cursor-pointer shadow-sm ${activeTab === 'security' ? 'border-[#800000] text-[#800000] shadow-md ring-2 ring-[#800000]/10' : 'border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-red-50 hover:border-[#800000]/20'}`}>
                                <span className="flex items-center gap-3"><i className={`fas fa-shield-alt transition-colors ${activeTab === 'security' ? 'text-[#F6DD26]' : 'text-slate-400 group-hover:text-[#F6DD26]'}`}></i> Security Center</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right Column: Configuration Area */}
                <div className="lg:col-span-8 space-y-6">
                    {/* Notifications Configuration (conditionally rendered) */}
                    {activeTab === 'notifications' && (
                        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-slate-100 dark:border-slate-700 transition-all hover:shadow-[0_20px_40px_rgb(0,0,0,0.12)] block text-left w-full animate-fade-in">
                            <div className="flex items-center justify-between mb-8 w-full border-b border-slate-100 dark:border-slate-700 pb-6">
                                <div>
                                    <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                        System Notifications
                                    </h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Review recent activities and alerts regarding your account.</p>
                                </div>
                                <div className="w-12 h-12 bg-[#F6DD26]/20 rounded-full flex items-center justify-center text-[#800000] shrink-0 border border-[#F6DD26]/50 shadow-inner">
                                    <i className="fas fa-bell text-lg"></i>
                                </div>
                            </div>
                            
                            <div className="space-y-4">
                                {notifications.length > 0 ? notifications.map((notif) => (
                                    <div 
                                        key={notif.notification_id} 
                                        onClick={() => !notif.is_read && markNotificationAsRead(notif.notification_id)}
                                        className={`flex items-start gap-4 p-5 rounded-2xl border transition-all w-full cursor-pointer relative overflow-hidden group ${notif.is_read ? 'bg-slate-50/50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-700 opacity-70' : 'bg-white dark:bg-slate-800 border-red-100 dark:border-red-900 shadow-sm shadow-red-500/5 hover:border-red-300'}`}
                                    >
                                        {!notif.is_read && <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#800000]"></div>}
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border ${
                                            notif.type === 'success' ? 'bg-emerald-100 text-emerald-600 border-emerald-200' : 
                                            notif.type === 'error' ? 'bg-red-100 text-red-600 border-red-200' :
                                            'bg-blue-100 text-blue-600 border-blue-200'
                                        }`}>
                                            <i className={`fas ${
                                                notif.type === 'success' ? 'fa-check-circle' : 
                                                notif.type === 'error' ? 'fa-exclamation-triangle' :
                                                notif.type === 'car' ? 'fa-car' : 'fa-bell'
                                            }`}></i>
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-baseline justify-between mb-1">
                                                <h4 className={`font-bold ${notif.is_read ? 'text-slate-600 dark:text-slate-400' : 'text-slate-800 dark:text-white'}`}>{notif.title}</h4>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                                                    {new Date(notif.created_at).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <p className={`text-sm font-medium ${notif.is_read ? 'text-slate-400' : 'text-slate-500 dark:text-slate-400'}`}>{notif.message}</p>
                                        </div>
                                        {!notif.is_read && (
                                            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                                        )}
                                    </div>
                                )) : (
                                    <div className="text-center py-10">
                                        <i className="fas fa-bell-slash text-4xl text-slate-200 mb-3"></i>
                                        <p className="text-slate-400 font-medium">No notifications yet.</p>
                                    </div>
                                )}
                            </div>
                            
                            <div className="pt-6 mt-4 flex justify-center w-full border-t border-slate-100 dark:border-slate-700">
                                <button type="button" onClick={markAllNotificationsAsRead} className="px-6 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2">
                                    <i className="fas fa-check-double"></i> Mark all as read
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Security Configuration (conditionally rendered) */}
                    {activeTab === 'security' && (
                        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-slate-100 dark:border-slate-700 transition-all hover:shadow-[0_20px_40px_rgb(0,0,0,0.12)] block text-left animate-fade-in w-full">
                            <div className="flex items-center justify-between mb-8 w-full border-b border-slate-100 dark:border-slate-700 pb-6">
                                <div>
                                    <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                        Password Management
                                    </h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Ensure your account is using a strong password.</p>
                                </div>
                                <div className="w-12 h-12 bg-[#F6DD26]/20 rounded-full flex items-center justify-center text-[#800000] shrink-0 border border-[#F6DD26]/50 shadow-inner">
                                    <i className="fas fa-lock text-lg"></i>
                                </div>
                            </div>
                            
                            <form className="space-y-6" onSubmit={handlePasswordSubmit}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-2">Current Password</label>
                                        <div className="relative">
                                            <i className="fas fa-key absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 focus-within:text-red-800"></i>
                                            <input type="password" name="currentPassword" value={passwordData.currentPassword} onChange={handlePasswordChange} placeholder="••••••••" className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-11 pr-4 py-3.5 focus:bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-red-800/20 focus:border-red-800 transition-all font-medium text-slate-800 dark:text-white block box-border shadow-sm shadow-slate-100 inset-0" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-200">New Password</label>
                                        <input type="password" name="newPassword" value={passwordData.newPassword} onChange={handlePasswordChange} placeholder="••••••••" className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3.5 focus:bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-red-800/20 focus:border-red-800 transition-all font-medium text-slate-800 dark:text-white block box-border shadow-sm shadow-slate-100" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-200">Confirm Password</label>
                                        <input type="password" name="confirmPassword" value={passwordData.confirmPassword} onChange={handlePasswordChange} placeholder="••••••••" className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3.5 focus:bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-red-800/20 focus:border-red-800 transition-all font-medium text-slate-800 dark:text-white block box-border shadow-sm shadow-slate-100" />
                                    </div>
                                </div>
                                <div className="pt-4 flex justify-end w-full">
                                    <button type="submit" className="px-8 py-3.5 bg-[#800000] hover:bg-[#660000] text-white font-bold rounded-xl shadow-lg shadow-red-900/30 transition-all transform hover:-translate-y-1 w-full md:w-auto border border-[#F6DD26]/30 cursor-pointer flex items-center justify-center gap-2">
                                        <i className="fas fa-shield-check text-[#F6DD26]"></i> Update Security
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SettingsTab;
