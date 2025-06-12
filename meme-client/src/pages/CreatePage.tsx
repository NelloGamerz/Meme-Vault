import React, { useState } from 'react';
import { Upload, Sparkles } from 'lucide-react';
import api from '../hooks/api';
import { FileUpload } from '../components/ui/FileUpload';
import { ImagePreview } from '../components/ui/ImagePreview';
import { Button } from '../components/ui/Button';

// Define types for our form data
interface FormData {
  file: File | null;
  prompt: string;
  caption: string;
}

export const CreatePage = () => {
  // State for active tab (meme or emoji)
  const [activeTab, setActiveTab] = useState<'meme' | 'emoji'>('meme');
  
  // State for creation method (AI or upload)
  const [memeCreationMethod, setMemeCreationMethod] = useState<'ai' | 'upload'>('ai');
  const [emojiCreationMethod, setEmojiCreationMethod] = useState<'ai' | 'upload'>('ai');
  
  // Form data for meme and emoji
  const [memeFormData, setMemeFormData] = useState<FormData>({
    file: null,
    prompt: '',
    caption: ''
  });
  
  const [emojiFormData, setEmojiFormData] = useState<FormData>({
    file: null,
    prompt: '',
    caption: ''
  });
  
  // Loading states
  const [isGeneratingMeme, setIsGeneratingMeme] = useState(false);
  const [isGeneratingEmoji, setIsGeneratingEmoji] = useState(false);
  
  // Preview states
  const [memePreview, setMemePreview] = useState<string | null>(null);
  const [emojiPreview, setEmojiPreview] = useState<string | null>(null);
  
  // These handlers have been replaced by the FileUpload component's onFileChange prop
  
  // Handle text input changes for memes
  const handleMemeInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setMemeFormData({
      ...memeFormData,
      [name]: value
    });
  };
  
  // Handle text input changes for emojis
  const handleEmojiInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEmojiFormData({
      ...emojiFormData,
      [name]: value
    });
  };
  
  // Generate meme with AI
  const generateMemeWithAI = async () => {
    setIsGeneratingMeme(true);
    try {
      // This is a placeholder for the actual API call
      // const response = await api.post('/memes/generate', {
      //   prompt: memeFormData.prompt
      // });
      // setMemePreview(response.data.imageUrl);
      
      // Simulate API response for now
      setTimeout(() => {
        setMemePreview('https://placehold.co/600x400/png?text=AI+Generated+Meme');
        setIsGeneratingMeme(false);
      }, 2000);
    } catch (error) {
      console.error('Error generating meme:', error);
      setIsGeneratingMeme(false);
    }
  };
  
  // Generate emoji with AI
  const generateEmojiWithAI = async () => {
    setIsGeneratingEmoji(true);
    try {
      // This is a placeholder for the actual API call
      // const response = await api.post('/emojis/generate', {
      //   prompt: emojiFormData.prompt
      // });
      // setEmojiPreview(response.data.imageUrl);
      
      // Simulate API response for now
      setTimeout(() => {
        setEmojiPreview('https://placehold.co/200x200/png?text=AI+Emoji');
        setIsGeneratingEmoji(false);
      }, 2000);
    } catch (error) {
      console.error('Error generating emoji:', error);
      setIsGeneratingEmoji(false);
    }
  };
  
  // Submit meme creation
  const submitMemeCreation = async () => {
    try {
      const formData = new FormData();
      
      if (memeCreationMethod === 'upload' && memeFormData.file) {
        formData.append('file', memeFormData.file);
      } else if (memeCreationMethod === 'ai') {
        formData.append('prompt', memeFormData.prompt);
        // If we have a generated image URL, we might need to handle it differently
        // This depends on your backend implementation
      }
      
      formData.append('caption', memeFormData.caption);
      
      // This is a placeholder for the actual API call
      // await api.post('/memes/create', formData, {
      //   headers: {
      //     'Content-Type': 'multipart/form-data'
      //   }
      // });
      
      // Reset form after successful submission
      alert('Meme created successfully!');
      setMemeFormData({
        file: null,
        prompt: '',
        caption: ''
      });
      setMemePreview(null);
    } catch (error) {
      console.error('Error creating meme:', error);
      alert('Failed to create meme. Please try again.');
    }
  };
  
  // Submit emoji creation
  const submitEmojiCreation = async () => {
    try {
      const formData = new FormData();
      
      if (emojiCreationMethod === 'upload' && emojiFormData.file) {
        formData.append('file', emojiFormData.file);
      } else if (emojiCreationMethod === 'ai') {
        formData.append('prompt', emojiFormData.prompt);
        // If we have a generated image URL, we might need to handle it differently
        // This depends on your backend implementation
      }
      
      formData.append('caption', emojiFormData.caption);
      
      // This is a placeholder for the actual API call
      // await api.post('/emojis/create', formData, {
      //   headers: {
      //     'Content-Type': 'multipart/form-data'
      //   }
      // });
      
      // Reset form after successful submission
      alert('Emoji created successfully!');
      setEmojiFormData({
        file: null,
        prompt: '',
        caption: ''
      });
      setEmojiPreview(null);
    } catch (error) {
      console.error('Error creating emoji:', error);
      alert('Failed to create emoji. Please try again.');
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto bg-gradient-to-b from-gray-50 to-white min-h-screen">
      <div className="mb-12 text-center">
        <h1 className="text-5xl font-bold mb-3 text-center bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 animate-slideInUp">
          Create Amazing Content
        </h1>
        <p className="text-gray-600 max-w-2xl mx-auto animate-fadeIn delay-300">
          Express yourself with custom memes and emojis. Upload your own images or let AI generate something unique!
        </p>
        
        <div className="flex justify-center mt-6 gap-4 animate-fadeIn delay-500">
          <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center animate-float">
            <span className="text-2xl">🎨</span>
          </div>
          <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center animate-float delay-300">
            <span className="text-2xl">✨</span>
          </div>
          <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center animate-float delay-700">
            <span className="text-2xl">🚀</span>
          </div>
        </div>
      </div>
      
      {/* Tab Navigation */}
      <div className="flex justify-center mb-10 animate-fadeIn delay-700">
        <div className="bg-white rounded-full shadow-md p-1 flex relative overflow-hidden">
          {/* Animated background glow */}
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-200/30 via-purple-200/30 to-pink-200/30 animate-shimmer"></div>
          
          <button
            className={`py-3 px-8 font-medium text-lg rounded-full transition-all duration-300 relative z-10 ${
              activeTab === 'meme'
                ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg transform scale-105'
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100 hover-lift'
            }`}
            onClick={() => setActiveTab('meme')}
          >
            <span className="flex items-center justify-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
              </svg>
              Create Meme
            </span>
          </button>
          <button
            className={`py-3 px-8 font-medium text-lg rounded-full transition-all duration-300 relative z-10 ${
              activeTab === 'emoji'
                ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg transform scale-105'
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100 hover-lift'
            }`}
            onClick={() => setActiveTab('emoji')}
          >
            <span className="flex items-center justify-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              Create Emoji
            </span>
          </button>
        </div>
      </div>
      
      {/* Meme Creation Section */}
      {activeTab === 'meme' && (
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 animate-fadeIn">
          <div className="relative mb-8">
            <h2 className="text-3xl font-bold text-center text-gray-800 animate-slideInUp">Create a Meme</h2>
          </div>
          
          {/* Creation Method Selection */}
          <div className="flex mb-8 gap-6 justify-center">
            <Button
              className={`flex-1 max-w-xs py-4 animate-slideInLeft delay-200 hover-glow ${
                memeCreationMethod === 'ai' ? 'transform scale-105' : ''
              }`}
              variant={memeCreationMethod === 'ai' ? 'primary' : 'ghost'}
              onClick={() => setMemeCreationMethod('ai')}
              icon={Sparkles}
              size="lg"
            >
              Generate with AI
            </Button>
            <Button
              className={`flex-1 max-w-xs py-4 animate-slideInRight delay-200 hover-glow ${
                memeCreationMethod === 'upload' ? 'transform scale-105' : ''
              }`}
              variant={memeCreationMethod === 'upload' ? 'primary' : 'ghost'}
              onClick={() => setMemeCreationMethod('upload')}
              icon={Upload}
              size="lg"
            >
              Upload Image
            </Button>
          </div>
          
          <div className="w-full h-px bg-gradient-to-r from-transparent via-indigo-100 to-transparent animate-fadeIn delay-500"></div>
          
          <div className="border-t border-gray-100 pt-8"></div>
          
          {/* AI Generation Form */}
          {memeCreationMethod === 'ai' && (
            <div className="space-y-6 max-w-2xl mx-auto animate-fadeIn delay-300">
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-6 rounded-xl shadow-sm hover-lift transition-all duration-500">
                <label htmlFor="meme-prompt" className="block text-base font-semibold text-gray-800 mb-3 animate-slideInLeft delay-400">
                  Describe your meme idea
                </label>
                <div className="relative animate-slideInUp delay-500">
                  <textarea
                    id="meme-prompt"
                    name="prompt"
                    rows={4}
                    className="w-full px-4 py-3 border border-indigo-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-700 transition-all duration-300"
                    placeholder="E.g., A cat wearing sunglasses and riding a skateboard through space with planets in the background"
                    value={memeFormData.prompt}
                    onChange={handleMemeInputChange}
                  />
                  <div className="absolute right-3 bottom-3 text-xs text-gray-400">
                    {memeFormData.prompt.length} / 500
                  </div>
                </div>
                <p className="mt-2 text-sm text-gray-500 animate-fadeIn delay-600">
                  Be descriptive! The more details you provide, the better your meme will be.
                </p>
                <div className="mt-4 bg-white rounded-lg p-3 border border-indigo-100 animate-fadeIn delay-700">
                  <p className="text-xs font-medium text-indigo-700">Pro Tips:</p>
                  <ul className="text-xs text-gray-600 mt-1 list-disc pl-4 space-y-1">
                    <li className="animate-fadeIn delay-800">Include details about characters, expressions, and setting</li>
                    <li className="animate-fadeIn delay-1000">Specify art style (cartoon, realistic, pixel art, etc.)</li>
                    <li className="animate-fadeIn delay-1000">Mention colors and lighting for better results</li>
                  </ul>
                </div>
              </div>
              
              <div className="flex justify-center animate-fadeIn delay-1000">
                <Button
                  className="px-8 py-3 shadow-lg hover:shadow-xl transition-all duration-300 animate-pulse"
                  onClick={generateMemeWithAI}
                  disabled={isGeneratingMeme || !memeFormData.prompt}
                  isLoading={isGeneratingMeme}
                  icon={Sparkles}
                  size="lg"
                >
                  Generate Meme
                </Button>
              </div>
              
              {/* Decorative elements */}
              <div className="absolute -right-10 top-1/3 w-20 h-20 bg-indigo-50 rounded-full opacity-50 animate-float" style={{ zIndex: -1 }}></div>
              <div className="absolute -left-10 bottom-1/3 w-16 h-16 bg-purple-50 rounded-full opacity-50 animate-float delay-500" style={{ zIndex: -1 }}></div>
              
              {!memePreview && !isGeneratingMeme && memeFormData.prompt && (
                <div className="text-center mt-4 text-sm text-gray-500">
                  Click generate to create your meme with AI
                </div>
              )}
              
              {isGeneratingMeme && (
                <div className="text-center mt-4 text-sm text-indigo-600 animate-pulse">
                  Creating your masterpiece...
                </div>
              )}
            </div>
          )}
          
          {/* Upload Form */}
          {memeCreationMethod === 'upload' && (
            <div className="space-y-6 max-w-2xl mx-auto animate-fadeIn delay-300">
              <div className="text-center mb-4 animate-slideInUp delay-400">
                <h3 className="text-lg font-semibold text-gray-700">Upload Your Meme Image</h3>
                <p className="text-gray-500 text-sm mt-1">Choose a high-quality image to create your meme</p>
              </div>
              
              <div className="animate-fadeIn delay-500">
                <FileUpload 
                  onFileChange={(file) => {
                    setMemeFormData({
                      ...memeFormData,
                      file
                    });
                    
                    // Create a preview
                    const reader = new FileReader();
                    reader.onload = () => {
                      setMemePreview(reader.result as string);
                    };
                    reader.readAsDataURL(file);
                  }}
                  maxSize={10}
                  label="Drag & drop your image here or click to browse"
                  sublabel="PNG, JPG, GIF up to 10MB"
                  theme="creative"
                />
              </div>
              
              {!memePreview && (
                <div className="flex justify-center gap-4 flex-wrap mt-6 animate-fadeIn delay-700">
                  <div className="text-center p-3 border border-gray-200 rounded-lg bg-gray-50 w-24 hover-scale transition-all duration-300">
                    <span className="block text-xs text-gray-500">Memes</span>
                  </div>
                  <div className="text-center p-3 border border-gray-200 rounded-lg bg-gray-50 w-24 hover-scale transition-all duration-300 delay-100">
                    <span className="block text-xs text-gray-500">Photos</span>
                  </div>
                  <div className="text-center p-3 border border-gray-200 rounded-lg bg-gray-50 w-24 hover-scale transition-all duration-300 delay-200">
                    <span className="block text-xs text-gray-500">Art</span>
                  </div>
                  <div className="text-center p-3 border border-gray-200 rounded-lg bg-gray-50 w-24 hover-scale transition-all duration-300 delay-300">
                    <span className="block text-xs text-gray-500">Screenshots</span>
                  </div>
                </div>
              )}
              
              {/* Decorative elements */}
              <div className="absolute right-20 bottom-1/4 w-12 h-12 bg-indigo-50 rounded-full opacity-30 animate-float" style={{ zIndex: -1 }}></div>
              <div className="absolute left-20 bottom-1/3 w-8 h-8 bg-purple-50 rounded-full opacity-30 animate-float delay-500" style={{ zIndex: -1 }}></div>
            </div>
          )}
          
          {/* Preview and Caption */}
          {memePreview && (
            <div className="mt-10 space-y-6 max-w-2xl mx-auto animate-fadeIn">
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-4 rounded-xl shadow-md animate-slideInUp">
                <h3 className="text-xl font-bold text-gray-800 mb-4 text-center animate-fadeIn delay-200">Your Meme Preview</h3>
                <div className="bg-white p-2 rounded-lg shadow-md animate-fadeIn delay-300">
                  <ImagePreview 
                    src={memePreview} 
                    alt="Meme preview"
                    showZoom={true}
                  />
                </div>
                
                {/* Decorative elements */}
                <div className="flex justify-between mt-4">
                  <div className="w-8 h-8 bg-indigo-100 rounded-full animate-float"></div>
                  <div className="w-6 h-6 bg-purple-100 rounded-full animate-float delay-300"></div>
                  <div className="w-4 h-4 bg-pink-100 rounded-full animate-float delay-500"></div>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 animate-slideInUp delay-400 hover-lift transition-all duration-500">
                <label htmlFor="meme-caption" className="block text-base font-semibold text-gray-800 mb-3 animate-fadeIn delay-500">
                  Add a caption to your meme
                </label>
                <input
                  type="text"
                  id="meme-caption"
                  name="caption"
                  className="w-full px-4 py-3 border border-indigo-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-700 animate-fadeIn delay-600"
                  placeholder="Something funny or descriptive..."
                  value={memeFormData.caption}
                  onChange={handleMemeInputChange}
                />
                <p className="mt-2 text-sm text-gray-500 animate-fadeIn delay-700">
                  A good caption can make your meme even more engaging!
                </p>
              </div>
              
              <div className="flex flex-col items-center mt-8 space-y-4 animate-fadeIn delay-700">
                <Button
                  className="px-12 py-4 shadow-lg hover:shadow-xl transition-all duration-300 text-lg animate-pulse"
                  onClick={submitMemeCreation}
                  variant="primary"
                  size="lg"
                >
                  Create & Share Meme
                </Button>
                <p className="text-sm text-gray-500 text-center max-w-md animate-fadeIn delay-1000">
                  By creating, you agree to our content guidelines. Your meme will be shared with the community!
                </p>
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Emoji Creation Section */}
      {activeTab === 'emoji' && (
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 animate-fadeIn">
          <div className="relative mb-8">
            <h2 className="text-3xl font-bold text-center text-gray-800 animate-slideInUp">Create an Emoji</h2>
          </div>
          
          {/* Creation Method Selection */}
          <div className="flex mb-8 gap-6 justify-center">
            <Button
              className={`flex-1 max-w-xs py-4 animate-slideInLeft delay-200 hover-glow ${
                emojiCreationMethod === 'ai' ? 'transform scale-105' : ''
              }`}
              variant={emojiCreationMethod === 'ai' ? 'primary' : 'ghost'}
              onClick={() => setEmojiCreationMethod('ai')}
              icon={Sparkles}
              size="lg"
            >
              Generate with AI
            </Button>
            <Button
              className={`flex-1 max-w-xs py-4 animate-slideInRight delay-200 hover-glow ${
                emojiCreationMethod === 'upload' ? 'transform scale-105' : ''
              }`}
              variant={emojiCreationMethod === 'upload' ? 'primary' : 'ghost'}
              onClick={() => setEmojiCreationMethod('upload')}
              icon={Upload}
              size="lg"
            >
              Upload Image
            </Button>
          </div>
          
          <div className="w-full h-px bg-gradient-to-r from-transparent via-indigo-100 to-transparent animate-fadeIn delay-500"></div>
          
          <div className="border-t border-gray-100 pt-8"></div>
          
          {/* AI Generation Form */}
          {emojiCreationMethod === 'ai' && (
            <div className="space-y-6 max-w-2xl mx-auto animate-fadeIn delay-300">
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-6 rounded-xl shadow-sm hover-lift transition-all duration-500">
                <label htmlFor="emoji-prompt" className="block text-base font-semibold text-gray-800 mb-3 animate-slideInLeft delay-400">
                  Describe your emoji idea
                </label>
                <div className="relative animate-slideInUp delay-500">
                  <textarea
                    id="emoji-prompt"
                    name="prompt"
                    rows={4}
                    className="w-full px-4 py-3 border border-indigo-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-700 transition-all duration-300"
                    placeholder="E.g., A smiling sun with sunglasses and a tropical drink"
                    value={emojiFormData.prompt}
                    onChange={handleEmojiInputChange}
                  />
                  <div className="absolute right-3 bottom-3 text-xs text-gray-400">
                    {emojiFormData.prompt.length} / 300
                  </div>
                </div>
                <p className="mt-2 text-sm text-gray-500 animate-fadeIn delay-600">
                  Describe colors, expressions, and details for the best results.
                </p>
                <div className="mt-4 bg-white rounded-lg p-3 border border-indigo-100 animate-fadeIn delay-700">
                  <p className="text-xs font-medium text-indigo-700">Emoji Tips:</p>
                  <ul className="text-xs text-gray-600 mt-1 list-disc pl-4 space-y-1">
                    <li className="animate-fadeIn delay-800">Keep it simple and focused on a single expression or concept</li>
                    <li className="animate-fadeIn delay-1000">Bright colors and clear designs work best for emojis</li>
                    <li className="animate-fadeIn delay-1000">Consider how it will look when scaled down to smaller sizes</li>
                  </ul>
                </div>
              </div>
              
              <div className="flex justify-center animate-fadeIn delay-1000">
                <Button
                  className="px-8 py-3 shadow-lg hover:shadow-xl transition-all duration-300 animate-pulse"
                  onClick={generateEmojiWithAI}
                  disabled={isGeneratingEmoji || !emojiFormData.prompt}
                  isLoading={isGeneratingEmoji}
                  icon={Sparkles}
                  size="lg"
                >
                  Generate Emoji
                </Button>
              </div>
              
              {/* Decorative elements */}
              <div className="absolute -right-10 top-2/3 w-20 h-20 bg-indigo-50 rounded-full opacity-50 animate-float" style={{ zIndex: -1 }}></div>
              <div className="absolute -left-10 top-1/3 w-16 h-16 bg-purple-50 rounded-full opacity-50 animate-float delay-500" style={{ zIndex: -1 }}></div>
              
              {!emojiPreview && !isGeneratingEmoji && emojiFormData.prompt && (
                <div className="text-center mt-4 text-sm text-gray-500">
                  Click generate to create your emoji with AI
                </div>
              )}
              
              {isGeneratingEmoji && (
                <div className="text-center mt-4 text-sm text-indigo-600 animate-pulse">
                  Creating your emoji magic...
                </div>
              )}
            </div>
          )}
          
          {/* Upload Form */}
          {emojiCreationMethod === 'upload' && (
            <div className="space-y-6 max-w-2xl mx-auto animate-fadeIn delay-300">
              <div className="text-center mb-4 animate-slideInUp delay-400">
                <h3 className="text-lg font-semibold text-gray-700">Upload Your Emoji Image</h3>
                <p className="text-gray-500 text-sm mt-1">Choose a square image for best results</p>
              </div>
              
              <div className="animate-fadeIn delay-500">
                <FileUpload 
                  onFileChange={(file) => {
                    setEmojiFormData({
                      ...emojiFormData,
                      file
                    });
                    
                    // Create a preview
                    const reader = new FileReader();
                    reader.onload = () => {
                      setEmojiPreview(reader.result as string);
                    };
                    reader.readAsDataURL(file);
                  }}
                  maxSize={5}
                  label="Drag & drop your emoji image here or click to browse"
                  sublabel="PNG, JPG, GIF up to 5MB (square images work best)"
                  theme="creative"
                />
              </div>
              
              {!emojiPreview && (
                <div className="flex justify-center gap-4 flex-wrap mt-6 animate-fadeIn delay-700">
                  <div className="text-center p-3 border border-gray-200 rounded-lg bg-gray-50 w-24 h-24 flex items-center justify-center hover-scale transition-all duration-300 animate-float">
                    <span className="block text-2xl">😊</span>
                  </div>
                  <div className="text-center p-3 border border-gray-200 rounded-lg bg-gray-50 w-24 h-24 flex items-center justify-center hover-scale transition-all duration-300 animate-float delay-200">
                    <span className="block text-2xl">🚀</span>
                  </div>
                  <div className="text-center p-3 border border-gray-200 rounded-lg bg-gray-50 w-24 h-24 flex items-center justify-center hover-scale transition-all duration-300 animate-float delay-400">
                    <span className="block text-2xl">🎮</span>
                  </div>
                  <div className="text-center p-3 border border-gray-200 rounded-lg bg-gray-50 w-24 h-24 flex items-center justify-center hover-scale transition-all duration-300 animate-float delay-600">
                    <span className="block text-2xl">🎨</span>
                  </div>
                </div>
              )}
              
              {/* Decorative elements */}
              <div className="absolute right-20 bottom-1/4 w-12 h-12 bg-indigo-50 rounded-full opacity-30 animate-float" style={{ zIndex: -1 }}></div>
              <div className="absolute left-20 bottom-1/3 w-8 h-8 bg-purple-50 rounded-full opacity-30 animate-float delay-500" style={{ zIndex: -1 }}></div>
            </div>
          )}
          
          {/* Preview and Caption */}
          {emojiPreview && (
            <div className="mt-10 space-y-6 max-w-2xl mx-auto animate-fadeIn">
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-6 rounded-xl shadow-md animate-slideInUp">
                <h3 className="text-xl font-bold text-gray-800 mb-4 text-center animate-fadeIn delay-200">Your Emoji Preview</h3>
                <div className="flex justify-center animate-fadeIn delay-300">
                  <div className="bg-white p-4 rounded-full shadow-md border-4 border-white animate-pulse duration-1000">
                    <ImagePreview 
                      src={emojiPreview} 
                      alt="Emoji preview" 
                      aspectRatio="square"
                      className="w-48 h-48"
                      showZoom={true}
                    />
                  </div>
                </div>
                
                {/* Decorative elements */}
                <div className="flex justify-around mt-6">
                  <div className="w-6 h-6 bg-indigo-100 rounded-full animate-float"></div>
                  <div className="w-8 h-8 bg-purple-100 rounded-full animate-float delay-300"></div>
                  <div className="w-6 h-6 bg-pink-100 rounded-full animate-float delay-500"></div>
                  <div className="w-4 h-4 bg-indigo-100 rounded-full animate-float delay-700"></div>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 animate-slideInUp delay-400 hover-lift transition-all duration-500">
                <label htmlFor="emoji-caption" className="block text-base font-semibold text-gray-800 mb-3 animate-fadeIn delay-500">
                  Name your emoji
                </label>
                <input
                  type="text"
                  id="emoji-caption"
                  name="caption"
                  className="w-full px-4 py-3 border border-indigo-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-700 animate-fadeIn delay-600"
                  placeholder="E.g., CoolSun, HappyDance, GamingFace..."
                  value={emojiFormData.caption}
                  onChange={handleEmojiInputChange}
                />
                <p className="mt-2 text-sm text-gray-500 animate-fadeIn delay-700">
                  Give your emoji a catchy, memorable name that describes it well!
                </p>
              </div>
              
              <div className="flex flex-col items-center mt-8 space-y-4 animate-fadeIn delay-700">
                <Button
                  className="px-12 py-4 shadow-lg hover:shadow-xl transition-all duration-300 text-lg animate-pulse"
                  onClick={submitEmojiCreation}
                  variant="primary"
                  size="lg"
                >
                  Create & Share Emoji
                </Button>
                <p className="text-sm text-gray-500 text-center max-w-md animate-fadeIn delay-1000">
                  Your emoji will be available for everyone to use in comments and reactions!
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};