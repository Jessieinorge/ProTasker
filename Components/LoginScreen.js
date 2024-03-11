import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  Image,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  ScrollView,
  Modal,
  Alert,
  Platform,
  Dimensions
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { FontAwesome } from '@expo/vector-icons';
import app from '../firebaseConfig';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { getDatabase, ref, set,onValue, get } from "firebase/database";


const screenWidth = Dimensions.get('window').width;
const screenHeight = Dimensions.get('window').height;
const logoWidth = screenWidth*0.9; // 80% of screen width
const logoHeight = logoWidth / (669 / 169); // Maintaining the original aspect ratio

const LoginScreen = () => {
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('Guest');
  const [passwordVisibility, setPasswordVisibility] = useState(true);
  const [confirmPasswordVisibility, setConfirmPasswordVisibility] = useState(true);
  const [error, setError] = useState(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const [isRegisterModalVisible, setIsRegisterModalVisible] = useState(false);

  useEffect(() => {
    const auth = getAuth(app);
    const database = getDatabase(app);
    const unsubscribe = onAuthStateChanged(auth, (user) => {
        if (user) {
            setEmail(user.email);
            setLoggedIn(true);

            // Fetch username from the database
            const userRef = ref(database, 'Users/' + user.uid);
            get(userRef).then((snapshot) => {
                if (snapshot.exists()) {
                    const data = snapshot.val();
                    setUsername(data.username); // Set the username state
                } else {
                    console.log("No data available");
                    setUsername("Guest");
                }
            });
        } else {
            setLoggedIn(false);
            setUsername("Guest"); // Reset username to "Guest" if logged out
        }
    });

    return () => unsubscribe();
}, []);

  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };
  
  const handleRegister = async () => {
    if (!isValidEmail(email)) {
      Alert.alert("Invalid Email", "Please enter a valid email address.");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Password Mismatch", "The confirmed password and the password do not match.");
      return;
    }
  
    const passwordRegex = /^(?=.*[A-Z])(?=.*\d).{12,}$/;
    if (!passwordRegex.test(password)) {
      Alert.alert("Password Requirement", "Password must be at least 12 characters long, include at least one uppercase letter and one number.");
      return;
    }
  
    try {
      const auth = getAuth(app);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Get a reference to the database service
      const database = getDatabase(app);
      
      // Create a unique path for the new user's data using their UID
      const userRef = ref(database, 'Users/' + user.uid);
      
      // Set the email and username in the database
      await set(userRef, {
        email: email,
        username: username || "Guest", // Use the username if provided, otherwise default to "Guest"
      });
  
      setLoggedIn(true);
      setIsRegisterModalVisible(false);
      navigation.navigate('Home');
    } catch (error) {
      setError(error.message);
    }
  };
  

  const handleLogin = async () => {
    try {
      const auth = getAuth(app);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
  
      // Fetch username from the database
      const database = getDatabase(app);
      const userRef = ref(database, 'Users/' + user.uid);
  
      const snapshot = await get(userRef); // Use `get` for a one-time fetch
      if (snapshot.exists()) {
        const data = snapshot.val();
        setUsername(data.username); // Set the username state
      } else {
        console.log("No data available");
      }
  
      setLoggedIn(true);
      navigation.navigate('Today');
    } catch (error) {
      setError(error.message);
    }
  };
    
  const handleLogout = async () => {
    try {
      const auth = getAuth(app);
      await signOut(auth);
      setLoggedIn(false);
      setEmail('');
      setPassword('');
    } catch (error) {
      setError(error.message);
    }
  };

  useEffect(() => {
    const auth = getAuth(app);
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setEmail(user.email);
        setLoggedIn(true);
      } else {
        setLoggedIn(false);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
        <View style={styles.centeredView}>
          <Image source={require('../assets/Icons/ProTasker120.png')} style={[styles.logo, { width: logoWidth, height: logoHeight }]} />
      


          {loggedIn ? (
            <View>
                <Text style={styles.subtitle}>Welcome, {username}!</Text>
               <Text style={styles.accountText}>Account: {email}</Text>
              <TouchableOpacity style={styles.button} onPress={handleLogout}>
                <Text style={styles.buttonText}>Logout</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.authContainer}>
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="lightgrey"
                value={email}
                onChangeText={setEmail}
                color="black"
              />
              <View style={styles.passwordContainer}>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="Password"
                  placeholderTextColor="lightgrey"
                  secureTextEntry={passwordVisibility}
                  value={password}
                  onChangeText={setPassword}
                  color="black"
                />
                <TouchableOpacity onPress={() => setPasswordVisibility(!passwordVisibility)}>
                  <FontAwesome name={passwordVisibility ? "eye-slash" : "eye"} size={20} color="grey" />
                </TouchableOpacity>
              </View>

              {error && <Text style={styles.errorText}>{error}</Text>}

              <TouchableOpacity style={styles.button} onPress={() => setIsRegisterModalVisible(true)}>
                <Text style={styles.buttonText}>Register</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.button} onPress={handleLogin}>
                <Text style={styles.buttonText}>Login</Text>
              </TouchableOpacity>
            </View>
          )}

          <Modal
            animationType="slide"
            transparent={true}
            visible={isRegisterModalVisible}
            onRequestClose={() => setIsRegisterModalVisible(false)}
          >
            <View style={styles.modalOuter}>
              <View style={styles.modalView}>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Email"
                  placeholderTextColor="lightgrey"
                  value={email}
                  onChangeText={setEmail}
                  color="black"
                />
                <TextInput
                  style={styles.modalInput}
                  placeholder="Username"
                  placeholderTextColor="lightgrey"
                  value={username}
                  onChangeText={setUsername}
                  color="black"
                />
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={[styles.modalInput, { flex: 1 }]}
                    placeholder="Password"
                    placeholderTextColor="lightgrey"
                    secureTextEntry={passwordVisibility}
                    value={password}
                    onChangeText={setPassword}
                    color="black"
                  />
                  <TouchableOpacity onPress={() => setPasswordVisibility(!passwordVisibility)}>
                    <FontAwesome name={passwordVisibility ? "eye-slash" : "eye"} size={20} color="grey" />
                  </TouchableOpacity>
                </View>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={[styles.modalInput, { flex: 1 }]}
                    placeholder="Confirm Password"
                    placeholderTextColor="lightgrey"
                    secureTextEntry={confirmPasswordVisibility}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    color="black"
                  />
                  <TouchableOpacity onPress={() => setConfirmPasswordVisibility(!confirmPasswordVisibility)}>
                    <FontAwesome name={confirmPasswordVisibility ? "eye-slash" : "eye"} size={20} color="grey" />
                  </TouchableOpacity>
                </View>
                <Text style={styles.passwordRequirement}>Password must be at least 12 characters, include at least one uppercase letter and one number.</Text>
                <View style={styles.modalButtonContainer}>
                  <TouchableOpacity style={[styles.button, styles.modalButton]} onPress={handleRegister}>
                    <Text style={styles.buttonText}>Submit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.button, styles.modalButton]} onPress={() => setIsRegisterModalVisible(false)}>
                    <Text style={styles.buttonText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#dccaca',
  },
  centeredView: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    resizeMode: 'contain',
    marginTop: 60,
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 18,
    textAlign: 'center',
    marginVertical: 20,
    color: 'black',
  },
  authContainer: {
    width: '100%',
    alignItems: 'center',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    width: 250,
    paddingHorizontal: 15,
    borderRadius: 25,
    marginVertical: 10,
  },
  input: {
    backgroundColor: '#FFF',
    width: 250, // Ensure this matches your layout design
    paddingHorizontal: 20,
    paddingVertical: 10, // Make sure padding is consistent
    borderRadius: 25,
    marginVertical: 10,
    fontSize: 16,
    flex: 1, // This ensures the input field fills the container, adjusting as needed for icons
  },
  
  modalInput: {
    backgroundColor: '#FFF',
    width: screenWidth/2,
    paddingHorizontal: 20,
    borderRadius: 25,
    marginVertical: 10,
    fontSize: 16,
    textAlign: 'left', // Ensure text is aligned to the left
    paddingVertical: 10, // Adjusted for consistent padding

  },
  errorText: {
    color: 'red',
    marginBottom: 10,
  },
  button: {
    backgroundColor: '#1f1f1f',
    padding: 10,
    borderRadius: 25,
    width: 100,
    marginVertical: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
  },
  accountText: {
    fontSize: 18,
    color: 'black',
    marginBottom: 20,
  },
  modalOuter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 22,
  },
  modalView: {
    margin: 20,
    backgroundColor: '#e2dddd',
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
  passwordRequirement: {
    fontSize: 14,
    color: 'grey',
    marginBottom: 15,
    textAlign: 'center',
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalButton: {
    width: '45%',
  },
});

export default LoginScreen;
