import React, { useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import Orientation from 'react-native-orientation-locker';
import { useWindowDimensions } from 'react-native';

const HomeScreen = () => {
    const { width, height } = useWindowDimensions();
    const isPortrait = height > width;

    useEffect(() => {
        try {
            if (Orientation && typeof Orientation.unlockAllOrientations === 'function') {
                Orientation.unlockAllOrientations();
            } else {
                console.warn("Orientation module is not available.");
            }
        } catch (error) {
            console.error("Error unlocking orientation:", error);
        }
    }, []);

    return (
        <View style={[styles.container, { flexDirection: isPortrait ? 'column' : 'row' }]}> 
            <Text style={styles.title}>ZAPE</Text>
            <View style={[styles.grid, { flexDirection: isPortrait ? 'column' : 'row' }]}> 
                <TouchableOpacity style={styles.card}>
                    <Image source={require('./assets/favicon.png')} style={styles.icon} />
                    <Text style={styles.cardText}>Science</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.card}>
                    <Image source={require('./assets/favicon.png')} style={styles.icon} />
                    <Text style={styles.cardText}>Math</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.card}>
                    <Image source={require('./assets/favicon.png')} style={styles.icon} />
                    <Text style={styles.cardText}>English</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#BEE3F8',
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#FFA500',
        marginBottom: 16
    },
    grid: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    card: {
        backgroundColor: '#FFF',
        width: 120,
        height: 120,
        margin: 16,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.7,
        shadowRadius: 6,
        elevation: 5,
    },
    cardText: {
        marginTop: 14,
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    icon: {
        width: 60,
        height: 60,
        resizeMode: 'contain',
    }
});

export default HomeScreen;
