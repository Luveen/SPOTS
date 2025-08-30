// app/(onboarding)/onboarding1.tsx
import React from 'react';
import OnboardingScreenTemplate from '../../components/OnboardingScreenTemplate';

export default function Onboarding1() {
  return (
    <OnboardingScreenTemplate
      currentPage={0}
      totalPages={3}
      description="Adventure awaits off the beaten path. Find spots you won't see on tourist maps."
      lottieSource={require('../../assets/animation/Travel.json')} // Path to your Lottie animation file
      buttonText="Continue"
      nextRoute="/onboarding/onboarding2" // Route to the next onboarding screen
      skipRoute="/auth/login"             // Skip to the login screen
      loginRoute="/auth/login"            // Route to the login screen
    />
  );
}