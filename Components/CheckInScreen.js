import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Modal, TouchableWithoutFeedback } from 'react-native';
import { ref, get, update } from 'firebase/database';
import { auth, database } from '../firebaseConfig';

const CheckInScreen = ({ isVisible, onClose }) => {
  const [hasCheckedIn, setHasCheckedIn] = useState(false);
  const user = auth.currentUser;
  const userUID = user ? user.uid : ''; // Get the current user's UID

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD
    const checkInPath = `Users/${userUID}/checkInHistory/${today}`;

    // Fetch today's check-in status
    const checkInRef = ref(database, checkInPath);
    get(checkInRef).then((snapshot) => {
      if (snapshot.exists() && snapshot.val().checkedIn) {
        setHasCheckedIn(true);
      } else {
        setHasCheckedIn(false);
      }
    }).catch((error) => {
      console.error('Failed to fetch check-in status:', error);
    });

  }, [userUID]);

  const handleCheckIn = async () => {
    const today = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD
    const checkInPath = `Users/${userUID}/checkInHistory/${today}`;
    const checkInDaysPath = `Users/${userUID}/CheckInDays`;
  
    try {
      // Fetch current CheckInDays
      const checkInDaysRef = ref(database, checkInDaysPath);
      const checkInDaysSnapshot = await get(checkInDaysRef);
      let currentCheckInDays = checkInDaysSnapshot.exists() ? checkInDaysSnapshot.val() : 0;
  
      // Update check-in status for today
      await update(ref(database, checkInPath), { checkedIn: true });
  
      // Increment CheckInDays and update in database
      await update(ref(database, `Users/${userUID}`), { CheckInDays: currentCheckInDays + 1 });
  
      setHasCheckedIn(true);
      Alert.alert("Check-In Success", "You have successfully checked in for today!");
    } catch (error) {
      console.error('Check-In Error:', error);
      Alert.alert("Check-In Failed", "Sorry, something went wrong.");
    }
  };
  

  return (
    <Modal
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
      animationType="none"
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalBackdrop}>
          <TouchableWithoutFeedback>
            <View style={styles.modalContainer}>
              <Text style={styles.title}>Daily Check-In</Text>
              <TouchableOpacity
                    style={[styles.button, hasCheckedIn ? styles.checkedInButton : styles.notCheckedInButton]}
                    onPress={handleCheckIn}
                    disabled={hasCheckedIn}
                  >
                    <Text style={styles.buttonText}>
                      {hasCheckedIn ? "Already Checked In" : "Check In for Today"}
                    </Text>
                  </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0)', // Optional: for better dimming effect
  },
  modalContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    width: '80%',
    maxWidth: 300,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
  },
  button: {
    padding: 10,
    borderRadius: 5,
  },
  notCheckedInButton: {
    backgroundColor: '#007bff', // Blue color for not checked in
  },
  checkedInButton: {
    backgroundColor: '#ff9900', // Orange color for already checked in
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
  },
});


export default CheckInScreen;
