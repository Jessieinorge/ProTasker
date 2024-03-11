import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, TextInput, ScrollView, FlatList,Image } from 'react-native';
import { auth, database } from '../firebaseConfig';
import { ref, get, set, push, update, remove, onValue, off } from 'firebase/database';
import { CheckBox } from 'react-native-elements';
import { useIsFocused } from '@react-navigation/native';
import EditTask from './EditTask';
import AddTask from './AddTask';
import { useRoute } from '@react-navigation/native';

const PRIORITY_ICONS = {
  'High Priority': require('../assets/Icons/high.png'),
  'Medium Priority': require('../assets/Icons/medium.png'),
  'Low Priority': require('../assets/Icons/low.png'),
  // No Priority does not need an icon
};
const ListScreen = () => {
  const [lists, setLists] = useState({});
  const [selectedListId, setSelectedListId] = useState('listId1'); // Default 'Inbox' list selected
  const [tasks, setTasks] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isNewListModalVisible, setIsNewListModalVisible] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [currentListId, setCurrentListId] = useState(null);
  const [checkedItems, setCheckedItems] = useState({}); // New state to track checked item
  const [editTask, setEditTask] = useState(null); // State to track the task being edited
  const isFocused = useIsFocused(); // Refresh the page
  const [todayTasks, setTodayTasks] = useState([]);

  const route = useRoute();
  const initialListId = route.params?.selectedListId ?? 'listId1';

  const user = auth.currentUser;
  const userUID = user ? user.uid : ''; // Get the current user's UID

  
  // Route
  useEffect(() => {
    if (route.params?.selectedListId) {
      setSelectedListId(route.params.selectedListId);
    }
  }, [route.params?.selectedListId]);

  const updateTasks = (newTask) => {
    setTodayTasks([...todayTasks, newTask]);
  };

  useEffect(() => {
    if (isFocused) {
      fetchLists();
      fetchTasksForList(selectedListId);
    }
  }, [isFocused, selectedListId]);

  const fetchLists = async () => {
    const listsRef = ref(database, 'Lists/Lists');
    try {
      const snapshot = await get(listsRef);
      if (snapshot.exists()) {
        const allLists = snapshot.val();

        // Filter lists based on userUID
        const filteredLists = Object.keys(allLists).reduce((acc, key) => {
          if (allLists[key].UID === userUID || key === "listId1") {
            acc[key] = allLists[key];
          }
          return acc;
        }, {});

        setLists(filteredLists);
      } else {
        setLists({});
      }
    } catch (error) {
      console.error('Error fetching lists:', error);
    }
  };

  const addNewList = async () => {
    if (newListName.trim() !== '') {
      const newListRef = ref(database, 'Lists/Lists');
      const newListKey = (await push(newListRef)).key;
      await set(ref(database, `Lists/Lists/${newListKey}`), {
        name: newListName,
        UID: userUID, // Add UID as the current user's UID
      });
      fetchLists();
      setNewListName('');
    }
  };

  const updateListName = async () => {
    if (newListName.trim() !== '' && currentListId) {
      await update(ref(database, `Lists/Lists/${currentListId}`), { name: newListName });
      fetchLists();
    }
    setIsModalVisible(false);
  };

  const deleteList = async () => {
    if (currentListId && currentListId !== 'listId1') {
      await remove(ref(database, `Lists/Lists/${currentListId}`));
      fetchLists();
    }
    setIsModalVisible(false);
  };

  const openModalForList = (listId, listName) => {
    setCurrentListId(listId);
    setNewListName(listName);
    setIsModalVisible(true);
  };

  const openNewListModal = () => {
    setNewListName('');
    setIsNewListModalVisible(true);
  };

  const confirmAddNewList = async () => {
    await addNewList();
    setIsNewListModalVisible(false);
  };

  const fetchTasksForList = (listId) => {
    const tasksRef = ref(database, 'Tasks');
  
    // Remove existing listeners to avoid memory leaks or multiple subscriptions
    off(tasksRef);
  
    onValue(tasksRef, (snapshot) => {
      if (snapshot.exists()) {
        const allTasks = snapshot.val();
        const filteredTasks = Object.keys(allTasks)
          .map((key) => ({
            id: key,
            ...allTasks[key],
          }))
          .filter((task) => task.list === listId && task.UID === userUID && task.status == 'uncompleted');
  
        // Update the tasks state
        setTasks(filteredTasks);
  
        // Update the checked items state based on the tasks' status
        const updatedCheckedItems = filteredTasks.reduce((acc, task) => {
          acc[task.id] = task.status === 'completed';
          return acc;
        }, {});
  
        setCheckedItems(updatedCheckedItems);
      } else {
        setTasks([]);
        setCheckedItems({});
      }
    });
  };
  
// Function to increment CompletedTasks
const incrementCompletedTasks = async () => {
  const userUID = user ? user.uid : null; // Make sure you have the user's UID
  if (!userUID) return; // Exit if user UID is not available

  const completedTasksRef = ref(database, `Users/${userUID}/CompletedTasks`);
  get(completedTasksRef).then((snapshot) => {
    let currentCompletedTasks = snapshot.exists() ? snapshot.val() : 0;
    currentCompletedTasks += 1; // Increment the counter
    update(ref(database, `Users/${userUID}`), { CompletedTasks: currentCompletedTasks });
  }).catch((error) => {
    console.error('Failed to increment CompletedTasks:', error);
  });
};

const handleCheckboxPress = async (taskId, index) => {
  try {
    // Update the task status in Firebase
    await update(ref(database, `Tasks/${taskId}`), { status: 'completed' });

    // Update the task status in the state
    const updatedTasks = [...tasks];
    updatedTasks[index].checked = true;
    setTasks(updatedTasks);

    // Increment CompletedTasks by 1
    incrementCompletedTasks();

    // Wait for 0.5 seconds and then remove the task from the list
    setTimeout(() => {
      setTasks((prevTasks) => prevTasks.filter((_, idx) => idx !== index));
    }, 500);
  } catch (error) {
    console.error('Error handling checkbox press:', error);
  }
};


  const handleTaskPress = (taskId) => {
    const taskToEdit = tasks.find((task) => task.id === taskId);
    setEditTask(taskToEdit);
  };

  const handleCancel = () => {
    // Reset the editTask state to null
    setEditTask(null);
  };

  useEffect(() => {
    // Initialize checkedItems based on tasks' status
    if (tasks.length > 0) {
      const initialCheckedState = tasks.reduce((acc, task) => {
        acc[task.id] = task.status === 'completed';
        return acc;
      }, {});
      setCheckedItems(initialCheckedState);
    }
  }, [tasks]);

  useEffect(() => {
    if (selectedListId) {
      fetchTasksForList(selectedListId);
    }
  }, [selectedListId]);

  return (
    <View style={styles.container}>
      <View style={styles.ScrollViewContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.navigationBar}>
          {/* Render 'Inbox' first if it exists */}
          {lists['listId1'] && (
            <TouchableOpacity
              style={[styles.listItem, selectedListId === 'listId1' && styles.selectedListItem]}
              onPress={() => setSelectedListId('listId1')}
            >
              <Text style={styles.listItemText}>{lists['listId1'].name}</Text>
            </TouchableOpacity>
          )}

          {/* Render other lists */}
          {Object.entries(lists)
            .filter(([key]) => key !== 'listId1')
            .map(([key, value]) => (
              <TouchableOpacity
                key={key} // Unique key for each list item
                style={[styles.listItem, selectedListId === key && styles.selectedListItem]}
                onPress={() => setSelectedListId(key)}
                onLongPress={() => key !== 'listId1' && openModalForList(key, value.name)}
              >
                <Text style={styles.listItemText}>{value.name}</Text>
              </TouchableOpacity>
            ))}

          <TouchableOpacity style={styles.addButton} onPress={openNewListModal}>
            <Text style={styles.addButtonText}>+ Add List</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
      <View style={styles.taskContainer}>
        {/* Display tasks for the selected list */}
        <FlatList
          data={tasks}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => (
            <TouchableOpacity onPress={() => handleTaskPress(item.id)}>
              <View style={styles.taskItem}>
                <CheckBox
                  checked={item.checked}
                  onPress={() => handleCheckboxPress(item.id, index)}
                />
                <View style={styles.taskItemRow}>
                  
                  <Text style={[styles.taskTitle, item.checked && styles.completedTaskTitle]}>
                    {item.title}
                  </Text>
                      {/* Display priority icon based on the task's priority */}
                      {item.priority && PRIORITY_ICONS[item.priority] && 
                        <Image source={PRIORITY_ICONS[item.priority]} style={styles.priorityIcon} />
                  }
                  <Text style={styles.taskDueDate}>
                    {item.dueDate} {item.time}
                  </Text>
               
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
      </View>
      {/* Modal for updating/deleting lists */}
      <Modal
        visible={isModalVisible}
        animationType="none"
        transparent={true}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.smallModalContainer}>
          <TextInput
            style={styles.input}
            placeholder="List Name"
            value={newListName}
            onChangeText={setNewListName}
          />
          <View style={styles.modalButtons}>
            <TouchableOpacity style={styles.modalButton} onPress={updateListName}>
              <Text style={styles.buttonText}>Confirm</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalButton} onPress={deleteList}>
              <Text style={styles.buttonText}>Delete</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalButton} onPress={() => setIsModalVisible(false)}>
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal for adding new lists */}
      <Modal
        visible={isNewListModalVisible}
        animationType="none"
        transparent={true}
        onRequestClose={() => setIsNewListModalVisible(false)}
      >
        <View style={styles.smallModalContainer}>
          <TextInput
            style={styles.input}
            placeholder="New List Name"
            value={newListName}
            onChangeText={setNewListName}
          />
          <View style={styles.modalButtons}>
            <TouchableOpacity style={styles.modalButton} onPress={confirmAddNewList}>
              <Text style={styles.buttonText}>Confirm</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalButton} onPress={() => setIsNewListModalVisible(false)}>
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Conditional rendering of EditTask component */}
      {editTask && (
        <EditTask
          initialTask={editTask}
          onTaskAdded={() => {
            // Reset the edited task and fetch updated tasks
            setEditTask(null);
            fetchTasksForList(selectedListId);
          }}
          handleCancel={handleCancel}
        />
      )}
      <View style={styles.addTaskButton}>
        <AddTask onTaskAdded={updateTasks} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5FCFF',
  },
  navigationBar: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    padding: 10,
    flexWrap: 'wrap', // Allow wrapping of list items
  },
  listItem: {
    padding: 8,
    marginHorizontal: 5,
    backgroundColor: '#e0e0e0',
    borderRadius: 5,
  },
  selectedListItem: {
    borderBottomWidth: 2,
    borderBottomColor: '#ff9900',
  },
  listItemText: {
    fontSize: 16,
  },
  addButton: {
    padding: 8,
  },
  addButtonText: {
    fontSize: 16,
  },
  smallModalContainer: {
    position: 'absolute',
    top: 60, // Adjust this value to position the modal right below the list line
    alignSelf: 'center',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: '80%', // Adjust width as per your design requirements
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    width: '100%',
    padding: 10,
    borderWidth: 1,
    borderColor: 'gray',
    borderRadius: 4,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  modalButton: {
    backgroundColor: '#2196f3',
    padding: 10,
    borderRadius: 4,
    marginHorizontal: 10,
  },
  buttonText: {
    color: 'white',
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  taskItemRow: {
    flexDirection: 'row', // Ensure content is in a row
    alignItems: 'center', // Align items vertically
    flex: 1, // Take up all available space
  },
taskTitle: {
    flex: 1,
    fontSize: 16,
    marginLeft: 10,
},
completedTaskTitle: {
    textDecorationLine: 'line-through',
    color: 'grey',
},
taskDueDate: {
    fontSize: 14,
    color: 'grey',
    marginLeft: 10,
},
addTaskButton:{
flex:1,
padding:20
},
priorityIcon: {
  width: 20, // Adjust size as needed
  height: 20, // Adjust size as needed
  marginRight: 5, // Add some space between the icon and text
},
});

export default ListScreen;
