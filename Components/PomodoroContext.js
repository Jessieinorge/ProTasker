import React, { createContext, useContext, useState } from 'react';

const PomodoroContext = createContext();

export const usePomodoro = () => useContext(PomodoroContext);

export const PomodoroProvider = ({ children }) => {
  const [pomodoroDuration, setPomodoroDuration] = useState(1);
  const [shortRestDuration, setShortRestDuration] = useState(5);
  const [longRestDuration, setLongRestDuration] = useState(20);
  const [sessionsBeforeLongBreak, setSessionsBeforeLongBreak] = useState(4);

  const resetSettings = () => {
    setPomodoroDuration(25);
    setShortRestDuration(5);
    setLongRestDuration(20);
    setSessionsBeforeLongBreak(4);
  };

  
 
  return (
    <PomodoroContext.Provider value={{
      pomodoroDuration,
      setPomodoroDuration,
      shortRestDuration,
      setShortRestDuration,
      longRestDuration,
      setLongRestDuration,
      sessionsBeforeLongBreak,
      setSessionsBeforeLongBreak,
      resetSettings,
    }}>
      {children}
    </PomodoroContext.Provider>
  );
};

