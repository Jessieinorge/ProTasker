import React, { useState } from 'react';
import { View, Text, Modal, StyleSheet, TouchableOpacity, TextInput,TouchableWithoutFeedback,Keyboard,} from 'react-native';
import { usePomodoro } from './PomodoroContext'; // Adjust the path as necessary


const NumericStepper = ({ value, setValue, minValue = 1 }) => {
    const handleIncrease = () => {
        setValue(prevValue => Math.max(Number(prevValue) + 1, minValue));
    };
  
    const handleDecrease = () => {
        setValue(prevValue => Math.max(Number(prevValue) - 1, minValue));
    };
  
    return (
      <View style={styles.stepperContainer}>
        <TouchableOpacity onPress={handleDecrease} style={styles.stepperButton}>
          <Text style={styles.stepperButtonText}>-</Text>
        </TouchableOpacity>
        <Text style={styles.stepperValue}>{value}</Text>
        <TouchableOpacity onPress={handleIncrease} style={styles.stepperButton}>
          <Text style={styles.stepperButtonText}>+</Text>
        </TouchableOpacity>
      </View>
    );
  };

const PomodoroSettingsModal = ({ isVisible, onClose }) => {
  const { pomodoroDuration, setPomodoroDuration, shortRestDuration, setShortRestDuration,
          longRestDuration, setLongRestDuration, sessionsBeforeLongBreak, setSessionsBeforeLongBreak,
          resetSettings } = usePomodoro();

  // Local state to handle temporary changes
  const [localPomodoroDuration, setLocalPomodoroDuration] = useState(pomodoroDuration.toString());
  const [localShortRestDuration, setLocalShortRestDuration] = useState(shortRestDuration.toString());
  const [localLongRestDuration, setLocalLongRestDuration] = useState(longRestDuration.toString());
  const [localSessionsBeforeLongBreak, setLocalSessionsBeforeLongBreak] = useState(sessionsBeforeLongBreak.toString());

  const handleSave = () => {
    // Convert local state back to integers and update global context
    setPomodoroDuration(parseInt(localPomodoroDuration));
    setShortRestDuration(parseInt(localShortRestDuration));
    setLongRestDuration(parseInt(localLongRestDuration));
    setSessionsBeforeLongBreak(parseInt(localSessionsBeforeLongBreak));
    onClose();
  };

  const handleReset = () => {
    resetSettings();
    setPomodoroDuration(25);
    setShortRestDuration(5);
    setLongRestDuration(20);
    setSessionsBeforeLongBreak(4);
     // Update the local component state to reflect these defaults
    setLocalPomodoroDuration('25');
    setLocalShortRestDuration('5');
    setLocalLongRestDuration('20');
    setLocalSessionsBeforeLongBreak('4');
    onClose();
  };

  return (
    <Modal
      visible={isVisible}
      animationType="none"
      transparent={true}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>

      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <Text style={styles.modalText}>Pomodoro Settings</Text>
        
        <View style={styles.inputContainer}>
          <View style={styles.settingRow}>
             <View style={styles.labelContainer}>
                <Text>Duration(mins):</Text>
            </View>
            <NumericStepper value={localPomodoroDuration} setValue={setLocalPomodoroDuration} />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.labelContainer}>
                <Text>Short Rest(mins):</Text>
            </View>
            <NumericStepper value={localShortRestDuration} setValue={setLocalShortRestDuration} />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.labelContainer}>
                <Text>Long Rest(mins):</Text>
            </View>

            <NumericStepper value={localLongRestDuration} setValue={setLocalLongRestDuration} />
            </View>

          <View style={styles.settingRow}>
            <View style={styles.labelContainer}>
              <Text>Sessions Before Long Break:</Text>
            </View>
            <NumericStepper value={localSessionsBeforeLongBreak} setValue={setLocalSessionsBeforeLongBreak} />
          </View>
        </View>
          <View style={styles.buttonRow}>

          <TouchableOpacity style={[styles.button, styles.buttonClose]} onPress={handleSave}>
            <Text style={styles.textStyle}>Save</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.button, styles.buttonClose]} onPress={handleReset}>
            <Text style={styles.textStyle}>Reset</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.button, styles.buttonClose]} onPress={onClose}>
            <Text style={styles.textStyle}>Close</Text>
          </TouchableOpacity>
        </View>
        </View>
      </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 22
  },
  modalView: {
    margin: 20,
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
  button: {
    borderRadius: 5,
    padding: 10,
    elevation: 2,
    marginTop: 10,
    flex: 1, // Make buttons flex to distribute evenly
    backgroundColor: "#2196f3",
    marginHorizontal: 5,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    width: '100%', // Make sure the buttons stretch across the modal
  },
  buttonClose: {
    backgroundColor: "#2196F3",
  },
  textStyle: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center"
  },
  modalText: {
    marginBottom: 15,
    textAlign: "center",
    fontWeight: "bold",
    fontSize: 18,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between', // This aligns items on both ends
    alignItems: 'center', // Keeps items vertically centered
    width: '100%', // Ensures the row takes full width
    marginBottom: 10, // Adds some space between rows
  },
  labelContainer: {
    flex: 1, // Takes up 1/3 of the container for the label
    alignItems: 'flex-start', // Aligns the text to the left
  },
  input: {
    borderWidth: 1,
    borderColor: 'gray',
    marginLeft: 10,
    width: 50,
    padding: 10,
    textAlign: 'center',
  }, 
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepperButton: {
    backgroundColor: '#ddd',
    padding: 5,
    margin: 2,
  },
  stepperContainer: {
    flex: 1, // Takes up 2/3 of the container for the stepper, adjust as needed
    flexDirection: 'row',
    justifyContent: 'center', // Centrally aligns the stepper buttons and value
    alignItems: 'center',
  },

  stepperValue: {
    minWidth: 40,
    textAlign: 'center',
    fontSize: 16,
  },
});

export default PomodoroSettingsModal;
