import React, { useState, useEffect } from 'react';
import { Modal, Text, TouchableOpacity, View, StyleSheet, Dimensions, FlatList, Image } from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { Audio } from 'expo-av';

// Define the white noise options
const whiteNoiseOptions = [
    { name: 'Pure Noise', source: require('../assets/Sounds/Pure-Noise.mp3'), icon: require('../assets/Icons/noise.png') },
    { name: 'Ocean', source: require('../assets/Sounds/Ocean.mp3'), icon: require('../assets/Icons/ocean.png') },
    { name: 'Rain', source: require('../assets/Sounds/Rain.mp3'), icon: require('../assets/Icons/rain.png') },
    { name: 'Train', source: require('../assets/Sounds/Train.mp3'), icon: require('../assets/Icons/train.png') },
    { name: 'Underwater', source: require('../assets/Sounds/Underwater.mp3'), icon: require('../assets/Icons/underwater.png') },
    { name: 'Wave', source: require('../assets/Sounds/Wave.mp3'), icon: require('../assets/Icons/wave.png') },
  ];

  const windowWidth = Dimensions.get('window').width;
  const windowHeight = Dimensions.get('window').height;

const WhiteNoise = ({ isPlaying, onStartStop, onClose }) => {
  const [isModalVisible, setModalVisible] = useState(false);
  const [selectedWhiteNoise, setSelectedWhiteNoise] = useState(null);
  const [whiteNoiseSound, setWhiteNoiseSound] = useState(null);
  const [isWhiteNoiseModalVisible, setIsWhiteNoiseModalVisible] = useState(false);

  
  useEffect(() => {
    console.log(`isPlaying changed to: ${isPlaying}`);

    if (isPlaying) {
        startWhiteNoise();
      } else {
        pauseWhiteNoise();
      }
   
  }, [ isPlaying]);
  useEffect(() => {
    return () => {
      // This function is called when the component unmounts
      stopWhiteNoise(); // Make sure this function properly unloads the sound
    };
  }, []); //  This effect runs only once when the component mounts and the cleanup runs on unmount


  const startWhiteNoise = async () => {
    try {
      const soundObject = new Audio.Sound(); // Create a new instance of Audio.Sound()
      
      await soundObject.loadAsync(selectedWhiteNoise.source);
      await soundObject.setIsLoopingAsync(true);
      await soundObject.playAsync();
      
      setWhiteNoiseSound(soundObject); // Set the sound object in the state
    } catch (error) {
      console.error('Error playing white noise sound:', error);
    }
  };

  const pauseWhiteNoise = async () => {
    console.log('Pausing white noise');

    try {
      if (whiteNoiseSound) {
        // Check if the sound is loaded before pausing
        const status = await whiteNoiseSound.getStatusAsync();
        if (status.isLoaded) {
          await whiteNoiseSound.pauseAsync();
        }
      }
    } catch (error) {
      console.error('Error pausing white noise sound:', error);
    }
  };
  
  const stopWhiteNoise = async () => {
    try {
      if (whiteNoiseSound) {
        // Check if the sound is loaded before stopping
        const status = await whiteNoiseSound.getStatusAsync();
        if (status.isLoaded) {
          await whiteNoiseSound.stopAsync();
          await whiteNoiseSound.unloadAsync();
        }
      }
    } catch (error) {
      console.error('Error stopping white noise sound:', error);
    }
  };
  

  const handleWhiteNoisePress = () => {
    setModalVisible(true);
  };

  const handleWhiteNoiseClose = () => {
    setModalVisible(false);
  };

  const handleWhiteNoiseSelect = async (whiteNoise) => {
    stopWhiteNoise(); // Stop the current sound
    
    // Add a slight delay before selecting and playing the new sound
    await new Promise(resolve => setTimeout(resolve, 500));
    
    setSelectedWhiteNoise(whiteNoise);
    onStartStop(true); // Start playing the selected white noise
    handleWhiteNoiseClose();
  };

  const handleWhiteNoiseModalClose = () => {
    // Set a state variable to control the visibility of the white noise modal
    setIsWhiteNoiseModalVisible(false);
    // Stop the white noise when the modal is closed
    stopWhiteNoise();
  };

  return (
    <View>
      <TouchableOpacity onPress={handleWhiteNoisePress} style={styles.button}>
                {isPlaying && (
                <TouchableOpacity onPress={() => onStartStop(!isPlaying)} style={styles.playButton}>
                    <FontAwesome name={isPlaying ? "pause" : "play"} size={20} color="#fff" />
                </TouchableOpacity>
                )}
        <Text style={styles.buttonText}>White Noise</Text>
      </TouchableOpacity>
      <Modal
        transparent={true}
        animationType="slide"
        visible={isModalVisible}
        onRequestClose={handleWhiteNoiseClose}
      >
         <View style={styles.modalBackdrop}>

            <View style={styles.modal}>
            <FlatList
              data={whiteNoiseOptions}
              renderItem={({ item }) => (
                <TouchableOpacity onPress={() => handleWhiteNoiseSelect(item)} style={styles.option}>
                  <Image source={item.icon} style={styles.icon} />
                  <Text style={styles.optionText}>{item.name}</Text>
                </TouchableOpacity>
              )}
              keyExtractor={(item) => item.name}
            />
            
            <TouchableOpacity onPress={handleWhiteNoiseClose} style={styles.closeButton}>
                <FontAwesome name="times" size={20} color="#000" />
            </TouchableOpacity>
            {/* <View style={styles.controls}>
                <TouchableOpacity onPress={() => onStartStop(!isPlaying)} style={styles.playButton}>
                    <FontAwesome name={isPlaying ? "pause" : "play"} size={20} color="#fff" />
                </TouchableOpacity> */}
                {/* <TouchableOpacity onPress={stopWhiteNoise} style={styles.stopButton}>
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

export default WhiteNoise;
