// app/(onboarding)/onboarding2.tsx
import React from 'react';
import OnboardingScreenTemplate from '../../components/OnboardingScreenTemplate';

export default function Onboarding2() {
  return (
    <OnboardingScreenTemplate
      currentPage={1}
      totalPages={3}
      description="Travel safer (and cheaper!) by joining trips with like-minded explorers."
      lottieSource={require('../../assets/animation/travel2.json')}
      buttonText="Continue"
      nextRoute="/onboarding/onboarding3" // Route to the next onboarding screen
      skipRoute="/auth/login"             // Skip to the login screen
      loginRoute="/auth/login"            // Route to the login screen
    />
  );
}