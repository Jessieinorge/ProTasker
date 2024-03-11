import React, { useState, useEffect } from 'react';
import { View, Text, Dimensions, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import moment from 'moment';
import { getDatabase, ref, onValue } from 'firebase/database';
import { auth } from '../firebaseConfig';
import { FontAwesome } from '@expo/vector-icons';

const screenWidth = Dimensions.get('window').width;

const FocusStatusScreen = ({ onClose }) => {
  const [pomodoroData, setPomodoroData] = useState({
    dailySessionNumbers: [],
    dailyDuration: [],
    labels: [],
  });

  useEffect(() => {
    const user = auth.currentUser;
    const userUID = user ? user.uid : null;

    if (userUID) {
      const pomodoroRef = ref(getDatabase(), `Pomodoro/${userUID}`);
      onValue(pomodoroRef, (snapshot) => {
        const data = snapshot.val();
        const sessionNumbers = {};
        const durations = {};

        for (let day = -6; day <= 0; day++) {
          const date = moment().add(day, 'days').format('YYYY-MM-DD');
          sessionNumbers[date] = 0;
          durations[date] = 0;
        }

        Object.keys(data).forEach((date) => {
          const dailyData = data[date];
          Object.values(dailyData).forEach((session) => {
            if (sessionNumbers.hasOwnProperty(date)) {
              sessionNumbers[date] += session.completedSessions;
              durations[date] += session.duration;
            }
          });
        });

        const labels = Object.keys(sessionNumbers).map(date => moment(date).format('MM/DD'));
        const dailySessionNumbers = Object.values(sessionNumbers);
        const dailyDurations = Object.values(durations);

        setPomodoroData({
          dailySessionNumbers,
          dailyDuration: dailyDurations,
          labels,
        });
      });
    }
  }, []);

  const chartConfig = {
    backgroundGradientFrom: '#FFFFFF',
    backgroundGradientTo: '#FFFFFF',
    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`, // Color for the line
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`, // Color for the labels
    strokeWidth: 2, // Width of the line
    barPercentage: 0.5,
    useShadowColorFromDataset: false, // Indicates whether to use a shadow color from the dataset
    fromZero: true, // Starts the Y-axis from zero
    yAxisInterval: 1, // Shows all Y-axis labels
    yAxisLabel: '', // A prefix for the Y-axis label
    yAxisSuffix: '%', // A suffix for the Y-axis label (useful for percentages)
    xAxisLabel: '', // A prefix for the X-axis labels
    chartConfig: {
      decimalPlaces: 1, // Optional: the number of decimal places for the Y-axis labels
    },
    propsForDots: {
      r: '6', // Radius of the dot that appears at a data point
      strokeWidth: '2',
      stroke: '#ffa726',
    },
    propsForBackgroundLines: {
      strokeDasharray: '', // Solid background lines
      strokeWidth: 1,
    },
    propsForLabels: {
      fontSize: 12, // Smaller font size for X-axis labels to fit more labels
    },
    formatXLabel: (label) => label, // Optional: Customize X-axis labels
    formatYLabel: (label) => `${label}%`, // Optional: Customize Y-axis labels
  };
  

  const cardStyle = StyleSheet.create({
    card: {
      backgroundColor: 'white',
      borderRadius: 10,
      padding: 5,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
      marginVertical: 8,
      marginHorizontal: 1,
    },
    labelStyle: {
      textAlign: 'center',
      fontWeight: 'bold',
    },
    titleContainer: {
      width: '100%',
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 10,
      paddingHorizontal: 2,
    },
    titleText: {
      fontSize: 24,
      marginBottom: 10,
    },
    closeButton: {
      padding: 0, // Adjust padding to control the touchable area size
      position: 'absolute', // Position the button absolutely
      right: 0, // Distance from the right edge
      top: 0, // Distance from the top edge to move it upwards
    },
  
  });

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <View style={cardStyle.titleContainer}>
        <Text style={cardStyle.titleText}>Focus Statistics</Text>
        <TouchableOpacity style={cardStyle.closeButton} onPress={onClose}>
          <FontAwesome name="close" size={24} color="black" />
        </TouchableOpacity>
      </View>
      <View style={cardStyle.card}>
        <Text style={cardStyle.labelStyle}>Daily Pomodoro Sessions</Text>
        <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}>
        <LineChart
          data={{
            labels: pomodoroData.labels,
            datasets: [{
              data: pomodoroData.dailySessionNumbers,
              color: (opacity = 1) => `rgba(134, 65, 244, ${opacity})`,
              strokeWidth: 2,
            }],
          }}
          width={screenWidth - 24} // Subtracting margin
          height={220}
          chartConfig={chartConfig}
          bezier
        />
        </ScrollView>
      </View>
      <View style={cardStyle.card}>
        <Text style={cardStyle.labelStyle}>Daily Pomodoro Duration (mins)</Text>
        <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}>
        <LineChart
          data={{
            labels: pomodoroData.labels,
            datasets: [{
              data: pomodoroData.dailyDuration,
              color: (opacity = 1) => `rgba(134, 65, 244, ${opacity})`,
              strokeWidth: 2,
            }],
          }}
          width={screenWidth - 24} // Subtracting margin
          height={220}
          chartConfig={chartConfig}
          bezier
        />
        </ScrollView>

      </View>

    </ScrollView>
  );
};

export default FocusStatusScreen;
