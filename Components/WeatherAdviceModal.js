import React from 'react';
import { Modal, View, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Text, Button } from 'react-native-elements';

const WeatherAdviceModal = ({ isVisible, onClose, weather }) => {
  const getModalContent = () => {
    // Assuming `getWeatherAdvice` is a function that generates advice text
    const advice = getWeatherAdvice(weather);
    return advice;
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <Text h4 style={styles.modalText}>Today's Weather Advice</Text>
          <Text style={styles.adviceText}>{getModalContent()}</Text>
          <Button
            title="Got it!"
            onPress={onClose}
            buttonStyle={styles.buttonClose}
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 22,
  },
  modalView: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 35,
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
  modalText: {
    marginBottom: 15,
    textAlign: 'center',
  },
  adviceText: {
    marginBottom: 15,
  },
  buttonClose: {
    backgroundColor: '#2196F3',
  },
});

export default WeatherAdviceModal;
