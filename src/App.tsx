import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { Shield, Send, Inbox, Plus, LogOut } from 'lucide-react';

import { auth, initializeAuth } from './config/firebase';
import { getUserProfile, createUserProfile, UserProfile } from './services/userService';
import { createShare, getUserSentShares, getUserReceivedShares, ShareData, ContentType } from './services/shareService';
import { useToast } from './hooks/useToast';

import ProfileSetup from './components/ProfileSetup';
import ShareForm from './components/ShareForm';
import ShareList from './components/ShareList';
import ToastContainer from './components/Toast';

type Tab = 'create' | 'sent' | 'received';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('create');
  const [loading, setLoading] = useState(true);
  const [profileSetupLoading, setProfileSetupLoading] = useState(false);
  const [shareLoading, setShareLoading] = useState(false);
  const [sentShares, setSentShares] = useState<ShareData[]>([]);
  const [receivedShares, setReceivedShares] = useState<ShareData[]>([]);
  const [sharesLoading, setSharesLoading] = useState(false);

  const { toasts, removeToast, showSuccess, showError } = useToast();

  useEffect(() => {
    const initAuth = async () => {
      try {
        const authUser = await initializeAuth();
        setUser(authUser);
        
        const userProfile = await getUserProfile(authUser.uid);
        if (userProfile) {
          setProfile(userProfile);
          await loadShares(userProfile);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        showError('Failed to initialize authentication');
      }
      setLoading(false);
    };

    initAuth();
  }, [showError]);

  const loadShares = async (userProfile: UserProfile) => {
    if (!userProfile) return;
    
    setSharesLoading(true);
    try {
      const [sent, received] = await Promise.all([
        getUserSentShares(userProfile.uid),
        getUserReceivedShares(userProfile.email),
      ]);
      setSentShares(sent);
      setReceivedShares(received);
    } catch (error) {
      console.error('Error loading shares:', error);
      showError('Failed to load shares');
    }
    setSharesLoading(false);
  };

  const handleProfileSetup = async (name: string, email: string) => {
    if (!user) return;

    setProfileSetupLoading(true);
    try {
      await createUserProfile(user.uid, name, email);
      const newProfile: UserProfile = {
        uid: user.uid,
        name,
        email,
        createdAt: new Date(),
      };
      setProfile(newProfile);
      await loadShares(newProfile);
      showSuccess('Profile created successfully!');
    } catch (error) {
      console.error('Error creating profile:', error);
      showError('Failed to create profile');
    }
    setProfileSetupLoading(false);
  };

  const handleCreateShare = async (data: {
    contentType: ContentType;
    content: string | File;
    recipientEmail: string;
  }) => {
    if (!user || !profile) return { shareId: '', key: '' };

    setShareLoading(true);
    console.log('App: Starting handleCreateShare...');
    try {
      const result = await createShare({
        senderUid: user.uid,
        senderName: profile.name,
        recipientEmail: data.recipientEmail,
        contentType: data.contentType,
        content: data.content,
      });
      
      console.log('App: createShare returned:', result);
      console.log('App: Key from createShare:', result.key);
      
      showSuccess('Encrypted share created successfully!');
      await loadShares(profile);
      setActiveTab('sent');
      
      console.log('App: Returning result to ShareForm:', result);
      return result;
    } catch (error) {
      console.error('App: Error creating share:', error);
      showError('Failed to create share');
      throw error;
    } finally {
      setShareLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      setUser(null);
      setProfile(null);
      setSentShares([]);
      setReceivedShares([]);
      showSuccess('Logged out successfully');
    } catch (error) {
      console.error('Error logging out:', error);
      showError('Failed to log out');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Initializing SafeShare...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <>
        <ProfileSetup onComplete={handleProfileSetup} loading={profileSetupLoading} />
        <ToastContainer toasts={toasts} onClose={removeToast} />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">SafeShare</h1>
                <p className="text-sm text-gray-600 hidden sm:block">Encrypted file sharing</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600 hidden sm:block">
                Welcome, {profile.name}
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <nav className="flex space-x-1 bg-white/50 backdrop-blur-sm rounded-lg p-1 mb-6">
          {[
            { id: 'create' as Tab, label: 'Create Share', icon: Plus },
            { id: 'sent' as Tab, label: 'Sent', icon: Send },
            { id: 'received' as Tab, label: 'Received', icon: Inbox },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-md text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
              {tab.id === 'sent' && sentShares.length > 0 && (
                <span className="ml-1 bg-blue-100 text-blue-700 text-xs rounded-full px-2 py-0.5">
                  {sentShares.length}
                </span>
              )}
              {tab.id === 'received' && receivedShares.length > 0 && (
                <span className="ml-1 bg-green-100 text-green-700 text-xs rounded-full px-2 py-0.5">
                  {receivedShares.length}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Content Area */}
        <div className="space-y-6">
          {activeTab === 'create' && (
            <ShareForm onSubmit={handleCreateShare} loading={shareLoading} />
          )}
          
          {activeTab === 'sent' && (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Sent Shares</h2>
              {sharesLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading shares...</p>
                </div>
              ) : (
                <ShareList shares={sentShares} type="sent" />
              )}
            </div>
          )}
          
          {activeTab === 'received' && (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Received Shares</h2>
              {sharesLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading shares...</p>
                </div>
              ) : (
                <ShareList 
                  shares={receivedShares} 
                  type="received" 
                  onDecryptSuccess={() => loadShares(profile)}
                />
              )}
            </div>
          )}
        </div>
      </div>

      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  );
}

export default App;