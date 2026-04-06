import React, { createContext, useContext, useState } from 'react';

const TripContext = createContext();

export const TripProvider = ({ children }) => {
  const [tripData, setTripData] = useState({
    destination: '',
    start_date: '',
    end_date: '',
    group_size: 'Solo Explorer',
    budget: '',
    travel_vibes: [],   // e.g. ["nature", "aesthetic_cafe", "trendy"]
  });

  return (
    <TripContext.Provider value={{ tripData, setTripData }}>
      {children}
    </TripContext.Provider>
  );
};

export const useTrip = () => useContext(TripContext);