import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, Alert, Dimensions, ScrollView } from 'react-native';
import { Overlay } from 'react-native-elements';
import { getDatabase, ref, onValue } from 'firebase/database';
import { auth } from '../firebaseConfig';
import { FontAwesome } from '@expo/vector-icons'; // Import FontAwesome icon

const screenWidth = Dimensions.get('window').width;
const badgeSize = screenWidth * 0.2; // Adjust the size based on your layout preference

const lockIcon = require('../assets/Icons/Badges/Lock.png');
const badgeIcons = {
  checkInOneWeek: require('../assets/Icons/Badges/CheckInOneWeek.png'),
  checkInOneMonth: require('../assets/Icons/Badges/CheckInOneMonth.png'),
  checkInOneYear: require('../assets/Icons/Badges/CheckInOneYear.png'),
  firstTaskComplete: require('../assets/Icons/Badges/FirstTaskComplete.png'),
  tenTasksComplete: require('../assets/Icons/Badges/TenTaskComplete.png'),
  hundredTasksComplete: require('../assets/Icons/Badges/OneHundredTaskComplete.png'),
  firstPomodoroSession: require('../assets/Icons/Badges/FirstPomodoroSession.png'),
  tenPomodoroSessions: require('../assets/Icons/Badges/TenPomodoroSession.png'),
  hundredPomodoroSessions: require('../assets/Icons/Badges/OneHundredPomodoroSession.png'),
  oneHourPomodoro: require('../assets/Icons/Badges/OneHourWork.png'),
  tenHoursPomodoro: require('../assets/Icons/Badges/TenHourWork.png'),
  hundredHoursPomodoro: require('../assets/Icons/Badges/OneHundredHourWork.png'),
};

// Adjusted structure to include 'afterMessage'
const badgeCriteria = [
  // First line: CheckInDays
  [
    { threshold: 7, icon: 'checkInOneWeek', unlockMessage: 'Check in for one week to unlock.', afterMessage: 'You have checked in for one week!' },
    { threshold: 30, icon: 'checkInOneMonth', unlockMessage: 'Check in for one month to unlock.', afterMessage: 'You have checked in for one month!' },
    { threshold: 365, icon: 'checkInOneYear', unlockMessage: 'Check in for one year to unlock.', afterMessage: 'You have checked in for one year!' },
  ],
  // Second line: CompletedTasks
  [
    { threshold: 1, icon: 'firstTaskComplete', unlockMessage: 'Complete one task to unlock.', afterMessage: 'You have completed your first task!' },
    { threshold: 10, icon: 'tenTasksComplete', unlockMessage: 'Complete 10 tasks to unlock.', afterMessage: 'You have completed 10 tasks!' },
    { threshold: 100, icon: 'hundredTasksComplete', unlockMessage: 'Complete 100 tasks to unlock.', afterMessage: 'You have completed 100 tasks!' },
  ],
  // Third line: PomodoroSessions
  [
    { threshold: 1, icon: 'firstPomodoroSession', unlockMessage: 'Complete 1 Pomodoro session to unlock.', afterMessage: 'You have completed your first Pomodoro session!' },
    { threshold: 10, icon: 'tenPomodoroSessions', unlockMessage: 'Complete 10 Pomodoro sessions to unlock.', afterMessage: 'You have completed 10 Pomodoro sessions!' },
    { threshold: 100, icon: 'hundredPomodoroSessions', unlockMessage: 'Complete 100 Pomodoro sessions to unlock.', afterMessage: 'You have completed 100 Pomodoro sessions!' },
  ],
  // Last line: TotalPomodoroDuration
  [
    { threshold: 60, icon: 'oneHourPomodoro', unlockMessage: 'Accumulate 1 hour of Pomodoro sessions to unlock.', afterMessage: 'You have accumulated 1 hour of Pomodoro sessions!' },
    { threshold: 600, icon: 'tenHoursPomodoro', unlockMessage: 'Accumulate 10 hours of Pomodoro sessions to unlock.', afterMessage: 'You have accumulated 10 hours of Pomodoro sessions!' },
    { threshold: 6000, icon: 'hundredHoursPomodoro', unlockMessage: 'Accumulate 100 hours of Pomodoro sessions to unlock.', afterMessage: 'You have accumulated 100 hours of Pomodoro sessions!' },
  ]
];

const BadgeScreen = ({ onClose }) => {
  const [userAchievements, setUserAchievements] = useState({
    checkInDays: 0,
    completedTasks: 0,
    pomodoroSessions: 0,
    totalPomodoroDuration: 0,
  });

  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      const db = getDatabase();
      const userRef = ref(db, `Users/${user.uid}`);
      onValue(userRef, (snapshot) => {
        const data = snapshot.val();
        setUserAchievements({
          checkInDays: data.CheckInDays || 0,
          completedTasks: data.CompletedTasks || 0,
          pomodoroSessions: data.PomodoroSessions || 0,
          totalPomodoroDuration: data.TotalPomodoroDuration || 0,
        });
      });
    }
  }, []);

  const handlePressBadge = (isUnlocked, message, afterMessage) => {
    Alert.alert("Badge Information", isUnlocked ? afterMessage : message);
  };

  const renderBadges = () => {
    let allBadges = [];
    badgeCriteria.forEach((row, rowIndex) => {
      const rowBadges = row.map((badge, badgeIndex) => {
        const achievementValue = userAchievements[Object.keys(userAchievements)[rowIndex]];
        const isUnlocked = achievementValue >= badge.threshold;
        const iconSource = isUnlocked ? badgeIcons[badge.icon] : lockIcon;

        return (
          <TouchableOpacity
            key={`badge-${rowIndex}-${badgeIndex}`}
            onPress={() => handlePressBadge(isUnlocked, badge.unlockMessage, badge.afterMessage)}
            style={styles.badgeContainer}
          >
            <Image source={iconSource} style={styles.badgeIcon} />
          </TouchableOpacity>
        );
      });
      allBadges = [...allBadges, ...rowBadges];
    });

    return allBadges;
  };

  return (
    <Overlay isVisible overlayStyle={styles.overlay}>
      <TouchableOpacity style={styles.closeButton} onPress={onClose}>
        <FontAwesome name="times" size={24} color="black" />
      </TouchableOpacity>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.title}>Your Badges</Text>
        <View style={styles.badgesContainer}>
        {renderBadges()}
        </View>
      </ScrollView>
    </Overlay>
  );
};

const styles = StyleSheet.create({
  overlay: {
    width: '90%',
    height: '70%',
    backgroundColor: '#f0f0f0', // Change background color
    borderRadius: 20,
    padding: 20,
  },
  scrollContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
    textAlign: 'center', // Center align title
  },
  badgesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    width: '100%',
    backgroundColor: '#fff', // Change background color
    borderRadius: 10,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  badgeContainer: {
    width: badgeSize,
    height: badgeSize,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10, // Adjust vertical margin
  },
  badgeIcon: {
    width: '80%', // Adjust icon size
    height: '80%', // Adjust icon size
    resizeMode: 'contain',
  },
  badgeTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 5,
    textAlign: 'center',
  },
  badgeMessage: {
    fontSize: 12,
    textAlign: 'center',
    color: '#555',
  },closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 1,
  },
});


export default BadgeScreen;