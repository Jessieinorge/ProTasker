import React, { useState, useEffect } from 'react';
import { Modal, Text, TouchableOpacity, View, StyleSheet, Dimensions, FlatList, Image } from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { Audio } from 'expo-av';

// Define the Rest noise options
const RestOptions = [
  { name: 'Breath training', source: require('../assets/Sounds/Breath.wav'), icon: require('../assets/Icons/breath.png') },
  { name: 'Indoor walk', source: require('../assets/Sounds/IndoorWalk.wav'), icon: require('../assets/Icons/walk.png') },
  { name: 'Relaxing music', source: require('../assets/Sounds/elevate.mp3'), icon: require('../assets/Icons/music.png') },
  { name: 'Stretch', source: require('../assets/Sounds/Strech.wav'), icon: require('../assets/Icons/stretch.png') },
  { name: 'Meditation', source: require('../assets/Sounds/Meditation.wav'), icon: require('../assets/Icons/meditation.png') },
];

  const windowWidth = Dimensions.get('window').width;
  const windowHeight = Dimensions.get('window').height;

const Rest = ({ isPlaying, onStartStop, onClose }) => {
  const [isModalVisible, setModalVisible] = useState(false);
  const [selectedRest, setSelectedRest] = useState(null);
  const [RestSound, setRestSound] = useState(null);
  const [isRestModalVisible, setIsRestModalVisible] = useState(false);

  
  useEffect(() => {
    console.log(`isPlaying changed to: ${isPlaying}`);

    if (isPlaying) {
        startRest();
      } else {
        pauseRest();
      }
   
  }, [ isPlaying]);
  useEffect(() => {
    return () => {
      // This function is called when the component unmounts
      stopRest(); // Make sure this function properly unloads the sound
    };
  }, []); //  This effect runs only once when the component mounts and the cleanup runs on unmount


  const startRest = async () => {
    try {
      const soundObject = new Audio.Sound(); // Create a new instance of Audio.Sound()
      
      await soundObject.loadAsync(selectedRest.source);
      await soundObject.setIsLoopingAsync(true);
      await soundObject.playAsync();
      
      setRestSound(soundObject); // Set the sound object in the state
    } catch (error) {
      console.error('Error playing Rest noise sound:', error);
    }
  };

  const pauseRest = async () => {
    console.log('Pausing Rest noise');

    try {
      if (RestSound) {
        // Check if the sound is loaded before pausing
        const status = await RestSound.getStatusAsync();
        if (status.isLoaded) {
          await RestSound.pauseAsync();
        }
      }
    } catch (error) {
      console.error('Error pausing Rest noise sound:', error);
    }
  };
  
  const stopRest = async () => {
    try {
      if (RestSound) {
        // Check if the sound is loaded before stopping
        const status = await RestSound.getStatusAsync();
        if (status.isLoaded) {
          await RestSound.stopAsync();
          await RestSound.unloadAsync();
        }
      }
    } catch (error) {
      console.error('Error stopping Rest noise sound:', error);
    }
  };
  

  const handleRestPress = () => {
    setModalVisible(true);
  };

  const handleRestClose = () => {
    setModalVisible(false);
  };

  const handleRestSelect = async (Rest) => {
    stopRest(); // Stop the current sound
    
    // Add a slight delay before selecting and playing the new sound
    await new Promise(resolve => setTimeout(resolve, 500));
    
    setSelectedRest(Rest);
    onStartStop(true); // Start playing the selected Rest noise
    handleRestClose();
  };

  const handleRestModalClose = () => {
    // Set a state variable to control the visibility of the Rest noise modal
    setIsRestModalVisible(false);
    // Stop the Rest noise when the modal is closed
    stopRest();
  };

  return (
    <View>
      <TouchableOpacity onPress={handleRestPress} style={styles.button}>
                {isPlaying && (
                <TouchableOpacity onPress={() => onStartStop(!isPlaying)} style={styles.playButton}>
                    <FontAwesome name={isPlaying ? "pause" : "play"} size={20} color="#fff" />
                </TouchableOpacity>
                )}
        <Text style={styles.buttonText}>Rest options</Text>
      </TouchableOpacity>
      <Modal
        transparent={true}
        animationType="slide"
        visible={isModalVisible}
        onRequestClose={handleRestClose}
      >
         <View style={styles.modalBackdrop}>

            <View style={styles.modal}>
            <FlatList
              data={RestOptions}
              renderItem={({ item }) => (
                <TouchableOpacity onPress={() => handleRestSelect(item)} style={styles.option}>
                  <Image source={item.icon} style={styles.icon} />
                  <Text style={styles.optionText}>{item.name}</Text>
                </TouchableOpacity>
              )}
              keyExtractor={(item) => item.name}
            />
            
            <TouchableOpacity onPress={handleRestClose} style={styles.closeButton}>
                <FontAwesome name="times" size={20} color="#000" />
            </TouchableOpacity>
            {/* <View style={styles.controls}>
                <TouchableOpacity onPress={() => onStartStop(!isPlaying)} style={styles.playButton}>
                    <FontAwesome name={isPlaying ? "pause" : "play"} size={20} color="#fff" />
                </TouchableOpacity> */}
                {/* <TouchableOpacity onPress={stopRest} style={styles.stopButton}>
                    <FontAwesome name="stop" size={20} color="#fff" />
                </TouchableOpacity> */}
            {/* </View> */}
            </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#2196f3',
    borderRadius: 5,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    marginHorizontal: 5,
  },
  buttonText: {
    color: '#fff',
    marginLeft: 5,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    width: '80%',
    maxHeight: '60%',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  icon: {
    width: 40,
    height: 40,
    marginRight: 20,
  },
  optionText: {
    fontSize: 18,
  },
  modalItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderColor: '#ccc',
  },
  closeButton: {
    position: 'absolute',
    top: 5,
    right: 5,
    padding: 5,
    zIndex: 1, 
  },
  controls: {
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    marginTop: 10,
  },
  playButton: {
    backgroundColor: '#2196f3',
    borderRadius: 5,
    marginRight: 10,
    padding:2
  },
  stopButton: {
    backgroundColor: '#FF0000',
    borderRadius: 5,
    padding: 10,
  },
});


export default Rest;
