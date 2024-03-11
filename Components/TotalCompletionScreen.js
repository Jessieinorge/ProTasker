import React, { useState, useEffect } from 'react';
import { View, Text, Dimensions, ScrollView , StyleSheet, TouchableOpacity} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import moment from 'moment';
import { getDatabase, ref, onValue } from 'firebase/database';
import { auth } from '../firebaseConfig'; // Adjust the import path as necessary
import { FontAwesome } from '@expo/vector-icons';

const screenWidth = Dimensions.get('window').width;

const TotalCompletionScreen = ({ onClose }) => {

  
  const [completionData, setCompletionData] = useState({
    dailyCompletionNumbers: [],
    dailyCompletionRates: [],
    labels: [],
  });

  useEffect(() => {
    const user = auth.currentUser;
    const userUID = user ? user.uid : null;
    
    if (userUID) {
      const tasksRef = ref(getDatabase(), `Tasks`);
      onValue(tasksRef, (snapshot) => {
        const tasks = snapshot.val();
        const completionNumbers = {};
        const completionRates = {};

        // Initialize the data structures
        for (let day = -6; day <= 0; day++) {
          const date = moment().add(day, 'days').format('YYYY-MM-DD');
          completionNumbers[date] = 0; // Completed tasks
          completionRates[date] = 0; // Completion rate
        }

        // Calculate the completion numbers and rates
        Object.entries(tasks).forEach(([id, task]) => {
          if (task.UID === userUID) {
            const taskDate = moment(task.dueDate, 'YYYY-MM-DD').format('YYYY-MM-DD');
            if (completionNumbers.hasOwnProperty(taskDate)) {
              if (task.status === 'completed') {
                completionNumbers[taskDate]++;
              }
              completionRates[taskDate]++; // Increment total tasks for the date
            }
          }
        });

        // Convert the object to arrays for the chart and calculate rates
        const labels = [];
        const dailyCompletionNumbers = [];
        const dailyCompletionRates = [];

        Object.keys(completionNumbers).forEach(date => {
          labels.push(moment(date).format('MM/DD'));
          dailyCompletionNumbers.push(completionNumbers[date]);
          dailyCompletionRates.push(completionRates[date] > 0 ? (completionNumbers[date] / completionRates[date]) * 100 : 0);
        });

        setCompletionData({
          dailyCompletionNumbers,
          dailyCompletionRates,
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
  
  // The style for the card container of each chart
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





  useEffect(() => {
    const user = auth.currentUser;
    const userUID = user ? user.uid : null;

    if (userUID) {
      const dbRef = ref(getDatabase(), `path_to_user_tasks/${userUID}`);
      onValue(dbRef, (snapshot) => {
        const data = snapshot.val();
        const today = moment().startOf('day');
        const startOfWeek = moment().startOf('week');

        let dailyTasksCompleted = 0;
        let weeklyTasksCompleted = 0;
        let totalDailyTasks = 0;
        let totalWeeklyTasks = 0;

        for (const key in data) {
          if (data.hasOwnProperty(key)) {
            const task = data[key];
            const taskDate = moment(task.dueDate, 'YYYY-MM-DD');
            const isToday = taskDate.isSame(today, 'day');
            const isThisWeek = taskDate.isSameOrAfter(startOfWeek, 'day');

            if (task.status === 'completed') {
              if (isToday) dailyTasksCompleted++;
              if (isThisWeek) weeklyTasksCompleted++;
            }
            if (isToday) totalDailyTasks++;
            if (isThisWeek) totalWeeklyTasks++;
          }
        }

        setDailyCompletionRate(totalDailyTasks > 0 ? (dailyTasksCompleted / totalDailyTasks) * 100 : 0);
        setWeeklyCompletionRate(totalWeeklyTasks > 0 ? (weeklyTasksCompleted / totalWeeklyTasks) * 100 : 0);
      }, {
        onlyOnce: true
      });
    }
  }, []);

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <View style={cardStyle.titleContainer}>
        <Text style={cardStyle.titleText}>Total Completion</Text>
        <TouchableOpacity style={cardStyle.closeButton} onPress={onClose}>
          <FontAwesome name="close" size={24} color="black" />
        </TouchableOpacity>
      </View>
      <View style={cardStyle.card}>
        <Text style={cardStyle.labelStyle}>Daily Completion Numbers</Text>
        <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}>
          <LineChart
            data={{
              labels: completionData.labels,
              datasets: [
                {
                  data: completionData.dailyCompletionNumbers,
                  color: (opacity = 1) => `rgba(134, 65, 244, ${opacity})`,
                  strokeWidth: 2,
                },
              ],
            }}
            width={screenWidth} // To allow horizontal scrolling
            height={220}
            chartConfig={chartConfig}
            bezier
          />
        </ScrollView>
      </View>

      <View style={cardStyle.card}>
        <Text style={cardStyle.labelStyle}>Daily Completion Rates</Text>
        <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}>
          <LineChart
            data={{
              labels: completionData.labels,
              datasets: [
                {
                  data: completionData.dailyCompletionRates,
                  color: (opacity = 1) => `rgba(134, 65, 244, ${opacity})`,
                  strokeWidth: 2,
                },
              ],
            }}
            width={screenWidth} // To allow horizontal scrolling
            height={220}
            chartConfig={chartConfig}
            bezier
          />
        </ScrollView>
      </View>
    </ScrollView>
  );
};export default TotalCompletionScreen;




