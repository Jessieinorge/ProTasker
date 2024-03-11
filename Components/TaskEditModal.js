
import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TextInput, Button, StyleSheet } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { database } from '../firebaseConfig';
import { ref, update } from 'firebase/database';

const TaskEditModal  = ({ isVisible, task, onClose, onSave }) => {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description);
  const [dueDate, setDueDate] = useState(new Date(task.dueDate));
  const [time, setTime] = useState(task.time || null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [priority, setPriority] = useState(task.priority);

  const handleSaveChanges = async () => {
    try {
      const updatedTask = {
        ...task,
        title,
        description,
        dueDate: dueDate.toISOString().split('T')[0],
        time: time ? time.toISOString().split('T')[1].substring(0, 5) : null,
        priority,
      };

      // Update the task in the Firebase database
      await update(ref(database, `Tasks/${task.id}`), updatedTask);

      // Close the modal and pass the updated task to the parent component
      onClose();
      onSave(updatedTask);
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}>
      <View style={styles.modalView}>
        <TextInput
          placeholder="Title"
          value={title}
          onChangeText={setTitle}
        />
        <TextInput
          placeholder="Description"
          value={description}
          onChangeText={setDescription}
        />


{showPriorityPicker && (
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



          {showDatePicker && (
            <DateTimePicker
              value={dueDate}
              mode="date"
              display="default"
              onChange={(event, selectedDate) => {
                setShowDatePicker(false);
                if (selectedDate) {
                  setDueDate(selectedDate);
                }
              }}
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
        

        <Button title="Save Changes" onPress={handleSaveChanges} />
        <Button title="Cancel" onPress={onClose} color="red" />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalView: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
  },
  // Add your styles as needed
});

export default TaskEditModal;
