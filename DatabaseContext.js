import { createContext, useContext, useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { database } from './firebaseConfig'; // Import your Firebase configuration

const DatabaseContext = createContext();

export const useDatabase = () => useContext(DatabaseContext);

export const DatabaseProvider = ({ children }) => {
  const [databaseState, setDatabaseState] = useState({
    Lists: {},
    Pomodoro: {},
    SubTasks: {},
    Tasks: {},
    Users: {},
  });

  useEffect(() => {
    // Listen to changes in the entire database structure
    const databaseRef = ref(database);
    onValue(databaseRef, (snapshot) => {
      if (snapshot.exists()) {
        setDatabaseState(snapshot.val());
      } else {
        setDatabaseState({
          Lists: {},
          Pomodoro: {},
          SubTasks: {},
          Tasks: {},
          Users: {},
        });
      }
    });
  }, []);

  return (
    <DatabaseContext.Provider value={databaseState}>
      {children}
    </DatabaseContext.Provider>
  );
};
