
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Index = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    // Redirect to HomePage
    navigate('/');
  }, [navigate]);
  
  return null; // This page will redirect immediately, so no need to render anything
};

export default Index;
