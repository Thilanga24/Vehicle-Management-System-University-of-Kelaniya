import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

const UserManagement = () => {
    const navigate = useNavigate();
    const [activeSection, setActiveSection] = useState('user-list');
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [users, setUsers] = useState([]);

    // Fetch users from backend
    const fetchUsers = async () => {
        try {
            const response = await fetch('/api/auth/users');
            const data = await response.json();
            if (response.ok) {
                setUsers(data);
            }
        } catch (error) {
            console.error('Error fetching users:', error);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const departments = [
        { name: 'Computer Science', head: 'Dr. Kamala Fernando', staff: 15, students: 450, budget: 'Rs. 2.5M' },
        { name: 'Engineering', head: 'Prof. Nimal Perera', staff: 25, students: 650, budget: 'Rs. 4.2M' },
        { name: 'Business Studies', head: 'Dr. Arjuna Wijesinghe', staff: 12, students: 380, budget: 'Rs. 1.8M' },
        { name: 'Arts & Humanities', head: 'Prof. Sandya Jayawardene', staff: 18, students: 520, budget: 'Rs. 2.1M' },
        { name: 'Applied Sciences', head: 'Dr. Mahesh Bandara', staff: 20, students: 480, budget: 'Rs. 3.0M' }
    ];

    const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

    const getRoleBadgeColor = (role) => {
        switch (role) {
            case 'admin': return 'bg-red-600';
            case 'dean': return 'bg-amber-600';
            case 'hod': return 'bg-yellow-600';
            case 'lecturer': return 'bg-emerald-600';
            case 'sar': return 'bg-purple-600';
            case 'registrar': return 'bg-cyan-600';
            default: return 'bg-slate-500';
        }
    };

    return (
        <div className="dashboard-container">
            {/* Mobile Hamburger */}
            <div className="lg:hidden fixed top-5 left-5 z-50 p-2 bg-maroon text-white rounded cursor-pointer" onClick={toggleSidebar}>
                <i className="fas fa-bars text-xl"></i>
            </div>

            {/* Sidebar */}
            <div className={`sidebar ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 transition-transform duration-300`}>
                <div className="logo">
                    <div className="logo-content justify-center">
                        <img src="/assets/banner.png" alt="University of Kelaniya VMS" className="w-full h-auto object-contain" />
                    </div>
                </div>

                <div className="menu-section">
                    <div className="menu-section-title">Directory</div>
                    <div className={`menu-item ${activeSection === 'user-list' ? 'active' : ''}`} onClick={() => setActiveSection('user-list')}>
                        <i className="fas fa-users"></i>
                        <span>User Directory</span>
                    </div>
                    <div className={`menu-item ${activeSection === 'add-user' ? 'active' : ''}`} onClick={() => setActiveSection('add-user')}>
                        <i className="fas fa-user-plus"></i>
                        <span>Add User</span>
                    </div>
                </div>

                <div className="menu-section">
                    <div className="menu-section-title">Administration</div>
                    <div className={`menu-item ${activeSection === 'roles-permissions' ? 'active' : ''}`} onClick={() => setActiveSection('roles-permissions')}>
                        <i className="fas fa-shield-alt"></i>
                        <span>Roles & Perms</span>
                    </div>
                    <div className={`menu-item ${activeSection === 'departments' ? 'active' : ''}`} onClick={() => setActiveSection('departments')}>
                        <i className="fas fa-building"></i>
                        <span>Departments</span>
                    </div>
                    <div className={`menu-item ${activeSection === 'activity-logs' ? 'active' : ''}`} onClick={() => setActiveSection('activity-logs')}>
                        <i className="fas fa-history"></i>
                        <span>Activity Logs</span>
                    </div>
                    <div className={`menu-item ${activeSection === 'security' ? 'active' : ''}`} onClick={() => setActiveSection('security')}>
                        <i className="fas fa-lock"></i>
                        <span>Security</span>
                    </div>
                </div>

                <div className="menu-section">
                    <div className="menu-section-title">Navigation</div>
                    <div className="menu-item" onClick={() => {
                        const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
                        const role = user.role;
                        if (role === 'registrar') navigate('/registrar-dashboard');
                        else if (role === 'sar') navigate('/sar-dashboard');
                        else if (role === 'hod') navigate('/hod-dashboard');
                        else if (role === 'dean') navigate('/dean-dashboard');
                        else if (role === 'admin') navigate('/admin-dashboard');
                        else if (role === 'management_assistant') navigate('/management-dashboard');
                        else navigate('/dashboard');
                    }}>
                        <i className="fas fa-arrow-left"></i>
                        <span>Back to Dashboard</span>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="main-content">
                <div className="top-nav">
                    <div className="welcome">
                        <h1>User Management <i className="fas fa-users-cog text-yellow-500 ml-2"></i></h1>
                        <p>Manage user accounts, permissions, and departments.</p>
                    </div>
                    <div className="top-nav-right">
                        <div className="user-profile">
                            <div className="user-avatar">
                                {JSON.parse(localStorage.getItem('currentUser') || '{}').name ? JSON.parse(localStorage.getItem('currentUser') || '{}').name.substring(0, 2).toUpperCase() : 'DS'}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="content-area">
                    {/* User List */}
                    {activeSection === 'user-list' && (
                        <div className="section">
                            <div className="section-header">
                                <h2>User Directory</h2>
                                <div className="filter-section" style={{ margin: 0 }}>
                                    <input type="text" placeholder="Search users..." className="p-2 border rounded-md mr-2 outline-none focus:ring-1 focus:ring-blue-500" />
                                    <select className="p-2 border rounded-md">
                                        <option value="">All Roles</option>
                                        <option value="admin">Admin</option>
                                        <option value="lecturer">Lecturer</option>
                                    </select>
                                </div>
                            </div>
                            <div className="bg-white rounded-xl shadow-md overflow-hidden border border-slate-100">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-50 border-b border-slate-200">
                                        <tr>
                                            <th className="p-4 font-semibold text-slate-700">User</th>
                                            <th className="p-4 font-semibold text-slate-700">Role</th>
                                            <th className="p-4 font-semibold text-slate-700">Department</th>
                                            <th className="p-4 font-semibold text-slate-700">Email</th>
                                            <th className="p-4 font-semibold text-slate-700">Status</th>
                                            <th className="p-4 font-semibold text-slate-700">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {users.map(user => (
                                            <tr key={user.user_id} className="hover:bg-slate-50">
                                                <td className="p-4">
                                                    <div className="font-medium text-slate-800">{user.first_name} {user.last_name}</div>
                                                    <div className="text-xs text-slate-500">ID: {user.user_id}</div>
                                                </td>
                                                <td className="p-4">
                                                    <span className={`${getRoleBadgeColor(user.role)} text-white text-xs px-2 py-1 rounded-full shadow-sm`}>
                                                        {user.role ? user.role.toUpperCase() : 'UNKNOWN'}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-slate-600">
                                                    {user.department || user.faculty || '-'}
                                                </td>
                                                <td className="p-4 text-slate-600">{user.email}</td>
                                                <td className="p-4">
                                                    <span className="px-2 py-1 rounded text-xs text-white bg-emerald-500">
                                                        Active
                                                    </span>
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex space-x-2">
                                                        <button className="text-blue-600 hover:text-blue-800"><i className="fas fa-edit"></i></button>
                                                        <button className="text-amber-600 hover:text-amber-800"><i className="fas fa-key"></i></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Add User */}
                    {activeSection === 'add-user' && (
                        <div className="section">
                            <div className="section-header"><h2>Add New User</h2></div>
                            <div className="bg-white rounded-xl shadow-md p-8 border border-slate-100">
                                <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); alert("Admin user creation not fully connected to backend yet."); }}>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-2">Full Name</label>
                                            <input type="text" className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500" placeholder="Dr. Somapala" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-2">Email Address</label>
                                            <input type="email" className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500" placeholder="email@uok.lk" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-2">Role</label>
                                            <select className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500">
                                                <option>Select Role</option>
                                                <option value="lecturer">Lecturer</option>
                                                <option value="admin">Admin</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-2">Department</label>
                                            <select className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500">
                                                <option>Select Department</option>
                                                <option>Computer Science</option>
                                                <option>Engineering</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <input type="checkbox" id="welcome" className="accent-blue-600 w-4 h-4" />
                                        <label htmlFor="welcome" className="text-sm text-slate-600">Send welcome email with login credentials</label>
                                    </div>
                                    <div className="flex justify-end">
                                        <button className="bg-maroon hover:bg-red-900 text-white px-6 py-2 rounded-lg font-medium transition-colors shadow-md">Create Account</button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

                    {/* Departments */}
                    {activeSection === 'departments' && (
                        <div className="section">
                            <div className="section-header"><h2>Faculties & Departments</h2></div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {departments.map((dept, i) => (
                                    <div key={i} className="bg-white rounded-xl shadow-md p-6 border border-slate-100 hover:shadow-lg transition">
                                        <h3 className="font-bold text-lg text-slate-800 mb-3 border-b pb-2">{dept.name}</h3>
                                        <div className="space-y-2 text-sm text-slate-600">
                                            <div className="flex justify-between"><span>Head:</span> <span className="font-medium text-slate-800">{dept.head}</span></div>
                                            <div className="flex justify-between"><span>Staff:</span> <span className="font-medium">{dept.staff}</span></div>
                                            <div className="flex justify-between"><span>Students:</span> <span className="font-medium">{dept.students}</span></div>
                                        </div>
                                        <button className="mt-4 w-full bg-blue-50 hover:bg-blue-100 text-blue-700 py-2 rounded font-medium transition-colors">Manage</button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Placeholder for others */}
                    {(activeSection === 'roles-permissions' || activeSection === 'activity-logs' || activeSection === 'security') && (
                        <div className="text-center py-20">
                            <i className="fas fa-lock text-slate-300 text-6xl mb-4"></i>
                            <h3 className="text-xl text-slate-600 font-bold">{activeSection.replace('-', ' ').toUpperCase()}</h3>
                            <p className="text-slate-400">Security & Logs module under construction.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UserManagement;
