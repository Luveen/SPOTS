
import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Dimensions } from 'react-native';
import CustomButton from './CustomButton';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import LottieView from 'lottie-react-native';

const { width, height } = Dimensions.get('window');

const OnboardingScreenTemplate = ({
  description,
  lottieSource,
  buttonText,
  currentPage,
  totalPages,
  showLoginLink = false,
  nextRoute,
  skipRoute,
  loginRoute,
}) => {
  const router = useRouter();

  const renderPaginationDots = () => {
    const dots = [];
    for (let i = 0; i < totalPages; i++) {
      dots.push(
        <View
          key={i}
          style={[
            styles.paginationDot,
            i === currentPage ? styles.activeDot : styles.inactiveDot,
          ]}
        />
      );
    }
    return <View style={styles.paginationContainer}>{dots}</View>;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        {renderPaginationDots()}
        <TouchableOpacity onPress={() => router.replace(skipRoute)} style={styles.skipButton}>
          <Text style={styles.skipText}>Skip </Text>
          <Ionicons name="chevron-forward" size={width * 0.05} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Text style={styles.spotsLogo}>SPOTS</Text>
        <Text style={styles.descriptionText}>{description}</Text>

        <View style={styles.lottieContainer}>
          <LottieView
            source={lottieSource}
            autoPlay
            loop
            style={styles.lottieAnimation}
          />
        </View>

        <CustomButton
          style={styles.cButton}
          title={buttonText}
          onPress={() => router.push(nextRoute)}
          type="primary"
        />

        {showLoginLink && (
          <TouchableOpacity onPress={() => router.push(loginRoute)} style={styles.loginLinkContainer}>
            <Text style={styles.loginLinkText}>Login</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#30706D',
    paddingTop: height * 0.05,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: width * 0.05,
    marginBottom: height * 0.04,
  },
  paginationContainer: {
    flexDirection: 'row',
  },
  paginationDot: {
    width: width * 0.02,
    height: width * 0.02,
    borderRadius: (width * 0.02) / 2,
    marginHorizontal: width * 0.01,
  },
  activeDot: {
    backgroundColor: '#FFFFFF',
  },
  inactiveDot: {
    backgroundColor: '#CCCCCC',
  },
  skipButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  skipText: {
    fontSize: width * 0.045,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: width * 0.1,
    justifyContent: 'flex-start',
  },
  spotsLogo: {
    // You may want to keep this font size fixed if it's a specific brand requirement
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 5,
    marginBottom: height * 0.02,
    marginTop: height * 0.02,
  },
  descriptionText: {
    fontSize: width * 0.04,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: height * 0.04,
    lineHeight: 25,
  },
  lottieContainer: {
    // Use a percentage of the screen dimensions for the container
    width: width * 0.8,
    height: height * 0.45,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: height * 0.02,
  },
  lottieAnimation: {
    // Make the animation fill its responsive container
    width: '100%',
    height: '100%',
    backgroundColor: 'transparent',
  },
  cButton: {
    width: width * 0.8,
    borderRadius: 30,
    paddingVertical: height * 0.02,
    paddingHorizontal: width * 0.05,
  },
  loginLinkContainer: {
    marginTop: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginLinkText: {
    fontSize: width * 0.045,
    color: '#ffffff',
    fontWeight: '500',
  },
});

export default OnboardingScreenTemplate;