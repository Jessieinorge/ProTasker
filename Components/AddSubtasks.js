import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet, Keyboard } from 'react-native';
import { database } from '../firebaseConfig';
import { ref, set, update, remove, onValue,off } from 'firebase/database';
import { TouchableWithoutFeedback } from 'react-native-gesture-handler';
import Icon from 'react-native-vector-icons/FontAwesome';

const AddSubTasks = ({ taskId, isVisible, onClose }) => {
  const [subtasks, setSubtasks] = useState({});
  const [subtaskIds, setSubtaskIds] = useState([]);

  useEffect(() => {
    // Fetch existing subtasks for the current task
    const subtasksRef = ref(database, `Tasks/${taskId}/subtasks`);
    onValue(subtasksRef, (snapshot) => {
      if (snapshot.exists()) {
        setSubtasks(snapshot.val());
        setSubtaskIds(Object.keys(snapshot.val()));
      }
    });

    return () => {
      // Cleanup listener
      off(subtasksRef);
    };
  }, [taskId]);

  const handleSubtaskChange = (text, id) => {
    const newSubtasks = { ...subtasks, [id]: text };
    setSubtasks(newSubtasks);
  };

  const addNewSubtask = () => {
    const newId = `subtask${subtaskIds.length + 1}`;
    setSubtaskIds([...subtaskIds, newId]);
    handleSubtaskChange('', newId);
  };

  const deleteSubtask = (id) => {
    const {[id]: _, ...remainingSubtasks} = subtasks;
    setSubtasks(remainingSubtasks);
    setSubtaskIds(subtaskIds.filter(subtaskId => subtaskId !== id));
  };

  const saveSubtasks = async () => {
    const updates = {};
    Object.entries(subtasks).forEach(([id, description]) => {
      if (description.trim() === '' && subtaskIds.length > 1) {
        // Delete empty subtask from database except it is the last input field
        updates[`Tasks/${taskId}/subtasks/${id}`] = null;
      } else {
        // Update non-empty subtasks
        updates[`Tasks/${taskId}/subtasks/${id}`] = description;
      }
    });

    try {
      await update(ref(database), updates);
      onClose();
    } catch (error) {
      console.error('Error updating subtasks:', error);
    }
  };

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Manage Subtasks</Text>
            {subtaskIds.map((id) => (
              <View key={id} style={styles.subtaskInputContainer}>
                <TextInput
                  style={styles.subtaskInput}
                  onChangeText={(text) => handleSubtaskChange(text, id)}
                  value={subtasks[id]}
                  placeholder="Enter subtask"
                />
                {subtaskIds.length > 1 && (
                  <TouchableOpacity onPress={() => deleteSubtask(id)}>
                    <Icon name="times" size={20} color="#ff6347" />
                  </TouchableOpacity>
                )}
              </View>
            ))}
            <View style={styles.buttonContainer}>
              <TouchableOpacity style={styles.button} onPress={addNewSubtask}>
                <Text style={styles.buttonText}>Add Subtask</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.button} onPress={saveSubtasks}>
                <Text style={styles.buttonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    width: '90%',
    borderRadius: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtaskInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  subtaskInput: {
    flex: 1,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    marginRight: 10,
    padding: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  button: {
    backgroundColor: '#2196F3',
    padding: 10,
    borderRadius: 4,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default AddSubTasks;
