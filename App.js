import React, { useState, useEffect } from 'react';
import { TouchableWithoutFeedback, Image, View, TouchableOpacity, StyleSheet, Dimensions, Platform, Alert } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Overlay, Text, Icon } from 'react-native-elements';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome } from '@expo/vector-icons';
import { DatabaseProvider } from './DatabaseContext';
import { AuthProvider } from './AuthContext';
import { PomodoroProvider } from './Components/PomodoroContext'; // Adjust the path as necessary
import { getDatabase, ref, get } from 'firebase/database';
import {auth, database} from './firebaseConfig'; 


import HomeScreen from './Components/HomeScreen';
import CalendarScreen from './Components/CalendarScreen';
import ListScreen from './Components/ListScreen';
import PomodoroScreen from './Components/PomodoroScreen';
import FilterScreen from './Components/FilterScreen';
import LoginScreen from './Components/LoginScreen';
import BadgeScreen from './Components/BadgeScreen';
import TotalCompletionScreen from './Components/TotalCompletionScreen';
import FocusStatusScreen from './Components/FocusStatusScreen';
import CheckInScreen from './Components/CheckInScreen';

//Pomodoro themes
import PomodoroOffice from './Components/PomodoroTheme/PomodoroOffice';
import PomodoroCity from './Components/PomodoroTheme/PomodoroCity';
import PomodoroForest from './Components/PomodoroTheme/PomodoroForest';
import PomodoroOcean from './Components/PomodoroTheme/PomodoroOcean';

if (ErrorUtils) {
  const defaultGlobalHandler = ErrorUtils.getGlobalHandler();

  const customGlobalHandler = (error, isFatal) => {
    // check the error message and decide if you want to handle it
    if (error.message === "Property 'e' doesn't exist") {
      // Handle or ignore the specific error
      console.log('Ignored specific error: ', error);
    } else {
      // If it's not the specific error you want to ignore,
      // handle it with the default global handler
      defaultGlobalHandler(error, isFatal);
    }
  };

  ErrorUtils.setGlobalHandler(customGlobalHandler);
}


const Tab = createBottomTabNavigator();
const screenWidth = Dimensions.get('window').width;
const iconSize = screenWidth * 0.1;

export default function App() {
  const [currentTheme, setCurrentTheme] = useState('Classic');
  const [userStats, setUserStats] = useState({ PomodoroSessions: 0, TotalPomodoroDuration: 0 });
  const [isModalVisible, setModalVisible] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [badgeModalVisible, setBadgeModalVisible] = useState(false);
  const [totalCompletionModalVisible, setTotalCompletionModalVisible] = useState(false);
  const [focusStatusModalVisible, setFocusStatusModalVisible] = useState(false);
  const [checkInModalVisible, setCheckInModalVisible] = useState(false);
  const [showThemesDropdown, setShowThemesDropdown] = useState(false);
  const [user, setUser] = useState(null); // Store user information

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async user => {
      if (user) {
        const dbRef = ref(getDatabase(), `Users/${user.uid}`);
        const snapshot = await get(dbRef);
        if (snapshot.exists()) {
          const userData = snapshot.val();
          setUser({
            ...user,
            username: userData.username || 'G', // Use 'G' as default if username is missing
          });
          setUserStats({
            PomodoroSessions: userData.PomodoroSessions || 0,
            TotalPomodoroDuration: userData.TotalPomodoroDuration || 0,
          });
        } else {
          console.log("No user data available.");
          setUser({ ...user, username: 'G' }); // No user data found, set default
        }
      } else {
        setUser(null); // No user is logged in
      }
    });
  
    return () => unsubscribe();
  }, []);
  


  const themeComponents = {
    Classic: PomodoroScreen,
    Office: userStats.PomodoroSessions >= 10 ? PomodoroOffice : PomodoroScreen,
    City: userStats.PomodoroSessions >= 50 ? PomodoroCity : PomodoroScreen,
    Forest: userStats.TotalPomodoroDuration >= 60 ? PomodoroForest : PomodoroScreen,
    Ocean: userStats.TotalPomodoroDuration >= 600 ? PomodoroOcean : PomodoroScreen,
  };
 
  const unlockMessages = {
    Office: 'Unlock the Office theme by finishing 10 Pomodoro Sessions.',
    City: 'Unlock the City theme by finishing 50 Pomodoro Sessions.',
    Forest: 'Unlock the Forest theme by accumulating 1 hour of Pomodoro Duration.',
    Ocean: 'Unlock the Ocean theme by accumulating 10 hours of Pomodoro Duration.',
  };
  


  const toggleDropdownMenu = () => {
    console.log('Dropdown toggled'); // Check if this logs when you press the icon

    setShowDropdown(!showDropdown);
  };
  useEffect(() => {
    if (showDropdown) {
      // You might want to add logic here to handle what happens when showDropdown is true
    }
  }, [showDropdown]);
  // Function to render the dropdown menu
  const renderDropdownMenu = () => (
    <TouchableWithoutFeedback onPress={() => setShowDropdown(false)}>
      <View style={styles.fullScreenOverlay}>
        <View style={styles.dropdownMenu}>
          {/* Other dropdown items */}
          <TouchableOpacity onPress={() => { setShowDropdown(false); setBadgeModalVisible(true); }}>
            <Text style={styles.dropdownItem}>Badges</Text>
          </TouchableOpacity>
      <TouchableOpacity onPress={() => { setShowDropdown(false); setCheckInModalVisible(true); }}>
        <Text style={styles.dropdownItem}>Check in</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => { setShowDropdown(false); setTotalCompletionModalVisible(true); }}>
        <Text style={styles.dropdownItem}>Total Completion</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => { setShowDropdown(false); setFocusStatusModalVisible(true); }}>
        <Text style={styles.dropdownItem}>Focus Status</Text>
      </TouchableOpacity>
    {/* Pomodoro Themes trigger */}
    <TouchableOpacity onPress={() => setShowThemesDropdown(!showThemesDropdown)} style={{ flexDirection: 'row', alignItems: 'center' }}>
  <Text style={[styles.dropdownItem]}>Pomodoro Themes</Text>
          {showThemesDropdown ? (
            <FontAwesome name="chevron-down" size={16} color="black" />
          ) : (
            <FontAwesome name="chevron-up" size={16} color="black" />
          )}
        </TouchableOpacity>


        {/* Conditionally render the Pomodoro Themes submenu */}
      {showThemesDropdown && (
        <View style={styles.subDropdownMenu}>
      {['Classic', 'Office', 'City', 'Forest', 'Ocean'].map((theme) => (
        <View key={theme} style={styles.subDropdownItem}>
          <TouchableOpacity
            onPress={() => {
              if (themeComponents[theme] !== PomodoroScreen || theme === 'Classic') {
                selectTheme(theme);
              } else {
                Alert.alert("Unlock Condition", unlockMessages[theme]);
              }
            }}
            style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
          >
            <Text style={[themeComponents[theme] === PomodoroScreen && theme !== 'Classic' ? styles.lockedItem : {}]}>
              {theme}
            </Text>
            {currentTheme === theme && (
              <Icon name="check" size={20} type="font-awesome" color="#ff9900" />
            )}
          </TouchableOpacity>
        </View>
      ))}

</View>

)}

      </View>
    </View>
  </TouchableWithoutFeedback>
);

// Helper function to select theme and handle logic
const selectTheme = (theme) => {
  if (theme === 'Classic' || themeComponents[theme] !== PomodoroScreen) {
    setCurrentTheme(theme);
    setShowDropdown(false); // Optionally close the main dropdown
    setShowThemesDropdown(false); // Close the themes list
  } else {
    Alert.alert("Unlock Condition", unlockMessages[theme]);
  }
};

  return (
    <AuthProvider>
      <DatabaseProvider>
        <SafeAreaView edges={['right', 'bottom', 'left']} style={{ flex: 1 }}>
          <View style={{ flex: 1 }}>
          {showDropdown && renderDropdownMenu()}
          <PomodoroProvider>

            <NavigationContainer>
              <Overlay
                isVisible={isModalVisible}
                onBackdropPress={() => setModalVisible(false)}
                overlayStyle={styles.container}
              >
              <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
                <FontAwesome name="times" size={24} color="black" />
              </TouchableOpacity>


                <View style={styles.centeredView}>
                  <LoginScreen />
                </View>
              </Overlay>
                  <Tab.Navigator
                  initialRouteName="Today"
                  screenOptions={{
                    headerLeft: () => (
                      user ? (
                        <View style={styles.userIcon}>
                          <TouchableOpacity onPress={() => setModalVisible(true)}>

                          <Text style={styles.userIconText}>{user.username[0].toUpperCase()}</Text>
                          </TouchableOpacity>

                        </View>
                      ) : (
                        <TouchableOpacity onPress={() => setModalVisible(true)}>
                          <Image
                            source={require('./assets/Icons/login.png')}
                            style={{
                              width: iconSize,
                              height: iconSize,
                              marginLeft: 15,
                            }}
                          />
                        </TouchableOpacity>
                      )
                    ),
                    headerRight: () => (
                      <TouchableOpacity onPress={toggleDropdownMenu}>
                        <FontAwesome name="ellipsis-v" size={24} color="black" style={{ marginRight: 15 }} />
                      </TouchableOpacity>
                    ),
                    tabBarLabel: () => null,
                  }}
                >


                <Tab.Screen
                  name="Calendar"
                  component={CalendarScreen}
                  options={{
                    tabBarIcon: ({ focused }) => (
                      <Image
                        source={require('./assets/Icons/calendar.png')}
                        style={{
                          width: iconSize,
                          height: iconSize,
                          backgroundColor: focused ? '#ff9900' : 'transparent',
                          borderRadius: 5,
                          padding: 5,
                          marginTop: 20,
                        }}
                      />
                    ),
                  }}
                />
                <Tab.Screen
                  name="List"
                  component={ListScreen}
                  options={{
                    tabBarIcon: ({ focused }) => (
                      <Image
                        source={require('./assets/Icons/list.png')}
                        style={{
                          width: iconSize,
                          height: iconSize,
                          backgroundColor: focused ? '#ff9900' : 'transparent',
                          borderRadius: 5,
                          padding: 5,
                          marginTop: 20,
                        }}
                      />
                    ),
                  }}
                />
                <Tab.Screen
                  name="Today"
                  component={HomeScreen}
                  options={{
                    tabBarIcon: ({ focused }) => (
                      <Image
                        source={require('./assets/Icons/home.png')}
                        style={{
                          width: iconSize,
                          height: iconSize,
                          backgroundColor: focused ? '#ff9900' : 'transparent',
                          borderRadius: 5,
                          padding: 5,
                          marginTop: 20,
                        }}
                      />
                    ),
                  }}
                />
                <Tab.Screen
                  name="Pomodoro"
                  component={themeComponents[currentTheme]}
                  options={{
                    tabBarIcon: ({ focused }) => (
                      <Image
                        source={require('./assets/Icons/clock.png')}
                        style={{
                          width: iconSize,
                          height: iconSize,
                          backgroundColor: focused ? '#ff9900' : 'transparent',
                          borderRadius: 5,
                          padding: 5,
                          marginTop: 20,
                        }}
                      />
                    ),
                  }}
                />
                <Tab.Screen
                  name="Filter"
                  component={FilterScreen}
                  options={{
                    tabBarIcon: ({ focused }) => (
                      <Image
                        source={require('./assets/Icons/search.png')}
                        style={{
                          width: iconSize,
                          height: iconSize,
                          backgroundColor: focused ? '#ff9900' : 'transparent',
                          borderRadius: 5,
                          padding: 5,
                          marginTop: 20,
                        }}
                      />
                    ),
                  }}
                />
              </Tab.Navigator>
              <Overlay
              isVisible={badgeModalVisible}
              onBackdropPress={() => setBadgeModalVisible(false)}
              overlayStyle={styles.modalContainer}
            >
              <BadgeScreen onClose={() => setBadgeModalVisible(false)} />
            </Overlay>


            <Overlay
                isVisible={totalCompletionModalVisible}
                onBackdropPress={() => setTotalCompletionModalVisible(false)}
                overlayStyle={styles.modalContainer}
              >
               <TotalCompletionScreen onClose={() => setTotalCompletionModalVisible(false)} />

              </Overlay>


              <Overlay
                isVisible={focusStatusModalVisible}
                onBackdropPress={() => setFocusStatusModalVisible(false)}
                overlayStyle={styles.modalContainer}
              >
              <FocusStatusScreen onClose={() => setFocusStatusModalVisible(false)} />
              </Overlay>

              <Overlay
            isVisible={checkInModalVisible}
            onBackdropPress={() => setCheckInModalVisible(false)}
            overlayStyle={styles.modalContainer}
          >
            <CheckInScreen isVisible={checkInModalVisible} onClose={() => setCheckInModalVisible(false)} />
          </Overlay>

            </NavigationContainer>
            </PomodoroProvider>

          </View>
        </SafeAreaView>
      </DatabaseProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButton: {
    position: 'absolute',
    right: 20,
    top: 50,
    padding: 10,
    zIndex: 1,
  },
  centeredView: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropdownMenu: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 88 : 60, // Adjust for status bar height
    right: 10,
    top: 50,
    backgroundColor: 'white',
    borderRadius: 5,
    padding: 10,
    zIndex: 2,
    shadowOpacity: 0.35,
    shadowRadius: 5,
    shadowColor: '#000',
    shadowOffset: { height: 3, width: 0 },
    pointerEvents: 'auto', // Explicitly allow pointer events for this element
  },
  dropdownItem: {
    padding: 10,
    fontSize: 16,
    borderBottomColor: '#ccc',
  },
  unlockMessage: {
    color: 'red',
    fontSize: 12,
    paddingTop: 5,
  },
  modalContainer: {
    marginVertical: 100,
    backgroundColor: "white",
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    marginHorizontal:10
  },
  fullScreenOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    zIndex: 1,
  },
  subDropdownMenu: {
    position: 'absolute',
    left: -120, // Adjust left positioning as needed to fit the wider menu
    top: 180,
    width: screenWidth/3, // Set a specific width for the submenu
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 5,
    shadowOpacity: 0.35,
    shadowRadius: 5,
    shadowColor: '#000',
    shadowOffset: { height: 3, width: 0 },
    zIndex: 3, // Ensure it overlays on top of other elements if needed
  },  
  
  subDropdownItem: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    
  },
  userIcon: {
    width: iconSize,
    height: iconSize,
    marginLeft: 15,
    marginBottom:5,
    backgroundColor: '#2196f3',
    borderRadius: iconSize / 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userIconText: {
    color: 'white',
    fontSize: iconSize / 2, // Adjust size as needed
    fontWeight: 'bold',
  },
  lockedItem: {
    color: '#ccc', // Grey color
  },

});

