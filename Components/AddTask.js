import React, { useState, useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, Dimensions,KeyboardAvoidingView, Platform,TouchableWithoutFeedback, Keyboard } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { database } from '../firebaseConfig';
import { push, ref, set, get, onValue,off } from 'firebase/database';
import { useAuth } from '../AuthContext';
import { Button, Input, Icon } from 'react-native-elements';
import DropDownPicker from 'react-native-dropdown-picker';
import analyzeTaskDescription from './TaskNLP';
import moment from 'moment'; // Import moment here

const { width, height } = Dimensions.get('window');

const AddTask = ({ onTaskAdded }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState(new Date());
  const [time, setTime] = useState(new Date(new Date().setHours(0, 0, 0, 0)));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [priority, setPriority] = useState('No priority');
  const [list, setList] = useState('listId1'); // Default list
  const [openPriorityDropdown, setOpenPriorityDropdown] = useState(false);
  const [openListDropdown, setOpenListDropdown] = useState(false);
  const { user } = useAuth();
  const [timeSet, setTimeSet] = useState(false); // New state to track if time has been set by user

  const userUID = user ? user.uid : ''; // Get the current user's UID

  const [listItems, setListItems] = useState([]);
  const timeStr = moment(time).format('HH:mm'); // Format time using moment.js

  // Update handleDateChange to set default date and prevent past date selection
  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);

    if (selectedDate) {
      if (selectedDate){
        setDueDate(selectedDate); // Update dueDate with the selected date
      }
    } 
  };


  const priorityItems = [
    { label: 'High Priority', value: 'High Priority' },
    { label: 'Medium Priority', value: 'Medium Priority' },
    { label: 'Low Priority', value: 'Low Priority' },
    { label: 'No Priority', value: 'No Priority' }
  ];


  const fetchListNames = () => {
    const listsRef = ref(database, 'Lists/Lists');
  
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
    }, (error) => {
      console.error('Error fetching lists:', error);
    });
  };
  
  useEffect(() => {
    fetchListNames();
    // Remember to clean up the listener when the component unmounts
    return () => {
      const listsRef = ref(database, 'Lists/Lists');
      // Assuming you have defined an 'off' function or you're using Firebase's off method to remove listeners
      off(listsRef); // This might need to be adjusted based on your actual cleanup code
    };
  }, [userUID]); // Add userUID as a dependency to refetch when the user changes
  
  
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

  const handleCancel = () => {
    // Resetting all the state variables to their initial values
    setTitle('');
    setDescription('');
    setDueDate(new Date());
    setPriority('No priority');
    setTime(new Date(new Date().setHours(0, 0, 0, 0)));
    hideDropdowns();
    hideDateAndTimePickers();
    setModalVisible(false); // Also close the modal
    setList('listId1'); // Set the list back to 'Inbox'
    setOpenPriorityDropdown(false);
    setOpenListDropdown(false);
    setShowDatePicker(false);
    setShowTimePicker(false);
    setTimeSet(false); // Reset the timeSet flag
    setModalVisible(false);

  };


  const handleAddTask = async () => {
    if (!user) {
      console.log('No authenticated user found');
      return;
    }
  
    // Combine title and description for NLP analysis
    const combinedText = `${title}. ${description}`;
    const analysisResult = analyzeTaskDescription(combinedText);
  
    // Prepare the task object with NLP results or default values
    let newDueDate = analysisResult.date ? analysisResult.date : moment(dueDate).format('YYYY-MM-DD');
    let newPriority = analysisResult.priority !== 'No priority' ? analysisResult.priority : priority;
    
    let newTime;
    // If the NLP analysis returns a time, use it. Otherwise, check if the user has set a time.
    if (analysisResult.time) {
      // NLP detected a time pattern, use it
      newTime = moment(analysisResult.time, 'HH:mm').toDate();
    } else if (timeSet) {
      // User explicitly set a time, use it
      newTime = time;
    } else {
      // No time set by the user and no NLP detected time pattern, default to 00:00
      newTime = new Date(newDueDate);
      newTime.setHours(0, 0, 0, 0); // Set time to 00:00
    }
  
    // Format time for storage
    const formattedTime = moment(newTime).format('HH:mm'); // Format time as 'HH:mm'
  
    try {
      const newTask = {
        UID: user.uid,
        title,
        description,
        dueDate: newDueDate,
        time: formattedTime,
        priority: newPriority,
        status: 'uncompleted',
        list
      };
  
      // Add the new task to Firebase
      const newTaskRef = push(ref(database, 'Tasks'));
      await set(newTaskRef, newTask);
  
      console.log('Task added successfully');
      setModalVisible(false); // Close the modal
      // Reset form fields and flags
      setTitle('');
      setDescription('');
      setDueDate(new Date());
      setTime(new Date(new Date().setHours(0, 0, 0, 0)));
      setPriority('No Priority');
      setList('listId1');
      setTimeSet(false); // Reset the timeSet flag
      onTaskAdded(newTask); // Optional callback
    } catch (error) {
      console.error('Error adding task:', error);
    }
  };
  

  
  
  return (

  
    <View style={styles.container}>
      <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
        <Text style={styles.addButtonText}>+</Text>
      </TouchableOpacity>
      <KeyboardAvoidingView
    style={styles.container}
    behavior={Platform.OS === "ios" ? "padding" : "height"}
    enabled
  >
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => handleCancel()}>
            <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>

        <View style={styles.modalView}>
          <Input
            placeholder="Title"
            value={title}
            onChangeText={setTitle}
          />
          {/* multiple lines for description */}
        <Input
        placeholder="Description"
        value={description}
        onChangeText={setDescription}
        multiline={true}
        numberOfLines={4} 
        style={{ textAlignVertical: 'top' }} // Needed for Android to align text to the top
      />


          <View style={styles.iconRow}>
          <TouchableOpacity onPress={toggleDatePicker}>
              <Icon name="calendar" type="font-awesome" size={30} />
            </TouchableOpacity>
            <TouchableOpacity onPress={toggleTimePicker}>
              <Icon name='clock-o' type='font-awesome' size={30} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => {
              setOpenPriorityDropdown(!openPriorityDropdown);
              setOpenListDropdown(false);
              hideDateAndTimePickers();
            }}>
              <Icon name='flag' type='font-awesome' size={30} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => {
              setOpenListDropdown(!openListDropdown);
              setOpenPriorityDropdown(false);
              hideDateAndTimePickers();
            }}>
              <Icon name='list' type='font-awesome' size={30} />
            </TouchableOpacity>
          </View>

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

          {showDatePicker && (
                <DateTimePicker
                  value={dueDate}
                  mode="date"
                  display="default"
                  onChange={handleDateChange} // Use the updated handler
                />
              )}

          {showTimePicker && (
            <DateTimePicker
              value={time || new Date()}
              mode="time"
              display="default"
              onChange={(event, selectedTime) => {
                setShowTimePicker(false);
                if (selectedTime) {
                  setTime(selectedTime);
                }
              }}
            />
          )}
          <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 20 }}>
            <Text style={{ color: 'grey', fontSize: 14 }}>
               {moment(dueDate).format('MMM-DD')}   {moment(time).format('HH:mm')}   {priority}   {listItems.find(item => item.value === list)?.label}
            </Text>
          </View>

          <View style={styles.buttonContainer}>
            <Button title="Add Task" onPress={handleAddTask} containerStyle={styles.button} buttonStyle={{ backgroundColor: '#2196f3' }}/>
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
  addButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#ff9900',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    bottom: 20,
    right: 20,
  },
  addButtonText: {
    fontSize: 30,
    color: 'white',
  },
  modalView: {
    margin: 20,
    marginTop: height / 4, // Positioning the modal in the middle of the screen
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
  input: {
    width: 200,
    borderBottomWidth: 1,
    marginBottom: 10,
  }, 
   buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: width - 100, // Dynamic width based on screen size
    marginTop:20
  },
  button: {
    width: '45%', // Equal width for buttons
  },
  iconButton: {
    width: 30,
    height: 30,
    resizeMode: 'contain', // This ensures the icons maintain their aspect ratio
  },
  iconRow: {//keep all icons in a row
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    width: '100%',
    marginVertical: 10,
  },
});

export default AddTask;