import React, { useState } from 'react';
import { Send, FileText, Link, Upload, Loader2, Copy, Check } from 'lucide-react';
import { ContentType } from '../services/shareService';
import ProgressBar from './ProgressBar';

interface ShareFormProps {
  onSubmit: (data: {
    contentType: ContentType;
    content: string | File;
    recipientEmail: string;
  }) => Promise<{ shareId: string; key: string }>;
  loading: boolean;
}

const ShareForm: React.FC<ShareFormProps> = ({ onSubmit, loading }) => {
  const [contentType, setContentType] = useState<ContentType>('note');
  const [content, setContent] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [progress, setProgress] = useState(0);
  const [shareResult, setShareResult] = useState<{ shareId: string; key: string } | null>(null);
  const [keyCopied, setKeyCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProgress(0);
    setShareResult(null);

    console.log('ShareForm: Starting share creation...');
    try {
      const submitContent = contentType === 'file' ? file! : content;
      setProgress(30);
      
      const result = await onSubmit({
        contentType,
        content: submitContent,
        recipientEmail,
      });
      
      console.log('ShareForm: Received result from onSubmit:', result);
      console.log('ShareForm: Key from result:', result.key);
      
      setProgress(100);
      setShareResult(result);
      
      // Reset form
      setContent('');
      setFile(null);
      setRecipientEmail('');
    } catch (error) {
      console.error('ShareForm: Error creating share:', error);
      setProgress(0);
    }
  };

  const copyKey = async () => {
    if (shareResult?.key) {
      await navigator.clipboard.writeText(shareResult.key);
      console.log('Key copied to clipboard:', shareResult.key);
      setKeyCopied(true);
      setTimeout(() => setKeyCopied(false), 2000);
    }
  };

  const isValid = recipientEmail.trim() && 
    (contentType === 'file' ? file : content.trim());

  if (shareResult) {
    console.log('ShareForm: Rendering share result:', shareResult);
    console.log('ShareForm: Key in shareResult:', shareResult.key);
    console.log('ShareForm: ShareResult object keys:', Object.keys(shareResult));
    
    if (!shareResult.key) {
      console.error('ShareForm: No decryption key found in shareResult!', shareResult);
    }
    
    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Share Created Successfully!</h3>
          <p className="text-gray-600 mb-6">
            Your encrypted content has been shared. <strong>IMPORTANT:</strong> Copy the decryption key below and share it with the recipient through a secure channel (like a different messaging app).
          </p>
          
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Decryption Key (Share this securely)
            </label>
            <div className="text-xs text-gray-500 mb-2">
              Debug: Key exists: {shareResult.key ? 'Yes' : 'No'} | Key length: {shareResult.key?.length || 0}
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={shareResult.key || 'ERROR: No key found'}
                readOnly
                className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-md text-sm font-mono break-all"
              />
              <button
                onClick={copyKey}
                disabled={!shareResult.key}
                className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center space-x-1"
              >
                {keyCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span className="text-sm">{keyCopied ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-yellow-800">
              <strong>Security Note:</strong> This decryption key is only shown once. Make sure to copy it and share it with the recipient through a secure channel separate from this application.
              Without this key, the encrypted content cannot be accessed.
            </p>
          </div>

          <button
            onClick={() => setShareResult(null)}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create Another Share
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Create Encrypted Share</h2>
      
      {loading && (
        <div className="mb-6">
          <ProgressBar progress={progress} label="Creating encrypted share..." />
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">Content Type</label>
          <div className="grid grid-cols-3 gap-3">
            {(['note', 'link', 'file'] as ContentType[]).map((type) => {
              const icons = { note: FileText, link: Link, file: Upload };
              const Icon = icons[type];
              const labels = { note: 'Note', link: 'Link', file: 'File' };
              
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => setContentType(type)}
                  className={`p-4 border-2 rounded-lg flex flex-col items-center space-y-2 transition-all ${
                    contentType === type
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-600'
                  }`}
                  disabled={loading}
                >
                  <Icon className="w-6 h-6" />
                  <span className="text-sm font-medium">{labels[type]}</span>
                </button>
              );
            })}
          </div>
        </div>

        {contentType === 'file' ? (
          <div>
            <label htmlFor="file" className="block text-sm font-medium text-gray-700 mb-2">
              Select File
            </label>
            <input
              type="file"
              id="file"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={loading}
            />
            {file && (
              <p className="mt-2 text-sm text-gray-600">
                Selected: {file.name} ({(file.size / 1024).toFixed(1)} KB)
              </p>
            )}
          </div>
        ) : (
          <div>
            <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
              {contentType === 'note' ? 'Note Content' : 'Link URL'}
            </label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder={contentType === 'note' ? 'Enter your note...' : 'https://example.com'}
              disabled={loading}
            />
          </div>
        )}

        <div>
          <label htmlFor="recipient" className="block text-sm font-medium text-gray-700 mb-2">
            Recipient Email
          </label>
          <input
            type="email"
            id="recipient"
            value={recipientEmail}
            onChange={(e) => setRecipientEmail(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="recipient@example.com"
            disabled={loading}
          />
        </div>

        <button
          type="submit"
          disabled={!isValid || loading}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin w-5 h-5 mr-2" />
              Creating Share...
            </>
          ) : (
            <>
              <Send className="w-5 h-5 mr-2" />
              Create Encrypted Share
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default ShareForm;