import { useState, useEffect, useRef } from 'react';

function App() {
  const [todos, setTodos] = useState(() => JSON.parse(localStorage.getItem('todos')) || []);
  const [history, setHistory] = useState(() => JSON.parse(localStorage.getItem('history')) || {});
  const [isDarkMode, setIsDarkMode] = useState(() => JSON.parse(localStorage.getItem('darkMode')) || false);
  const [currentView, setCurrentView] = useState('home'); 
  const [inputValue, setInputValue] = useState('');

  // --- SÜRÜKLE BIRAK REFLERİ ---
  const dragItem = useRef();
  const dragOverItem = useRef();

  const todayObj = new Date();
  const y = todayObj.getFullYear();
  const m = String(todayObj.getMonth() + 1).padStart(2, '0');
  const d = String(todayObj.getDate()).padStart(2, '0');
  const todayKey = `${y}-${m}-${d}`; 
  const todayDateStr = new Intl.DateTimeFormat('en-US', { day: 'numeric', month: 'long', weekday: 'long' }).format(todayObj);

  useEffect(() => { localStorage.setItem('todos', JSON.stringify(todos)); }, [todos]);
  useEffect(() => { localStorage.setItem('history', JSON.stringify(history)); }, [history]);
  useEffect(() => { localStorage.setItem('darkMode', JSON.stringify(isDarkMode)); }, [isDarkMode]);

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

  const getProgressColor = (percent) => {
    if (percent === 0 || percent === undefined) return isDarkMode ? 'bg-[#2C2C2E]' : 'bg-gray-100';
    if (percent < 35) return 'bg-rose-500 text-white'; 
    if (percent < 70) return 'bg-amber-500 text-white'; 
    if (percent < 100) return 'bg-lime-500 text-white'; 
    return 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/40'; 
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

  // --- BİLGİSAYAR VE TELEFON İÇİN SÜRÜKLE BIRAK İŞLEMLERİ ---
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

  const bgApp = isDarkMode ? 'bg-black text-white' : 'bg-[#F2F2F7] text-gray-900';
  const bgCard = isDarkMode ? 'bg-[#1C1C1E] border border-[#2C2C2E]' : 'bg-white border border-gray-100';
  const textMuted = isDarkMode ? 'text-gray-400' : 'text-gray-500';
  const inputBg = isDarkMode ? 'bg-[#2C2C2E] text-white placeholder-gray-500' : 'bg-[#F2F2F7] text-gray-900 placeholder-gray-400';
  const darkPurpleBtn = isDarkMode ? 'bg-[#7D53F9] hover:bg-[#8F68FA]' : 'bg-[#5E5CE6] hover:bg-[#4C49C3]'; 
  const checkColor = isDarkMode ? 'bg-[#7D53F9] border-[#7D53F9]' : 'bg-[#5E5CE6] border-[#5E5CE6]';

  return (
    <div className={`min-h-screen ${bgApp} p-4 sm:p-8 font-sans transition-colors duration-500 flex items-center justify-center`}>
      <div className="w-full max-w-md space-y-6">

        {/* BAŞLIK */}
        <div className="flex justify-between items-end px-2">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight">Daily Journal</h1>
            <p className={`text-sm font-semibold mt-1 ${textMuted}`}>{todayDateStr}</p>
          </div>
          <button onClick={() => setIsDarkMode(!isDarkMode)} className={`p-3 rounded-full transition-all active:scale-90 ${isDarkMode ? 'bg-[#1C1C1E] text-yellow-400' : 'bg-white text-[#5E5CE6] shadow-sm'}`}>
            {isDarkMode ? (
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"/></svg>
            ) : (
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"/></svg>
            )}
          </button>
        </div>

        {currentView === 'home' ? (
          <>
            {/* ZİNCİR KARTI */}
            <div onClick={() => setCurrentView('calendar')} className={`cursor-pointer rounded-[2.5rem] p-6 shadow-sm ${bgCard} hover:scale-[1.02] active:scale-95 transition-all duration-300 group`}>
              <div className="flex justify-between items-center mb-5">
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl ${isDarkMode ? 'bg-[#2C2C2E]' : 'bg-[#F2F2F7]'}`}>🔗</div>
                  <div>
                    <h2 className="text-2xl font-bold tracking-tight">Streak</h2>
                    <p className={`text-sm font-semibold mt-0.5 ${textMuted}`}>{streakCount} Day Streak</p>
                  </div>
                </div>
                <div className="text-right">
                  <h2 className="text-2xl font-bold tracking-tight">{progressPercentage}%</h2>
                  <p className={`text-sm font-semibold mt-0.5 ${textMuted}`}>Progress</p>
                </div>
              </div>
              
              <div className={`w-full h-4 rounded-full overflow-hidden ${isDarkMode ? 'bg-[#2C2C2E]' : 'bg-[#F2F2F7]'}`}>
                <div className={`h-full rounded-full transition-all duration-700 ease-out ${getProgressColor(progressPercentage)}`} style={{ width: `${progressPercentage}%` }}></div>
              </div>
            </div>

            {/* GÖREV LİSTESİ KARTI */}
            <div className={`rounded-[2.5rem] p-6 shadow-sm ${bgCard} overflow-hidden`}>
              <div className="flex gap-3 mb-6">
                <input
                  type="text"
                  placeholder="What needs to be done today?"
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
                <div className={`text-center py-8 font-medium ${textMuted}`}>
                  Your day is empty. Add a task to start your streak! 🎯
                </div>
              ) : (
                <ul className="flex flex-col">
                  {todos.map((todo, index) => (
                    <li 
                      key={todo.id}
                      data-index={index}
                      draggable
                      onDragStart={(e) => dragStart(e, index)}
                      onDragEnter={(e) => dragEnter(e, index)}
                      onDragEnd={drop}
                      onDragOver={(e) => e.preventDefault()}
                      className={`flex items-center gap-3 sm:gap-4 py-4 border-b last:border-none group transition-colors ${isDarkMode ? 'border-[#2C2C2E]' : 'border-gray-100'}`}
                    >
                      {/* TELEFON UYUMLU SÜRÜKLEME İKONU (touch-none eklendi) */}
                      <div 
                        className="text-gray-300 cursor-grab active:cursor-grabbing hover:text-gray-500 px-1 shrink-0 touch-none"
                        onTouchStart={() => { dragItem.current = index; }}
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

                      <div onClick={() => toggleTodo(todo.id)} className={`w-7 h-7 shrink-0 cursor-pointer rounded-full border-[2.5px] flex items-center justify-center transition-all duration-300 ${todo.completed ? `${checkColor} scale-110` : isDarkMode ? 'border-gray-600' : 'border-gray-300'}`}>
                        {todo.completed && <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                      </div>
                      
                      <span onClick={() => toggleTodo(todo.id)} className={`text-lg cursor-pointer font-semibold flex-1 transition-all duration-300 ${todo.completed ? 'text-gray-400 line-through opacity-50' : ''}`}>{todo.text}</span>

                      <button onClick={(e) => deleteTodo(todo.id, e)} className={`transition-all p-2 rounded-xl opacity-100 md:opacity-0 md:group-hover:opacity-100 ${isDarkMode ? 'text-gray-500 hover:text-red-400 hover:bg-[#2C2C2E]' : 'text-gray-300 hover:text-red-500 hover:bg-red-50'}`}>
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
                      
                      let bgColor = getProgressColor(percent);
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