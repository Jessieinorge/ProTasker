import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image,Dimensions } from 'react-native';
import moment from 'moment';
import { auth, database } from '../firebaseConfig';
import { ref, get, update } from 'firebase/database';
import { Picker } from '@react-native-picker/picker';
import { useIsFocused } from '@react-navigation/native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { Circle, Svg, Text as SvgText } from 'react-native-svg';
import WhiteNoise from './WhiteNoise';
import Rest from './Rest';
import { usePomodoro } from './PomodoroContext'; // Adjust the path as necessary
import PomodoroSettingsModal from './PomodoroSettingsModal'; // Adjust the path as necessary


// const pomodoroDuration = 1;
// const shortRestDuration = 5;
// const longRestDuration = 20;
// const SESSIONS_BEFORE_LONG_BREAK = 4;

const screenWidth = Dimensions.get('window').width;
const screenHeight = Dimensions.get('window').height;

const PomodoroScreen = () => {
  const {
    pomodoroDuration,
    shortRestDuration,
    longRestDuration,
    sessionsBeforeLongBreak,
  } = usePomodoro();

  const [selectedTask, setSelectedTask] = useState('');
  const [tasks, setTasks] = useState([]);
  const [timeLeft, setTimeLeft] = useState(moment.duration(pomodoroDuration, 'minutes'));
  const [timerActive, setTimerActive] = useState(false);
  const [sessionType, setSessionType] = useState('work');
  const [completedSessions, setCompletedSessions] = useState(0);
  const isFocused = useIsFocused();
  const [isWhiteNoisePlaying, setIsWhiteNoisePlaying] = useState(false);
  const [isRestPlaying, setIsRestPlaying] = useState(false);
const [isSettingsModalVisible, setIsSettingsModalVisible] = useState(false);

  const user = auth.currentUser;
  const userUID = user ? user.uid : '';

  
  useEffect(() => {
    if (!isFocused) {
      setIsWhiteNoisePlaying(false); // Ensure this stops the white noise
    }
    if (userUID && isFocused) {
      fetchTasks(userUID);
      resetTimerState();
    }
  }, [userUID, isFocused]);

 

 // Use this useEffect to pause/stop white noise and hide the button when not focused
 useEffect(() => {
  if (!isFocused) {
    setIsWhiteNoisePlaying(false); // Stop white noise
  }
}, [isFocused]);


  const resetTimerState = () => {
    setTimerActive(false);
    setTimeLeft(moment.duration(pomodoroDuration, 'minutes'));
    setSessionType('work');
    setCompletedSessions(0);
    setSelectedTask('');

  };

  useEffect(() => {
    let interval = null;
    if (timerActive) {
      interval = setInterval(() => {
        setTimeLeft(prevTime => {
          const updatedTime = moment.duration(prevTime.asSeconds() - 1, 'seconds');
          if (updatedTime.asSeconds() <= 0) {
            clearInterval(interval);
            onTimerComplete();
            return moment.duration(pomodoroDuration, 'minutes');
          }
          return updatedTime;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerActive, sessionType]);

  const fetchTasks = async (uid) => {
    const tasksRef = ref(database, `Tasks`);
    const snapshot = await get(tasksRef);
    if (snapshot.exists()) {
      const tasksData = snapshot.val();
      const userTasks = Object.entries(tasksData)
        .filter(([key, value]) => value.UID === uid && value.status === 'uncompleted')
        .map(([key, value]) => ({
          id: key,
          title: value.title,
        }));
      setTasks(userTasks);
    } else {
      setTasks([]);
    }
  };

  // Adjust useEffect hook to react to changes in pomodoroDuration and reset timeLeft accordingly
  useEffect(() => {
    if (sessionType === 'work') {
      setTimeLeft(moment.duration(pomodoroDuration, 'minutes'));
    } else if (sessionType === 'short-rest') {
      setTimeLeft(moment.duration(shortRestDuration, 'minutes'));
    } else if (sessionType === 'long-rest') {
      setTimeLeft(moment.duration(longRestDuration, 'minutes'));
    }
  }, [pomodoroDuration, shortRestDuration, longRestDuration, sessionType]);


  const onTimerComplete = () => {
    setTimerActive(false);
    if (sessionType === 'work') {
      updateDatabaseForCompletedSession();
      const newSessionCount = completedSessions + 1;
      setCompletedSessions(newSessionCount);
      if (newSessionCount % sessionsBeforeLongBreak === 0) {
        setSessionType('long-rest');
        setIsWhiteNoisePlaying(false); // Pause white noise
        setTimeLeft(moment.duration(longRestDuration, 'minutes'));
      } else {
        setSessionType('short-rest');
        setIsWhiteNoisePlaying(false); // Pause white noise
        setTimeLeft(moment.duration(shortRestDuration, 'minutes'));
      }
    } else {
      setSessionType('work');
      setTimeLeft(moment.duration(pomodoroDuration, 'minutes'));
      setIsRestPlaying(false);
    }
  };
  
  const updateDatabaseForCompletedSession = () => {
    if (!userUID || !selectedTask) return;
  
    const today = moment().format('YYYY-MM-DD');
    const pomodoroRef = ref(database, `Pomodoro/${userUID}/${today}/${selectedTask}`);
    const userRef = ref(database, `Users/${userUID}`);
  
    get(pomodoroRef).then(snapshot => {
      const currentData = snapshot.exists() ? snapshot.val() : { completedSessions: 0, duration: 0 };
      const updatedData = {
        completedSessions: currentData.completedSessions + 1,
        duration: currentData.duration + pomodoroDuration,
      };
      update(pomodoroRef, updatedData);
    });
  
    // Update global user statistics for PomodoroSessions and TotalPomodoroDuration
    get(userRef).then(snapshot => {
      if (snapshot.exists()) {
        const userData = snapshot.val();
        const updatedUserData = {
          ...userData,
          PomodoroSessions: (userData.PomodoroSessions || 0) + 1,
          TotalPomodoroDuration: (userData.TotalPomodoroDuration || 0) + pomodoroDuration,
        };
        update(userRef, updatedUserData);
      } else {
        // If the user data does not exist, initialize it
        const initialUserData = {
          PomodoroSessions: 1,
          TotalPomodoroDuration: pomodoroDuration,
        };
        set(userRef, initialUserData);
      }
    }).catch(error => console.error('Failed to update user Pomodoro stats:', error));
  };
  
  const skipRestAndStartNewSession = () => {
    setSessionType('work');
    setTimeLeft(moment.duration(pomodoroDuration, 'minutes'));
    setTimerActive(true);
  };

  const handleStartStop = () => {
    if (sessionType === 'work' && !selectedTask) {
      alert('Please select a task before starting.');
      return;
    }
    setTimerActive(!timerActive);
  };

  const handleWhiteNoiseModalClose = () => {
    // Set a state variable to control the visibility of the white noise modal
    setIsWhiteNoiseModalVisible(false);
  };
  

  //handle rest component
   // handleRestModalClose function definition (if not already defined)
   const handleRestModalClose = () => {
    setIsRestPlaying(false); // Ensure this stops the Rest
  };


  const handleReset = () => {
    setTimerActive(false);
    setTimeLeft(moment.duration(pomodoroDuration, 'minutes'));
    setSessionType('work');
    setSelectedTask('');
    setCompletedSessions(0);
    setIsWhiteNoisePlaying(false); // Pause white noise
    setIsRestPlaying(false); // Pause rest options
  };

  const formattedTime = `${timeLeft.minutes()}:${timeLeft.seconds() < 10 ? '0' : ''}${timeLeft.seconds()}`;

  const renderCircularTimer = () => {
    const radius = 100;
    const strokeWidth = 10;
    const svgDiameter = (radius * 2) + (strokeWidth * 2); // Full diameter including the stroke
    const circumference = 2 * Math.PI * radius;
  
    // Determine the current session duration
    const currentDuration = sessionType === 'work' ? pomodoroDuration :
                            sessionType === 'short-rest' ? shortRestDuration :
                            longRestDuration;
  
    const strokeDashoffset = circumference - (timeLeft.asSeconds() / (currentDuration * 60)) * circumference;
  
    return (
      <Svg
        width={svgDiameter} // Set the width to the full diameter of the circle including stroke
        height={svgDiameter} // Set the height to the full diameter of the circle including stroke
      >
        {/* Draw the static blue circle */}
        <Circle
          r={radius}
          cx={radius + strokeWidth} // Center the circle within the SVG
          cy={radius + strokeWidth} // Center the circle within the SVG
          fill="transparent"
          stroke="#007AFF"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
  
        {/* Draw the dynamic circle for time passing */}
        <Circle
          r={radius}
          cx={radius + strokeWidth} // Center the circle within the SVG
          cy={radius + strokeWidth} // Center the circle within the SVG
          fill="transparent"
          stroke={sessionType === 'work' ? "#ff9900" : "#09e08a"} // Change the color based on the session type
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          transform={`rotate(-90 ${radius + strokeWidth} ${radius + strokeWidth})`}
          strokeLinecap="round"
        />
  
        {/* Display the time text */}
        <SvgText
          x={radius + strokeWidth} // Center the text within the SVG
          y={radius + (strokeWidth)} // Center the text vertically within the SVG
          textAnchor="middle"
          fontSize="24"
          fontWeight="bold"
          fill="#000"
        >
          {formattedTime}
        </SvgText>
      </Svg>
    );
  };
  
  
  return (
    <View style={styles.container}>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={selectedTask}
          onValueChange={itemValue => setSelectedTask(itemValue)}
          style={styles.picker}
          enabled={!timerActive || sessionType !== 'work'}>
          <Picker.Item label="Select a task" value="" />
          {tasks.map(task => (
            <Picker.Item key={task.id} label={task.title} value={task.id} />
          ))}
        </Picker>
        {timerActive && <View style={styles.pickerOverlay} />}
      </View>

      {/* Render the rest period message and image if it's a rest session */}
       {(sessionType === 'short-rest' || sessionType === 'long-rest') && (
        <View style={restPeriodStyles.container}>
          <Image
            source={require('../assets/Icons/rest1.png')} // Make sure the path is correct
            style={restPeriodStyles.image}
          />
        </View>
      )}

      <View style={styles.timerContainer}>
        <View style={styles.timerTextContainer}>
        <TouchableOpacity onPress={() => setIsSettingsModalVisible(true)}>
            {renderCircularTimer()}
        </TouchableOpacity>
        </View>
        <View style={styles.buttonContainer}>
          <TouchableOpacity onPress={handleStartStop} style={styles.button}>
            <FontAwesome name={timerActive ? "pause" : "play"} size={20} color="#fff" />
            <Text style={styles.buttonText}>{timerActive ? "Pause" : "Start"}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleReset} style={styles.button}>
            <FontAwesome name="refresh" size={20} color="#fff" />
            <Text style={styles.buttonText}>Reset</Text>
          </TouchableOpacity>
          {sessionType !== 'work' && (
            <TouchableOpacity onPress={skipRestAndStartNewSession} style={styles.button}>
              <FontAwesome name="forward" size={20} color="#fff" />
              <Text style={styles.buttonText}>Skip</Text>
            </TouchableOpacity>
          )}

        </View>
        <PomodoroSettingsModal
          isVisible={isSettingsModalVisible}
          onClose={() => setIsSettingsModalVisible(false)}
        />

<View style={styles.overlayButtonsContainer}>

        {/* only show it during work session */}
        <View style={{ display: sessionType === 'work' && timerActive ? 'flex' : 'none' }}>
        {sessionType === 'work' && timerActive ? (
            <WhiteNoise
              isPlaying={isWhiteNoisePlaying}
              onStartStop={() => setIsWhiteNoisePlaying(!isWhiteNoisePlaying)}
              onClose={handleWhiteNoiseModalClose}
            />
          ) :  (
            <WhiteNoise isPlaying={false} onStartStop={() => {}} onClose={() => {}} />
          ) }
      </View>

        {/* only show it during work session */}
        <View style={{ display: sessionType !== 'work' && timerActive ? 'flex' : 'none' }}>
        {sessionType !== 'work' && timerActive ? (
            <Rest
              isPlaying={isRestPlaying}
              onStartStop={() => setIsRestPlaying(!isRestPlaying)}
              onClose={handleRestModalClose}
            />
          ) :  (
            <Rest isPlaying={false} onStartStop={() => {}} onClose={() => {}} />
          ) }
      </View>
      </View>
      </View>
    </View>

    
  );
};
  // Additional styles for the rest period message and image
  const restPeriodStyles = StyleSheet.create({
    container: {
      position: 'absolute', // Use absolute positioning
      top: '33%', // Adjust this to position the image vertically
      left: '50%', // Adjust this to position the image horizontally
      transform: [{ translateX: -150 }, { translateY: -50 }], // Adjust based on the size of the image to center it
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 2, // Ensure it appears above other elements
    },
    image: {
      width: 300, // Adjust the size as needed
      height: 100, // Adjust the size as needed
    },
  });

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
  },
  
overlayButtonsContainer: {
  position: 'absolute',
  bottom: 0, // Adjust this value based on your layout
  left: 0,
  right: 0,
  alignItems: 'center', // Center the buttons horizontally
  justifyContent: 'center', // Center the buttons vertically if needed
  zIndex: 10, // Ensure it overlays other elements
},
  pickerContainer: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    width: '70%',
    paddingTop: 0,
  },
  picker: {
    width: '100%',
    height: 40, // Reduced height
    transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }], // Scale down the picker to reduce its size
  },
  pickerOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'transparent',
  },
  timerContainer: {
    flex: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 50,
  },
  timerTextContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 50,
  },
  timeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '60%',
  },
  button: {
    flex: 1,
    backgroundColor: '#2196f3',
    borderRadius: 5,
    padding: 10,
    margin: 5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#fff',
    marginLeft: 5,
  },
});

export default PomodoroScreen;