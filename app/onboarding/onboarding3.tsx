// app/(onboarding)/onboarding3.tsx
import React from 'react';
import OnboardingScreenTemplate from '../../components/OnboardingScreenTemplate';

export default function Onboarding3() {
  return (
    <OnboardingScreenTemplate
      currentPage={2}
      totalPages={3}
      description="Your experiences matter. Document your trips and inspire others to explore responsibly."
      lottieSource={require('../../assets/animation/travel3.json')}
      buttonText="Sign up" // Button text changes for the last screen
      nextRoute="/auth/signup" // This button now goes to Signup
      skipRoute="/auth/login"   // Skip to the login screen
      showLoginLink={true}       // Show the Login link
      loginRoute="/auth/login" // Login link destination
    />
  );
}