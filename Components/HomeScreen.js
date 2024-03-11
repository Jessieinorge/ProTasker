import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Dimensions, TouchableOpacity, Image } from 'react-native';
import Weather from './Weather';
import { auth, database } from '../firebaseConfig';
import { ref, get, update, onValue } from 'firebase/database';
import { onAuthStateChanged } from 'firebase/auth';
import AddTask from './AddTask';
import { CheckBox, Icon } from 'react-native-elements';
import { useIsFocused } from '@react-navigation/native';
import EditTask from './EditTask'; // Import the EditTask component

const screenWidth = Dimensions.get('window').width;
const fontSize = screenWidth * 0.06;
const currentDate = new Date().toISOString().split('T')[0];
const currentTime = new Date().toISOString().split('T')[1].substring(0, 5);
const PRIORITY_ICONS = {
  'High Priority': require('../assets/Icons/high.png'),
  'Medium Priority': require('../assets/Icons/medium.png'),
  'Low Priority': require('../assets/Icons/low.png'),
  // No Priority does not need an icon
};

const HomeScreen = () => {
  const [todayTasks, setTodayTasks] = useState([]);
  const [overdueTasks, setOverdueTasks] = useState([]);
  const [isOverdueListExpanded, setIsOverdueListExpanded] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const isFocused = useIsFocused();
  const [tasksUpdated, setTasksUpdated] = useState(false); //This state can be updated whenever close the EditTask modal after making changes.
  const [subtasks, setSubtasks] = useState([]);

  // Function to open EditTask modal with the selected task
  const handleEditTask = (task) => {
    setEditingTask(task);
    setIsEditModalVisible(true);
  };

  const onTaskUpdated = (updatedTask) => {
    if (updatedTask) {
      // Determine if the task is overdue
      const isOverdue = updatedTask.dueDate < currentDate || 
                        (updatedTask.dueDate === currentDate && updatedTask.time < currentTime);
  
      // Determine the appropriate list for the updated task
      if (isOverdue) {
        // Update overdueTasks list
        setOverdueTasks(prevTasks => prevTasks.map(task => task.id === updatedTask.id ? updatedTask : task));
      } else {
        // Update todayTasks list
        setTodayTasks(prevTasks => prevTasks.map(task => task.id === updatedTask.id ? updatedTask : task));
      }
    }
    setIsEditModalVisible(false);
    setTasksUpdated(prev => !prev); // Toggle to trigger refresh
  };
  

  useEffect(() => {
    onAuthStateChanged(auth, (user) => {
      if (user) {
        fetchTasks(user.uid);
      } else {
        setTodayTasks([]);
        setOverdueTasks([]);
      }
    });
  }, []);
  const updateTasks = (newTask) => {
    setTodayTasks([...todayTasks, newTask]);
  };
  
  useEffect(() => {
    if (isFocused) {
      const user = auth.currentUser;
      if (user) {
        fetchTasks(user.uid);
      }
    }
  }, [tasksUpdated, isFocused]);//refresh the screen whenever change a screen/made a updating

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        fetchTasks(user.uid);
      } else {
        setTodayTasks([]); // Clear tasks if there's no user
        setOverdueTasks([]); // Clear overdue tasks if there's no user
      }
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [isFocused]); // Added isFocused dependency to refetch tasks when the screen is focused

  const fetchTasks = async (userUID) => {
    const today = new Date().toISOString().split('T')[0]; // Ensure we're using the same format for comparison
    const tasksRef = ref(database, 'Tasks');
  
    try {
      const snapshot = await get(tasksRef);
      if (snapshot.exists()) {
        const allTasks = snapshot.val();
        const todayTasksDetails = [];
        const overdueTasksDetails = [];
  
        Object.keys(allTasks).forEach((key) => {
          const task = allTasks[key];
          if (task.UID === userUID) { // Ensure task belongs to the current user
            const taskDueDate = task.dueDate;
            const taskDateTime = new Date(taskDueDate + 'T' + (task.time || '00:00') + ':00');
            const now = new Date();
            const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
  
            if (task.status === 'uncompleted' && taskDueDate < today) {
              // Task is overdue
              overdueTasksDetails.push({ ...task, id: key, checked: false });
            } else if (task.status === 'uncompleted' && taskDateTime >= startOfToday && taskDateTime <= endOfToday) {
              // Task is for today
              todayTasksDetails.push({ ...task, id: key, checked: false });
            }
            // Future tasks are not handled here
          }
        });
  
        setTodayTasks(todayTasksDetails);
        setOverdueTasks(overdueTasksDetails);
      } else {
        setTodayTasks([]);
        setOverdueTasks([]);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  const handleCheckboxPress = async (index, isOverdue) => {
    try {
      const tasksToUpdate = isOverdue ? overdueTasks : todayTasks;
      const task = tasksToUpdate[index];
      const taskId = task.id;
      const newStatus = task.status === 'uncompleted' ? 'completed' : 'uncompleted';
  
      // Update the task status in Firebase
      await update(ref(database, `Tasks/${taskId}`), { status: newStatus });
  
      // Update the state to show the checked effect immediately
      const updatedTasks = [...tasksToUpdate];
      updatedTasks[index] = { ...task, status: newStatus, checked: newStatus === 'completed' };
  
      if (isOverdue) {
        setOverdueTasks(updatedTasks);
      } else {
        setTodayTasks(updatedTasks);
      }
  
      // Remove the task from the list after 0.5 seconds
      if (newStatus === 'completed') {
        setTimeout(() => {
          if (isOverdue) {
            setOverdueTasks((prevTasks) => prevTasks.filter((_, idx) => idx !== index));
          } else {
            setTodayTasks((prevTasks) => prevTasks.filter((_, idx) => idx !== index));
          }
  
          // Increment CompletedTasks by 1
          incrementCompletedTasks();
        }, 500);
      }
    } catch (error) {
      console.error('Error updating task status:', error);
    }
  };
  
  // New function to increment the CompletedTasks
  const incrementCompletedTasks = async () => {
    const userUID = auth.currentUser ? auth.currentUser.uid : null;
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
      <View style={styles.weather}>
        <Weather />
      </View>
      <View style={styles.overdueHeader}>
       
        <Text style={styles.todayTitle}>Overdue</Text>
        <TouchableOpacity onPress={() => setIsOverdueListExpanded(!isOverdueListExpanded)}>
          <Icon
            name={isOverdueListExpanded ? 'chevron-up' : 'chevron-down'}
            type='font-awesome'
            color='#ff9900'
            size={20}
            padding = {5}
          />
        </TouchableOpacity>
      </View>
      {isOverdueListExpanded ? (
       <FlatList
       data={overdueTasks}
       keyExtractor={(item, index) => index.toString()}
       style={styles.taskList}
       renderItem={({ item, index }) => (
         <View style={styles.taskItem}>
           <CheckBox
             checked={item.checked}
             onPress={() => handleCheckboxPress(index, true)}
           />
           <TouchableOpacity 
             style={styles.taskContentContainer} 
             onPress={() => handleEditTask(item)}
           >
             <Text style={[styles.taskTitle, item.checked && styles.completedTaskTitle]}>
               {item.title}
             </Text>
             {item.priority && PRIORITY_ICONS[item.priority] && 
               <Image source={PRIORITY_ICONS[item.priority]} style={styles.priorityIcon} />
             }
           </TouchableOpacity>
         </View>
       )}
     />
      ) : null}
      <Text style={styles.todayTitle}>{currentDate}</Text>
      <FlatList
        data={todayTasks}
        keyExtractor={(item, index) => index.toString()}
        style={styles.taskList}
        renderItem={({ item, index }) => (
          <View style={styles.taskItem}>
            <CheckBox
              checked={item.checked}
              onPress={() => handleCheckboxPress(index, false)}
            />
            <TouchableOpacity 
              style={styles.taskContentContainer} 
              onPress={() => handleEditTask(item)}
            >
              <Text style={[styles.taskTitle, item.checked && styles.completedTaskTitle]}>
                {item.title}
              </Text>
              {item.priority && PRIORITY_ICONS[item.priority] && 
                <Image source={PRIORITY_ICONS[item.priority]} style={styles.priorityIcon} />
              }
            </TouchableOpacity>
          </View>
        )}
      />
      
      {/* EditTask Modal */}
      {isEditModalVisible && editingTask && (
        <EditTask
          initialTask={editingTask}
          onTaskAdded={onTaskUpdated}
          handleCancel={() => setIsEditModalVisible(false)}
        />
      )}
       <AddTask onTaskAdded={(newTask) => setTodayTasks([...todayTasks, newTask])} />

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#F5FCFF',
  },
  overdueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  todayTitle: {
    fontSize: fontSize,
    textAlign: 'left',
    marginVertical: 5,
  },
  taskList: {
    marginBottom: 5,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  taskTitle: {
    flex: 1,
    fontSize: 18,
  },
  completedTaskTitle: {
    textDecorationLine: 'line-through',
  },
  taskDescription: {
    fontSize: 16,
  },
  weather: {
    paddingBottom: 10,
  },
  touchableTaskTitle:{
    flex:1,
    padding:15
  },
  taskContentContainer: {
    flex: 1,
    flexDirection: 'row', // Align items in a row
    alignItems: 'center', // Center items vertically in the container
    padding: 15,
  },
  priorityIcon: {
    width: 20,
    height: 20,
    marginLeft: 5,
  },

});

export default HomeScreen;
