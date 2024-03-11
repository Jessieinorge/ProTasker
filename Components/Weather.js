import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Image, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { Text } from 'react-native-elements';
import * as Location from 'expo-location';

const openWeatherKey = '4a3a860168c74192c1f1fd33178d4a24';

const Weather = () => {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  
  useEffect(() => {
    const fetchWeather = async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        setLoading(false);
        return;
      }

      try {
        let location = await Location.getCurrentPositionAsync({});
        const lat = location.coords.latitude;
        const lon = location.coords.longitude;

        const locationResponse = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lon });
        const cityName = locationResponse[0]?.city || "Unknown";

        const url = `https://api.openweathermap.org/data/2.5/weather?q=${cityName}&appid=${openWeatherKey}&units=metric`;
        const response = await fetch(url);
        const result = await response.json();
        if (!response.ok) {
          setErrorMsg(`Error retrieving weather data: ${result.message}`);
        } else {
          setWeather(result);
        }
      } catch (error) {
        setErrorMsg(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
  }, []);

  const showWeatherAdvice = () => {
    const advice = getWeatherAdvice(weather);
    Alert.alert("Today's Weather Advice", advice, [{ text: "OK" }]);
  };

  const getWeatherAdvice = (weatherData) => {
    if (!weatherData) return 'Weather data unavailable.';
  
    const temp = Math.round(weatherData.main.temp);
    const description = weatherData.weather[0].description.toLowerCase();
    const mainWeather = weatherData.weather[0].main.toLowerCase();
  
    // Adjusted comfort level advice focusing on study conditions
    let studyAdvice = '';
    if (temp < 10) {
      studyAdvice = 'It\'s cold outside, perfect for staying in and focusing on your studies.';
    } else if (temp >= 10 && temp < 20) {
      studyAdvice = 'Cool weather can be refreshing for study sessions. Consider opening a window for some fresh air.';
    } else if (temp >= 20 && temp < 30) {
      studyAdvice = 'Warm weather is great for studying outdoors or near a window, just make sure to stay hydrated.';
    } else {
      studyAdvice = 'Hot weather may affect concentration. Stay cool with a fan or air conditioning to maintain focus.';
    }
  
    // Weather-specific advice tailored for students
    let weatherSpecificAdvice = '';
    switch (mainWeather) {
      case 'rain':
      case 'drizzle':
        weatherSpecificAdvice = 'Rainy weather creates a calming background noise perfect for studying.';
        break;
      case 'thunderstorm':
        weatherSpecificAdvice = 'Thunderstorms can be distracting. Use noise-cancelling headphones to stay focused.';
        break;
      case 'snow':
        weatherSpecificAdvice = 'Watching the snowfall can be peaceful, providing a serene study environment.';
        break;
      case 'clear':
        weatherSpecificAdvice = 'Clear skies and sunshine can boost your mood and energy levels, making it easier to study.';
        break;
      default:
        weatherSpecificAdvice = 'Current weather conditions are conducive to focusing on your studies.';
        break;
    }
  
    // Additional advice on utilizing weather conditions for study breaks
    let breakAdvice = 'Remember to take regular breaks. Whether it\'s stepping outside for some fresh air or stretching indoors, breaks can help improve concentration and reduce stress.';
  
    return `${studyAdvice} ${weatherSpecificAdvice} ${breakAdvice} The current temperature is ${temp}°C, feeling mostly ${description}.`;
  };
  
  

  if (loading) {
    return (
      <View style={styles.weatherContainer}>
        <ActivityIndicator size="large" />
        <Text>Loading weather...</Text>
      </View>
    );
  }

  if (errorMsg || !weather) {
    return (
      <View style={styles.weatherContainer}>
        <Text>{errorMsg || "Weather data unavailable."}</Text>
      </View>
    );
  }

  return (
    <TouchableOpacity style={styles.weatherContainer} onPress={showWeatherAdvice}>
      <Text style={styles.title}>Current Weather in {weather.name}</Text>
      <Image
        style={styles.largeIcon}
        source={{ uri: `http://openweathermap.org/img/wn/${weather.weather[0].icon}@2x.png` }}
      />
      <Text style={styles.currentTemp}>{`${Math.round(weather.main.temp)}°C`}</Text>
      <Text style={styles.currentDescription}>{weather.weather[0].description}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  weatherContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 20,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  largeIcon: {
    width: 80,
    height: 80,
    margin: 10,
  },
  currentTemp: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  currentDescription: {
    fontSize: 18,
  },
});

export default Weather;
