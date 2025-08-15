import React, { useState } from 'react';
import { FileText, Link, Upload, Lock, Unlock, Download, Eye, Calendar, User } from 'lucide-react';
import { ShareData } from '../services/shareService';
import { decryptData, bufferToText } from '../utils/encryption';

interface ShareListProps {
  shares: ShareData[];
  type: 'sent' | 'received';
  onDecryptSuccess?: () => void;
}

const ShareList: React.FC<ShareListProps> = ({ shares, type, onDecryptSuccess }) => {
  const [selectedShare, setSelectedShare] = useState<ShareData | null>(null);
  const [decryptionKey, setDecryptionKey] = useState('');
  const [decrypting, setDecrypting] = useState(false);
  const [decryptedContent, setDecryptedContent] = useState<string | null>(null);

  const handleDecrypt = async () => {
    if (!selectedShare || !decryptionKey.trim()) return;

    setDecrypting(true);
    try {
      const decrypted = await decryptData({
        ciphertext: selectedShare.ciphertext,
        iv: selectedShare.iv,
        key: decryptionKey.trim(),
      });

      if (selectedShare.contentType === 'file') {
        // For files, create a download link
        const base64Data = bufferToText(decrypted);
        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: selectedShare.fileType || 'application/octet-stream' });
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = selectedShare.fileName || 'decrypted-file';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        setDecryptedContent('File downloaded successfully!');
      } else {
        setDecryptedContent(bufferToText(decrypted));
      }

      onDecryptSuccess?.();
    } catch (error) {
      console.error('Decryption failed:', error);
      alert('Failed to decrypt. Please check your key.');
    }
    setDecrypting(false);
  };

  const getTypeIcon = (contentType: string) => {
    switch (contentType) {
      case 'note':
        return <FileText className="w-5 h-5 text-blue-600" />;
      case 'link':
        return <Link className="w-5 h-5 text-green-600" />;
      case 'file':
        return <Upload className="w-5 h-5 text-purple-600" />;
      default:
        return <FileText className="w-5 h-5 text-gray-600" />;
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (shares.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <Lock className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No {type} shares yet
        </h3>
        <p className="text-gray-500">
          {type === 'sent' 
            ? 'Create your first encrypted share to get started'
            : 'You\'ll see shares sent to your email here'
          }
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {shares.map((share) => (
        <div
          key={share.id}
          className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-4 flex-1">
              <div className="flex-shrink-0">
                {getTypeIcon(share.contentType)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-2">
                  <h3 className="text-lg font-medium text-gray-900 truncate">
                    {share.contentType === 'file' ? share.fileName || 'Encrypted File' : 
                     share.contentType === 'link' ? 'Encrypted Link' : 'Encrypted Note'}
                  </h3>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {share.contentType}
                  </span>
                </div>
                <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(share.createdAt)}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <User className="w-4 h-4" />
                    <span>
                      {type === 'sent' 
                        ? `To: ${share.recipientEmail}` 
                        : `From: ${share.senderName}`
                      }
                    </span>
                  </div>
                </div>
                {type === 'received' && (
                  <button
                    onClick={() => setSelectedShare(share)}
                    className="inline-flex items-center px-3 py-1.5 border border-blue-300 rounded-md text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors"
                  >
                    <Unlock className="w-4 h-4 mr-1.5" />
                    Decrypt & View
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Decryption Modal */}
      {selectedShare && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Decrypt Content
            </h3>
            
            {decryptedContent ? (
              <div>
                <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h4 className="font-medium text-green-800 mb-2">Decrypted Content:</h4>
                  {selectedShare.contentType === 'file' ? (
                    <p className="text-green-700">{decryptedContent}</p>
                  ) : (
                    <div className="bg-white p-3 rounded border text-gray-900 whitespace-pre-wrap max-h-40 overflow-y-auto">
                      {decryptedContent}
                    </div>
                  )}
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      setSelectedShare(null);
                      setDecryptedContent(null);
                      setDecryptionKey('');
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="mb-4">
                  <label htmlFor="decryptionKey" className="block text-sm font-medium text-gray-700 mb-2">
                    Enter Decryption Key
                  </label>
                  <input
                    type="text"
                    id="decryptionKey"
                    value={decryptionKey}
                    onChange={(e) => setDecryptionKey(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Paste the decryption key here..."
                    disabled={decrypting}
                  />
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      setSelectedShare(null);
                      setDecryptionKey('');
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                    disabled={decrypting}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDecrypt}
                    disabled={!decryptionKey.trim() || decrypting}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {decrypting ? 'Decrypting...' : 'Decrypt'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ShareList;