import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import LoginScreen from './screens/LoginScreen';
import SignupScreen from './screens/SignupScreen';
import UserHomeScreen from './screens/UserHomeScreen';
import SecurityHomeScreen from './screens/SecurityHomeScreen';
import ProfileScreen from './screens/ProfileScreen';
import GeneratePassScreen from './screens/GeneratePassScreen';
import ScanInScreen from './screens/ScanInScreen';
import ScanOutScreen from './screens/ScanOutScreen';
import OverdueDashboard from './screens/OverdueDashboard';
import SecurityVideosScreen from './screens/SecurityVideosScreen';
import SecurityMapScreen from './screens/SecurityMapScreen';
import TestModelScreen from './screens/TestModelScreen';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginScreen />} />
        <Route path="/signup" element={<SignupScreen />} />
        <Route path="/user-home" element={<UserHomeScreen />} />
        <Route path="/security-home" element={<SecurityHomeScreen />} />
        <Route path="/user-profile" element={<ProfileScreen />} />
        <Route path="/security-profile" element={<ProfileScreen />} />
        <Route path="/generate-pass" element={<GeneratePassScreen />} />
        <Route path="/scan-in" element={<ScanInScreen />} />
        <Route path="/scan-out" element={<ScanOutScreen />} />
        <Route path="/overdue-dashboard" element={<OverdueDashboard />} />
        <Route path="/clips" element={<SecurityVideosScreen />} />
        <Route path="/sos-map" element={<SecurityMapScreen />} />
        <Route path="/test-model" element={<TestModelScreen />} />
      </Routes>
    </Router>
  );
}

export default App;
