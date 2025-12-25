import React, { useState, useMemo, useCallback } from 'react';
import { analyzeIeltsWriting } from './services/geminiService';
import { UploadIcon, SpinnerIcon, CloseIcon } from './components/icons';

type TaskType = 'Task 1' | 'Task 2';
type EssayInputMode = 'text' | 'image';

const App: React.FC = () => {
  const [taskType, setTaskType] = useState<TaskType>('Task 2');
  const [topic, setTopic] = useState<string>('');
  
  // Question Image State (Task 1)
  const [questionImageFile, setQuestionImageFile] = useState<File | null>(null);
  const [questionImagePreview, setQuestionImagePreview] = useState<string | null>(null);

  // Essay State
  const [essayInputMode, setEssayInputMode] = useState<EssayInputMode>('text');
  const [userWriting, setUserWriting] = useState<string>('');
  const [essayImageFile, setEssayImageFile] = useState<File | null>(null);
  const [essayImagePreview, setEssayImagePreview] = useState<string | null>(null);

  const [result, setResult] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const wordCount = useMemo(() => {
    return userWriting.trim().split(/\s+/).filter(Boolean).length;
  }, [userWriting]);

  // Handle Question Image (Task 1)
  const handleQuestionImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 4 * 1024 * 1024) {
        setError("Image size should not exceed 4MB.");
        return;
      }
      setQuestionImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setQuestionImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setError(null);
    }
  };
  
  const removeQuestionImage = () => {
      setQuestionImageFile(null);
      setQuestionImagePreview(null);
  }

  // Handle Essay Image
  const handleEssayImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 4 * 1024 * 1024) {
        setError("Image size should not exceed 4MB.");
        return;
      }
      setEssayImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setEssayImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setError(null);
    }
  };

  const removeEssayImage = () => {
      setEssayImageFile(null);
      setEssayImagePreview(null);
  };

  const handleSubmit = async () => {
    if (!topic) {
      setError('Please provide a topic for your writing task.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult('');

    // Prepare data
    // We send text if mode is text, or null if mode is image (or empty).
    // We send essay image if mode is image.
    const finalUserWriting = essayInputMode === 'text' ? userWriting : '';
    const finalEssayImage = essayInputMode === 'image' ? essayImageFile : null;

    try {
      const response = await analyzeIeltsWriting(
        taskType, 
        topic, 
        finalUserWriting, 
        questionImageFile, 
        finalEssayImage
      );
      setResult(response);
    } catch (err) {
      if (err instanceof Error) {
        setError(`An error occurred: ${err.message}`);
      } else {
        setError('An unknown error occurred during analysis.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const isSubmitDisabled = isLoading || !topic;

  const getWordCountColor = useCallback(() => {
    const target = taskType === 'Task 1' ? 150 : 250;
    if (wordCount === 0) return 'text-gray-400';
    if (wordCount < target) return 'text-orange-500';
    return 'text-green-600';
  }, [wordCount, taskType]);
  
  return (
    <div className="min-h-screen bg-[#f4f6fc] text-gray-800 font-sans p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
            IELTS Writing Co-pilot
          </h1>
          <p className="mt-2 text-lg text-gray-600">
            Get expert AI-powered feedback and model answers for your IELTS writing tasks.
          </p>
        </header>
        
        <main className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Panel */}
          <div className="bg-white p-6 rounded-2xl shadow-xl shadow-blue-900/5 flex flex-col gap-6 h-fit border border-gray-100">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Task Type</label>
              <div className="flex gap-2 bg-blue-50 p-1 rounded-lg">
                <button 
                  onClick={() => setTaskType('Task 1')}
                  className={`w-full py-2 rounded-md text-sm font-semibold transition-colors duration-200 ${taskType === 'Task 1' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 hover:bg-blue-100'}`}>
                  Writing Task 1
                </button>
                <button 
                  onClick={() => setTaskType('Task 2')}
                  className={`w-full py-2 rounded-md text-sm font-semibold transition-colors duration-200 ${taskType === 'Task 2' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 hover:bg-blue-100'}`}>
                  Writing Task 2
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="topic" className="block text-sm font-medium text-gray-700 mb-2">
                Topic / Question
              </label>
              <input
                type="text"
                id="topic"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder={taskType === 'Task 1' ? "e.g., The chart shows..." : "e.g., Some people believe that..."}
                className="w-full bg-white border border-gray-200 rounded-lg p-3 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              />
            </div>
            
            {taskType === 'Task 1' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Task 1 Chart/Graph (Optional)</label>
                {questionImagePreview ? (
                  <div className="relative group">
                    <img src={questionImagePreview} alt="Question Preview" className="w-full h-auto max-h-60 object-contain rounded-lg bg-gray-50 border border-gray-200"/>
                    <button onClick={removeQuestionImage} className="absolute top-2 right-2 bg-black bg-opacity-60 rounded-full p-1.5 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                      <CloseIcon className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="relative border-2 border-dashed border-blue-200 bg-blue-50/30 rounded-lg p-6 flex flex-col items-center justify-center text-center hover:border-blue-500 hover:bg-blue-50 transition-all">
                    <UploadIcon className="w-8 h-8 text-blue-400 mb-2" />
                    <p className="text-sm text-gray-500">
                      <span className="font-semibold text-blue-600">Upload Chart/Graph</span>
                    </p>
                    <p className="text-xs text-gray-400 mt-1">PNG, JPG (max 4MB)</p>
                    <input type="file" onChange={handleQuestionImageChange} accept="image/png, image/jpeg, image/webp" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                  </div>
                )}
              </div>
            )}
            
            <div className="flex-grow flex flex-col">
              <div className="flex justify-between items-end mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Your Essay
                </label>
                <div className="flex bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setEssayInputMode('text')}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${essayInputMode === 'text' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    Text
                  </button>
                  <button
                    onClick={() => setEssayInputMode('image')}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${essayInputMode === 'image' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    Image
                  </button>
                </div>
              </div>

              {essayInputMode === 'text' ? (
                <>
                  <div className="flex justify-end mb-1">
                      <span className={`text-xs font-mono ${getWordCountColor()}`}>{wordCount} words</span>
                  </div>
                  <textarea
                    id="user-writing"
                    value={userWriting}
                    onChange={(e) => setUserWriting(e.target.value)}
                    placeholder="Paste your essay here..."
                    className="w-full flex-grow bg-white border border-gray-200 rounded-lg p-3 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition min-h-[200px]"
                    rows={12}
                  ></textarea>
                </>
              ) : (
                <div className="flex-grow flex flex-col min-h-[200px]">
                   {essayImagePreview ? (
                    <div className="relative group flex-grow">
                      <img src={essayImagePreview} alt="Essay Preview" className="w-full h-full max-h-[300px] object-contain rounded-lg bg-gray-50 border border-gray-200"/>
                      <button onClick={removeEssayImage} className="absolute top-2 right-2 bg-black bg-opacity-60 rounded-full p-1.5 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                        <CloseIcon className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex-grow relative border-2 border-dashed border-blue-200 bg-blue-50/30 rounded-lg p-8 flex flex-col items-center justify-center text-center hover:border-blue-500 hover:bg-blue-50 transition-all">
                      <UploadIcon className="w-10 h-10 text-blue-400 mb-2" />
                      <p className="text-sm text-gray-500">
                        <span className="font-semibold text-blue-600">Upload Essay Photo</span>
                      </p>
                      <p className="text-xs text-gray-400 mt-1">Take a clear photo of your handwritten essay</p>
                      <input type="file" onChange={handleEssayImageChange} accept="image/png, image/jpeg, image/webp" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <button
              onClick={handleSubmit}
              disabled={isSubmitDisabled}
              className="w-full flex items-center justify-center bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed transition-all duration-200 shadow-md shadow-blue-600/20 disabled:shadow-none"
            >
              {isLoading && <SpinnerIcon className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />}
              {isLoading ? 'Analyzing...' : 'Analyze My Writing'}
            </button>
            {error && <p className="text-red-600 text-sm mt-2 text-center">{error}</p>}
          </div>

          {/* Output Panel */}
          <div className="bg-white p-6 rounded-2xl shadow-xl shadow-blue-900/5 relative overflow-hidden min-h-[500px] lg:min-h-0 border border-gray-100">
            <div className="absolute inset-0 overflow-y-auto p-6 custom-scrollbar">
              {isLoading && (
                 <div className="flex flex-col items-center justify-center h-full text-center">
                   <SpinnerIcon className="w-12 h-12 text-blue-600 animate-spin mb-4" />
                   <h3 className="text-lg font-semibold text-gray-900">AI Examiner is thinking...</h3>
                   <p className="text-gray-500 mt-1">This may take a moment for complex analysis.</p>
                 </div>
              )}
              {!isLoading && !result && !error && (
                 <div className="flex flex-col items-center justify-center h-full text-center">
                    <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                        <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                    </div>
                   <h3 className="text-lg font-semibold text-gray-900">Your Analysis Will Appear Here</h3>
                   <p className="text-gray-500 mt-1 max-w-sm">Complete the form and click "Analyze" to receive your detailed IELTS writing feedback.</p>
                 </div>
              )}
              {result && (
                <div className="font-sans">
                  {result.split('---').map((section, index) => (
                    <div key={index}>
                      {section.split('\n').map((line, lineIndex) => {
                        if (line.startsWith('### ')) return <h3 key={lineIndex} className="text-2xl font-bold text-blue-900 border-b border-gray-200 pb-2 mb-4">{line.substring(4)}</h3>
                        if (line.startsWith('#### ')) return <h4 key={lineIndex} className="text-lg font-semibold text-blue-800 mt-6 mb-3">{line.substring(5)}</h4>
                        if (line.startsWith('**')) return <p key={lineIndex} className="mb-2"><strong className="text-gray-900">{line.replace(/\*\*/g, '')}</strong></p>
                        if (line.startsWith('- ')) return <li key={lineIndex} className="ml-4 list-disc list-outside text-gray-700 mb-1">{line.substring(2)}</li>
                        if (line.trim() === '') return <br key={lineIndex} />
                        return <p key={lineIndex} className="text-gray-700 leading-relaxed mb-3">{line}</p>
                      })}
                      {index < result.split('---').length - 1 && <hr className="my-8 border-gray-200" />}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;