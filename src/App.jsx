import { useState, useEffect, useRef } from 'react';

function App() {
  const todayObj = new Date();
  const y = todayObj.getFullYear();
  const m = String(todayObj.getMonth() + 1).padStart(2, '0');
  const d = String(todayObj.getDate()).padStart(2, '0');
  const todayKey = `${y}-${m}-${d}`; 

  // --- STATE'LER VE GÜNLÜK OTOMATİK SIFIRLAMA MANTIĞI ---
  const [todos, setTodos] = useState(() => {
    const savedTodos = localStorage.getItem('todos');
    const lastActiveDate = localStorage.getItem('last_active_date');
    if (savedTodos) {
      const parsedTodos = JSON.parse(savedTodos);
      if (lastActiveDate !== todayKey) {
        return parsedTodos.map(todo => ({ ...todo, completed: false }));
      }
      return parsedTodos;
    }
    return [];
  });

  const [history, setHistory] = useState(() => JSON.parse(localStorage.getItem('history')) || {});
  const [isDarkMode, setIsDarkMode] = useState(() => JSON.parse(localStorage.getItem('darkMode')) || false);
  const [currentView, setCurrentView] = useState('home'); 
  const [inputValue, setInputValue] = useState('');
  
  // YENİ: Günün Odak Noktası ve En İyi Rekor (Best Record)
  const [dailyIntention, setDailyIntention] = useState(() => localStorage.getItem(`intention-${todayKey}`) || '');
  const [bestRecord, setBestRecord] = useState(() => JSON.parse(localStorage.getItem('bestRecord')) || 0);

  const [dragId, setDragId] = useState(null);
  const dragItem = useRef(null);
  const dragOverItem = useRef(null);

  // --- HAFIZAYA KAYITLAR ---
  useEffect(() => { 
    localStorage.setItem('todos', JSON.stringify(todos)); 
    localStorage.setItem('last_active_date', todayKey); 
  }, [todos, todayKey]);

  useEffect(() => { localStorage.setItem('history', JSON.stringify(history)); }, [history]);
  useEffect(() => { localStorage.setItem('darkMode', JSON.stringify(isDarkMode)); }, [isDarkMode]);
  useEffect(() => { localStorage.setItem(`intention-${todayKey}`, dailyIntention); }, [dailyIntention, todayKey]);
  useEffect(() => { localStorage.setItem('bestRecord', JSON.stringify(bestRecord)); }, [bestRecord]);

  const completedCount = todos.filter((t) => t.completed).length;
  const progressPercentage = todos.length > 0 ? Math.round((completedCount / todos.length) * 100) : 0;

  useEffect(() => {
    if (todos.length > 0) {
      setHistory(prev => ({ ...prev, [todayKey]: progressPercentage }));
    } else {
      setHistory(prev => { const newHist = { ...prev }; delete newHist[todayKey]; return newHist; });
    }
  }, [progressPercentage, todos.length, todayKey]);

  // Aktif Zincir Hesaplama (Eski adıyla Streak)
  const getStreak = () => {
    let count = 0;
    let curr = new Date(todayObj);
    const getVal = (key) => history[key] === true ? 100 : history[key];
    if (getVal(todayKey) !== 100) curr.setDate(curr.getDate() - 1); 
    while(true) {
      const cy = curr.getFullYear();
      const cm = String(curr.getMonth() + 1).padStart(2, '0');
      const cd = String(curr.getDate()).padStart(2, '0');
      const k = `${cy}-${cm}-${cd}`;
      if (getVal(k) === 100) { count++; curr.setDate(curr.getDate() - 1); } 
      else break;
    }
    return count;
  };
  const streakCount = getStreak();

  // YENİ: Rekor Kırma Mantığı
  useEffect(() => {
    if (streakCount > bestRecord) {
      setBestRecord(streakCount);
    }
  }, [streakCount, bestRecord]);

  // Takvim kutucukları için arkaplan renkleri
  const getProgressBgColor = (percent) => {
    if (percent === 0 || percent === undefined) return isDarkMode ? 'bg-[#2C2C2E]' : 'bg-gray-100';
    if (percent < 35) return 'bg-rose-500 text-white'; 
    if (percent < 70) return 'bg-amber-500 text-white'; 
    if (percent < 100) return 'bg-lime-500 text-white'; 
    return 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/40'; 
  };

  // YENİ: Dairesel bar için SVG Stroke renkleri
  const getProgressTextColor = (percent) => {
    if (percent === 0 || percent === undefined) return isDarkMode ? 'text-[#2C2C2E]' : 'text-gray-200';
    if (percent < 35) return 'text-rose-500'; 
    if (percent < 70) return 'text-amber-500'; 
    if (percent < 100) return 'text-lime-500'; 
    return 'text-emerald-500'; 
  };

  const handleAddTodo = () => {
    if (inputValue.trim() === '') return;
    const newTodo = { id: Date.now(), text: inputValue, completed: false };
    setTodos([...todos, newTodo]);
    setInputValue('');
  };

  const toggleTodo = (id) => {
    setTodos(todos.map((todo) => todo.id === id ? { ...todo, completed: !todo.completed } : todo));
  };

  const deleteTodo = (id, e) => { 
    e.stopPropagation(); 
    setTodos(todos.filter((todo) => todo.id !== id)); 
  };

  const dragStart = (e, position) => { dragItem.current = position; };
  const dragEnter = (e, position) => { dragOverItem.current = position; };
  const drop = () => {
    if (dragItem.current === null || dragOverItem.current === null || dragItem.current === dragOverItem.current) {
      setDragId(null);
      return;
    }
    const copyListItems = [...todos];
    const dragItemContent = copyListItems[dragItem.current];
    copyListItems.splice(dragItem.current, 1);
    copyListItems.splice(dragOverItem.current, 0, dragItemContent);
    dragItem.current = null;
    dragOverItem.current = null;
    setTodos(copyListItems);
    setDragId(null);
  };

  const getCompactCalendar = () => {
    const data = [];
    for (let i = 0; i < 12; i++) {
      const d = new Date(y, i, 1);
      const monthName = new Intl.DateTimeFormat('en-US', { month: 'short' }).format(d);
      const daysInMonth = new Date(y, i + 1, 0).getDate();
      let startDay = d.getDay();
      startDay = startDay === 0 ? 7 : startDay; 
      
      const days = [];
      for (let day = 1; day <= daysInMonth; day++) {
        const currentDay = new Date(y, i, day);
        const dayStr = `${y}-${String(i + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        days.push({ dayNum: day, dateStr: dayStr, isFuture: currentDay > todayObj && dayStr !== todayKey });
      }
      data.push({ monthName, startDay, days });
    }
    return data;
  };
  const monthsData = getCompactCalendar();

  // YENİ: Dairesel Bar Hesaplamaları
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercentage / 100) * circumference;
  const isCompleted = progressPercentage === 100;

  const bgApp = isDarkMode ? 'bg-black text-white' : 'bg-[#F2F2F7] text-gray-900';
  const bgCard = isDarkMode ? 'bg-[#1C1C1E] border border-[#2C2C2E]' : 'bg-white border border-gray-100';
  const textMuted = isDarkMode ? 'text-gray-400' : 'text-gray-500';
  const inputBg = isDarkMode ? 'bg-[#2C2C2E] text-white placeholder-gray-500' : 'bg-[#F2F2F7] text-gray-900 placeholder-gray-400';
  const darkPurpleBtn = isDarkMode ? 'bg-[#7D53F9] hover:bg-[#8F68FA]' : 'bg-[#5E5CE6] hover:bg-[#4C49C3]'; 
  const checkColor = isDarkMode ? 'bg-[#7D53F9] border-[#7D53F9]' : 'bg-[#5E5CE6] border-[#5E5CE6]';

  return (
    <div className={`min-h-screen ${bgApp} p-4 sm:p-8 font-sans transition-colors duration-500 flex items-center justify-center`}>
      <div className="w-full max-w-md space-y-6">

        {/* YENİ: BAŞLIK (Daha Büyük Tarih ve Günün Odağı) */}
        <div className="flex justify-between items-start px-2 mb-2">
          <div className="flex-1 pr-4">
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
              {d} {new Intl.DateTimeFormat('en-US', { month: 'short' }).format(todayObj)}
            </h1>
            <p className={`text-lg font-semibold mt-1 mb-3 ${textMuted}`}>
              {new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(todayObj)}
            </p>
            <input
              type="text"
              placeholder="Daily intention: e.g. Stay focused and calm..."
              value={dailyIntention}
              onChange={(e) => setDailyIntention(e.target.value)}
              className={`w-full text-sm sm:text-base font-medium outline-none bg-transparent transition-all border-b border-transparent focus:border-gray-300 dark:focus:border-gray-700 pb-1 ${isDarkMode ? 'text-gray-300 placeholder-gray-600' : 'text-gray-600 placeholder-gray-400'}`}
            />
          </div>
          <button onClick={() => setIsDarkMode(!isDarkMode)} className={`mt-2 p-3 shrink-0 rounded-full transition-all active:scale-90 ${isDarkMode ? 'bg-[#1C1C1E] text-yellow-400' : 'bg-white text-[#5E5CE6] shadow-sm'}`}>
            {isDarkMode ? (
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"/></svg>
            ) : (
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"/></svg>
            )}
          </button>
        </div>

        {currentView === 'home' ? (
          <>
            {/* YENİ: Dairesel Apple Fitness Tarzı Zincir Kartı */}
            <div onClick={() => setCurrentView('calendar')} className={`cursor-pointer rounded-[2.5rem] p-6 shadow-sm ${bgCard} hover:scale-[1.02] active:scale-95 transition-all duration-300 flex items-center justify-between`}>
              
              {/* Sol Taraf: Aktif Zincir ve Rekor */}
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Active Chain</h2>
                <div className="flex flex-col gap-2 mt-2">
                  <p className={`text-base font-semibold ${textMuted}`}>Day {streakCount}</p>
                  
                  {/* Rekor Badge'i */}
                  <div className={`inline-flex items-center self-start gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'bg-[#2C2C2E] text-yellow-500' : 'bg-yellow-50 text-yellow-600 border border-yellow-100'}`}>
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 2a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 2zM5.5 5.5A.75.75 0 016 6v3.25a4.25 4.25 0 008.5 0V6a.75.75 0 011.5 0v3.25a5.75 5.75 0 01-11.5 0V6a.75.75 0 01.5-.5z" clipRule="evenodd" /><path fillRule="evenodd" d="M10 13a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 13z" clipRule="evenodd" /><path d="M6 18h8v1.5H6V18z" /></svg>
                    Best: {bestRecord}
                  </div>
                </div>
              </div>
              
              {/* Sağ Taraf: Dairesel İlerleme (SVG) */}
              <div className="relative flex items-center justify-center">
                <svg className="w-[100px] h-[100px] transform -rotate-90" viewBox="0 0 100 100">
                  {/* Arkaplan Halkası */}
                  <circle cx="50" cy="50" r={radius} stroke="currentColor" strokeWidth="8" fill="transparent" className={isDarkMode ? 'text-[#2C2C2E]' : 'text-gray-100'} />
                  {/* Dolgu Halkası */}
                  <circle cx="50" cy="50" r={radius} stroke="currentColor" strokeWidth="8" fill="transparent"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    className={`transition-all duration-1000 ease-out ${getProgressTextColor(progressPercentage)} ${isCompleted ? 'drop-shadow-[0_0_8px_rgba(16,185,129,0.6)]' : ''}`}
                  />
                </svg>
                {/* Yüzde Yazısı */}
                <div className="absolute flex flex-col items-center justify-center">
                  <span className={`text-xl font-extrabold ${isCompleted ? (isDarkMode ? 'text-emerald-400' : 'text-emerald-500') : ''}`}>{progressPercentage}%</span>
                </div>
              </div>

            </div>

            {/* GÖREV LİSTESİ KARTI (Dokunmatik Sorunsuz Hali) */}
            <div className={`rounded-[2.5rem] p-6 shadow-sm ${bgCard} overflow-hidden`}>
              <div className="flex gap-3 mb-6">
                <input
                  type="text"
                  placeholder="Add a new task..."
                  className={`flex-1 rounded-2xl px-5 py-4 outline-none font-semibold transition-all ${inputBg}`}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddTodo()}
                />
                <button onClick={handleAddTodo} className={`text-white px-6 py-4 rounded-2xl font-bold active:scale-95 transition-all shadow-sm ${darkPurpleBtn}`}>
                  Add
                </button>
              </div>

              {todos.length === 0 ? (
                <div className={`text-center py-8 font-semibold ${textMuted}`}>
                  No tasks added yet ✨
                </div>
              ) : (
                <ul className="flex flex-col">
                  {todos.map((todo, index) => (
                    <li 
                      key={todo.id}
                      data-index={index}
                      draggable={dragId === todo.id}
                      onDragStart={(e) => dragStart(e, index)}
                      onDragEnter={(e) => dragEnter(e, index)}
                      onDragEnd={drop}
                      onDragOver={(e) => e.preventDefault()}
                      className={`flex items-center gap-3 sm:gap-4 py-4 border-b last:border-none transition-colors ${isDarkMode ? 'border-[#2C2C2E]' : 'border-gray-100'}`}
                    >
                      <div 
                        className="text-gray-300 cursor-grab active:cursor-grabbing px-2 shrink-0 touch-none"
                        onMouseEnter={() => setDragId(todo.id)}
                        onMouseLeave={() => setDragId(null)}
                        onTouchStart={() => { dragItem.current = index; setDragId(todo.id); }}
                        onTouchMove={(e) => {
                          const touch = e.touches[0];
                          const target = document.elementFromPoint(touch.clientX, touch.clientY);
                          if (target) {
                            const li = target.closest('li[data-index]');
                            if (li) {
                              dragOverItem.current = Number(li.getAttribute('data-index'));
                            }
                          }
                        }}
                        onTouchEnd={drop}
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" /></svg>
                      </div>

                      <button 
                        type="button"
                        onClick={() => toggleTodo(todo.id)} 
                        className="flex-1 flex items-center gap-3 sm:gap-4 text-left outline-none"
                      >
                        <div className={`w-7 h-7 shrink-0 cursor-pointer rounded-full border-[2.5px] flex items-center justify-center transition-all duration-300 ${todo.completed ? `${checkColor} scale-110` : isDarkMode ? 'border-gray-600' : 'border-gray-300'}`}>
                          {todo.completed && <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                        </div>
                        <span className={`text-lg font-semibold flex-1 transition-all duration-300 ${todo.completed ? 'text-gray-400 line-through opacity-50' : ''}`}>
                          {todo.text}
                        </span>
                      </button>

                      <button onClick={(e) => deleteTodo(todo.id, e)} className={`p-2 rounded-xl transition-all ${isDarkMode ? 'text-gray-600 hover:text-red-400' : 'text-gray-300 hover:text-red-500'}`}>
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        ) : (
          /* KOMPAKT TAKVİM */
          <div className={`rounded-[2.5rem] p-6 shadow-sm ${bgCard} animate-in fade-in zoom-in-95 duration-300 w-full`}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-extrabold tracking-tight">{y} Overview</h2>
              <button onClick={() => setCurrentView('home')} className={`px-5 py-2.5 rounded-2xl font-bold transition-all active:scale-95 ${isDarkMode ? 'bg-[#2C2C2E] text-white hover:bg-gray-700' : 'bg-[#F2F2F7] text-[#5E5CE6] hover:bg-gray-200'}`}>
                Back
              </button>
            </div>
            
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-x-2 gap-y-4">
              {monthsData.map((month, index) => (
                <div key={index} className="flex flex-col items-center">
                  <h3 className={`text-[10px] sm:text-xs font-bold uppercase mb-1 ${textMuted}`}>{month.monthName}</h3>
                  <div className="grid grid-cols-7 gap-[2px]">
                    {Array.from({ length: month.startDay - 1 }).map((_, i) => (
                      <div key={`empty-${i}`} className="w-2.5 h-2.5 sm:w-3 sm:h-3"></div>
                    ))}
                    {month.days.map(day => {
                      const val = history[day.dateStr];
                      const percent = val === true ? 100 : val;
                      
                      let bgColor = getProgressBgColor(percent);
                      if (day.isFuture) bgColor = isDarkMode ? 'bg-transparent text-gray-700' : 'bg-transparent text-gray-300';
                      else if (percent === undefined) bgColor = isDarkMode ? 'bg-[#2C2C2E] text-gray-400' : 'bg-gray-100 text-gray-400';

                      return (
                        <div key={day.dateStr} className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-[2px] flex items-center justify-center text-[5px] sm:text-[7px] font-bold ${bgColor}`}>
                          {day.dayNum}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default App;