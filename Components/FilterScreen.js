import React, { useState, useEffect } from 'react';
import {
  View,
  FlatList,
  TouchableOpacity,
  Text,
  TextInput,
  Keyboard,
  TouchableWithoutFeedback,
  SafeAreaView,
  StyleSheet,
} from 'react-native';
import { Icon } from 'react-native-elements';
import DropDownPicker from 'react-native-dropdown-picker';
import { ref, onValue } from 'firebase/database';
import { auth, database } from '../firebaseConfig';
import { useNavigation, useIsFocused } from '@react-navigation/native';

const FilterScreen = () => {
  const navigation = useNavigation();
  const [selectedFilter, setSelectedFilter] = useState('Tasks');
  const [searchQuery, setSearchQuery] = useState('');
  const [items, setItems] = useState([]);
  const [openDropdown, setOpenDropdown] = useState(false);
  const user = auth.currentUser;
  const userUID = user ? user.uid : ''; // Get the current user's UID
  const isFocused = useIsFocused();

  useEffect(() => {
    if (!isFocused) {
      // Reset the page when it's not focused
      setSelectedFilter('Tasks');
      setSearchQuery('');
      setItems([]);
      setOpenDropdown(false);
    }
  }, [isFocused]);
  useEffect(() => {
    if (!selectedFilter || searchQuery.trim() === '') {
      setItems([]);
      return;
    }
  
    let path = selectedFilter === 'Tasks' ? 'Tasks' : 'Lists/Lists';
    const dbRef = ref(database, path);
  
    onValue(dbRef, (snapshot) => {
      const data = snapshot.val();
      const fetchedItems = [];
  
      for (const key in data) {
        const item = data[key];
        if (selectedFilter === 'Tasks') {
          // Assuming tasks have a 'status' field you want to check
          if (item.UID === userUID && item.status === 'uncompleted' && item.title.toLowerCase().includes(searchQuery.toLowerCase())) {
            fetchedItems.push({ id: key, name: item.title, list: item.list });
          }
        } else if (selectedFilter === 'Lists') {
          // For lists, there's no 'status', so just check the name and userUID
          if ((item.UID === userUID || key === 'listId1') && item.name.toLowerCase().includes(searchQuery.toLowerCase())) {
            fetchedItems.push({ id: key, name: item.name });
          }
        }
      }
  
      setItems(fetchedItems);
    }, {
      onlyOnce: true
    });
  }, [selectedFilter, searchQuery, userUID]);
  

  return (
    <SafeAreaView style={styles.safeArea}>
      <TouchableWithoutFeedback onPress={() => {
        Keyboard.dismiss();
        setOpenDropdown(false);
      }}>
        <View style={styles.container}>
          <View style={styles.searchBarContainer}>
            <TextInput
              style={styles.searchBar}
              placeholder="Search..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              onFocus={() => setOpenDropdown(false)}
            />
            {searchQuery ? (
              <Icon
                name="close"
                type="font-awesome"
                size={20}
                color="black"
                onPress={() => setSearchQuery('')}
                containerStyle={styles.clearIcon}
              />
            ) : null}
            <TouchableOpacity
              onPress={() => setOpenDropdown(!openDropdown)}
              style={styles.dropdownButtonContainer}
            >
              <Icon name="caret-down" type="font-awesome" size={20} color="black" />
            </TouchableOpacity>
          </View>
          {openDropdown && (
            <DropDownPicker
              open={openDropdown}
              value={selectedFilter}
              items={[
                { label: 'Tasks', value: 'Tasks' },
                { label: 'Lists', value: 'Lists' },
              ]}
              setOpen={setOpenDropdown}
              setValue={setSelectedFilter}
              zIndex={3000}
              style={styles.dropdownStyle}
              dropDownContainerStyle={styles.dropdownBoxStyle}
            />
          )}
          <FlatList
            data={items}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => {
                  if (selectedFilter === 'Lists') {
                    navigation.navigate('List', { selectedListId: item.id });
                  } else if (selectedFilter === 'Tasks') {
                    navigation.navigate('List', { selectedListId: item.list });
                  }
                }}
                style={styles.itemContainer}
              >
                <Text style={styles.taskTitle}>{item.name}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
};


const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5FCFF', 
  },
  container: {
    flex: 1,
    marginTop: 20,
    backgroundColor: '#F5FCFF',
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  searchBar: {
    flex: 1,
    borderColor: 'gray',
    borderWidth: 1,
    paddingVertical:15,
    paddingLeft:15,
    paddingRight:45,
    borderRadius: 5,
    marginRight: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
  },
  clearIcon: {
    position: 'absolute',
    right: 65,
  },
  dropdownButtonContainer: {
    backgroundColor: '#ff9900',
    borderRadius: 5,
    padding: 15,
    position: 'absolute',
    right: 15,
  },
  dropdownContainerStyle: {
    position: 'absolute',
    top: 50,
    right: 10,
    width: 150,
    zIndex: 1000,
  },
  dropdownStyle: {
    alignSelf: 'flex-end', // This ensures the picker itself is aligned to the right
    width: 150,
  },
  dropdownBoxStyle: {
    alignSelf: 'flex-end', // This ensures the picker itself is aligned to the right
    width: 150,
  },
  itemContainer: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#cccccc',
  },taskTitle: {
    flex: 1,
    fontSize: 16,
    marginLeft: 10,
},
});

export default FilterScreen;
