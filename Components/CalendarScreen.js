import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, Dimensions, TouchableOpacity, Image } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { CheckBox } from 'react-native-elements';
import { database, auth } from '../firebaseConfig'; // Import Firebase Authentication
import { ref, get, update } from 'firebase/database';
import { useIsFocused } from '@react-navigation/native';
import EditTask from './EditTask'; // Import the EditTask component
import AddTask from './AddTask';

const CalendarScreen = () => {
  const [editTask, setEditTask] = useState(null); // State to track the task being edited
  const [tasksData, setTasksData] = useState([]); // State to store tasks
  const today = new Date().toISOString().split('T')[0]; // Get today's date in ISO format (YYYY-MM-DD)
  const [currentDay, setCurrentDay] = useState(today); // State to track the currently selected day
  const isFocused = useIsFocused(); // Detect screen focus

  // Function to fetch the UID of the currently authenticated user
  const fetchUserUID = () => {
    if (auth.currentUser) {
      return auth.currentUser.uid;
    } else {
      return null;
    }
  };

  const userUID = fetchUserUID(); // Fetch the user's UID

  // Function to update the tasks when a new task is added or edited
  const updateTasks = (newTask) => {
    // Handle the addition or update of tasks here
    // For example, you can update the state or perform any necessary actions
    if (newTask) {
      setTasksData([...tasksData, newTask]);
    } else {
      // Task was deleted, handle it here
    }
  };

  // Function to fetch tasks from the Firebase Realtime Database
  const fetchTasks = async () => {
    const tasksRef = ref(database, 'Tasks');
    try {
      const snapshot = await get(tasksRef);
      if (snapshot.exists()) {
        const allTasks = snapshot.val();
        const filteredTasks = Object.keys(allTasks).map((key) => ({
          id: key,
          ...allTasks[key],
        })).filter((task) =>
          task.dueDate === currentDay && task.status === 'uncompleted' && task.UID === userUID // Filter by UID
        );
        setTasksData(filteredTasks);
      } else {
        setTasksData([]);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  useEffect(() => {
    fetchTasks(); // Fetch tasks initially
  }, [currentDay, userUID]); // Include currentDay and userUID in the dependency array

  useEffect(() => {
    if (isFocused) {
      fetchTasks(); // Fetch tasks when the screen is focused
    }
  }, [isFocused, currentDay, userUID]); // Include currentDay and userUID in the dependency array

  // Function to handle pressing a task item
  const handleTaskPress = (task) => {
    setEditTask(task); // Set the task to be edited
  };

  // Function to handle pressing the checkbox to mark a task as completed
  const handleCheckboxPress = async (taskId, index) => {
    try {
      // Update the task status in Firebase
      await update(ref(database, `Tasks/${taskId}`), { status: 'completed' });
  
      // Update the task status in the state
      const updatedTasks = [...tasksData];
      const updatedTaskIndex = updatedTasks.findIndex((task) => task.id === taskId);
      if (updatedTaskIndex !== -1) {
        updatedTasks[updatedTaskIndex].completed = true;
        setTasksData(updatedTasks);
      }
  
      // Wait for 0.5 seconds and then remove the task from the list
      setTimeout(() => {
        setTasksData((prevTasks) => prevTasks.filter((_, idx) => idx !== index));
  
        // Increment CompletedTasks by 1
        incrementCompletedTasks();
      }, 500);
    } catch (error) {
      console.error('Error handling checkbox press:', error);
    }
  };
  
  // Function to increment the CompletedTasks counter
  const incrementCompletedTasks = async () => {
    const userUID = fetchUserUID(); // Assuming fetchUserUID() fetches the current user's UID
    if (!userUID) return; // Exit if user is not logged in
  
    const completedTasksPath = `Users/${userUID}/CompletedTasks`;
    const completedTasksRef = ref(database, completedTasksPath);
  
    get(completedTasksRef).then((snapshot) => {
      let currentCompletedTasks = snapshot.exists() ? snapshot.val() : 0;
      update(ref(database, `Users/${userUID}`), { CompletedTasks: currentCompletedTasks + 1 });
    }).catch((error) => {
      console.error('Failed to increment CompletedTasks:', error);
    });
  };
  

  return (
    <View style={styles.container}>
      <View style={styles.calendarContainer}>
        {/* Calendar component */}
        <Calendar
          style={styles.calendar}
          theme={{
            calendarBackground: 'transparent',
          }}
          markedDates={{
            [today]: { selected: true, selectedColor: '#ff9900' },
            [currentDay]: { selected: true, selectedColor: '#2196f3' },
          }}
          current={today}
          onDayPress={(day) => setCurrentDay(day.dateString)}
        />
      </View>

      {/* Task list */}
      {tasksData.length === 0 ? (
        <View style={styles.noTasksContainer}>
          <Image
            source={require('../assets/Icons/nature.png')}
            style={styles.noTasksImage}
          />
          <Text style={styles.noTasksText}>You have no tasks today, </Text>
          <Text style={styles.noTasksText}>enjoy a free day!</Text>

        </View>
      ) : (
      <FlatList
        data={tasksData}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <TouchableOpacity onPress={() => handleTaskPress(item)}>
            <View style={styles.taskItem}>
              <View style={styles.taskItemRow}>
                <CheckBox
                  checked={item.completed}
                  onPress={() => handleCheckboxPress(item.id, index)}
                />
                <Text style={[styles.taskTitle, item.completed && styles.completedTaskTitle]}>
                  {item.title}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
      />
      )}

      {/* Add Task button */}
      <View style={styles.addTaskButton}>
        <AddTask onTaskAdded={updateTasks} />
      </View>

      {/* Edit Task modal */}
      {editTask && (
        <EditTask
          initialTask={editTask}
          onTaskAdded={() => {
            // Reset the edited task
            setEditTask(null);
          }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5FCFF',
  },
  calendarContainer: {
    backgroundColor: '#F5FCFF',
  },
  calendar: {
    width: Dimensions.get('window').width,
    backgroundColor: '#F5FCFF',
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 5,
    paddingHorizontal: 10,
  },
  taskItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  taskTitle: {
    marginLeft: 8,
  },
  completedTaskTitle: {
    textDecorationLine: 'line-through',
    color: 'grey',
  },
  addTaskButton: {
    flex: 1,
    padding: 20,
  },  
  noTasksContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  noTasksImage: {
    marginTop:20,
    width: 100,
    height: 100, // Adjust the size as needed
    resizeMode: 'contain', // Ensure the image fits without stretching
  },
  noTasksText: {
    fontSize: 18,
    marginTop: 10,
    color: '#666',
  },
});

export default CalendarScreen;
