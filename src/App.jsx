import { useState, useEffect, useRef } from 'react';

function App() {
  const todayObj = new Date();
  const y = todayObj.getFullYear();
  const d = todayObj.getDate(); // Başında sıfır olmayan gün (Örn: 8)
  const mNum = String(todayObj.getMonth() + 1).padStart(2, '0');
  const dNum = String(todayObj.getDate()).padStart(2, '0');
  const todayKey = `${y}-${mNum}-${dNum}`; 

  const dayNameOfWeek = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(todayObj);
  const monthNameLong = new Intl.DateTimeFormat('en-US', { month: 'long' }).format(todayObj);
  
  // İstenilen tutarlı "Gün Ay" formatı (Örn: 8 November)
  const consistentDate = `${d} ${monthNameLong}`;

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
  
  const [currentView, setCurrentView] = useState('splash'); 
  const [inputValue, setInputValue] = useState('');
  
  const [dailyIntention, setDailyIntention] = useState(() => localStorage.getItem(`intention-${todayKey}`) || '');
  const [bestRecord, setBestRecord] = useState(() => JSON.parse(localStorage.getItem('bestRecord')) || 0);

  const [dragId, setDragId] = useState(null);
  const dragItem = useRef(null);
  const dragOverItem = useRef(null);

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

  useEffect(() => {
    if (streakCount > bestRecord) {
      setBestRecord(streakCount);
    }
  }, [streakCount, bestRecord]);

  const getProgressBgColor = (percent) => {
    if (percent === 0 || percent === undefined) return isDarkMode ? 'bg-[#2C2C2E]' : 'bg-gray-200';
    if (percent < 35) return 'bg-rose-500 text-white'; 
    if (percent < 70) return 'bg-amber-500 text-white'; 
    if (percent < 100) return 'bg-lime-500 text-white'; 
    return 'bg-emerald-500 text-white shadow-[0_0_12px_rgba(16,185,129,0.5)]'; 
  };

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
    if (dragItem.current === null || dragOverItem.current === null || dragItem.current === dragOverItem.current) return;
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
      const tempDate = new Date(y, i, 1);
      const mName = new Intl.DateTimeFormat('en-US', { month: 'long' }).format(tempDate);
      const daysInMonth = new Date(y, i + 1, 0).getDate();
      let startDay = tempDate.getDay();
      startDay = startDay === 0 ? 7 : startDay; 
      const days = [];
      for (let day = 1; day <= daysInMonth; day++) {
        const currentDay = new Date(y, i, day);
        const dayStr = `${y}-${String(i + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        days.push({ dayNum: day, dateStr: dayStr, isFuture: currentDay > todayObj && dayStr !== todayKey });
      }
      data.push({ monthName: mName, startDay, days });
    }
    return data;
  };
  const monthsData = getCompactCalendar();

  const radius = 35;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercentage / 100) * circumference;
  const isCompleted = progressPercentage === 100;

  const bigRadius = 90;
  const bigCircumference = 2 * Math.PI * bigRadius;
  const bigStrokeDashoffset = bigCircumference - (progressPercentage / 100) * bigCircumference;

  const bgApp = isDarkMode ? 'bg-black text-white' : 'bg-[#F2F2F7] text-gray-900';
  const bgCard = isDarkMode ? 'bg-[#1C1C1E] border border-[#2C2C2E]' : 'bg-white border border-gray-100';
  const textMuted = isDarkMode ? 'text-gray-400' : 'text-gray-500';
  const inputBg = isDarkMode ? 'bg-[#2C2C2E] text-white placeholder-gray-500' : 'bg-[#F2F2F7] text-gray-900 placeholder-gray-400';
  const darkPurpleBtn = isDarkMode ? 'bg-[#7D53F9] hover:bg-[#8F68FA]' : 'bg-[#5E5CE6] hover:bg-[#4C49C3]'; 
  const checkColor = isDarkMode ? 'bg-[#7D53F9] border-[#7D53F9]' : 'bg-[#5E5CE6] border-[#5E5CE6]';

  // Yazısız Geri Dönüşlü Evrensel Header Bileşeni
  const Header = ({ onBack }) => (
    <div className="flex justify-between items-center w-full px-2 mb-8">
      <div className="flex items-center gap-2">
        {onBack && (
          <button onClick={onBack} className={`flex items-center justify-center p-2 -ml-2 rounded-full transition-all ${textMuted} hover:text-gray-900 dark:hover:text-white`}>
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" /></svg>
          </button>
        )}
        <span className={`text-sm font-bold uppercase tracking-widest ${textMuted}`}>{consistentDate}</span>
      </div>
      <button onClick={() => setIsDarkMode(!isDarkMode)} className={`p-2.5 rounded-full transition-all active:scale-90 ${isDarkMode ? 'bg-[#1C1C1E] text-yellow-400' : 'bg-white text-[#5E5CE6] shadow-sm'}`}>
        {isDarkMode ? ( <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"/></svg> ) : ( <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"/></svg> )}
      </button>
    </div>
  );

  return (
    <div className={`min-h-screen ${bgApp} px-4 sm:px-8 pt-6 pb-16 font-sans transition-colors duration-700 flex flex-col items-center overflow-x-hidden`}>
      <div className="w-full max-w-md">

        {currentView === 'splash' && (
          <div className="animate-in fade-in duration-700">
            <Header />
            <div onClick={() => setCurrentView('home')} className="flex flex-col items-center justify-center cursor-pointer group mt-16">
              <h1 className="text-4xl font-extrabold mb-12 tracking-tight transition-transform group-hover:-translate-y-2 duration-500">Daily Journal</h1>
              
              <div className={`relative flex items-center justify-center transition-all duration-700 transform group-hover:scale-110 active:scale-95 ${isCompleted ? 'drop-shadow-[0_0_25px_rgba(16,185,129,0.4)]' : ''}`}>
                <svg className="w-[240px] h-[240px] transform -rotate-90" viewBox="0 0 200 200">
                  <circle cx="100" cy="100" r={bigRadius} stroke="currentColor" strokeWidth="12" fill="transparent" className={isDarkMode ? 'text-[#2C2C2E]' : 'text-gray-200'} />
                  <circle cx="100" cy="100" r={bigRadius} stroke="currentColor" strokeWidth="12" fill="transparent" strokeDasharray={bigCircumference} strokeDashoffset={bigStrokeDashoffset} strokeLinecap="round" className={`transition-all duration-1500 ease-out ${getProgressTextColor(progressPercentage)}`} />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className={`text-6xl font-black tracking-tighter ${isCompleted ? (isDarkMode ? 'text-emerald-400' : 'text-emerald-500') : ''}`}>{progressPercentage}%</span>
                  <span className={`text-sm font-bold uppercase tracking-widest mt-2 transition-opacity ${isCompleted ? 'opacity-100 text-emerald-500' : 'opacity-0'}`}>Completed</span>
                </div>
              </div>
              <p className={`mt-20 text-sm font-bold uppercase tracking-[0.2em] animate-pulse ${isDarkMode ? 'text-white' : 'text-black'}`}>Tap to enter</p>
            </div>
          </div>
        )}

        {currentView === 'home' && (
          <div className="space-y-6 animate-in slide-in-from-right-8 fade-in duration-500">
            <Header onBack={() => setCurrentView('splash')} />
            
            <div className="px-2 mb-6">
              <h1 className="text-5xl font-black tracking-tight leading-none mb-4">{dayNameOfWeek}</h1>
              <input type="text" placeholder="Set your daily intention..." value={dailyIntention} onChange={(e) => setDailyIntention(e.target.value)} className={`w-full text-base font-semibold outline-none bg-transparent transition-all border-b-2 border-transparent focus:border-gray-300 dark:focus:border-gray-700 pb-2 ${isDarkMode ? 'text-gray-200 placeholder-gray-600' : 'text-gray-800 placeholder-gray-400'}`} />
            </div>

            <div className="flex flex-col gap-5">
              
              {/* Active Chain Kartı */}
              <div onClick={() => setCurrentView('calendar')} className={`cursor-pointer rounded-[2.5rem] p-6 shadow-sm ${bgCard} hover:scale-[1.02] active:scale-95 transition-all duration-300 flex items-center justify-between h-[130px]`}>
                <div className="flex flex-col justify-center h-full">
                  <h2 className="text-2xl font-black tracking-tight mb-1">Active Chain</h2>
                  {/* İstenilen "Day X" güncellemesi */}
                  <p className={`text-sm font-bold mb-2 ${textMuted}`}>Day {streakCount}</p>
                  <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${isDarkMode ? 'bg-[#2C2C2E] text-yellow-500' : 'bg-yellow-50 text-yellow-600 border border-yellow-100'}`}>
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 2a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 2zM5.5 5.5A.75.75 0 016 6v3.25a4.25 4.25 0 008.5 0V6a.75.75 0 011.5 0v3.25a5.75 5.75 0 01-11.5 0V6a.75.75 0 01.5-.5z" clipRule="evenodd" /><path fillRule="evenodd" d="M10 13a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 13z" clipRule="evenodd" /><path d="M6 18h8v1.5H6V18z" /></svg>
                    Best: {bestRecord}
                  </div>
                </div>
                <div className="relative w-[80px] h-[80px] flex items-center justify-center shrink-0">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r={radius} stroke="currentColor" strokeWidth="10" fill="transparent" className={isDarkMode ? 'text-[#2C2C2E]' : 'text-gray-100'} />
                    <circle cx="50" cy="50" r={radius} stroke="currentColor" strokeWidth="10" fill="transparent" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} strokeLinecap="round" className={`transition-all duration-1000 ease-out ${getProgressTextColor(progressPercentage)} ${isCompleted ? 'drop-shadow-[0_0_8px_rgba(16,185,129,0.6)]' : ''}`} />
                  </svg>
                  <span className={`absolute text-lg font-black ${isCompleted ? (isDarkMode ? 'text-emerald-400' : 'text-emerald-500') : ''}`}>{progressPercentage}%</span>
                </div>
              </div>

              {/* Missions Kartı (Yuvarlağı küçültüldü) */}
              <div onClick={() => setCurrentView('tasks')} className={`cursor-pointer rounded-[2.5rem] p-6 shadow-sm ${bgCard} hover:scale-[1.02] active:scale-95 transition-all duration-300 flex items-center justify-between h-[130px]`}>
                <div className="flex flex-col justify-center h-full">
                  <h2 className="text-2xl font-black tracking-tight mb-1">Missions</h2>
                  <p className={`text-sm font-bold ${textMuted}`}>{completedCount} of {todos.length} done</p>
                </div>
                {/* w-[56px] h-[56px] yapılarak zarifleştirildi */}
                <div className={`w-[56px] h-[56px] rounded-full flex items-center justify-center shrink-0 transition-all ${isCompleted && todos.length > 0 ? getProgressBgColor(progressPercentage) : (isDarkMode ? 'bg-[#2C2C2E] text-white' : 'bg-gray-100 text-gray-800')}`}>
                   <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
                </div>
              </div>

            </div>
          </div>
        )}

        {currentView === 'tasks' && (
          <div className="space-y-6 animate-in slide-in-from-right-8 fade-in duration-500 w-full">
            <Header onBack={() => setCurrentView('home')} />
            
            <div className="mb-6 px-2">
              <h2 className="text-4xl font-black tracking-tight mb-4">Missions</h2>
              <div className={`w-full h-3 rounded-full overflow-hidden ${isDarkMode ? 'bg-[#2C2C2E]' : 'bg-gray-200'}`}>
                <div className={`h-full rounded-full transition-all duration-700 ease-out ${getProgressBgColor(progressPercentage)}`} style={{ width: `${progressPercentage}%` }}></div>
              </div>
            </div>

            <div className={`rounded-[2.5rem] p-6 shadow-sm ${bgCard} overflow-hidden`}>
              <div className="flex gap-3 mb-6">
                <input type="text" placeholder="Add a new task..." value={inputValue} onChange={(e) => setInputValue(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddTodo()} className={`flex-1 rounded-2xl px-5 py-4 outline-none font-bold transition-all ${inputBg}`} />
                <button onClick={handleAddTodo} className={`text-white px-6 py-4 rounded-2xl font-black active:scale-95 transition-all shadow-sm ${darkPurpleBtn}`}>Add</button>
              </div>

              {todos.length === 0 ? (
                <div className={`text-center py-8 font-bold ${textMuted}`}>Arena is empty. Add a mission! ⚔️</div>
              ) : (
                <ul className="flex flex-col">
                  {todos.map((todo, index) => (
                    <li key={todo.id} data-index={index} draggable={dragId === todo.id} onDragStart={(e) => dragStart(e, index)} onDragEnter={(e) => dragEnter(e, index)} onDragEnd={drop} onDragOver={(e) => e.preventDefault()} className={`flex items-center gap-3 sm:gap-4 py-4 border-b last:border-none transition-colors ${isDarkMode ? 'border-[#2C2C2E]' : 'border-gray-100'}`}>
                      <div className="text-gray-300 cursor-grab active:cursor-grabbing px-2 shrink-0 touch-none" onMouseEnter={() => setDragId(todo.id)} onMouseLeave={() => setDragId(null)} onTouchStart={() => { dragItem.current = index; setDragId(todo.id); }} onTouchMove={(e) => { const touch = e.touches[0]; const target = document.elementFromPoint(touch.clientX, touch.clientY); if (target) { const li = target.closest('li[data-index]'); if (li) dragOverItem.current = Number(li.getAttribute('data-index')); } }} onTouchEnd={drop}>
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 8h16M4 16h16" /></svg>
                      </div>
                      <button type="button" onClick={() => toggleTodo(todo.id)} className="flex-1 flex items-center gap-3 sm:gap-4 text-left outline-none group">
                        <div className={`w-7 h-7 shrink-0 cursor-pointer rounded-full border-[3px] flex items-center justify-center transition-all duration-300 group-active:scale-90 ${todo.completed ? `${checkColor} scale-110` : isDarkMode ? 'border-gray-600' : 'border-gray-300'}`}>
                          {todo.completed && <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" /></svg>}
                        </div>
                        <span className={`text-lg font-bold flex-1 transition-all duration-300 ${todo.completed ? 'text-gray-400 line-through opacity-50' : ''}`}>{todo.text}</span>
                      </button>
                      <button onClick={(e) => deleteTodo(todo.id, e)} className={`p-2 rounded-xl transition-all ${isDarkMode ? 'text-gray-600 hover:text-red-400' : 'text-gray-300 hover:text-red-500'}`}>
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        {currentView === 'calendar' && (
          <div className="w-full animate-in slide-in-from-bottom-8 fade-in duration-300">
            <Header onBack={() => setCurrentView('home')} />
            
            <div className={`rounded-[2.5rem] p-6 sm:p-8 shadow-sm ${bgCard} w-full mt-4`}>
              <h2 className="text-3xl font-black tracking-tight mb-8">{y} History</h2>
              
              <div className="grid grid-cols-2 gap-x-6 gap-y-10">
                {monthsData.map((month, index) => (
                  <div key={index} className="flex flex-col items-center">
                    <h3 className={`text-sm font-bold uppercase mb-3 ${textMuted}`}>{month.monthName}</h3>
                    <div className="grid grid-cols-7 gap-1">
                      {Array.from({ length: month.startDay - 1 }).map((_, i) => (<div key={`empty-${i}`} className="w-4 h-4 sm:w-5 sm:h-5"></div>))}
                      {month.days.map(day => {
                        const val = history[day.dateStr]; const percent = val === true ? 100 : val;
                        let bgColor = getProgressBgColor(percent);
                        if (day.isFuture) bgColor = isDarkMode ? 'bg-transparent text-gray-700' : 'bg-transparent text-gray-300';
                        else if (percent === undefined) bgColor = isDarkMode ? 'bg-[#2C2C2E] text-gray-400' : 'bg-gray-200 text-gray-500';
                        
                        return (
                          <div key={day.dateStr} className={`w-4 h-4 sm:w-5 sm:h-5 rounded-[4px] flex items-center justify-center text-[8px] sm:text-[9px] font-bold ${bgColor}`}>
                            {day.dayNum}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default App;