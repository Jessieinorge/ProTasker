import React, { useState, useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, Dimensions, KeyboardAvoidingView, Platform,TouchableWithoutFeedback, Keyboard, FlatList,TextInput } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { database } from '../firebaseConfig';
import { ref, get, update, remove, onValue,off, set} from 'firebase/database';
import { useAuth } from '../AuthContext';
import { Button, Input, Icon } from 'react-native-elements';
import DropDownPicker from 'react-native-dropdown-picker';
import analyzeTaskDescription from './TaskNLP'; // Make sure this import is correct based on your file structure
import moment from 'moment'; // Import moment here
import { CheckBox } from 'react-native-elements';
import FontAwesome from 'react-native-vector-icons/FontAwesome';

const { width, height } = Dimensions.get('window');

const EditTask = ({ onTaskAdded, initialTask }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [taskId, setTaskId] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState(new Date());
  const [time, setTime] = useState(new Date(new Date().setHours(0, 0, 0, 0)));
  const [priority, setPriority] = useState('No priority');
  const [list, setList] = useState('listId1'); // Default list
  const { user } = useAuth();
  const userUID = user ? user.uid : ''; // Get the current user's UID
  const [listItems, setListItems] = useState([]);
  // Dropdown and Picker visibility state

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [openPriorityDropdown, setOpenPriorityDropdown] = useState(false);
  const [openListDropdown, setOpenListDropdown] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [showDeleteConfirmation1, setShowDeleteConfirmation1] = useState(false);

  //subtasks
  const [subtasks, setSubtasks] = useState([]);
  const [checkedSubtasks, setCheckedSubtasks] = useState(new Set());
  const [showSubtaskInput, setShowSubtaskInput] = useState(false);
  const [newSubtask, setNewSubtask] = useState('');
  const [selectedSubtask, setSelectedSubtask] = useState(null); // New state for selected subtask ID

  const timeStr = time.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });


  useEffect(() => {
    if (initialTask) {
      setModalVisible(true);
      setTaskId(initialTask.id);
      setTitle(initialTask.title);
      setDescription(initialTask.description);
      setDueDate(new Date(initialTask.dueDate));
      fetchSubtasks(initialTask.id);
       // Create a new Date object for setting the time
        const timeParts = initialTask.time.split(':');
        const taskTime = new Date();
        taskTime.setHours(parseInt(timeParts[0]), parseInt(timeParts[1]), 0, 0);
        setTime(taskTime);

      if (initialTask.time) {
        const timeParts = initialTask.time.split(':');
        const taskTime = new Date();
        taskTime.setHours(timeParts[0], timeParts[1]);
        setTime(taskTime);
      } else {
        setTime(new Date());
      }

      setPriority(initialTask.priority);
      setList(initialTask.list);
    }
  }, [initialTask]);

 //to fetch subtasks 
 const fetchSubtasks = (taskId) => {
  const taskRef = ref(database, `Tasks/${taskId}`);

  onValue(taskRef, (snapshot) => {
    const taskData = snapshot.val();
    const fetchedSubtasks = [];

    // Directly access subtask properties from taskData
    Object.keys(taskData).forEach((key) => {
      if (key.startsWith("subtask") && taskData[key]) {
        // Assumes subtask properties are direct strings. Adjust if the structure is different.
        fetchedSubtasks.push({
          id: key,
          description: taskData[key],
          // Add more properties here if necessary
        });
      }
    });

    setSubtasks(fetchedSubtasks);
  }, { onlyOnce: true });
};

const saveSubtask = async () => {
  if (newSubtask.trim().length === 0) {
    setShowSubtaskInput(false);
    return; // Do nothing if the input is empty
  }

  // Find the highest subtask number or start with 1
  const nextSubtaskId = `subtask${subtasks.length + 1}`;

  // Save the new subtask to Firebase
  try {
    await set(ref(database, `Tasks/${taskId}/${nextSubtaskId}`), newSubtask.trim());
    console.log('Subtask added successfully');
  } catch (error) {
    console.error('Failed to add subtask:', error);
  }

  // Reset state and close the input field
  setNewSubtask('');
  setShowSubtaskInput(false);
  fetchSubtasks(taskId); // Optionally re-fetch subtasks to update the UI
};

    // Function to handle long press on subtask item
    const handleLongPress = (subtaskId) => {
      setShowDeleteConfirmation(true); // Show delete confirmation modal
      setSelectedSubtask(subtaskId); // Set the selected subtask ID
    };
  
 // Function to delete the selected subtask from the database
const handleDeleteSubtask = async () => {
  if (!user || !selectedSubtask) {
    console.log('No authenticated user or selectedSubtask found');
    return;
  }

  try {
    // Reference the subtask to be deleted
    const subtaskRef = ref(database, `Tasks/${taskId}/${selectedSubtask}`);

    // Remove the subtask from the database
    await remove(subtaskRef);

    console.log('Subtask deleted successfully');
    setShowDeleteConfirmation(false); // Hide delete confirmation modal

    // Fetch updated subtask list from the database
    fetchSubtasks(taskId);
  } catch (error) {
    console.error('Error deleting subtask:', error);
  }
};
  
  const fetchListNames = () => {
    const listsRef = ref(database, 'Lists/Lists');
    const userUID = user ? user.uid : ''; // Ensure we have the current user's UID
  
    onValue(listsRef, (snapshot) => {
      if (snapshot.exists()) {
        const listsData = snapshot.val();
        const fetchedLists = [];
  
        // Always include the default list 'listId1'
        if (listsData['listId1']) {
          fetchedLists.push({
            label: listsData['listId1'].name,
            value: 'listId1'
          });
        }
  
        // Include lists where UID matches the current user's UID
        Object.keys(listsData).forEach(key => {
          if (listsData[key].UID && listsData[key].UID === userUID) {
            fetchedLists.push({
              label: listsData[key].name,
              value: key
            });
          }
        });
  
        setListItems(fetchedLists);
      } else {
        console.log('No lists found in database');
        setListItems([]);
      }
    }, {
      onlyOnce: true // Optionally, you can use this if you only need to fetch the data once and not listen for real-time updates.
    });
  
    // Cleanup function
    return () => {
      // Properly remove the listener when the component unmounts
      off(listsRef, 'value');
    };
  };
  

useEffect(() => {
    fetchListNames();
    // Remember to clean up the listener when the component unmounts
    return () => {
        const listsRef = ref(database, 'Lists/Lists');
        off(listsRef);
    };
}, []);


  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
        setDueDate(selectedDate);

    }
  };

  const handleTimeChange = (event, selectedTime) => {
    setShowTimePicker(false);
    if (selectedTime) {
      setTime(selectedTime);
    }
  };

  const handleCancel = () => {
    setModalVisible(false);
  };

  const handleDeleteTask = async () => {
    if (!user || !taskId) {
      console.log('No authenticated user or taskId found');
      return;
    }
  
    try {
      // Reference the task to be deleted
      const taskRef = ref(database, `Tasks/${taskId}`);
  
      // Remove the task from the database
      await remove(taskRef);
  
      console.log('Task deleted successfully');
      setModalVisible(false);
  
      // Notify the parent component that the task has been deleted
      onTaskAdded(null); // Pass null to indicate task deletion
    } catch (error) {
      console.error('Error deleting task:', error);
    }

    setShowDeleteConfirmation1(false);

  };


  const handleUpdateTask = async () => {
    if (!user) {
      console.log('No authenticated user found');
      return;
    }

    // Combine title and description for NLP analysis
    const combinedText = `${title}. ${description}`;
    const analysisResult = analyzeTaskDescription(combinedText);

    // Prepare the task object with NLP results or default values
    let newDueDate = analysisResult.date ? moment(analysisResult.date).toDate() : dueDate;
    let newTime = analysisResult.time ? moment(analysisResult.time, 'HH:mm').toDate() : time;
    let newPriority = analysisResult.priority !== 'No priority' ? analysisResult.priority : priority;

    // Format dueDate and time for storage
    const formattedDueDate = moment(newDueDate).format('YYYY-MM-DD');
    const formattedTime = moment(newTime).format('HH:mm');

    try {
        const updatedTask = {
            title,
            description,
            dueDate: formattedDueDate,
            time: formattedTime,
            priority: newPriority,
            list
        };

        await update(ref(database, `Tasks/${taskId}`), updatedTask);
        console.log('Task updated successfully');
        setModalVisible(false);
        onTaskAdded({...updatedTask, id: taskId}); // Include task ID in the callback
    } catch (error) {
        console.error('Error updating task:', error);
    }
};

  const priorityItems = [
    { label: 'High Priority', value: 'High Priority' },
    { label: 'Medium Priority', value: 'Medium Priority' },
    { label: 'Low Priority', value: 'Low Priority' },
    { label: 'No Priority', value: 'No Priority' }
  ];

  const hideDateAndTimePickers = () => {
    setShowDatePicker(false);
    setShowTimePicker(false);
  };

  const hideDropdowns = () => {
    setOpenPriorityDropdown(false);
    setOpenListDropdown(false);
  };

  const toggleDatePicker = () => {
    setShowDatePicker(!showDatePicker);
    setShowTimePicker(false);
    hideDropdowns();
  };

  const toggleTimePicker = () => {
    setShowTimePicker(!showTimePicker);
    setShowDatePicker(false);
    hideDropdowns();
  };


  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        enabled
      >
        <Modal
          animationType="none"
          transparent={true}
          visible={modalVisible}
          onRequestClose={handleCancel}
        >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>

          <View style={styles.modalView}>
            <Input
              placeholder="Title"
              value={title}
              onChangeText={setTitle}
              inputContainerStyle={{ borderBottomColor: 'white', borderBottomWidth: 1 }} // remove the divider
              inputStyle={{ color: 'white' }} // Sets font color to white

            />
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Input
              placeholder="Description"
              value={description}
              onChangeText={setDescription}
              multiline={true}
              numberOfLines={4}
              containerStyle={{ flex: 1 }} // Adjust this to manage space
              style={{ textAlignVertical: 'top' }}
              inputContainerStyle={{ borderBottomColor: 'white', borderBottomWidth: 1 }}// remove the divider
              inputStyle={{ color: 'white' }} // Sets font color to white
            />
             <TouchableOpacity
                onPress={() => setShowSubtaskInput(true)}
                style={{ marginLeft: 10, padding: 10 }}
              >
                <Icon name="plus" type="font-awesome" color="white" size={20} />
              </TouchableOpacity>
            </View>
          
            {
                showSubtaskInput && (
                  <View style={styles.subtaskInputContainer}>
                    <TextInput
                      autoFocus
                      style={[styles.subtaskInput, { color: 'white' }]} 
                      value={newSubtask}
                      onChangeText={setNewSubtask}
                      placeholder="Enter subtask..."
                    />
                    <View style={styles.subtaskButtons}>
                      <TouchableOpacity
                        onPress={() => {
                          saveSubtask();
                          // No need to explicitly call setShowSubtaskInput(false) here
                          // It will be handled in saveSubtask()
                        }}
                        style={styles.subtaskSaveButton}
                      >
                        <FontAwesome name="check" color="white" size={20} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => {
                          setNewSubtask('');
                          setShowSubtaskInput(false);
                        }}
                      
                        style={styles.subtaskCancelButton}
                      >
                         <FontAwesome name="times" color="white" size={20} />
                      </TouchableOpacity>
                    </View>
                  </View>
                )
              }

       <FlatList
            data={subtasks}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                onLongPress={() => handleLongPress(item.id)} // Long press action
              >
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 40,
                //backgroundColor: '#f0f0f0', // Example background color, adjust as needed
                alignSelf: 'stretch', // Makes the item's background stretch to the full width of the FlatList
                marginLeft: 20, 
                marginRight: 20, 
                marginBottom:10,
                borderRadius: 5, // Optional: rounds the corners of the background
                borderWidth:1,
                borderColor:"white"
              }}>
                <CheckBox
                  checked={checkedSubtasks.has(item.id)}
                  onPress={() => {
                    let newChecked = new Set(checkedSubtasks);
                    if (newChecked.has(item.id)) {
                      newChecked.delete(item.id);
                    } else {
                      newChecked.add(item.id);
                    }
                    setCheckedSubtasks(newChecked);
                  }}
                />
                <Text style={{ 
                  color: checkedSubtasks.has(item.id) ? 'lightgrey' : 'white',
                  textDecorationLine: checkedSubtasks.has(item.id) ? 'line-through' : 'none'
                }}>
                  {item.description}
                </Text>
              </View>
              </TouchableOpacity>
            )}
          />

 {/* Delete confirmation modal */}
 <Modal
            animationType="fade"
            transparent={true}
            visible={showDeleteConfirmation}
          >
            <View style={styles.confirmationModal}>
              <Text style={styles.confirmationText}>
                Are you sure you want to delete this subtask?
              </Text>
              <View style={styles.confirmationButtonContainer}>
                {/* Delete button */}
                <Button
                  title="Delete"
                  containerStyle={styles.confirmationButton}
                  buttonStyle={{ backgroundColor: 'red' }}
                  onPress={handleDeleteSubtask}
                />
                {/* Cancel button */}
                <Button
                  title="Cancel"
                  containerStyle={styles.confirmationButton}
                  onPress={() => setShowDeleteConfirmation(false)}
                  buttonStyle={{ backgroundColor: '#2196f3' }}
                />
              </View>
            </View>
          </Modal>


            {/* Icon Row for Date, Time, Priority, and List */}
            <View style={styles.iconRow}>
              <TouchableOpacity onPress={toggleDatePicker}>
                <Icon name="calendar" type="font-awesome" size={30} color="white"/>
              </TouchableOpacity>
              <TouchableOpacity onPress={toggleTimePicker}>
                <Icon name='clock-o' type='font-awesome' size={30} color="white"/>
              </TouchableOpacity>
              {/* Priority Dropdown */}
              <TouchableOpacity onPress={() => { setOpenPriorityDropdown(!openPriorityDropdown); hideDateAndTimePickers();setOpenListDropdown(false) }}>
                <Icon name='flag' type='font-awesome' size={30} color="white"/>
              </TouchableOpacity>
              {/* List Dropdown */}
              <TouchableOpacity onPress={() => { setOpenListDropdown(!openListDropdown); hideDateAndTimePickers();setOpenPriorityDropdown(false); }}>
                <Icon name='list' type='font-awesome' size={30} color="white"/>
              </TouchableOpacity>
            </View>

            {/* Priority Dropdown Picker */}
            {openPriorityDropdown && (
              <DropDownPicker
                open={openPriorityDropdown}
                value={priority}
                items={priorityItems}
                setOpen={setOpenPriorityDropdown}
                setValue={setPriority}
                zIndex={3000}
                style={styles.dropdownStyle}
                containerStyle={styles.dropdownContainerStyle}
              />
            )}

            {/* List Dropdown Picker */}
            {openListDropdown && (
              <DropDownPicker
                open={openListDropdown}
                value={list}
                items={listItems}
                setOpen={setOpenListDropdown}
                setValue={setList}
                zIndex={3000}
                style={styles.dropdownStyle}
                containerStyle={styles.dropdownContainerStyle}
              />
            )}

            {/* Date and Time Pickers */}
            {showDatePicker && (
              <DateTimePicker
                value={dueDate}
                mode="date"
                display="default"
                onChange={handleDateChange}
              />
            )}
            {showTimePicker && (
              <DateTimePicker
                value={time}
                mode="time"
                display="default"
                onChange={handleTimeChange}
              />
            )}
         <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 20 }}>
            <Text style={{ color: 'lightgrey', fontSize: 14 }}>
               {moment(dueDate).format('MMM-DD')}   {moment(time).format('HH:mm')}   {priority}   {listItems.find(item => item.value === list)?.label}
            </Text>
          </View>
            {/* Update and Cancel Buttons */}
            <View style={styles.buttonContainer}>
              <Button title="Update" onPress={handleUpdateTask} containerStyle={styles.button} buttonStyle={{ backgroundColor: '#2196f3' }} />
                 {/* Delete Task Button */}
                 <Button
                title="Delete"
                containerStyle={styles.button}
                buttonStyle={{ backgroundColor: 'red' }}
                onPress={() => setShowDeleteConfirmation1(true)}
              />

              {/* Delete Confirmation Dialog */}
              <Modal
                animationType="fade"
                transparent={true}
                visible={showDeleteConfirmation1}
              >
                <View style={styles.confirmationModal}>
                  <Text style={styles.confirmationText}>
                    Are you sure you want to delete this task?
                  </Text>
                  <View style={styles.confirmationButtonContainer}>
                    <Button
                      title="Delete"
                      containerStyle={styles.confirmationButton}
                      buttonStyle={{ backgroundColor: 'red' }}
                      onPress={handleDeleteTask}
                    />                   
                    <Button
                      title="Cancel"
                      containerStyle={styles.confirmationButton}
                      onPress={() => setShowDeleteConfirmation1(false)}
                    />
                 
                  </View>
                </View>
              </Modal>
              <Button title="Cancel" onPress={handleCancel} containerStyle={styles.button} buttonStyle={{ backgroundColor: '#ff9900' }} />
            </View>
          </View>
          </TouchableWithoutFeedback>

        </Modal>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',

  },
  modalView: {
    margin: 20,
    marginTop: height / 4,
    backgroundColor: "grey",
    borderRadius: 20,
    padding: 35,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5
  },
  confirmationModal:{
    margin: 20,
    marginTop: height / 2,
    backgroundColor: "white",
    borderRadius: 20,
    padding: 35,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5
  },
  confirmationButtonContainer:{
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    width: '100%',
    marginVertical: 10,
  },
  iconRow: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    width: '100%',
    marginVertical: 10,
  },
  dropdownStyle: {
    // Style for Dropdown Picker
  },
  dropdownContainerStyle: {
    // Container Style for Dropdown Picker
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: width - 100,
    marginTop: 20,
  },
  button: {
    width: '28%',
  },
  subtaskInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    marginTop: 10,
  },
  subtaskInput: {
    flex: 1,
    marginRight: 10,
    paddingHorizontal: 8,
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
  },
  subtaskButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  subtaskSaveButton: {
    // backgroundColor: '#2196f3',
    padding: 10,
    marginRight: 5,
    borderRadius:5,
    color: 'white',
  },
  subtaskCancelButton: {
    // backgroundColor: 'red',
    padding: 10,
    borderRadius:5,
    color: 'white',
  },
  
});

export default EditTask;